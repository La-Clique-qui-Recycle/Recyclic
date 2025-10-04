"""
Schemas for statistics endpoints.
"""
from pydantic import BaseModel, Field
from typing import List
from decimal import Decimal


class ReceptionSummaryStats(BaseModel):
    """Summary statistics for reception data."""

    total_weight: Decimal = Field(
        ...,
        description="Total weight in kg",
        ge=0
    )
    total_items: int = Field(
        ...,
        description="Total number of items",
        ge=0
    )
    unique_categories: int = Field(
        ...,
        description="Number of unique categories",
        ge=0
    )

    class Config:
        json_schema_extra = {
            "example": {
                "total_weight": 1250.75,
                "total_items": 342,
                "unique_categories": 15
            }
        }


class CategoryStats(BaseModel):
    """Statistics for a single category."""

    category_name: str = Field(
        ...,
        description="Name of the category"
    )
    total_weight: Decimal = Field(
        ...,
        description="Total weight in kg for this category",
        ge=0
    )
    total_items: int = Field(
        ...,
        description="Total number of items for this category",
        ge=0
    )

    class Config:
        json_schema_extra = {
            "example": {
                "category_name": "Écrans",
                "total_weight": 350.5,
                "total_items": 80
            }
        }
