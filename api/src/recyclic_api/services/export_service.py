"""Services for generating Ecologic-compliant CSV exports (Story 4.1)."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
from uuid import UUID as UUIDType

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from recyclic_api.core.config import settings
from recyclic_api.models.deposit import Deposit, DepositStatus, EEECategory
from recyclic_api.models.sale import Sale
from recyclic_api.models.sale_item import SaleItem
from recyclic_api.models.cash_session import CashSession
from recyclic_api.models.user import User
from recyclic_api.models.site import Site
from recyclic_api.models.preset_button import PresetButton
from recyclic_api.models.category import Category


@dataclass(frozen=True)
class EcologicCategory:
    code: str
    label: str
    deposit_categories: Tuple[EEECategory, ...]


# Ordered list so CSV rows stay deterministic
ECOLOGIC_CATEGORIES: Tuple[EcologicCategory, ...] = (
    EcologicCategory(
        code="EEE-1",
        label="Gros électroménager",
        deposit_categories=(EEECategory.LARGE_APPLIANCE, EEECategory.AUTOMATIC_DISPENSERS),
    ),
    EcologicCategory(
        code="EEE-2",
        label="Petits appareils ménagers",
        deposit_categories=(EEECategory.SMALL_APPLIANCE,),
    ),
    EcologicCategory(
        code="EEE-3",
        label="Équipements informatiques et télécoms",
        deposit_categories=(EEECategory.IT_EQUIPMENT,),
    ),
    EcologicCategory(
        code="EEE-4",
        label="Équipements d'éclairage",
        deposit_categories=(EEECategory.LIGHTING,),
    ),
    EcologicCategory(
        code="EEE-5",
        label="Outils électriques et électroniques",
        deposit_categories=(EEECategory.TOOLS,),
    ),
    EcologicCategory(
        code="EEE-6",
        label="Jouets et équipements de loisir",
        deposit_categories=(EEECategory.TOYS,),
    ),
    EcologicCategory(
        code="EEE-7",
        label="Dispositifs médicaux",
        deposit_categories=(EEECategory.MEDICAL_DEVICES,),
    ),
    EcologicCategory(
        code="EEE-8",
        label="Instruments de surveillance et autres",
        deposit_categories=(EEECategory.MONITORING_CONTROL, EEECategory.OTHER),
    ),
)

# Deposit statuses considered as finalized for exports
ELIGIBLE_DEPOSIT_STATUSES = (
    DepositStatus.VALIDATED,
    DepositStatus.COMPLETED,
)

CSV_HEADERS: Tuple[str, ...] = (
    "category_code",
    "category_label",
    "deposit_count",
    "deposit_weight_kg",
    "sales_quantity",
    "sales_amount_eur",
    "period_start",
    "period_end",
    "generated_at",
)


def _normalize_datetime(value: date | datetime, end_of_day: bool = False) -> datetime:
    if isinstance(value, datetime):
        return value
    boundary_time = time.max if end_of_day else time.min
    return datetime.combine(value, boundary_time)


def _category_from_deposit(category: Optional[EEECategory], fallback: Optional[EEECategory]) -> Optional[str]:
    resolved = category or fallback
    if not resolved:
        return None
    mapping = _deposit_category_map()
    return mapping.get(resolved.value)


def _deposit_category_map() -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    for eco_category in ECOLOGIC_CATEGORIES:
        for deposit_category in eco_category.deposit_categories:
            mapping[deposit_category.value] = eco_category.code
    return mapping


def _initialize_export_totals() -> Dict[str, Dict[str, float]]:
    totals: Dict[str, Dict[str, float]] = {}
    for eco_category in ECOLOGIC_CATEGORIES:
        totals[eco_category.code] = {
            "deposit_count": 0,
            "deposit_weight_kg": 0.0,
            "sales_quantity": 0,
            "sales_amount_eur": 0.0,
        }
    return totals


def generate_ecologic_csv(
    db: Session,
    date_from: date | datetime,
    date_to: date | datetime,
    export_dir: Optional[Path | str] = None,
) -> Path:
    """Generate the Ecologic CSV export for the given period."""
    if date_to < date_from:
        raise ValueError("date_to must be greater than or equal to date_from")

    start_dt = _normalize_datetime(date_from)
    end_dt = _normalize_datetime(date_to, end_of_day=True)

    totals = _initialize_export_totals()
    category_labels = {cat.code: cat.label for cat in ECOLOGIC_CATEGORIES}

    # Aggregate deposits
    deposit_query = (
        db.query(
            Deposit.category,
            Deposit.eee_category,
            func.count(Deposit.id),
            func.coalesce(func.sum(Deposit.weight), 0.0),
        )
        .filter(
            Deposit.created_at >= start_dt,
            Deposit.created_at <= end_dt,
            Deposit.status.in_(ELIGIBLE_DEPOSIT_STATUSES),
        )
        .group_by(Deposit.category, Deposit.eee_category)
    )

    for category, eee_category, count, total_weight in deposit_query.all():
        code = _category_from_deposit(category, eee_category)
        if not code:
            code = "EEE-8"  # Fallback bucket for unmapped categories
        totals[code]["deposit_count"] += int(count or 0)
        totals[code]["deposit_weight_kg"] += float(total_weight or 0.0)

    # Aggregate sales
    sale_query = (
        db.query(
            SaleItem.category,
            func.coalesce(func.sum(SaleItem.quantity), 0),
            func.coalesce(func.sum(SaleItem.total_price), 0.0),
        )
        .join(Sale, SaleItem.sale_id == Sale.id)
        .filter(
            Sale.created_at >= start_dt,
            Sale.created_at <= end_dt,
        )
        .group_by(SaleItem.category)
    )

    for category, quantity, total_amount in sale_query.all():
        code = str(category).strip() if category else None
        if code not in totals:
            # Treat unexpected categories as "EEE-8"
            code = "EEE-8"
        totals[code]["sales_quantity"] += int(quantity or 0)
        totals[code]["sales_amount_eur"] += float(total_amount or 0.0)

    export_path = Path(export_dir) if export_dir else Path(settings.ECOLOGIC_EXPORT_DIR)
    export_path.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"ecologic_export_{start_dt.strftime('%Y%m%d')}_{end_dt.strftime('%Y%m%d')}_{timestamp}.csv"
    file_path = export_path / filename

    generated_at = datetime.utcnow().isoformat()

    with file_path.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=CSV_HEADERS)
        writer.writeheader()
        for category in ECOLOGIC_CATEGORIES:
            values = totals[category.code]
            writer.writerow(
                {
                    "category_code": category.code,
                    "category_label": category_labels[category.code],
                    "deposit_count": values["deposit_count"],
                    "deposit_weight_kg": round(values["deposit_weight_kg"], 3),
                    "sales_quantity": values["sales_quantity"],
                    "sales_amount_eur": round(values["sales_amount_eur"], 2),
                    "period_start": start_dt.date().isoformat(),
                    "period_end": end_dt.date().isoformat(),
                    "generated_at": generated_at,
                }
            )

    return file_path



def _enforce_report_retention(report_root: Path) -> None:
    """Delete reports older than the configured retention window."""
    retention_days = settings.CASH_SESSION_REPORT_RETENTION_DAYS
    if retention_days <= 0:
        return
    threshold = datetime.utcnow() - timedelta(days=retention_days)
    for candidate in report_root.glob('*.csv'):
        try:
            modified_at = datetime.utcfromtimestamp(candidate.stat().st_mtime)
        except OSError:
            continue
        if modified_at < threshold:
            try:
                candidate.unlink()
            except OSError:
                continue

def generate_cash_session_report(
    db: Session,
    session: CashSession,
    reports_dir: Path | None = None
) -> Path:
    """Generate a detailed CSV report for a cash session (Story 4.2)."""
    report_root = Path(reports_dir or settings.CASH_SESSION_REPORT_DIR)
    report_root.mkdir(parents=True, exist_ok=True)

    # Amélioration du nom de fichier : format lisible avec date, opérateur, site et UUID (pour compatibilité)
    operator = session.operator or db.query(User).filter(User.id == session.operator_id).first()
    site = session.site or db.query(Site).filter(Site.id == session.site_id).first()
    
    operator_name = (getattr(operator, "username", None) or getattr(operator, "full_name", None) or "unknown")
    operator_name_safe = operator_name.replace(' ', '_').replace('/', '_')[:20]
    
    site_name = getattr(site, "name", "") or "unknown"
    site_name_safe = site_name.replace(' ', '_').replace('/', '_')[:20]
    
    date_str = session.opened_at.strftime('%Y%m%d') if session.opened_at else datetime.utcnow().strftime('%Y%m%d')
    timestamp = datetime.utcnow().strftime("%H%M%S")
    
    # Format: session_caisse_YYYYMMDD_operateur_site_{UUID}_HHMMSS.csv
    # Exemple: session_caisse_20251119_admintest1_LaClique_c2399c3d-52aa-464d-aec2-e6e901cfaa8a_125443.csv
    # L'UUID complet est conservé pour permettre l'extraction par le pattern dans reports.py
    filename = f"session_caisse_{date_str}_{operator_name_safe}_{site_name_safe}_{session.id}_{timestamp}.csv"
    file_path = report_root / filename

    def _format_amount(value: Optional[float]) -> str:
        """Format un montant avec virgule comme séparateur décimal (format français)"""
        if value is None:
            return ''
        # Utiliser virgule au lieu de point pour les décimales (format français)
        return f"{value:.2f}".replace('.', ',')
    
    def _format_weight(value: Optional[float]) -> str:
        """Format un poids avec virgule comme séparateur décimal (format français)"""
        if value is None:
            return ''
        # Utiliser virgule au lieu de point pour les décimales (format français)
        return f"{value:.3f}".replace('.', ',')
    
    def _format_date(dt: Optional[datetime]) -> str:
        if dt is None:
            return ''
        return dt.strftime('%Y-%m-%d %H:%M:%S')

    # Résumé de session avec en-têtes en français
    summary_rows = [
        ("ID Session", str(session.id)),
        ("ID Opérateur", str(session.operator_id)),
        ("Nom Opérateur", (getattr(operator, "full_name", None) or getattr(operator, "username", None) or getattr(operator, "telegram_id", None) or "")),
        ("ID Site", str(session.site_id)),
        ("Nom Site", getattr(site, "name", "") or ""),
        ("Date Ouverture", _format_date(session.opened_at)),
        ("Date Fermeture", _format_date(session.closed_at)),
        ("Montant Initial (€)", _format_amount(session.initial_amount)),
        ("Montant de Clôture (€)", _format_amount(session.closing_amount if session.closing_amount is not None else (session.initial_amount + (session.total_sales or 0)))),
        ("Montant Réel (€)", _format_amount(session.actual_amount)),
        ("Écart (€)", _format_amount(session.variance)),
        ("Commentaire Écart", session.variance_comment or ""),
        ("Total Ventes (€)", _format_amount(session.total_sales)),
        ("Nombre d'Articles", str(session.total_items or 0)),
        ("Rapport Généré Le", _format_date(datetime.utcnow())),
    ]

    # Charger les ventes avec les relations nécessaires (preset_button pour récupérer le nom)
    sales = db.query(Sale).filter(Sale.cash_session_id == session.id).options(
        joinedload(Sale.items).joinedload(SaleItem.preset_button)
    ).all()

    # Créer un cache des catégories pour éviter les requêtes multiples
    # Récupérer tous les IDs de catégories uniques utilisés dans les items
    category_ids = set()
    for sale in sales:
        for item in sale.items:
            if item.category:
                # Vérifier si c'est un UUID (format avec tirets) ou un code (EEE-X)
                try:
                    # Essayer de parser comme UUID
                    UUIDType(item.category)
                    category_ids.add(item.category)
                except (ValueError, AttributeError):
                    # Ce n'est pas un UUID, probablement un code comme "EEE-1"
                    pass
    
    # Charger toutes les catégories en une seule requête
    category_map = {}
    if category_ids:
        # Convertir les strings en UUID pour la requête
        uuid_category_ids = []
        for cat_id in category_ids:
            try:
                uuid_category_ids.append(UUIDType(cat_id))
            except (ValueError, AttributeError):
                pass
        
        if uuid_category_ids:
            categories = db.query(Category).filter(Category.id.in_(uuid_category_ids)).all()
            # Créer le mapping avec les deux formats (UUID et string) pour faciliter la recherche
            for cat in categories:
                category_map[str(cat.id)] = cat.name
                category_map[cat.id] = cat.name  # Support aussi pour comparaison directe UUID

    # Utiliser le séparateur point-virgule (;) pour compatibilité avec Excel/OpenOffice français
    # et virgule (,) pour les décimales
    with file_path.open('w', newline='', encoding='utf-8-sig') as csvfile:
        # Utiliser point-virgule comme délimiteur (standard français pour CSV)
        # QUOTE_MINIMAL pour échapper automatiquement les guillemets et caractères spéciaux
        writer = csv.writer(csvfile, delimiter=';', quoting=csv.QUOTE_MINIMAL)
        
        # Section 1: Résumé de session (format tabulaire lisible)
        writer.writerow(['=== RÉSUMÉ DE SESSION ==='])
        writer.writerow(['Champ', 'Valeur'])
        for label, value in summary_rows:
            writer.writerow([label, value])

        # Ligne vide pour séparation (avec le bon nombre de colonnes pour éviter les erreurs d'import)
        writer.writerow(['', ''])  # 2 colonnes pour le résumé
        
        # Section 2: Détails des ventes avec toutes les colonnes nécessaires
        # Ajout d'une colonne "Numéro de Ticket" pour identifier chaque ticket
        writer.writerow(['=== DÉTAILS DES VENTES ==='])
        writer.writerow([
            'Numéro de Ticket',
            'Date de Vente',
            'Catégorie',
            'Quantité',
            'Poids (kg)',
            'Prix Unitaire (€)',
            'Prix Total (€)',
            'Type de Transaction',
            'Notes'
        ])

        # Compteur pour numéroter les tickets
        ticket_number = 1
        total_tickets = len(sales)
        
        for sale_idx, sale in enumerate(sales, start=1):
            sale_created_at = _format_date(sale.created_at)
            if sale.items:
                for item in sale.items:
                    # Récupérer le nom du preset si présent et nettoyer
                    preset_name = ''
                    if item.preset_button:
                        preset_name = (item.preset_button.name or '').replace('\n', ' ').replace('\r', ' ').strip()
                    elif item.preset_id:
                        # Fallback: si la relation n'est pas chargée, chercher le preset
                        preset = db.query(PresetButton).filter(PresetButton.id == item.preset_id).first()
                        if preset:
                            preset_name = (preset.name or '').replace('\n', ' ').replace('\r', ' ').strip()
                    
                    # Récupérer les notes et nettoyer les caractères problématiques
                    notes = (item.notes or '').replace('\n', ' ').replace('\r', ' ').strip()
                    
                    # Récupérer le poids avec format français (virgule)
                    weight_str = ''
                    if item.weight is not None:
                        weight_str = _format_weight(item.weight)
                    
                    # Résoudre le nom de la catégorie depuis l'ID et nettoyer
                    category_name = item.category
                    if item.category in category_map:
                        category_name = (category_map[item.category] or item.category).replace('\n', ' ').replace('\r', ' ').strip()
                    elif item.category:
                        # Si ce n'est pas un UUID mais un code (ex: "EEE-1"), garder tel quel
                        # Sinon essayer de chercher la catégorie
                        try:
                            UUIDType(item.category)
                            # C'est un UUID mais pas dans le cache, chercher
                            cat = db.query(Category).filter(Category.id == item.category).first()
                            if cat:
                                category_name = (cat.name or item.category).replace('\n', ' ').replace('\r', ' ').strip()
                        except (ValueError, AttributeError):
                            # Ce n'est pas un UUID, probablement un code, garder tel quel mais nettoyer
                            category_name = item.category.replace('\n', ' ').replace('\r', ' ').strip()
                    
                    writer.writerow([
                        f'Ticket #{ticket_number}',
                        sale_created_at,
                        category_name,
                        str(item.quantity),
                        weight_str,
                        _format_amount(item.unit_price),
                        _format_amount(item.total_price),
                        preset_name,
                        notes
                    ])
                
                # Après tous les items d'un ticket, ajouter une ligne de séparation
                # Sauf pour le dernier ticket
                # Utiliser une ligne avec le bon nombre de colonnes (9) mais vides pour éviter les erreurs d'import
                if sale_idx < total_tickets:
                    writer.writerow(['', '', '', '', '', '', '', '', ''])  # 9 colonnes vides pour séparer les tickets
                
                ticket_number += 1
            else:
                # Vente sans items (cas rare)
                writer.writerow([
                    f'Ticket #{ticket_number}',
                    sale_created_at,
                    '',
                    '0',
                    '',
                    _format_amount(0.0),
                    _format_amount(sale.total_amount),
                    '',
                    ''
                ])
                
                # Séparation après ce ticket aussi
                if sale_idx < total_tickets:
                    writer.writerow(['', '', '', '', '', '', '', '', ''])  # 9 colonnes vides pour séparer les tickets
                
                ticket_number += 1

    _enforce_report_retention(report_root)

    return file_path

def preview_ecologic_export(
    db: Session,
    date_from: date | datetime,
    date_to: date | datetime,
) -> List[Dict[str, float | int | str]]:
    """Helper used by tests or API callers to preview export data without writing file."""
    start_dt = _normalize_datetime(date_from)
    end_dt = _normalize_datetime(date_to, end_of_day=True)

    # Reuse the core aggregation but accumulate results without file IO
    totals = _initialize_export_totals()
    category_labels = {cat.code: cat.label for cat in ECOLOGIC_CATEGORIES}

    deposit_query = (
        db.query(
            Deposit.category,
            Deposit.eee_category,
            func.count(Deposit.id),
            func.coalesce(func.sum(Deposit.weight), 0.0),
        )
        .filter(
            Deposit.created_at >= start_dt,
            Deposit.created_at <= end_dt,
            Deposit.status.in_(ELIGIBLE_DEPOSIT_STATUSES),
        )
        .group_by(Deposit.category, Deposit.eee_category)
    )

    for category, eee_category, count, total_weight in deposit_query.all():
        code = _category_from_deposit(category, eee_category) or "EEE-8"
        totals[code]["deposit_count"] += int(count or 0)
        totals[code]["deposit_weight_kg"] += float(total_weight or 0.0)

    sale_query = (
        db.query(
            SaleItem.category,
            func.coalesce(func.sum(SaleItem.quantity), 0),
            func.coalesce(func.sum(SaleItem.total_price), 0.0),
        )
        .join(Sale, SaleItem.sale_id == Sale.id)
        .filter(
            Sale.created_at >= start_dt,
            Sale.created_at <= end_dt,
        )
        .group_by(SaleItem.category)
    )

    for category, quantity, total_amount in sale_query.all():
        code = str(category).strip() if category else None
        if code not in totals:
            code = "EEE-8"
        totals[code]["sales_quantity"] += int(quantity or 0)
        totals[code]["sales_amount_eur"] += float(total_amount or 0.0)

    generated_at = datetime.utcnow().isoformat()

    preview_rows: List[Dict[str, float | int | str]] = []
    for category in ECOLOGIC_CATEGORIES:
        values = totals[category.code]
        preview_rows.append(
            {
                "category_code": category.code,
                "category_label": category_labels[category.code],
                "deposit_count": values["deposit_count"],
                "deposit_weight_kg": round(values["deposit_weight_kg"], 3),
                "sales_quantity": values["sales_quantity"],
                "sales_amount_eur": round(values["sales_amount_eur"], 2),
                "period_start": start_dt.date().isoformat(),
                "period_end": end_dt.date().isoformat(),
                "generated_at": generated_at,
            }
        )

    return preview_rows
