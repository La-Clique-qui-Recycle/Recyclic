from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from recyclic_api.models.cash_register import CashRegister
from recyclic_api.schemas.cash_register import (
    CashRegisterCreate,
    CashRegisterUpdate,
)


class CashRegisterService:
    """Service d'accès et de gestion des postes de caisse.

    Sépare la logique métier de la couche API (contrôleurs FastAPI).
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    # Read operations
    def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        site_id: Optional[str] = None,
        only_active: bool = True,
    ) -> List[CashRegister]:
        query = self._db.query(CashRegister)
        if site_id:
            query = query.filter(CashRegister.site_id == site_id)
        if only_active:
            query = query.filter(CashRegister.is_active.is_(True))
        return query.offset(skip).limit(limit).all()

    def get(self, *, register_id: str) -> Optional[CashRegister]:
        return self._db.query(CashRegister).filter(CashRegister.id == register_id).first()

    # Create
    def create(self, *, data: CashRegisterCreate) -> CashRegister:
        register = CashRegister(
            name=data.name,
            location=data.location,
            site_id=data.site_id,
            is_active=data.is_active,
        )
        self._db.add(register)
        self._db.commit()
        self._db.refresh(register)
        return register

    # Update (partial)
    def update(self, *, register: CashRegister, data: CashRegisterUpdate) -> CashRegister:
        if data.name is not None:
            register.name = data.name
        if data.location is not None:
            register.location = data.location
        if data.site_id is not None:
            register.site_id = data.site_id
        if data.is_active is not None:
            register.is_active = data.is_active

        self._db.add(register)
        self._db.commit()
        self._db.refresh(register)
        return register

    # Delete
    def delete(self, *, register: CashRegister) -> None:
        """Supprimer un poste de caisse après vérification des dépendances."""
        self._check_dependencies(register)
        self._db.delete(register)
        self._db.commit()

    def _check_dependencies(self, register: CashRegister) -> None:
        """Vérifier les dépendances avant suppression d'un poste de caisse."""
        from fastapi import HTTPException, status as http_status
        from recyclic_api.models.cash_session import CashSession

        # Check for cash sessions - FIXED: use register_id not cash_register_id
        sessions_count = self._db.query(CashSession).filter(
            CashSession.register_id == register.id
        ).count()

        if sessions_count > 0:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail=f"Impossible de supprimer le poste de caisse '{register.name}'. "
                       f"{sessions_count} session(s) de caisse y sont associées."
            )


