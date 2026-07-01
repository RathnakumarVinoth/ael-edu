from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TopicCreate(BaseModel):
    domain_id: int
    topic_name: str
    description: Optional[str] = None
    learning_outcome: Optional[str] = None


class TopicResponse(BaseModel):
    id: int
    domain_id: int
    topic_name: str
    description: Optional[str]
    learning_outcome: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
