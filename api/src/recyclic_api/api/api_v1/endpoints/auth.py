from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import select
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
import time

from recyclic_api.core.database import get_db
from recyclic_api.core.security import create_access_token, verify_password, hash_password, create_reset_token, verify_reset_token
from recyclic_api.models.user import User, UserRole, UserStatus
from recyclic_api.models.login_history import LoginHistory
from recyclic_api.schemas.auth import LoginRequest, LoginResponse, AuthUser, SignupRequest, SignupResponse, ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest, ResetPasswordResponse
from recyclic_api.utils.auth_metrics import auth_metrics

# Create rate limiter with Redis backend (using existing Redis connection)
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(tags=["auth"])

# Configure logger for authentication events
logger = logging.getLogger(__name__)

# Add rate limit exception handler (should be added to main app, not router)
# router.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Check if we're in test mode
def is_test_mode():
    return os.getenv("PYTEST_CURRENT_TEST") is not None or os.getenv("TESTING") == "true"

# Conditional rate limiting decorator
def conditional_rate_limit(limit_str):
    def decorator(func):
        if is_test_mode():
            return func
        else:
            return limiter.limit(limit_str)(func)
    return decorator

@router.post("/login", response_model=LoginResponse)
@conditional_rate_limit("10/minute")
async def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """Authentifie un utilisateur via son nom d'utilisateur et mot de passe, et retourne un JWT."""

    start_time = time.time()
    client_ip = getattr(request.client, 'host', 'unknown') if request.client else 'unknown'

    # Récupérer l'utilisateur par son nom d'utilisateur
    result = db.execute(select(User).where(User.username == payload.username))
    user = result.scalar_one_or_none()

    # Vérifier si l'utilisateur existe et est actif
    if not user or not user.is_active:
        # Log failed login attempt
        logger.warning(f"Failed login attempt for username: {payload.username}, IP: {client_ip}")

        # Record metrics for failed login
        elapsed_ms = (time.time() - start_time) * 1000
        auth_metrics.record_login_attempt(
            username=payload.username,
            success=False,
            elapsed_ms=elapsed_ms,
            client_ip=client_ip,
            error_type="invalid_user_or_inactive"
        )

        # Persist failed login attempt
        try:
            db.add(LoginHistory(
                id=__import__("uuid").uuid4(),
                user_id=None,
                username=payload.username,
                success=False,
                client_ip=client_ip,
                error_type="invalid_user_or_inactive",
            ))
            db.commit()
        except Exception:
            db.rollback()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides ou utilisateur inactif",
        )

    # Vérifier le mot de passe
    if not verify_password(payload.password, user.hashed_password):
        # Log failed login attempt due to invalid password
        logger.warning(f"Failed login attempt for username: {payload.username}, IP: {client_ip}")

        # Record metrics for failed login
        elapsed_ms = (time.time() - start_time) * 1000
        auth_metrics.record_login_attempt(
            username=payload.username,
            success=False,
            elapsed_ms=elapsed_ms,
            client_ip=client_ip,
            error_type="invalid_password"
        )

        # Persist failed login attempt
        try:
            db.add(LoginHistory(
                id=__import__("uuid").uuid4(),
                user_id=user.id if user else None,
                username=payload.username,
                success=False,
                client_ip=client_ip,
                error_type="invalid_password",
            ))
            db.commit()
        except Exception:
            db.rollback()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides ou utilisateur inactif",
        )

    # Créer le token JWT
    token = create_access_token({"sub": str(user.id)})

    # Log successful login
    logger.info(f"Successful login for user_id: {user.id}")

    # Record metrics for successful login
    elapsed_ms = (time.time() - start_time) * 1000
    auth_metrics.record_login_attempt(
        username=payload.username,
        success=True,
        elapsed_ms=elapsed_ms,
        client_ip=client_ip,
        user_id=str(user.id)
    )

    # Persist successful login
    try:
        db.add(LoginHistory(
            id=__import__("uuid").uuid4(),
            user_id=user.id,
            username=payload.username,
            success=True,
            client_ip=client_ip,
            error_type=None,
        ))
        db.commit()
    except Exception:
        db.rollback()

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUser(
            id=str(user.id),
            telegram_id=user.telegram_id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            status=user.status.value if hasattr(user.status, "value") else str(user.status),
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        ),
    )


