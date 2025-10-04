from fastapi import APIRouter
from .endpoints import (
    health_router as health,
    users_router as users,
    sites_router as sites,
    deposits_router as deposits,
    sales_router as sales,
    cash_sessions_router as cash_sessions,
    cash_registers as cash_registers,
    admin_router as admin,
    monitoring_router as monitoring,
    auth_router as auth,
    email_router as email,
    reports_router as reports,
    admin_settings_router as admin_settings,
    dashboard_router as dashboard,
    reception_router as reception,
    stats_router as stats,
    categories_router as categories,
    settings_router as settings,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health, prefix="/health", tags=["health"])
api_router.include_router(users, prefix="/users", tags=["users"])
api_router.include_router(sites, prefix="/sites", tags=["sites"])
api_router.include_router(deposits, prefix="/deposits", tags=["deposits"])
api_router.include_router(sales, prefix="/sales", tags=["sales"])
api_router.include_router(cash_sessions, prefix="/cash-sessions", tags=["cash-sessions"])
api_router.include_router(cash_registers, prefix="/cash-registers", tags=["cash-registers"])
api_router.include_router(admin, prefix="/admin", tags=["admin"])
api_router.include_router(monitoring, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(auth, prefix="/auth", tags=["auth"])
api_router.include_router(email, prefix="/email", tags=["email"])
api_router.include_router(reports, prefix="/admin/reports", tags=["admin", "reports"])
api_router.include_router(admin_settings, prefix="/admin/settings", tags=["admin", "settings"])
api_router.include_router(dashboard, prefix="/admin/dashboard", tags=["admin", "dashboard"])
api_router.include_router(reception, prefix="/reception", tags=["reception"])
api_router.include_router(stats, prefix="/stats", tags=["stats"])
api_router.include_router(categories, prefix="/categories", tags=["categories"])
api_router.include_router(settings, prefix="/settings", tags=["settings"])


