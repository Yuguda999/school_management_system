"""
Schemas for Text-to-Action feature
"""
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class TextToActionRequest(BaseModel):
    """Request schema for text-to-action queries"""
    query: str = Field(..., description="Natural language query from the user")
    context: Optional[str] = Field(None, description="Additional context (e.g., current page)")


class TextToActionResult(BaseModel):
    """Result schema for text-to-action queries"""
    success: bool = Field(..., description="Whether the query was successful")
    query_type: str = Field(
        ..., 
        description="Type of query: 'count', 'list', 'aggregate', 'general'"
    )
    natural_language_answer: str = Field(
        ..., 
        description="Human-readable answer to the query"
    )
    data: Optional[List[dict]] = Field(
        None, 
        description="Raw data results if applicable"
    )
    row_count: Optional[int] = Field(
        None, 
        description="Number of rows returned"
    )
    generated_sql: Optional[str] = Field(
        None, 
        description="The SQL that was generated (for debugging)"
    )
    error: Optional[str] = Field(
        None, 
        description="Error message if the query failed"
    )


class SQLGenerationResult(BaseModel):
    """Result of SQL generation from natural language"""
    success: bool
    sql: Optional[str] = None
    query_type: str = "general"
    error: Optional[str] = None
    is_safe: bool = False


class SQLExecutionResult(BaseModel):
    """Result of SQL execution"""
    success: bool
    data: List[dict] = Field(default_factory=list)
    row_count: int = 0
    columns: List[str] = Field(default_factory=list)
    error: Optional[str] = None


class TextToActionSettings(BaseModel):
    """Settings for text-to-action feature"""
    enabled: bool = Field(default=False, description="Whether the feature is enabled")
