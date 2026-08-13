from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class SceneIngestion(BaseModel):
    text: str = Field(..., description="Manuscript text for the scene")
    in_universe_time: int = Field(..., description="Timestamp or sequential marker for in-universe story time")
    chapter: int = Field(..., description="Chapter number in the manuscript")
    manuscript_position: Optional[float] = Field(
        default=0.0, description="Relative or absolute position within the manuscript"
    )


class ContinuityCheck(BaseModel):
    active_text: Optional[str] = Field(
        default=None, description="Active manuscript text segment to evaluate for plot holes"
    )
    text: Optional[str] = Field(
        default=None, description="Active manuscript text segment alias"
    )
    current_timeline_marker: Optional[Any] = Field(
        default=None, description="In-universe time or milestone marker for continuity check"
    )
    in_universe_time: Optional[Any] = Field(
        default=None, description="In-universe time alias"
    )
    chapter: Optional[int] = Field(
        default=None, description="Chapter number"
    )
    manuscript_position: Optional[float] = Field(
        default=None, description="Relative manuscript position"
    )


class EntityExtraction(BaseModel):
    characters: List[Dict[str, Any]] = Field(
        default_factory=list, description="Extracted characters with attributes (name, physical_status, core_motivation)"
    )
    items: List[Dict[str, Any]] = Field(
        default_factory=list, description="Extracted items with attributes (name, secret_payload)"
    )
    locations: List[Dict[str, Any]] = Field(
        default_factory=list, description="Extracted locations with attributes (name, is_accessible, controlling_faction)"
    )
    events: List[Dict[str, Any]] = Field(
        default_factory=list, description="Extracted events with attributes (name, description, consequence)"
    )
    relationships: List[Dict[str, Any]] = Field(
        default_factory=list, description="Relationships identified between entities with timeline markers"
    )
