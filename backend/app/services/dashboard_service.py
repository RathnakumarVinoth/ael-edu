from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime


from app.models.user import User
from app.models.assessment import AssessmentSession
from app.models.alwe import ALWEScore
from app.models.topic_mastery import TopicMastery
from app.models.learning_recommendation import LearningRecommendation
from app.models.question import Question
from app.services.alwe_service import classify_alwe_score


def get_student_overview(db: Session, student_id: int) -> Dict[str, Any]:
    sessions = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.student_id == student_id, AssessmentSession.status == "completed")
        .order_by(AssessmentSession.completed_at.desc(), AssessmentSession.id.desc())
        .all()
    )
    total_assessments = len(sessions)
    average_percentage = float(sum(s.percentage or 0.0 for s in sessions) / total_assessments) if total_assessments else None
    latest_assessment = sessions[0] if sessions else None
    latest_assessment_id = latest_assessment.id if latest_assessment else None

    latest_alwe_record = None
    if latest_assessment_id is not None:
        latest_alwe_record = (
            db.query(ALWEScore)
            .filter(ALWEScore.student_id == student_id, ALWEScore.assessment_session_id == latest_assessment_id)
            .order_by(ALWEScore.created_at.desc())
            .first()
        )

    latest_alwe_score = latest_alwe_record.score if latest_alwe_record is not None else None
    if latest_alwe_record is not None and latest_alwe_record.category:
        latest_category = latest_alwe_record.category
    elif latest_alwe_score is not None:
        latest_category = classify_alwe_score(latest_alwe_score)
    else:
        latest_category = None

    topic_mastery_query = db.query(TopicMastery).filter(TopicMastery.student_id == student_id)
    if latest_assessment and latest_assessment.completed_at:
        topic_mastery_query = topic_mastery_query.filter(TopicMastery.updated_at >= latest_assessment.completed_at)
    topic_mastery = topic_mastery_query.order_by(TopicMastery.updated_at.desc(), TopicMastery.topic_id.asc()).all()
    weak_topics = [m.topic_id for m in topic_mastery if m.status == "weak"]
    moderate_topics = [m.topic_id for m in topic_mastery if m.status == "moderate"]
    strong_topics = [m.topic_id for m in topic_mastery if m.status == "strong"]

    recommendations_rows = []
    if latest_assessment_id is not None:
        recommendations_rows = (
            db.query(LearningRecommendation)
            .filter(
                LearningRecommendation.student_id == student_id,
                LearningRecommendation.assessment_session_id == latest_assessment_id,
            )
            .all()
        )
    else:
        recommendations_rows = []

    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations_rows = sorted(
        recommendations_rows,
        key=lambda r: (
            priority_order.get((r.priority or "").lower(), 99),
            -(r.created_at.timestamp() if r.created_at else 0),
            -(r.id or 0),
        ),
    )
    recommendations = [f"{r.priority}: {r.title} - {r.description}" for r in recommendations_rows]

    recent_results = [
        {
            "session_id": s.id,
            "quiz_id": s.quiz_id,
            "percentage": s.percentage,
            "completed_at": s.completed_at,
        }
        for s in sessions[:5]
    ]

    return {
        "student_id": student_id,
        "latest_assessment": latest_assessment_id,
        "total_assessments_completed": total_assessments,
        "average_percentage": average_percentage,
        "latest_alwe_score": latest_alwe_score,
        "latest_category": latest_category,
        "weak_topics": weak_topics,
        "moderate_topics": moderate_topics,
        "strong_topics": strong_topics,
        "recommendations": recommendations,
        "recent_results": recent_results,
    }


