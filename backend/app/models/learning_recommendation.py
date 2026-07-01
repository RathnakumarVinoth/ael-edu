from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base


class LearningRecommendation(Base):
    __tablename__ = "learning_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    assessment_session_id = Column(Integer, ForeignKey("assessment_sessions.id"), nullable=False)
    recommendation_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=False)
    priority = Column(String(50), nullable=False)
    next_action = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
