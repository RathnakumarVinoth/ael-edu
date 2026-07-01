from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database import Base


class ALWEScore(Base):
    __tablename__ = "alwe_scores"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    assessment_session_id = Column(Integer, ForeignKey("assessment_sessions.id"), nullable=False)
    knowledge_accuracy = Column(Float, nullable=False)
    time_performance = Column(Float, nullable=False)
    emotional_stability = Column(Float, nullable=False)
    attention_consistency = Column(Float, nullable=False)
    independent_problem_solving = Column(Float, nullable=False)
    recovery_improvement = Column(Float, nullable=False)
    score = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
