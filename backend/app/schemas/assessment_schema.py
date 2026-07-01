from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class HintResponse(BaseModel):
    id: int
    question_id: int
    hint_level: int
    hint_text: str

    model_config = {"from_attributes": True}


class QuizQuestionForStudent(BaseModel):
    question_id: int
    topic_id: int
    difficulty_level: str
    question_text: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    marks: Optional[int]
    expected_time: Optional[int]
    hints: List[HintResponse] = []

    model_config = {"from_attributes": True}


class AssessmentStartResponse(BaseModel):
    session_id: int
    quiz_id: int
    started_at: datetime
    questions: List[QuizQuestionForStudent]

    model_config = {"from_attributes": True}


class AnswerSubmitRequest(BaseModel):
    question_id: int
    answer: str
    time_taken: Optional[int] = None
    hints_used: Optional[int] = 0
    attempts: Optional[int] = 1
    emotion_state: Optional[str] = "neutral"
    attention_score: Optional[int] = 85


class AnswerSubmitResponse(BaseModel):
    question_id: int
    is_correct: bool
    marks_awarded: int

    model_config = {"from_attributes": True}


class AssessmentCompleteResponse(BaseModel):
    session_id: int
    total_marks: int
    obtained_marks: int
    percentage: float
    completed_at: datetime

    model_config = {"from_attributes": True}


class StudentResultResponse(BaseModel):
    id: int
    quiz_id: int
    started_at: datetime
    completed_at: Optional[datetime]
    total_marks: Optional[int]
    obtained_marks: Optional[int]
    percentage: Optional[float]

    model_config = {"from_attributes": True}


class StudentAnswerResponse(BaseModel):
    id: int
    question_id: int
    answer: Optional[str]
    is_correct: Optional[bool]
    marks_awarded: Optional[int]
    time_taken: Optional[int]
    hints_used: Optional[int]
    attempts: Optional[int]
    emotion_state: Optional[str]
    attention_score: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class AssessmentSessionDetail(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    total_marks: Optional[int]
    obtained_marks: Optional[int]
    percentage: Optional[float]
    answers: List[StudentAnswerResponse] = []

    model_config = {"from_attributes": True}
