from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    quiz_name = Column(String(255), nullable=False)
    course_id = Column(Integer, nullable=True)
    subject_id = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)
    pass_mark = Column(Integer, nullable=True)
    adaptive_mode = Column(Boolean, default=False)
    randomization_mode = Column(Boolean, default=False)
    hint_mode = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("QuizQuestion", backref="quiz", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Quiz id={self.id} name={self.quiz_name}>"


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)

    def __repr__(self):
        return f"<QuizQuestion id={self.id} quiz_id={self.quiz_id} question_id={self.question_id}>"
