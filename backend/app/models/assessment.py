from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from database import Base


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    status = Column(String(50), nullable=False, default="in_progress")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    total_marks = Column(Integer, nullable=True)
    obtained_marks = Column(Integer, nullable=True)
    percentage = Column(Float, nullable=True)

    answers = relationship("StudentAnswer", backref="assessment_session", cascade="all, delete-orphan")


class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(Integer, primary_key=True, index=True)
    assessment_session_id = Column(Integer, ForeignKey("assessment_sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer = Column(String(50), nullable=True)
    time_taken = Column(Integer, nullable=True)
    hints_used = Column(Integer, nullable=True)
    attempts = Column(Integer, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    marks_awarded = Column(Integer, nullable=True)
    emotion_state = Column(String(50), nullable=False, default="neutral")
    attention_score = Column(Integer, nullable=False, default=85)
    created_at = Column(DateTime, default=datetime.utcnow)

