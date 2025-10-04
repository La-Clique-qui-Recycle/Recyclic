"""
Service for statistics and analytics aggregation.
"""
from __future__ import annotations

from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from fastapi import HTTPException, status

from recyclic_api.models.ligne_depot import LigneDepot
from recyclic_api.models.ticket_depot import TicketDepot
from recyclic_api.models.category import Category
from recyclic_api.schemas.stats import ReceptionSummaryStats, CategoryStats


class StatsService:
    """Service for generating statistics and analytics."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def _validate_date_range(self, start_date: Optional[date], end_date: Optional[date]) -> None:
        """
        Validate that start_date is not after end_date.

        Args:
            start_date: Start date to validate
            end_date: End date to validate

        Raises:
            HTTPException: If start_date is after end_date
        """
        if start_date and end_date and start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date cannot be after end_date"
            )

    def get_reception_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> ReceptionSummaryStats:
        """
        Get summary statistics for reception data.

        Args:
            start_date: Optional start date filter (inclusive)
            end_date: Optional end date filter (inclusive)

        Returns:
            ReceptionSummaryStats with aggregated data

        Raises:
            HTTPException: If start_date is after end_date
        """
        # Validate date range
        self._validate_date_range(start_date, end_date)
        # Build base query
        query = self.db.query(
            func.coalesce(func.sum(LigneDepot.poids_kg), 0).label('total_weight'),
            func.count(LigneDepot.id).label('total_items'),
            func.count(func.distinct(LigneDepot.category_id)).label('unique_categories')
        ).join(
            TicketDepot,
            LigneDepot.ticket_id == TicketDepot.id
        )

        # Apply date filters if provided
        filters = []
        if start_date:
            start_datetime = datetime.combine(start_date, datetime.min.time())
            filters.append(TicketDepot.created_at >= start_datetime)
        if end_date:
            end_datetime = datetime.combine(end_date, datetime.max.time())
            filters.append(TicketDepot.created_at <= end_datetime)

        if filters:
            query = query.filter(and_(*filters))

        # Execute query
        result = query.one()

        return ReceptionSummaryStats(
            total_weight=Decimal(str(result.total_weight)),
            total_items=result.total_items,
            unique_categories=result.unique_categories
        )

    def get_reception_by_category(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[CategoryStats]:
        """
        Get reception statistics grouped by category.

        Args:
            start_date: Optional start date filter (inclusive)
            end_date: Optional end date filter (inclusive)

        Returns:
            List of CategoryStats, sorted by total_weight descending

        Raises:
            HTTPException: If start_date is after end_date
        """
        # Validate date range
        self._validate_date_range(start_date, end_date)
        # Build base query
        query = self.db.query(
            Category.name.label('category_name'),
            func.coalesce(func.sum(LigneDepot.poids_kg), 0).label('total_weight'),
            func.count(LigneDepot.id).label('total_items')
        ).join(
            LigneDepot,
            Category.id == LigneDepot.category_id
        ).join(
            TicketDepot,
            LigneDepot.ticket_id == TicketDepot.id
        )

        # Apply date filters if provided
        filters = []
        if start_date:
            start_datetime = datetime.combine(start_date, datetime.min.time())
            filters.append(TicketDepot.created_at >= start_datetime)
        if end_date:
            end_datetime = datetime.combine(end_date, datetime.max.time())
            filters.append(TicketDepot.created_at <= end_datetime)

        if filters:
            query = query.filter(and_(*filters))

        # Group by category and order by weight
        query = query.group_by(Category.name).order_by(func.sum(LigneDepot.poids_kg).desc())

        # Execute query
        results = query.all()

        return [
            CategoryStats(
                category_name=row.category_name,
                total_weight=Decimal(str(row.total_weight)),
                total_items=row.total_items
            )
            for row in results
        ]
