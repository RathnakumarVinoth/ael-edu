from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    domain_id = Column(Integer, ForeignKey("domains.id"), nullable=False)
    topic_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    learning_outcome = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    domain = relationship("Domain", backref="topics")

    def __repr__(self):
        return f"<Topic id={self.id} name={self.topic_name}>"
