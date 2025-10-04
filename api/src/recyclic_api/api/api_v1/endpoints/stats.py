"""
Statistics and analytics endpoints.
"""
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

from recyclic_api.core.database import get_db
from recyclic_api.core.auth import get_current_user, require_admin_role
from recyclic_api.models.user import User
from recyclic_api.services.stats_service import StatsService
from recyclic_api.schemas.stats import (
    ReceptionSummaryStats,
    CategoryStats,
)

router = APIRouter(tags=["stats"])
logger = logging.getLogger(__name__)

# Rate limiting configuration
limiter = Limiter(key_func=get_remote_address)


@router.get(
    "/reception/summary",
    response_model=ReceptionSummaryStats,
    summary="Get reception summary statistics",
    description="Retrieve summary statistics (total weight, items, categories) for reception data. "
                "Optionally filter by date range. Requires ADMIN or SUPER_ADMIN role."
)
@limiter.limit("60/minute")
def get_reception_summary(
    request: Request,
    start_date: Optional[date] = Query(
        None,
        description="Start date (inclusive) in ISO 8601 format (YYYY-MM-DD)"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date (inclusive) in ISO 8601 format (YYYY-MM-DD)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_role)
) -> ReceptionSummaryStats:
    """
    Get summary statistics for reception data.

    This endpoint aggregates data from ligne_depot and provides:
    - Total weight in kg
    - Total number of items
    - Number of unique categories

    Access restricted to ADMIN and SUPER_ADMIN roles.
    """
    logger.info(
        f"User {current_user.id} requesting reception summary stats "
        f"(start_date={start_date}, end_date={end_date})"
    )

    stats_service = StatsService(db)
    return stats_service.get_reception_summary(
        start_date=start_date,
        end_date=end_date
    )


@router.get(
    "/reception/by-category",
    response_model=List[CategoryStats],
    summary="Get reception statistics by category",
    description="Retrieve reception statistics grouped by category. "
                "Optionally filter by date range. Requires ADMIN or SUPER_ADMIN role."
)
@limiter.limit("60/minute")
def get_reception_by_category(
    request: Request,
    start_date: Optional[date] = Query(
        None,
        description="Start date (inclusive) in ISO 8601 format (YYYY-MM-DD)"
    ),
    end_date: Optional[date] = Query(
        None,
        description="End date (inclusive) in ISO 8601 format (YYYY-MM-DD)"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_role)
) -> List[CategoryStats]:
    """
    Get reception statistics grouped by category.

    This endpoint aggregates data from ligne_depot by category and provides:
    - Category name
    - Total weight in kg for that category
    - Total number of items for that category

    Results are sorted by total weight (descending).

    Access restricted to ADMIN and SUPER_ADMIN roles.
    """
    logger.info(
        f"User {current_user.id} requesting reception by category stats "
        f"(start_date={start_date}, end_date={end_date})"
    )

    stats_service = StatsService(db)
    return stats_service.get_reception_by_category(
        start_date=start_date,
        end_date=end_date
    )
