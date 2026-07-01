from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CourseCreate(BaseModel):
    course_name: str
    course_code: str
    description: Optional[str] = None


class CourseResponse(BaseModel):
    id: int
    course_name: str
    course_code: str
    description: Optional[str]
    created_by: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
