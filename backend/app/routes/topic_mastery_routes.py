from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime

from database import get_db
from app.models.topic_mastery import TopicMastery
from app.models.learning_recommendation import LearningRecommendation
from app.models.assessment import AssessmentSession, StudentAnswer
from app.models.question import Question
from app.schemas.topic_mastery_schema import (
    TopicMasteryResponse,
    LearningRecommendationResponse,
    TopicMasteryCalculationResponse,
)
from app.core.security import require_role
from app.services.topic_mastery_service import upsert_topic_mastery_record
from app.services.recommendation_service import upsert_learning_recommendation

router = APIRouter()


def _topic_status(mastery_percentage: float) -> str:
    if mastery_percentage >= 80:
        return "strong"
    if mastery_percentage >= 60:
        return "moderate"
    return "weak"


@router.post("/topic-mastery/calculate/{session_id}", response_model=List[TopicMasteryCalculationResponse])
def calculate_topic_mastery(session_id: int, db: Session = Depends(get_db), user=Depends(require_role("student"))):
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")
    if session.student_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your assessment session")
    if session.status != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assessment session must be completed")

    answers = db.query(StudentAnswer).filter(StudentAnswer.assessment_session_id == session_id).all()
    if not answers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No answers available for this session")

    topic_groups: Dict[int, List[StudentAnswer]] = {}
    for answer in answers:
        q = db.query(Question).filter(Question.id == answer.question_id).first()
        if not q:
            continue
        topic_groups.setdefault(q.topic_id, []).append((answer, q))

    results: List[TopicMasteryCalculationResponse] = []
    for topic_id, group in topic_groups.items():
        total_questions = len(group)
        correct_answers = sum(1 for answer, q in group if answer.is_correct)
        obtained_marks = sum(answer.marks_awarded or 0 for answer, q in group)
        total_marks = sum(q.marks or 0 for answer, q in group)
        mastery_percentage = float((obtained_marks / total_marks * 100.0) if total_marks else 0.0)
        status_label = _topic_status(mastery_percentage)

        upsert_topic_mastery_record(
            db=db,
            student_id=user.id,
            topic_id=topic_id,
            mastery_percentage=mastery_percentage,
            total_questions=total_questions,
            correct_answers=correct_answers,
            total_marks=total_marks,
            obtained_marks=obtained_marks,
        )
        results.append(
            TopicMasteryCalculationResponse(
                topic_id=topic_id,
                mastery_percentage=mastery_percentage,
                total_questions=total_questions,
                correct_answers=correct_answers,
                total_marks=total_marks,
                obtained_marks=obtained_marks,
                status=status_label,
            )
        )

        upsert_learning_recommendation(
            db=db,
            student_id=user.id,
            topic_id=topic_id,
            assessment_session_id=session_id,
            status=status_label,
        )

    return results


@router.get("/topic-mastery/my-mastery", response_model=List[TopicMasteryResponse])
def my_mastery(db: Session = Depends(get_db), user=Depends(require_role("student"))):
    return db.query(TopicMastery).filter(TopicMastery.student_id == user.id).all()


@router.get("/topic-mastery/student/{student_id}", response_model=List[TopicMasteryResponse])
def student_mastery(student_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    return db.query(TopicMastery).filter(TopicMastery.student_id == student_id).all()


@router.get("/recommendations/my-recommendations", response_model=List[LearningRecommendationResponse])
def my_recommendations(db: Session = Depends(get_db), user=Depends(require_role("student"))):
    latest_session = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.student_id == user.id, AssessmentSession.status == "completed")
        .order_by(AssessmentSession.completed_at.desc(), AssessmentSession.id.desc())
        .first()
    )
    if not latest_session:
        return []

    recommendations = (
        db.query(LearningRecommendation)
        .filter(
            LearningRecommendation.student_id == user.id,
            LearningRecommendation.assessment_session_id == latest_session.id,
        )
        .all()
    )
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(
        key=lambda r: (
            priority_order.get((r.priority or "").lower(), 99),
            -(r.created_at.timestamp() if r.created_at else 0),
            -(r.id or 0),
        )
    )
    return recommendations


@router.get("/recommendations/student/{student_id}", response_model=List[LearningRecommendationResponse])
def student_recommendations(student_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    latest_session = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.student_id == student_id, AssessmentSession.status == "completed")
        .order_by(AssessmentSession.completed_at.desc(), AssessmentSession.id.desc())
        .first()
    )
    if not latest_session:
        return []

    recommendations = (
        db.query(LearningRecommendation)
        .filter(
            LearningRecommendation.student_id == student_id,
            LearningRecommendation.assessment_session_id == latest_session.id,
        )
        .all()
    )
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(
        key=lambda r: (
            priority_order.get((r.priority or "").lower(), 99),
            -(r.created_at.timestamp() if r.created_at else 0),
            -(r.id or 0),
        )
    )
    return recommendations
