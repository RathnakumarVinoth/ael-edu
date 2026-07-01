from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from app.schemas.topic_schema import TopicCreate, TopicResponse
from app.models.topic import Topic
from app.core.security import require_role

router = APIRouter()


@router.post("/topics", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
def create_topic(payload: TopicCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    topic = Topic(
        domain_id=payload.domain_id,
        topic_name=payload.topic_name,
        description=payload.description,
        learning_outcome=payload.learning_outcome,
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.get("/topics", response_model=list[TopicResponse])
def list_topics(db: Session = Depends(get_db)):
    return db.query(Topic).all()


@router.get("/topics/{topic_id}", response_model=TopicResponse)
def get_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return topic


@router.put("/topics/{topic_id}", response_model=TopicResponse)
def update_topic(topic_id: int, payload: TopicCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    topic.domain_id = payload.domain_id
    topic.topic_name = payload.topic_name
    topic.description = payload.description
    topic.learning_outcome = payload.learning_outcome
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(topic_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    db.delete(topic)
    db.commit()
    return None
