from sqlalchemy import Column, Integer, String, Text, ForeignKey
from database import Base


class Hint(Base):
    __tablename__ = "hints"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    hint_level = Column(Integer, nullable=False)
    hint_text = Column(Text, nullable=False)

    def __repr__(self):
        return f"<Hint id={self.id} question_id={self.question_id} level={self.hint_level}>"
