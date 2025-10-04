from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from recyclic_api.models import PosteReception, TicketDepot, User, LigneDepot, Category


class PosteReceptionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, poste_id: UUID) -> Optional[PosteReception]:
        return self.db.query(PosteReception).filter(PosteReception.id == poste_id).first()

    def count_open_tickets(self, poste_id: UUID) -> int:
        from recyclic_api.models import TicketDepotStatus

        return (
            self.db.query(TicketDepot)
            .filter(TicketDepot.poste_id == poste_id, TicketDepot.status == TicketDepotStatus.OPENED.value)
            .count()
        )

    def add(self, poste: PosteReception) -> PosteReception:
        self.db.add(poste)
        self.db.commit()
        self.db.refresh(poste)
        return poste

    def update(self, poste: PosteReception) -> PosteReception:
        self.db.commit()
        self.db.refresh(poste)
        return poste


class TicketDepotRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, ticket_id: UUID) -> Optional[TicketDepot]:
        return self.db.query(TicketDepot).filter(TicketDepot.id == ticket_id).first()

    def add(self, ticket: TicketDepot) -> TicketDepot:
        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)
        return ticket

    def update(self, ticket: TicketDepot) -> TicketDepot:
        self.db.commit()
        self.db.refresh(ticket)
        return ticket


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user_id: UUID) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()


class LigneDepotRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, ligne_id: UUID) -> Optional[LigneDepot]:
        return self.db.query(LigneDepot).filter(LigneDepot.id == ligne_id).first()

    def add(self, ligne: LigneDepot) -> LigneDepot:
        self.db.add(ligne)
        self.db.commit()
        self.db.refresh(ligne)
        return ligne

    def update(self, ligne: LigneDepot) -> LigneDepot:
        self.db.commit()
        self.db.refresh(ligne)
        return ligne

    def delete(self, ligne: LigneDepot) -> None:
        self.db.delete(ligne)
        self.db.commit()


class CategoryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def exists(self, category_id: UUID) -> bool:
        return (
            self.db.query(Category)
            .filter(Category.id == category_id, Category.is_active.is_(True))
            .first()
            is not None
        )

    def get(self, category_id: UUID) -> Optional[Category]:
        return self.db.query(Category).filter(Category.id == category_id).first()

    def get_all_active(self) -> list[Category]:
        return self.db.query(Category).filter(Category.is_active.is_(True)).all()