def get_lecturer_overview(db: Session) -> Dict[str, Any]:
    total_students = db.query(User).filter(User.role == "student").count()
    total_quizzes = db.query(Question).count()  # using question count as a proxy for quiz content
    sessions = db.query(AssessmentSession).filter(AssessmentSession.status == "completed").all()
    total_assessments_completed = len(sessions)
    class_average_percentage = float(sum(s.percentage or 0.0 for s in sessions) / total_assessments_completed) if total_assessments_completed else None

    alwe_scores = db.query(ALWEScore).all()
    at_risk_students = list({score.student_id for score in alwe_scores if score.score < 40})
    weak_students = list({score.student_id for score in alwe_scores if 40 <= score.score < 55})
    top_performing_students = list({score.student_id for score in alwe_scores if score.score >= 85})

    topic_mastery = db.query(TopicMastery).all()
    weak_topics_summary: List[Dict[str, Any]] = []
    topic_summary: Dict[int, Dict[str, Any]] = {}
    for mastery in topic_mastery:
        if mastery.topic_id not in topic_summary:
            topic_summary[mastery.topic_id] = {"topic_id": mastery.topic_id, "weak_count": 0, "moderate_count": 0, "strong_count": 0}
        if mastery.status == "weak":
            topic_summary[mastery.topic_id]["weak_count"] += 1
        elif mastery.status == "moderate":
            topic_summary[mastery.topic_id]["moderate_count"] += 1
        elif mastery.status == "strong":
            topic_summary[mastery.topic_id]["strong_count"] += 1
    weak_topics_summary = list(topic_summary.values())

    recent_assessments = [
        {
            "session_id": s.id,
            "student_id": s.student_id,
            "quiz_id": s.quiz_id,
            "percentage": s.percentage,
            "completed_at": s.completed_at,
        }
        for s in sorted(sessions, key=lambda item: item.completed_at or datetime.min, reverse=True)[:10]
    ]

    return {
        "total_students": total_students,
        "total_quizzes": total_quizzes,
        "total_assessments_completed": total_assessments_completed,
        "class_average_percentage": class_average_percentage,
        "at_risk_students": at_risk_students,
        "weak_students": weak_students,
        "top_performing_students": top_performing_students,
        "weak_topics_summary": weak_topics_summary,
        "recent_assessments": recent_assessments,
    }


def get_student_progress(db: Session, student_id: int) -> List[Dict[str, Any]]:
    sessions = db.query(AssessmentSession).filter(AssessmentSession.student_id == student_id).order_by(AssessmentSession.started_at.asc()).all()
    progress = []
    for session in sessions:
        alwe = db.query(ALWEScore).filter(ALWEScore.assessment_session_id == session.id).order_by(ALWEScore.created_at.desc()).first()
        progress.append(
            {
                "session_id": session.id,
                "quiz_id": session.quiz_id,
                "percentage": session.percentage,
                "started_at": session.started_at,
                "completed_at": session.completed_at,
                "alwe_score": alwe.score if alwe else None,
            }
        )
    return progress


def get_student_analytics(db: Session, student_id: int) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == student_id).first()
    if not user:
        return {}

    sessions = db.query(AssessmentSession).filter(AssessmentSession.student_id == student_id).order_by(AssessmentSession.completed_at.desc()).all()
    alwe_scores = db.query(ALWEScore).filter(ALWEScore.student_id == student_id).order_by(ALWEScore.created_at.desc()).all()
    topic_mastery = db.query(TopicMastery).filter(TopicMastery.student_id == student_id).all()
    recommendations = db.query(LearningRecommendation).filter(LearningRecommendation.student_id == student_id).all()

    analytics = {
        "student_id": student_id,
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "assessments": [
            {
                "session_id": s.id,
                "quiz_id": s.quiz_id,
                "status": s.status,
                "percentage": s.percentage,
                "started_at": s.started_at,
                "completed_at": s.completed_at,
            }
            for s in sessions
        ],
        "alwe_scores": [
            {
                "id": score.id,
                "quiz_id": score.quiz_id,
                "assessment_session_id": score.assessment_session_id,
                "score": score.score,
                "category": score.category,
                "created_at": score.created_at,
            }
            for score in alwe_scores
        ],
        "topic_mastery": [
            {
                "topic_id": m.topic_id,
                "mastery_percentage": m.mastery_percentage,
                "status": m.status,
                "updated_at": m.updated_at,
            }
            for m in topic_mastery
        ],
        "recommendations": [
            {
                "topic_id": r.topic_id,
                "recommendation_type": r.recommendation_type,
                "title": r.title,
                "description": r.description,
                "priority": r.priority,
                "next_action": r.next_action,
                "created_at": r.created_at,
            }
            for r in recommendations
        ],
        "weak_topics": [m.topic_id for m in topic_mastery if m.status == "weak"],
        "strong_topics": [m.topic_id for m in topic_mastery if m.status == "strong"],
    }
    return analytics
