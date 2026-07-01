from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SubjectCreate(BaseModel):
    course_id: int
    subject_name: str
    subject_code: str


class SubjectResponse(BaseModel):
    id: int
    course_id: int
    subject_name: str
    subject_code: str
    created_at: datetime

    model_config = {"from_attributes": True}
