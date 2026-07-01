from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String(255), nullable=False)
    course_code = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", backref="courses")

    def __repr__(self):
        return f"<Course id={self.id} code={self.course_code} name={self.course_name}>"
