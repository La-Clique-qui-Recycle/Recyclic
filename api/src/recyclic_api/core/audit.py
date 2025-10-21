"""
Module de gestion du journal d'audit centralisé
"""
from typing import Optional, Dict, Any, Union
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

from recyclic_api.models.audit_log import AuditLog, AuditActionType
from recyclic_api.models.user import User


def log_audit(
    action_type: Union[str, AuditActionType],
    actor: Optional[User] = None,
    target_id: Optional[UUID] = None,
    target_type: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    description: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    db: Optional[Session] = None
) -> Optional[AuditLog]:
    """
    Enregistre un événement d'audit dans le journal centralisé.
    
    Args:
        action_type: Type d'action (enum AuditActionType ou string)
        actor: Utilisateur qui a effectué l'action (optionnel)
        target_id: ID de la cible de l'action (optionnel)
        target_type: Type de la cible (ex: "user", "group", "system")
        details: Détails supplémentaires en JSON (optionnel)
        description: Description textuelle de l'action (optionnel)
        ip_address: Adresse IP de l'acteur (optionnel)
        user_agent: User-Agent de la requête (optionnel)
        db: Session de base de données (optionnel, sera créée si non fournie)
    
    Returns:
        AuditLog: L'entrée d'audit créée, ou None en cas d'erreur
    """
    if db is None:
        # Si pas de session fournie, on ne peut pas créer l'entrée
        # Cette fonction doit être appelée dans un contexte avec une session DB
        return None
    
    try:
        # Convertir l'action_type en string si c'est un enum
        if isinstance(action_type, AuditActionType):
            action_type_str = action_type.value
        else:
            action_type_str = str(action_type)
        
        # Créer l'entrée d'audit
        audit_entry = AuditLog(
            timestamp=datetime.utcnow(),
            actor_id=actor.id if actor else None,
            actor_username=actor.username if actor else None,
            action_type=action_type_str,
            target_id=target_id,
            target_type=target_type,
            details_json=details,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Sauvegarder en base
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        
        return audit_entry
        
    except Exception as e:
        # En cas d'erreur, on log mais on ne fait pas échouer l'opération principale
        print(f"Erreur lors de l'enregistrement de l'audit: {e}")
        db.rollback()
        return None


def log_user_action(
    action_type: Union[str, AuditActionType],
    actor: User,
    target_user: Optional[User] = None,
    details: Optional[Dict[str, Any]] = None,
    description: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    db: Optional[Session] = None
) -> Optional[AuditLog]:
    """
    Version simplifiée pour les actions sur les utilisateurs.
    
    Args:
        action_type: Type d'action
        actor: Utilisateur qui effectue l'action
        target_user: Utilisateur cible (optionnel)
        details: Détails supplémentaires
        description: Description de l'action
        ip_address: Adresse IP
        user_agent: User-Agent
        db: Session de base de données
    
    Returns:
        AuditLog: L'entrée d'audit créée
    """
    return log_audit(
        action_type=action_type,
        actor=actor,
        target_id=target_user.id if target_user else None,
        target_type="user" if target_user else None,
        details=details,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
        db=db
    )


def log_system_action(
    action_type: Union[str, AuditActionType],
    actor: Optional[User] = None,
    target_type: Optional[str] = None,
    target_id: Optional[UUID] = None,
    details: Optional[Dict[str, Any]] = None,
    description: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    db: Optional[Session] = None
) -> Optional[AuditLog]:
    """
    Version pour les actions système (sans utilisateur spécifique).
    
    Args:
        action_type: Type d'action
        actor: Utilisateur qui effectue l'action (optionnel)
        target_type: Type de la cible
        target_id: ID de la cible
        details: Détails supplémentaires
        description: Description de l'action
        ip_address: Adresse IP
        user_agent: User-Agent
        db: Session de base de données
    
    Returns:
        AuditLog: L'entrée d'audit créée
    """
    return log_audit(
        action_type=action_type,
        actor=actor,
        target_id=target_id,
        target_type=target_type,
        details=details,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
        db=db
    )


def log_admin_access(
    user_id: str,
    username: str,
    endpoint: str,
    success: bool = True,
    error_message: Optional[str] = None,
    db: Optional[Session] = None
) -> Optional[AuditLog]:
    """
    Enregistre l'accès d'un administrateur à un endpoint.
    
    Args:
        user_id: ID de l'utilisateur administrateur
        username: Nom d'utilisateur de l'administrateur
        endpoint: Endpoint accédé
        success: Si l'accès a réussi
        error_message: Message d'erreur si échec
        db: Session de base de données
    
    Returns:
        AuditLog: L'entrée d'audit créée
    """
    action_type = AuditActionType.SYSTEM_CONFIG_CHANGED if success else AuditActionType.SYSTEM_CONFIG_CHANGED
    description = f"Accès admin à {endpoint}" if success else f"Échec accès admin à {endpoint}"
    
    details = {
        "endpoint": endpoint,
        "success": success
    }
    
    if error_message:
        details["error_message"] = error_message
    
    # Note: Cette fonction ne peut pas récupérer l'utilisateur car elle est appelée
    # avant la validation, donc on passe les infos directement
    return log_audit(
        action_type=action_type,
        actor=None,  # Pas d'acteur car on n'a pas l'objet User
        details=details,
        description=description,
        db=db
    )


def log_role_change(
    admin_user_id: str,
    admin_username: str,
    target_user_id: Optional[str] = None,
    target_username: Optional[str] = None,
    old_role: Optional[str] = None,
    new_role: Optional[str] = None,
    success: bool = True,
    db: Optional[Session] = None
) -> Optional[AuditLog]:
    """
    Enregistre un changement de rôle d'utilisateur.
    
    Args:
        admin_user_id: ID de l'administrateur qui fait le changement
        admin_username: Nom d'utilisateur de l'administrateur
        target_user_id: ID de l'utilisateur cible
        target_username: Nom d'utilisateur cible
        old_role: Ancien rôle
        new_role: Nouveau rôle
        success: Si le changement a réussi
        db: Session de base de données
    
    Returns:
        AuditLog: L'entrée d'audit créée
    """
    action_type = AuditActionType.USER_ROLE_CHANGED if success else AuditActionType.USER_ROLE_CHANGED
    description = f"Changement de rôle: {old_role} → {new_role}" if success else f"Échec changement de rôle"
    
    details = {
        "admin_user_id": admin_user_id,
        "admin_username": admin_username,
        "target_user_id": target_user_id,
        "target_username": target_username,
        "old_role": old_role,
        "new_role": new_role,
        "success": success
    }
    
    return log_audit(
        action_type=action_type,
        actor=None,  # Pas d'acteur car on n'a pas l'objet User
        target_id=target_user_id,
        target_type="user",
        details=details,
        description=description,
        db=db
    )


def log_cash_session_opening(
    user_id: str,
    username: str,
    session_id: str,
    opening_amount: float,
    success: bool = True,
    db: Optional[Session] = None
) -> Optional[AuditLog]:
    """
    Enregistre l'ouverture d'une session de caisse.
    
    Args:
        user_id: ID de l'utilisateur qui ouvre la session
        username: Nom d'utilisateur
        session_id: ID de la session de caisse
        opening_amount: Montant d'ouverture
        success: Si l'ouverture a réussi
        db: Session de base de données
    
    Returns:
        AuditLog: L'entrée d'audit créée
    """
    action_type = AuditActionType.SYSTEM_CONFIG_CHANGED  # Utiliser un type générique
    description = f"Ouverture de session de caisse {session_id}" if success else f"Échec ouverture de session de caisse"
    
    details = {
        "user_id": user_id,
        "username": username,
        "session_id": session_id,
        "opening_amount": opening_amount,
        "success": success
    }
    
    return log_audit(
        action_type=action_type,
        actor=None,
        target_id=session_id,
        target_type="cash_session",
        details=details,
        description=description,
        db=db
    )


def log_cash_session_closing(
    user_id: str,
    username: str,
    session_id: str,
    closing_amount: float,
    success: bool = True,
    db: Optional[Session] = None
) -> Optional[AuditLog]:
    """
    Enregistre la fermeture d'une session de caisse.
    
    Args:
        user_id: ID de l'utilisateur qui ferme la session
        username: Nom d'utilisateur
        session_id: ID de la session de caisse
        closing_amount: Montant de fermeture
        success: Si la fermeture a réussi
        db: Session de base de données
    
    Returns:
        AuditLog: L'entrée d'audit créée
    """
    action_type = AuditActionType.SYSTEM_CONFIG_CHANGED  # Utiliser un type générique
    description = f"Fermeture de session de caisse {session_id}" if success else f"Échec fermeture de session de caisse"
    
    details = {
        "user_id": user_id,
        "username": username,
        "session_id": session_id,
        "closing_amount": closing_amount,
        "success": success
    }
    
    return log_audit(
        action_type=action_type,
        actor=None,
        target_id=session_id,
        target_type="cash_session",
        details=details,
        description=description,
        db=db
    )


def log_cash_sale(
    user_id: str,
    username: str,
    sale_id: str,
    amount: float,
    success: bool = True,
    db: Optional[Session] = None
) -> Optional[AuditLog]:
    """
    Enregistre une vente en caisse.
    
    Args:
        user_id: ID de l'utilisateur qui effectue la vente
        username: Nom d'utilisateur
        sale_id: ID de la vente
        amount: Montant de la vente
        success: Si la vente a réussi
        db: Session de base de données
    
    Returns:
        AuditLog: L'entrée d'audit créée
    """
    action_type = AuditActionType.SYSTEM_CONFIG_CHANGED  # Utiliser un type générique
    description = f"Vente en caisse {sale_id}" if success else f"Échec vente en caisse"
    
    details = {
        "user_id": user_id,
        "username": username,
        "sale_id": sale_id,
        "amount": amount,
        "success": success
    }
    
    return log_audit(
        action_type=action_type,
        actor=None,
        target_id=sale_id,
        target_type="sale",
        details=details,
        description=description,
        db=db
    )


def log_cash_session_access(
    user_id: str,
    username: str,
    session_id: str,
    success: bool = True,
    db: Optional[Session] = None
) -> Optional[AuditLog]:
    """
    Enregistre l'accès à une session de caisse.
    
    Args:
        user_id: ID de l'utilisateur qui accède à la session
        username: Nom d'utilisateur
        session_id: ID de la session de caisse
        success: Si l'accès a réussi
        db: Session de base de données
    
    Returns:
        AuditLog: L'entrée d'audit créée
    """
    action_type = AuditActionType.SYSTEM_CONFIG_CHANGED  # Utiliser un type générique
    description = f"Accès à la session de caisse {session_id}" if success else f"Échec accès à la session de caisse"
    
    details = {
        "user_id": user_id,
        "username": username,
        "session_id": session_id,
        "success": success
    }
    
    return log_audit(
        action_type=action_type,
        actor=None,
        target_id=session_id,
        target_type="cash_session",
        details=details,
        description=description,
        db=db
    )