from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    subject_name = Column(String(255), nullable=False)
    subject_code = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", backref="subjects")

    def __repr__(self):
        return f"<Subject id={self.id} name={self.subject_name} code={self.subject_code}>"
