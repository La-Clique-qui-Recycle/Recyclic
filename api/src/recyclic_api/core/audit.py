"""
Module d'audit pour tracer les actions importantes
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from .config import settings

# Configuration du logger d'audit
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Handler pour les logs d'audit
if not audit_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '%(asctime)s - AUDIT - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    audit_logger.addHandler(handler)

def log_role_change(
    admin_user_id: str,
    admin_username: str,
    target_user_id: str,
    target_username: str,
    old_role: str,
    new_role: str,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Log une modification de rôle utilisateur"""
    
    log_data = {
        "action": "role_change",
        "admin_user_id": admin_user_id,
        "admin_username": admin_username,
        "target_user_id": target_user_id,
        "target_username": target_username,
        "old_role": old_role,
        "new_role": new_role,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if error_message:
        log_data["error"] = error_message
    
    if success:
        audit_logger.info(
            f"Role change: {admin_username} changed {target_username} "
            f"from {old_role} to {new_role}",
            extra=log_data
        )
    else:
        audit_logger.error(
            f"Failed role change: {admin_username} attempted to change "
            f"{target_username} from {old_role} to {new_role} - {error_message}",
            extra=log_data
        )

def log_admin_access(
    user_id: str,
    username: str,
    endpoint: str,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Log un accès à une fonctionnalité d'administration"""
    
    log_data = {
        "action": "admin_access",
        "user_id": user_id,
        "username": username,
        "endpoint": endpoint,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if error_message:
        log_data["error"] = error_message
    
    if success:
        audit_logger.info(
            f"Admin access: {username} accessed {endpoint}",
            extra=log_data
        )
    else:
        audit_logger.warning(
            f"Failed admin access: {username} attempted to access {endpoint} - {error_message}",
            extra=log_data
        )

def log_user_creation(
    admin_user_id: str,
    admin_username: str,
    new_user_id: str,
    new_username: str,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Log la création d'un nouvel utilisateur"""
    
    log_data = {
        "action": "user_creation",
        "admin_user_id": admin_user_id,
        "admin_username": admin_username,
        "new_user_id": new_user_id,
        "new_username": new_username,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if error_message:
        log_data["error"] = error_message
    
    if success:
        audit_logger.info(
            f"User creation: {admin_username} created user {new_username}",
            extra=log_data
        )
    else:
        audit_logger.error(
            f"Failed user creation: {admin_username} attempted to create {new_username} - {error_message}",
            extra=log_data
        )

def log_security_event(
    event_type: str,
    user_id: Optional[str],
    username: Optional[str],
    details: Dict[str, Any],
    severity: str = "info"
):
    """Log un événement de sécurité"""
    
    log_data = {
        "action": "security_event",
        "event_type": event_type,
        "user_id": user_id,
        "username": username,
        "details": details,
        "severity": severity,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if severity == "error":
        audit_logger.error(
            f"Security event: {event_type} - {username or 'Unknown user'}",
            extra=log_data
        )
    elif severity == "warning":
        audit_logger.warning(
            f"Security event: {event_type} - {username or 'Unknown user'}",
            extra=log_data
        )
    else:
        audit_logger.info(
            f"Security event: {event_type} - {username or 'Unknown user'}",
            extra=log_data
        )

def log_cash_session_opening(
    operator_id: str,
    operator_username: str,
    session_id: str,
    initial_amount: float,
    site_id: Optional[str] = None,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Log l'ouverture d'une session de caisse"""
    
    log_data = {
        "action": "cash_session_opening",
        "operator_id": operator_id,
        "operator_username": operator_username,
        "session_id": session_id,
        "initial_amount": initial_amount,
        "site_id": site_id,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if error_message:
        log_data["error"] = error_message
    
    if success:
        audit_logger.info(
            f"Cash session opened: {operator_username} opened session {session_id} "
            f"with initial amount {initial_amount}€",
            extra=log_data
        )
    else:
        audit_logger.error(
            f"Failed cash session opening: {operator_username} failed to open session - {error_message}",
            extra=log_data
        )

def log_cash_session_closing(
    operator_id: str,
    operator_username: str,
    session_id: str,
    final_amount: float,
    total_sales: float,
    total_items: int,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Log la fermeture d'une session de caisse"""
    
    log_data = {
        "action": "cash_session_closing",
        "operator_id": operator_id,
        "operator_username": operator_username,
        "session_id": session_id,
        "final_amount": final_amount,
        "total_sales": total_sales,
        "total_items": total_items,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if error_message:
        log_data["error"] = error_message
    
    if success:
        audit_logger.info(
            f"Cash session closed: {operator_username} closed session {session_id} "
            f"with final amount {final_amount}€, sales: {total_sales}€, items: {total_items}",
            extra=log_data
        )
    else:
        audit_logger.error(
            f"Failed cash session closing: {operator_username} failed to close session {session_id} - {error_message}",
            extra=log_data
        )

def log_cash_sale(
    operator_id: str,
    operator_username: str,
    session_id: str,
    sale_id: str,
    amount: float,
    payment_method: str,
    deposit_id: Optional[str] = None,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Log une vente en caisse"""
    
    log_data = {
        "action": "cash_sale",
        "operator_id": operator_id,
        "operator_username": operator_username,
        "session_id": session_id,
        "sale_id": sale_id,
        "amount": amount,
        "payment_method": payment_method,
        "deposit_id": deposit_id,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if error_message:
        log_data["error"] = error_message
    
    if success:
        audit_logger.info(
            f"Cash sale: {operator_username} processed sale {sale_id} "
            f"for {amount}€ via {payment_method} in session {session_id}",
            extra=log_data
        )
    else:
        audit_logger.error(
            f"Failed cash sale: {operator_username} failed to process sale in session {session_id} - {error_message}",
            extra=log_data
        )

def log_cash_session_access(
    user_id: str,
    username: str,
    session_id: str,
    action: str,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Log l'accès à une session de caisse"""
    
    log_data = {
        "action": "cash_session_access",
        "user_id": user_id,
        "username": username,
        "session_id": session_id,
        "access_action": action,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if error_message:
        log_data["error"] = error_message
    
    if success:
        audit_logger.info(
            f"Cash session access: {username} performed {action} on session {session_id}",
            extra=log_data
        )
    else:
        audit_logger.warning(
            f"Failed cash session access: {username} failed to {action} session {session_id} - {error_message}",
            extra=log_data
        )