from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ALWEScoreResponse(BaseModel):
    id: int
    student_id: int
    quiz_id: int
    assessment_session_id: int
    knowledge_accuracy: float
    time_performance: float
    emotional_stability: float
    attention_consistency: float
    independent_problem_solving: float
    recovery_improvement: float
    score: float
    category: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ALWECalculationResponse(BaseModel):
    student_id: int
    quiz_id: int
    assessment_session_id: int
    knowledge_accuracy: float
    time_performance: float
    emotional_stability: float
    attention_consistency: float
    independent_problem_solving: float
    recovery_improvement: float
    score: float
    category: str

    model_config = {"from_attributes": True}
