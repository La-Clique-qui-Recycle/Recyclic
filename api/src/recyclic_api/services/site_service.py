from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from recyclic_api.models.site import Site
from recyclic_api.schemas.site import (
    SiteCreate,
    SiteUpdate,
)


class SiteService:
    """Service d'accès et de gestion des sites.

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
        only_active: bool = False,
    ) -> List[Site]:
        query = self._db.query(Site)
        if only_active:
            query = query.filter(Site.is_active.is_(True))
        return query.offset(skip).limit(limit).all()

    def get(self, *, site_id: str) -> Optional[Site]:
        return self._db.query(Site).filter(Site.id == site_id).first()

    # Create
    def create(self, *, data: SiteCreate) -> Site:
        site = Site(
            name=data.name,
            address=data.address,
            city=data.city,
            postal_code=data.postal_code,
            country=data.country,
            configuration=data.configuration,
            is_active=data.is_active,
        )
        self._db.add(site)
        self._db.commit()
        self._db.refresh(site)
        return site

    # Update
    def update(self, *, site: Site, data: SiteUpdate) -> Site:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(site, field, value)
        self._db.commit()
        self._db.refresh(site)
        return site

    # Delete
    def delete(self, *, site: Site) -> None:
        # Check for dependencies before deletion
        self._check_dependencies(site)
        self._db.delete(site)
        self._db.commit()

    def _check_dependencies(self, site: Site) -> None:
        """Vérifier les dépendances avant suppression d'un site."""
        from recyclic_api.models.cash_register import CashRegister
        from recyclic_api.models.user import User

        # Check for cash registers
        cash_registers_count = self._db.query(CashRegister).filter(
            CashRegister.site_id == site.id
        ).count()

        if cash_registers_count > 0:
            raise ValueError(
                f"Impossible de supprimer le site '{site.name}'. "
                f"{cash_registers_count} poste(s) de caisse y sont associés."
            )

        # Check for users with this site as primary
        users_count = self._db.query(User).filter(
            User.primary_site_id == site.id
        ).count()

        if users_count > 0:
            raise ValueError(
                f"Impossible de supprimer le site '{site.name}'. "
                f"{users_count} utilisateur(s) l'utilisent comme site principal."
            )