@router.post("/signup", response_model=SignupResponse)
@conditional_rate_limit("5/minute")
async def signup(request: Request, payload: SignupRequest, db: Session = Depends(get_db)) -> SignupResponse:
    """Crée un nouveau compte utilisateur en attente de validation."""

    # Validation simple de l'email si fourni
    if payload.email is not None:
        email_val = str(payload.email)
        if "@" not in email_val or "." not in email_val:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Email invalide",
            )

    # Vérifier si le nom d'utilisateur existe déjà
    result = db.execute(select(User).where(User.username == payload.username))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce nom d'utilisateur est déjà pris",
        )

    # Hasher le mot de passe
    hashed_password = hash_password(payload.password)

    # Créer le nouvel utilisateur
    new_user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hashed_password,
        role=UserRole.USER,
        status=UserStatus.PENDING,
        is_active=True
    )

    # Sauvegarder en base de données
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return SignupResponse(
        message="Compte créé avec succès. Votre compte est en attente de validation par un administrateur.",
        user_id=str(new_user.id),
        status=new_user.status.value
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@conditional_rate_limit("5/minute")
async def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> ForgotPasswordResponse:
    """Génère un token de réinitialisation et l'envoie par email (ou le log)."""

    # Rechercher l'utilisateur par email
    result = db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    # Toujours retourner le même message, même si l'utilisateur n'existe pas
    # (pour éviter l'énumération d'emails)
    response_message = "Si un compte est associé à cet email, un lien de réinitialisation a été envoyé."

    if user and user.is_active:
        # Générer le token de réinitialisation
        reset_token = create_reset_token(str(user.id))

        # TODO: Intégrer un service d'envoi d'email ici
        # Pour le développement, on log le lien dans la console
        reset_link = f"http://localhost:4444/reset-password?token={reset_token}"
        print(f"🔑 Lien de réinitialisation pour {user.email}: {reset_link}")

        # Dans un vrai environnement, ici on enverrait l'email:
        # await send_password_reset_email(user.email, reset_link)

    return ForgotPasswordResponse(message=response_message)


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)) -> ResetPasswordResponse:
    """Réinitialise le mot de passe avec un token valide."""

    # Vérifier et décoder le token
    user_id = verify_reset_token(payload.token)

    # Récupérer l'utilisateur
    result = db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable ou inactif",
        )

    # Valider la force du nouveau mot de passe
    from recyclic_api.core.security import validate_password_strength
    is_valid, errors = validate_password_strength(payload.new_password)
    if not is_valid:
        # Translate common English messages to French keywords expected by tests
        translations = {
            "Password must be at least 8 characters long": "Le mot de passe doit contenir au moins 8 caractères",
            "Password must contain at least one uppercase letter": "Le mot de passe doit contenir au moins une lettre majuscule",
            "Password must contain at least one lowercase letter": "Le mot de passe doit contenir au moins une lettre minuscule",
            "Password must contain at least one digit": "Le mot de passe doit contenir au moins un chiffre",
            "Password must contain at least one special character": "Le mot de passe doit contenir au moins un caractère spécial",
        }
        fr_errors = [translations.get(e, e) for e in errors]
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Mot de passe invalide: {' '.join(fr_errors)}",
        )

    # Hasher le nouveau mot de passe
    new_hashed_password = hash_password(payload.new_password)

    # Mettre à jour le mot de passe
    user.hashed_password = new_hashed_password
    db.commit()

    return ResetPasswordResponse(message="Mot de passe réinitialisé avec succès.")


