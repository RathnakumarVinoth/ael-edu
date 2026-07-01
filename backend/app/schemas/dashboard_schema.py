from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class StudentOverviewResponse(BaseModel):
    student_id: int
    latest_assessment: Optional[int]
    total_assessments_completed: int
    average_percentage: Optional[float]
    latest_alwe_score: Optional[float]
    latest_category: Optional[str]
    weak_topics: List[int] = []
    moderate_topics: List[int] = []
    strong_topics: List[int] = []
    recommendations: List[str] = []
    recent_results: List[dict] = []

    model_config = {"from_attributes": True}


class LecturerOverviewResponse(BaseModel):
    total_students: int
    total_quizzes: int
    total_assessments_completed: int
    class_average_percentage: Optional[float]
    at_risk_students: List[int] = []
    weak_students: List[int] = []
    top_performing_students: List[int] = []
    weak_topics_summary: List[dict] = []
    recent_assessments: List[dict] = []

    model_config = {"from_attributes": True}


class StudentProgressItem(BaseModel):
    session_id: int
    quiz_id: int
    percentage: Optional[float]
    started_at: datetime
    completed_at: Optional[datetime]
    alwe_score: Optional[float]

    model_config = {"from_attributes": True}


class StudentAnalyticsResponse(BaseModel):
    student_id: int
    name: str
    email: str
    username: str
    assessments: List[dict] = []
    alwe_scores: List[dict] = []
    topic_mastery: List[dict] = []
    recommendations: List[dict] = []
    weak_topics: List[int] = []
    strong_topics: List[int] = []

    model_config = {"from_attributes": True}
