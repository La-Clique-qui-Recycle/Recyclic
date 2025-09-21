from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, AliasChoices
from typing import List, Optional


def to_camel(string: str) -> str:
    parts = string.split('_')
    return parts[0] + ''.join(word.capitalize() for word in parts[1:])


class DashboardMetrics(BaseModel):
    """Aggregated metrics displayed on the admin dashboard."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel, revalidate_instances='never')

    total_sessions: int = Field(..., ge=0, serialization_alias="totalSessions")
    open_sessions: int = Field(..., ge=0, serialization_alias="openSessions")
    closed_sessions: int = Field(..., ge=0, serialization_alias="closedSessions")
    total_sales: float = Field(..., ge=0, serialization_alias="totalSales")
    total_items: int = Field(..., ge=0, serialization_alias="totalItems")
    average_session_duration: Optional[float] = Field(
        None,
        ge=0,
        description="Average duration in hours",
        serialization_alias="averageSessionDuration",
    )


class RecentReport(BaseModel):
    """Metadata about recently generated cash session reports."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel, revalidate_instances='never')

    filename: str
    download_url: str = Field(..., serialization_alias="downloadUrl")
    generated_at: datetime = Field(..., serialization_alias="generatedAt")
    size_bytes: int = Field(..., serialization_alias="sizeBytes")


class CashSessionSummary(BaseModel):
    """Summary information for recent cash sessions."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel, revalidate_instances='never')

    session_id: str = Field(..., serialization_alias="sessionId")
    site_id: str = Field(..., serialization_alias="siteId")
    operator: str
    opened_at: datetime = Field(..., serialization_alias="openedAt")
    closed_at: Optional[datetime] = Field(None, serialization_alias="closedAt")
    initial_amount: float = Field(..., serialization_alias="initialAmount")
    current_amount: float = Field(..., serialization_alias="currentAmount")
    total_sales: float = Field(..., serialization_alias="totalSales")
    total_items: int = Field(..., serialization_alias="totalItems")
    status: str


class DashboardStatsResponse(BaseModel):
    """Response payload for the admin dashboard statistics endpoint."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel, revalidate_instances='never')

    metrics: DashboardMetrics
    encrypted_metrics: str = Field(..., description="Encrypted representation of the metrics payload", serialization_alias="encryptedMetrics")
    recent_reports: List[RecentReport] = Field(default_factory=list, serialization_alias="recentReports")
    recent_sessions: List[CashSessionSummary] = Field(default_factory=list, serialization_alias="recentSessions")
