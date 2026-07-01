from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class QuizCreate(BaseModel):
    quiz_name: str
    course_id: Optional[int] = None
    subject_id: Optional[int] = None
    duration: Optional[int] = None
    pass_mark: Optional[int] = None
    adaptive_mode: Optional[bool] = False
    randomization_mode: Optional[bool] = False
    hint_mode: Optional[bool] = False


class QuizResponse(BaseModel):
    id: int
    quiz_name: str
    course_id: Optional[int]
    subject_id: Optional[int]
    duration: Optional[int]
    pass_mark: Optional[int]
    adaptive_mode: bool
    randomization_mode: bool
    hint_mode: bool
    created_by: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizGenerateRequest(BaseModel):
    easy_count: int = 0
    medium_count: int = 0
    hard_count: int = 0
    advanced_count: int = 0


class QuizQuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question_id: int

    model_config = {"from_attributes": True}
