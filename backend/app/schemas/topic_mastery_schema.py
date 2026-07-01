from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TopicMasteryResponse(BaseModel):
    id: int
    student_id: int
    topic_id: int
    mastery_percentage: float
    total_questions: int
    correct_answers: int
    total_marks: int
    obtained_marks: int
    status: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class LearningRecommendationResponse(BaseModel):
    id: int
    student_id: int
    topic_id: int
    assessment_session_id: int
    recommendation_type: str
    title: str
    description: str
    priority: str
    next_action: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TopicMasteryCalculationResponse(BaseModel):
    topic_id: int
    mastery_percentage: float
    total_questions: int
    correct_answers: int
    total_marks: int
    obtained_marks: int
    status: str

    model_config = {"from_attributes": True}
