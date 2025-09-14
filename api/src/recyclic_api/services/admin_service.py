from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_
from sqlalchemy.orm import selectinload
from uuid import UUID

from ..models.user import User, UserRole, UserStatus
from ..schemas.admin import AdminUser, AdminUserList, PaginationInfo, UserRoleUpdate

class AdminService:
    """Service pour les opérations d'administration des utilisateurs"""
    
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_users(
        self,
        page: int = 1,
        limit: int = 20,
        role: Optional[UserRole] = None,
        status: Optional[UserStatus] = None,
        search: Optional[str] = None
    ) -> Tuple[List[AdminUser], PaginationInfo]:
        """Récupère la liste paginée des utilisateurs avec filtres"""
        
        # Construction de la requête de base
        query = select(User)
        
        # Application des filtres
        if role:
            query = query.where(User.role == role)
        if status:
            query = query.where(User.status == status)
        if search:
            search_filter = or_(
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                User.username.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        # Comptage total pour la pagination
        count_query = select(func.count(User.id))
        if role:
            count_query = count_query.where(User.role == role)
        if status:
            count_query = count_query.where(User.status == status)
        if search:
            count_query = count_query.where(search_filter)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Application de la pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        query = query.order_by(User.created_at.desc())
        
        # Exécution de la requête
        result = await self.db.execute(query)
        users = result.scalars().all()
        
        # Conversion en schémas AdminUser
        admin_users = []
        for user in users:
            full_name = self._get_full_name(user)
            admin_user = AdminUser(
                id=str(user.id),
                telegram_id=user.telegram_id,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                full_name=full_name,
                email=None,  # Pas d'email dans le modèle actuel
                role=user.role,
                status=user.status,
                is_active=user.is_active,
                site_id=str(user.site_id) if user.site_id else None,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
            admin_users.append(admin_user)
        
        # Calcul des informations de pagination
        pages = (total + limit - 1) // limit if total > 0 else 0
        has_next = page < pages
        has_prev = page > 1
        
        pagination = PaginationInfo(
            page=page,
            limit=limit,
            total=total,
            pages=pages,
            has_next=has_next,
            has_prev=has_prev
        )
        
        return admin_users, pagination

    async def update_user_role(
        self,
        user_id: str,
        role_update: UserRoleUpdate
    ) -> Optional[AdminUser]:
        """Met à jour le rôle d'un utilisateur"""
        
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            return None
        
        # Vérification que l'utilisateur existe
        user_query = select(User).where(User.id == user_uuid)
        result = await self.db.execute(user_query)
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        # Mise à jour du rôle
        update_query = (
            update(User)
            .where(User.id == user_uuid)
            .values(role=role_update.role)
        )
        
        await self.db.execute(update_query)
        await self.db.commit()
        
        # Récupération de l'utilisateur mis à jour
        updated_result = await self.db.execute(user_query)
        updated_user = updated_result.scalar_one()
        
        # Conversion en AdminUser
        full_name = self._get_full_name(updated_user)
        return AdminUser(
            id=str(updated_user.id),
            telegram_id=updated_user.telegram_id,
            username=updated_user.username,
            first_name=updated_user.first_name,
            last_name=updated_user.last_name,
            full_name=full_name,
            email=None,
            role=updated_user.role,
            status=updated_user.status,
            is_active=updated_user.is_active,
            site_id=str(updated_user.site_id) if updated_user.site_id else None,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at
        )

    def _get_full_name(self, user: User) -> Optional[str]:
        """Construit le nom complet à partir des champs first_name et last_name"""
        if user.first_name and user.last_name:
            return f"{user.first_name} {user.last_name}"
        elif user.first_name:
            return user.first_name
        elif user.last_name:
            return user.last_name
        else:
            return None
