from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from app.schemas.question_schema import (
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
    HintCreate,
    HintResponse,
)
from app.models.question import Question
from app.models.hint import Hint
from app.core.security import require_role

router = APIRouter()


@router.post("/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(payload: QuestionCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    q = Question(
        topic_id=payload.topic_id,
        difficulty_level=payload.difficulty_level,
        question_text=payload.question_text,
        option_a=payload.option_a,
        option_b=payload.option_b,
        option_c=payload.option_c,
        option_d=payload.option_d,
        correct_answer=payload.correct_answer,
        marks=payload.marks,
        expected_time=payload.expected_time,
        solution=payload.solution,
        status=payload.status or "active",
        created_by=user.id,
    )
    db.add(q)
    db.commit()
    db.refresh(q)

    # create hints
    hints_created: List[Hint] = []
    for h in payload.hints or []:
        hint = Hint(question_id=q.id, hint_level=h.hint_level, hint_text=h.hint_text)
        db.add(hint)
        hints_created.append(hint)
    db.commit()
    db.refresh(q)
    return q


@router.get("/questions", response_model=List[QuestionResponse])
def list_questions(db: Session = Depends(get_db)):
    return db.query(Question).all()


@router.get("/questions/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return q


@router.get("/questions/topic/{topic_id}", response_model=List[QuestionResponse])
def get_questions_by_topic(topic_id: int, db: Session = Depends(get_db)):
    return db.query(Question).filter(Question.topic_id == topic_id).all()


@router.put("/questions/{question_id}", response_model=QuestionResponse)
def update_question(question_id: int, payload: QuestionUpdate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    for field, value in payload.__dict__.items():
        if value is not None and field != "hints":
            setattr(q, field, value)

    # update hints: simple approach - delete existing and recreate if hints provided
    if payload.hints is not None:
        db.query(Hint).filter(Hint.question_id == q.id).delete()
        for h in payload.hints:
            db.add(Hint(question_id=q.id, hint_level=h.hint_level, hint_text=h.hint_text))

    db.commit()
    db.refresh(q)
    return q


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    db.delete(q)
    db.commit()
    return None
