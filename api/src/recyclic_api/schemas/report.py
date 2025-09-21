from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class ReportEntry(BaseModel):
    """Metadata describing an available report file."""

    model_config = ConfigDict(from_attributes=True)

    filename: str = Field(..., description="Nom du fichier de rapport")
    size_bytes: int = Field(..., description="Taille du fichier en octets")
    modified_at: datetime = Field(..., description="Horodatage de la derniere modification")
    download_url: str = Field(..., description="URL relative pour telecharger le rapport")


class ReportListResponse(BaseModel):
    """Response payload listing report files."""

    reports: List[ReportEntry] = Field(..., description="Liste des rapports disponibles")
    total: int = Field(..., description="Nombre total de rapports")
