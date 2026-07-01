from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database import Base


class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    mastery_percentage = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    total_marks = Column(Integer, nullable=False)
    obtained_marks = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
