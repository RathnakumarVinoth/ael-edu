import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from app.schemas.quiz_schema import (
    QuizCreate,
    QuizResponse,
    QuizGenerateRequest,
    QuizQuestionResponse,
)
from app.models.quiz import Quiz, QuizQuestion
from app.models.question import Question
from app.models.topic import Topic
from app.models.domain import Domain
from app.core.security import require_role

router = APIRouter()


@router.post("/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(payload: QuizCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    quiz = Quiz(
        quiz_name=payload.quiz_name,
        course_id=payload.course_id,
        subject_id=payload.subject_id,
        duration=payload.duration,
        pass_mark=payload.pass_mark,
        adaptive_mode=payload.adaptive_mode,
        randomization_mode=payload.randomization_mode,
        hint_mode=payload.hint_mode,
        created_by=user.id,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


@router.get("/quizzes", response_model=List[QuizResponse])
def list_quizzes(db: Session = Depends(get_db)):
    return db.query(Quiz).all()


@router.get("/quizzes/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz


def _query_questions_by_level(db: Session, subject_id: int, level: str):
    # Join Question -> Topic -> Domain and filter by Domain.subject_id
    return (
        db.query(Question)
        .join(Topic, Question.topic_id == Topic.id)
        .join(Domain, Topic.domain_id == Domain.id)
        .filter(Domain.subject_id == subject_id, Question.difficulty_level == level)
        .all()
    )


@router.post("/quizzes/{quiz_id}/generate", status_code=status.HTTP_201_CREATED)
def generate_quiz(quiz_id: int, payload: QuizGenerateRequest, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    subject_id = quiz.subject_id
    if not subject_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quiz has no subject_id set")

    # Build requests per level
    requests = [
        ("Easy", payload.easy_count),
        ("Medium", payload.medium_count),
        ("Hard", payload.hard_count),
        ("Advanced", payload.advanced_count),
    ]

    selected_questions = []
    for level, count in requests:
        if count <= 0:
            continue
        candidates = _query_questions_by_level(db, subject_id, level)
        # remove already selected
        candidates = [c for c in candidates if c.id not in {q.id for q in selected_questions}]
        if len(candidates) < count:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Not enough questions for level {level}: requested {count}, available {len(candidates)}")
        chosen = random.sample(candidates, count)
        selected_questions.extend(chosen)

    # If randomization_mode is set on quiz, shuffle
    if quiz.randomization_mode:
        random.shuffle(selected_questions)

    # Save to quiz_questions, avoid duplicates
    for q in selected_questions:
        exists = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id, QuizQuestion.question_id == q.id).first()
        if not exists:
            qq = QuizQuestion(quiz_id=quiz.id, question_id=q.id)
            db.add(qq)
    db.commit()

    return {"selected": [q.id for q in selected_questions]}


@router.get("/quizzes/{quiz_id}/questions", response_model=List[QuizQuestionResponse])
def get_quiz_questions(quiz_id: int, db: Session = Depends(get_db)):
    qs = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    return qs


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    db.delete(quiz)
    db.commit()
    return None
