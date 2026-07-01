from sqlalchemy.orm import Session

from app.models.learning_recommendation import LearningRecommendation


def _recommendation_payload(status: str) -> dict:
    if status == "weak":
        return {
            "recommendation_type": "Revision",
            "title": "Revision Required",
            "description": "The student needs revision and additional practice for this topic.",
            "priority": "high",
            "next_action": "Revision Lesson → Practice Questions → Topic Assessment",
        }
    if status == "moderate":
        return {
            "recommendation_type": "Practice",
            "title": "Continue Practice",
            "description": "The student should continue practice to improve mastery.",
            "priority": "medium",
            "next_action": "Practice Questions → Adaptive Quiz",
        }
    return {
        "recommendation_type": "Advanced Learning",
        "title": "Advance Further",
        "description": "The student is ready for advanced questions.",
        "priority": "low",
        "next_action": "Advanced Questions → Challenge Quiz",
    }


def upsert_learning_recommendation(
    db: Session,
    student_id: int,
    topic_id: int,
    assessment_session_id: int,
    status: str,
) -> LearningRecommendation:
    recommendation = (
        db.query(LearningRecommendation)
        .filter(
            LearningRecommendation.student_id == student_id,
            LearningRecommendation.topic_id == topic_id,
            LearningRecommendation.assessment_session_id == assessment_session_id,
        )
        .first()
    )

    payload = _recommendation_payload(status)

    if recommendation:
        recommendation.recommendation_type = payload["recommendation_type"]
        recommendation.title = payload["title"]
        recommendation.description = payload["description"]
        recommendation.priority = payload["priority"]
        recommendation.next_action = payload["next_action"]
        db.commit()
        db.refresh(recommendation)
        return recommendation

    recommendation = LearningRecommendation(
        student_id=student_id,
        topic_id=topic_id,
        assessment_session_id=assessment_session_id,
        recommendation_type=payload["recommendation_type"],
        title=payload["title"],
        description=payload["description"],
        priority=payload["priority"],
        next_action=payload["next_action"],
    )
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    return recommendation
