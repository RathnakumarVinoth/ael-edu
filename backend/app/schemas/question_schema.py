from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class HintCreate(BaseModel):
    hint_level: int
    hint_text: str


class HintResponse(BaseModel):
    id: int
    question_id: int
    hint_level: int
    hint_text: str

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    topic_id: int
    difficulty_level: str
    question_text: str
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    marks: Optional[int] = None
    expected_time: Optional[int] = None
    solution: Optional[str] = None
    status: Optional[str] = "active"
    hints: Optional[List[HintCreate]] = []


class QuestionResponse(BaseModel):
    id: int
    topic_id: int
    difficulty_level: str
    question_text: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    correct_answer: Optional[str]
    marks: Optional[int]
    expected_time: Optional[int]
    solution: Optional[str]
    status: str
    created_by: Optional[int]
    created_at: datetime
    hints: List[HintResponse] = []

    model_config = {"from_attributes": True}


class QuestionUpdate(BaseModel):
    topic_id: Optional[int] = None
    difficulty_level: Optional[str] = None
    question_text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_answer: Optional[str] = None
    marks: Optional[int] = None
    expected_time: Optional[int] = None
    solution: Optional[str] = None
    status: Optional[str] = None
    hints: Optional[List[HintCreate]] = None

    model_config = {"from_attributes": True}
