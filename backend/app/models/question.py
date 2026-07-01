from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    difficulty_level = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    option_a = Column(Text, nullable=True)
    option_b = Column(Text, nullable=True)
    option_c = Column(Text, nullable=True)
    option_d = Column(Text, nullable=True)
    correct_answer = Column(String(10), nullable=True)
    marks = Column(Integer, nullable=True)
    expected_time = Column(Integer, nullable=True)
    solution = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="active")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    topic = relationship("Topic", backref="questions")
    hints = relationship("Hint", backref="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Question id={self.id} topic_id={self.topic_id} level={self.difficulty_level}>"
