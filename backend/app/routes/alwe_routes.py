from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from app.models.alwe import ALWEScore
from app.models.assessment import AssessmentSession, StudentAnswer
from app.models.question import Question
from app.schemas.alwe_schema import ALWEScoreResponse, ALWECalculationResponse
from app.core.security import require_role
from app.services.alwe_service import classify_alwe_score

router = APIRouter()


_EMOTION_MAP = {
    "confidence": 100,
    "neutral": 80,
    "confusion": 60,
    "boredom": 50,
    "frustration": 40,
    "stress": 40,
}


def _emotion_score(value: str) -> float:
    if not value:
        return 80.0
    return float(_EMOTION_MAP.get(value.lower(), 80))


def _classification(score: float) -> str:
    return classify_alwe_score(score)


@router.post("/alwe/calculate/{session_id}", response_model=ALWECalculationResponse)
def calculate_alwe(session_id: int, db: Session = Depends(get_db), user=Depends(require_role("student"))):
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")
    if session.student_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your assessment session")
    if session.status != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assessment must be completed before calculating ALWE")

    existing = db.query(ALWEScore).filter(ALWEScore.assessment_session_id == session_id).first()
    if existing:
        if not existing.category:
            existing.category = _classification(existing.score)
            db.commit()
            db.refresh(existing)
        return existing

    answers = db.query(StudentAnswer).filter(StudentAnswer.assessment_session_id == session_id).all()
    if not answers:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No answers found for assessment session")

    knowledge_accuracy = float(session.percentage or 0.0)

    time_scores = []
    for answer in answers:
        q = db.query(Question).filter(Question.id == answer.question_id).first()
        if not q:
            continue
        expected = q.expected_time or 0
        if answer.time_taken is None or expected <= 0:
            time_scores.append(100.0)
        else:
            time_scores.append(max(0.0, min(100.0, expected / answer.time_taken * 100.0)))
    time_performance = float(sum(time_scores) / len(time_scores)) if time_scores else 0.0

    emotion_scores = [_emotion_score(answer.emotion_state) for answer in answers]
    emotional_stability = float(sum(emotion_scores) / len(emotion_scores)) if emotion_scores else 0.0

    attention_scores = [float(answer.attention_score or 0) for answer in answers]
    attention_consistency = float(sum(attention_scores) / len(attention_scores)) if attention_scores else 0.0

    total_hints = sum(answer.hints_used or 0 for answer in answers)
    total_questions = len(answers)
    max_hints = total_questions * 3 if total_questions else 1
    independent_problem_solving = float(max(0.0, 100.0 - (total_hints / max_hints * 100.0)))

    recovery_improvement = 70.0

    score = (
        0.40 * knowledge_accuracy
        + 0.15 * time_performance
        + 0.15 * emotional_stability
        + 0.10 * attention_consistency
        + 0.10 * independent_problem_solving
        + 0.10 * recovery_improvement
    )

    category = _classification(score)

    new_record = ALWEScore(
        student_id=user.id,
        quiz_id=session.quiz_id,
        assessment_session_id=session.id,
        knowledge_accuracy=knowledge_accuracy,
        time_performance=time_performance,
        emotional_stability=emotional_stability,
        attention_consistency=attention_consistency,
        independent_problem_solving=independent_problem_solving,
        recovery_improvement=recovery_improvement,
        score=score,
        category=category,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


@router.get("/alwe/my-scores", response_model=List[ALWEScoreResponse])
def my_scores(db: Session = Depends(get_db), user=Depends(require_role("student"))):
    scores = db.query(ALWEScore).filter(ALWEScore.student_id == user.id).all()
    return scores


@router.get("/alwe/student/{student_id}", response_model=List[ALWEScoreResponse])
def student_scores(student_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    scores = db.query(ALWEScore).filter(ALWEScore.student_id == student_id).all()
    return scores
