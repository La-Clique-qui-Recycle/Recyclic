from __future__ import annotations

from typing import Optional, List, Tuple
from uuid import UUID
from decimal import Decimal
from datetime import date

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, desc, and_
from fastapi import HTTPException, status

from recyclic_api.models import (
    PosteReception,
    PosteReceptionStatus,
    TicketDepot,
    TicketDepotStatus,
    LigneDepot,
    Destination as DBLigneDestination,
)
from recyclic_api.repositories.reception import (
    PosteReceptionRepository,
    TicketDepotRepository,
    UserRepository,
    LigneDepotRepository,
    CategoryRepository,
)


class ReceptionService:
    """Service métier pour la gestion des postes de réception et des tickets."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.poste_repo = PosteReceptionRepository(db)
        self.ticket_repo = TicketDepotRepository(db)
        self.user_repo = UserRepository(db)
        self.ligne_repo = LigneDepotRepository(db)
        self.category_repo = CategoryRepository(db)

    # Postes
    def open_poste(self, opened_by_user_id: UUID) -> PosteReception:
        poste = PosteReception(opened_by_user_id=opened_by_user_id, status=PosteReceptionStatus.OPENED.value)
        self.db.add(poste)
        self.db.commit()
        self.db.refresh(poste)
        return poste

    def close_poste(self, poste_id: UUID) -> PosteReception:
        poste: Optional[PosteReception] = self.poste_repo.get(poste_id)
        if not poste:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste introuvable")

        # Contrainte métier: pas de tickets ouverts
        open_tickets = self.poste_repo.count_open_tickets(poste.id)
        if open_tickets > 0:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Des tickets ouverts empêchent la fermeture du poste")

        poste.status = PosteReceptionStatus.CLOSED.value
        from sqlalchemy.sql import func

        poste.closed_at = func.now()
        return self.poste_repo.update(poste)

    # Tickets
    def create_ticket(self, poste_id: UUID, benevole_user_id: UUID) -> TicketDepot:
        # Vérifier que le poste existe et est ouvert
        poste: Optional[PosteReception] = self.poste_repo.get(poste_id)
        if not poste:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poste introuvable")
        if poste.status != PosteReceptionStatus.OPENED.value:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Poste fermé")

        # Vérifier l'utilisateur
        if not self.user_repo.get(benevole_user_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable")

        ticket = TicketDepot(
            poste_id=poste.id,
            benevole_user_id=benevole_user_id,
            status=TicketDepotStatus.OPENED.value,
        )
        return self.ticket_repo.add(ticket)

    def close_ticket(self, ticket_id: UUID) -> TicketDepot:
        ticket: Optional[TicketDepot] = self.ticket_repo.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")
        if ticket.status == TicketDepotStatus.CLOSED.value:
            return ticket

        from sqlalchemy.sql import func

        ticket.status = TicketDepotStatus.CLOSED.value
        ticket.closed_at = func.now()
        return self.ticket_repo.update(ticket)


    # Lignes de dépôt
    def create_ligne(self, *, ticket_id: UUID, category_id: UUID, poids_kg: float, destination: Optional[str], notes: Optional[str]) -> LigneDepot:
        """Créer une ligne de dépôt avec règles métier: poids>0 et ticket ouvert."""
        ticket: Optional[TicketDepot] = self.ticket_repo.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")
        if ticket.status != TicketDepotStatus.OPENED.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ticket fermé")

        if not self.category_repo.exists(category_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catégorie introuvable")

        # Validation poids côté service (déjà validé par Pydantic au niveau schéma d'entrée)
        if poids_kg <= 0:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="poids_kg doit être > 0")

        # Convertir destination en enum DB si string fournie
        dest_value = None
        if destination is not None:
            dest_value = DBLigneDestination(destination)

        ligne = LigneDepot(
            ticket_id=ticket.id,
            category_id=category_id,
            poids_kg=poids_kg,
            destination=dest_value,
            notes=notes,
        )
        return self.ligne_repo.add(ligne)

    def update_ligne(
        self,
        *,
        ligne_id: UUID,
        category_id: Optional[UUID] = None,
        poids_kg: Optional[float] = None,
        destination: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> LigneDepot:
        ligne: Optional[LigneDepot] = self.ligne_repo.get(ligne_id)
        if not ligne:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ligne introuvable")

        # On ne peut modifier que si le ticket est ouvert
        ticket: Optional[TicketDepot] = self.ticket_repo.get(ligne.ticket_id)
        assert ticket is not None
        if ticket.status != TicketDepotStatus.OPENED.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ticket fermé")

        if category_id is not None:
            if not self.category_repo.exists(category_id):
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catégorie introuvable")
            ligne.category_id = category_id

        if poids_kg is not None:
            if poids_kg <= 0:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="poids_kg doit être > 0")
            ligne.poids_kg = poids_kg

        if destination is not None:
            ligne.destination = DBLigneDestination(destination)

        if notes is not None:
            ligne.notes = notes

        return self.ligne_repo.update(ligne)

    def delete_ligne(self, *, ligne_id: UUID) -> None:
        ligne: Optional[LigneDepot] = self.ligne_repo.get(ligne_id)
        if not ligne:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ligne introuvable")
        ticket: Optional[TicketDepot] = self.ticket_repo.get(ligne.ticket_id)
        assert ticket is not None
        if ticket.status != TicketDepotStatus.OPENED.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ticket fermé")
        self.ligne_repo.delete(ligne)

    # Méthodes pour l'historique des tickets
    def get_tickets_list(self, page: int = 1, per_page: int = 10) -> Tuple[List[TicketDepot], int]:
        """Récupérer la liste paginée des tickets avec leurs informations de base."""
        offset = (page - 1) * per_page
        
        # Requête avec eager loading pour éviter les N+1 queries
        query = self.db.query(TicketDepot).options(
            selectinload(TicketDepot.benevole),
            selectinload(TicketDepot.lignes)
        ).order_by(desc(TicketDepot.created_at))
        
        # Compter le total
        total = query.count()
        
        # Récupérer les tickets paginés
        tickets = query.offset(offset).limit(per_page).all()
        
        return tickets, total

    def get_ticket_detail(self, ticket_id: UUID) -> Optional[TicketDepot]:
        """Récupérer les détails complets d'un ticket avec ses lignes."""
        return self.db.query(TicketDepot).options(
            selectinload(TicketDepot.benevole),
            selectinload(TicketDepot.lignes).selectinload(LigneDepot.category)
        ).filter(TicketDepot.id == ticket_id).first()

    def _calculate_ticket_totals(self, ticket: TicketDepot) -> Tuple[int, Decimal]:
        """Calculer le nombre de lignes et le poids total d'un ticket."""
        total_lignes = len(ticket.lignes)
        total_poids = sum(ligne.poids_kg for ligne in ticket.lignes)
        return total_lignes, total_poids

    def get_lignes_depot_filtered(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        category_id: Optional[UUID] = None,
        page: int = 1,
        per_page: int = 50
    ) -> Tuple[List[LigneDepot], int]:
        """
        Récupérer les lignes de dépôt avec filtres et pagination.
        
        Args:
            start_date: Date de début (inclusive)
            end_date: Date de fin (inclusive)
            category_id: ID de la catégorie à filtrer
            page: Numéro de page (commence à 1)
            per_page: Nombre d'éléments par page
            
        Returns:
            Tuple[List[LigneDepot], int]: (lignes, total_count)
        """
        offset = (page - 1) * per_page
        
        # Requête de base avec eager loading
        query = self.db.query(LigneDepot).options(
            selectinload(LigneDepot.category),
            selectinload(LigneDepot.ticket).selectinload(TicketDepot.benevole)
        )
        
        # Appliquer les filtres
        if start_date or end_date:
            # Joindre avec la table ticket pour filtrer par date de création
            query = query.join(TicketDepot, LigneDepot.ticket_id == TicketDepot.id)
            
            if start_date:
                query = query.filter(TicketDepot.created_at >= start_date)
            if end_date:
                # Ajouter 1 jour pour inclure toute la journée de fin
                from datetime import timedelta
                end_date_inclusive = end_date + timedelta(days=1)
                query = query.filter(TicketDepot.created_at < end_date_inclusive)
        
        if category_id:
            query = query.filter(LigneDepot.category_id == category_id)
        
        # Compter le total avant pagination
        total = query.count()
        
        # Appliquer la pagination et l'ordre
        lignes = query.order_by(desc(LigneDepot.id)).offset(offset).limit(per_page).all()
        
        return lignes, total

    def get_lignes_depot_for_export(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        category_id: Optional[UUID] = None
    ) -> List[LigneDepot]:
        """
        Récupérer toutes les lignes de dépôt pour l'export CSV (sans pagination).
        
        Args:
            start_date: Date de début (inclusive)
            end_date: Date de fin (inclusive)
            category_id: ID de la catégorie à filtrer
            
        Returns:
            List[LigneDepot]: Toutes les lignes correspondant aux filtres
        """
        # Requête de base avec eager loading
        query = self.db.query(LigneDepot).options(
            selectinload(LigneDepot.category),
            selectinload(LigneDepot.ticket).selectinload(TicketDepot.benevole)
        )
        
        # Appliquer les filtres
        if start_date or end_date:
            # Joindre avec la table ticket pour filtrer par date de création
            query = query.join(TicketDepot, LigneDepot.ticket_id == TicketDepot.id)
            
            if start_date:
                query = query.filter(TicketDepot.created_at >= start_date)
            if end_date:
                # Ajouter 1 jour pour inclure toute la journée de fin
                from datetime import timedelta
                end_date_inclusive = end_date + timedelta(days=1)
                query = query.filter(TicketDepot.created_at < end_date_inclusive)
        
        if category_id:
            query = query.filter(LigneDepot.category_id == category_id)
        
        # Récupérer toutes les lignes correspondant aux filtres
        return query.order_by(desc(LigneDepot.id)).all()

