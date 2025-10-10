"""
Database purge endpoint for SuperAdmins.
Allows secure deletion of transactional data.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import require_super_admin_role
from recyclic_api.models.user import User

router = APIRouter(tags=["admin"])
logger = logging.getLogger(__name__)


@router.post(
    "/db/purge-transactions",
    summary="Purge sécurisée des données transactionnelles (Super Admin uniquement)",
    description="Supprime toutes les données de ventes, réceptions et sessions de caisse. Action irréversible.",
    status_code=status.HTTP_200_OK
)
async def purge_transactional_data(
    current_user: User = Depends(require_super_admin_role()),
    db: Session = Depends(get_db)
):
    """
    Supprime de manière sécurisée toutes les données transactionnelles de l'application.
    
    Tables affectées (dans cet ordre pour respecter les contraintes de clés étrangères) :
    - sale_items (lignes de vente)
    - sales (ventes)
    - ligne_depot (lignes de dépôt)
    - ticket_depot (tickets de dépôt)
    - cash_sessions (sessions de caisse)
    
    Tables préservées :
    - users, sites, categories, cash_registers (configuration)
    
    Restrictions:
    - Accessible uniquement aux Super-Admins
    - Action irréversible
    - Exécutée dans une transaction unique
    """
    try:
        logger.warning(f"Database purge requested by user {current_user.id} ({current_user.username})")
        
        # Ordre de suppression pour respecter les contraintes de clés étrangères
        # Les tables enfants doivent être supprimées avant les tables parents
        tables_to_purge = [
            "sale_items",        # Lignes de vente (dépendent de sales)
            "sales",             # Ventes (dépendent de cash_sessions)
            "ligne_depot",       # Lignes de dépôt (dépendent de ticket_depot)
            "ticket_depot",      # Tickets de dépôt
            "cash_sessions"      # Sessions de caisse
        ]
        
        deleted_counts = {}
        
        # Utiliser une transaction SQLAlchemy appropriée
        try:
            for table in tables_to_purge:
                # Compter les enregistrements avant suppression
                count_query = text(f"SELECT COUNT(*) FROM {table}")
                count_result = db.execute(count_query).scalar()
                
                # Supprimer tous les enregistrements
                delete_query = text(f"DELETE FROM {table}")
                db.execute(delete_query)
                
                deleted_counts[table] = count_result
                logger.info(f"Deleted {count_result} records from {table}")
            
            # Valider la transaction
            db.commit()
            
        except Exception as e:
            # Rollback en cas d'erreur
            db.rollback()
            raise e
        
        logger.warning(f"Database purge completed by user {current_user.id}. Records deleted: {deleted_counts}")
        
        return {
            "message": "Purge des données transactionnelles effectuée avec succès",
            "deleted_records": deleted_counts,
            "timestamp": db.execute(text("SELECT NOW()")).scalar()
        }
        
    except Exception as e:
        # Rollback en cas d'erreur
        db.rollback()
        logger.error(f"Database purge failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la purge des données: {str(e)}"
        )
