from datetime import datetime
from sqlalchemy.orm import Session

from app.models.topic_mastery import TopicMastery


def _topic_status(mastery_percentage: float) -> str:
    if mastery_percentage >= 80:
        return "strong"
    if mastery_percentage >= 60:
        return "moderate"
    return "weak"


def upsert_topic_mastery_record(
    db: Session,
    student_id: int,
    topic_id: int,
    mastery_percentage: float,
    total_questions: int,
    correct_answers: int,
    total_marks: int,
    obtained_marks: int,
) -> TopicMastery:
    topic_mastery = (
        db.query(TopicMastery)
        .filter(TopicMastery.student_id == student_id, TopicMastery.topic_id == topic_id)
        .first()
    )

    status_label = _topic_status(mastery_percentage)

    if topic_mastery:
        topic_mastery.mastery_percentage = mastery_percentage
        topic_mastery.total_questions = total_questions
        topic_mastery.correct_answers = correct_answers
        topic_mastery.total_marks = total_marks
        topic_mastery.obtained_marks = obtained_marks
        topic_mastery.status = status_label
        topic_mastery.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(topic_mastery)
        return topic_mastery

    topic_mastery = TopicMastery(
        student_id=student_id,
        topic_id=topic_id,
        mastery_percentage=mastery_percentage,
        total_questions=total_questions,
        correct_answers=correct_answers,
        total_marks=total_marks,
        obtained_marks=obtained_marks,
        status=status_label,
    )
    db.add(topic_mastery)
    db.commit()
    db.refresh(topic_mastery)
    return topic_mastery
