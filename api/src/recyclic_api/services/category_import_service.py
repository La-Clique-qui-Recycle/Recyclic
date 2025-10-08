from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4
import csv
import io
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import Session

from recyclic_api.core.redis import get_redis
from recyclic_api.models.category import Category


class CategoryImportService:
    """Service d'analyse et d'import CSV pour les catégories.

    Flux attendu (2 étapes):
      1) analyze: parse/valide le CSV et stocke un état temporaire (Redis) → retourne session_id + rapport
      2) execute: lit l'état stocké et effectue l'upsert transactionnel (tout ou rien)
    """

    REDIS_KEY_PREFIX = "import:categories:session:"
    REDIS_TTL_SECONDS = 30 * 60  # 30 minutes

    REQUIRED_HEADERS = [
        "Catégorie racine",
        "Sous-catégorie",
        "Prix minimum (€)",
        "Prix maximum (€)",
    ]

    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis()

    # ---------- Utilities ----------
    @staticmethod
    def _normalize_header(h: str) -> str:
        return h.strip()

    @staticmethod
    def _to_decimal(value: str | None) -> Optional[Decimal]:
        if value is None:
            return None
        s = value.strip()
        if s == "":
            return None
        # Remplacer virgule par point, retirer espaces et caractères non numériques utiles
        s = s.replace(" ", "").replace("\u00A0", "").replace(",", ".")
        try:
            return Decimal(s)
        except (InvalidOperation, ValueError):
            return None

    @staticmethod
    def _clean_name(value: str | None) -> Optional[str]:
        if value is None:
            return None
        name = value.strip()
        return name if name else None

    # ---------- Analyze ----------
    def analyze(self, file_bytes: bytes) -> Dict[str, Any]:
        """Analyse le CSV, valide et prépare un état d'import.

        Retourne: { session_id, summary, sample, errors }
        """
        text = file_bytes.decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(text))

        # Valider les entêtes
        headers = [self._normalize_header(h) for h in (reader.fieldnames or [])]
        missing = [h for h in self.REQUIRED_HEADERS if h not in headers]
        if missing:
            return {
                "session_id": None,
                "summary": {"total": 0, "roots": 0, "subs": 0, "to_create": 0, "to_update": 0},
                "sample": [],
                "errors": [f"Colonnes manquantes: {', '.join(missing)}"],
            }

        rows: List[Dict[str, Any]] = []
        errors: List[str] = []
        to_create = 0
        to_update = 0
        roots_seen: set[str] = set()

        for idx, raw in enumerate(reader, start=2):  # start=2 inclut l'en-tête ligne 1
            root = self._clean_name(raw.get("Catégorie racine"))
            sub = self._clean_name(raw.get("Sous-catégorie"))
            min_price = self._to_decimal(raw.get("Prix minimum (€)"))
            max_price = self._to_decimal(raw.get("Prix maximum (€)"))

            if not root:
                errors.append(f"L{idx}: 'Catégorie racine' manquante")
                continue

            # Règles: si sous-catégorie absente → ligne root-only (création éventuelle du parent)
            if sub is None and (min_price is not None or max_price is not None):
                errors.append(f"L{idx}: Prix fournis sans 'Sous-catégorie' (prix uniquement sur feuilles)")
                continue

            # Charger existence en base pour déterminer create/update
            # Contrainte d'unicité globale sur name: on identifie par name uniquement
            root_obj = self.db.query(Category).filter(Category.name == root).first()

            if root_obj is None:
                roots_seen.add(root)

            if sub:
                sub_obj = None
                # Identifier par nom global (unicité sur name)
                sub_obj = self.db.query(Category).filter(Category.name == sub).first()

                if sub_obj is None:
                    to_create += 1
                else:
                    # Déterminer si une mise à jour est nécessaire (prix)
                    should_update = False
                    if min_price is not None and sub_obj.price != min_price:
                        should_update = True
                    if max_price is not None and sub_obj.max_price != max_price:
                        should_update = True
                    if should_update:
                        to_update += 1

            rows.append({
                "root": root,
                "sub": sub,
                "min_price": str(min_price) if min_price is not None else None,
                "max_price": str(max_price) if max_price is not None else None,
            })

        session_id = str(uuid4()) if not errors else None
        if session_id:
            key = f"{self.REDIS_KEY_PREFIX}{session_id}"
            payload = {
                "rows": rows,
                "required_headers": self.REQUIRED_HEADERS,
            }
            # Stocker JSON (decode_responses=True côté client)
            # Utiliser représentation simple (pas Decimal)
            import json
            self.redis.setex(key, self.REDIS_TTL_SECONDS, json.dumps(payload))

        sample = rows[:10]
        return {
            "session_id": session_id,
            "summary": {
                "total": len(rows),
                "roots": len(roots_seen),
                "subs": sum(1 for r in rows if r["sub"] is not None),
                "to_create": to_create,
                "to_update": to_update,
            },
            "sample": sample,
            "errors": errors,
        }

    # ---------- Execute ----------
    def execute(self, session_id: str) -> Dict[str, Any]:
        """Exécute l'import (upsert) à partir d'une session d'analyse valide."""
        key = f"{self.REDIS_KEY_PREFIX}{session_id}"
        payload_raw = self.redis.get(key)
        if not payload_raw:
            return {"imported": 0, "updated": 0, "errors": ["Session d'import introuvable ou expirée"]}

        import json
        payload = json.loads(payload_raw)
        rows: List[Dict[str, Any]] = payload.get("rows", [])

        imported = 0
        updated = 0
        errors: List[str] = []

        try:
            # Transaction explicite
            for row in rows:
                root = row["root"]
                sub = row["sub"]
                min_price = Decimal(row["min_price"]) if row.get("min_price") is not None else None
                max_price = Decimal(row["max_price"]) if row.get("max_price") is not None else None

                # Upsert root (par nom global)
                root_obj = self.db.query(Category).filter(Category.name == root).first()
                if root_obj is None:
                    root_obj = Category(name=root, is_active=True, parent_id=None)
                    self.db.add(root_obj)
                    self.db.flush()
                else:
                    # S'assurer que c'est une racine
                    root_obj.parent_id = None
                    root_obj.is_active = True

                # Subcat upsert si présent (par nom global)
                if sub is not None:
                    sub_obj = self.db.query(Category).filter(Category.name == sub).first()
                    if sub_obj is None:
                        sub_obj = Category(
                            name=sub,
                            is_active=True,
                            parent_id=root_obj.id,
                            price=min_price,
                            max_price=max_price,
                        )
                        self.db.add(sub_obj)
                        imported += 1
                    else:
                        # Reparent et MAJ prix
                        should_update = False
                        if sub_obj.parent_id != root_obj.id:
                            sub_obj.parent_id = root_obj.id
                            should_update = True
                        if min_price is not None and sub_obj.price != min_price:
                            sub_obj.price = min_price
                            should_update = True
                        if max_price is not None and sub_obj.max_price != max_price:
                            sub_obj.max_price = max_price
                            should_update = True
                        if not sub_obj.is_active:
                            sub_obj.is_active = True
                            should_update = True
                        if should_update:
                            updated += 1

            self.db.commit()
        except Exception as exc:  # meaningful handling: rollback + error capture
            self.db.rollback()
            errors.append(f"Erreur d'exécution: {exc}")

        # Nettoyage session
        self.redis.delete(key)

        return {"imported": imported, "updated": updated, "errors": errors}

    # ---------- Template ----------
    def generate_template_csv(self) -> bytes:
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(self.REQUIRED_HEADERS)
        writer.writerow(["EEE - Informatique", "Ordinateur portable", "5", "100"])  # exemple
        writer.writerow(["Mobilier", "Chaise", "", ""])  # sans prix
        return buf.getvalue().encode("utf-8")


