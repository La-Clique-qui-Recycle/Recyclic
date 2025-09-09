from fastapi import APIRouter
from .endpoints import health, users, sites, deposits, sales, cash_sessions

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(sites.router, prefix="/sites", tags=["sites"])
api_router.include_router(deposits.router, prefix="/deposits", tags=["deposits"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(cash_sessions.router, prefix="/cash-sessions", tags=["cash-sessions"])
