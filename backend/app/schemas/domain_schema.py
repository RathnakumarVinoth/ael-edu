from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DomainCreate(BaseModel):
    subject_id: int
    domain_name: str
    description: Optional[str] = None


class DomainResponse(BaseModel):
    id: int
    subject_id: int
    domain_name: str
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
