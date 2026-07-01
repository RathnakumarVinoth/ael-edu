import sys
from datetime import datetime
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.models.assessment  # noqa: F401
import app.models.alwe  # noqa: F401
import app.models.course  # noqa: F401
import app.models.domain  # noqa: F401
import app.models.hint  # noqa: F401
import app.models.learning_recommendation  # noqa: F401
import app.models.question  # noqa: F401
import app.models.quiz  # noqa: F401
import app.models.subject  # noqa: F401
import app.models.topic  # noqa: F401
import app.models.topic_mastery  # noqa: F401
import app.models.user  # noqa: F401

from app.models.assessment import AssessmentSession
from app.models.learning_recommendation import LearningRecommendation
from app.models.user import User
from app.models.topic import Topic
from database import Base
from app.services.dashboard_service import get_student_overview


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def make_student(db, student_id=1):
    user = User(id=student_id, username="student", email="student@example.com", password_hash="x", role="student", name="Student")
    db.add(user)
    db.commit()
    return user


def make_topic(db, topic_id=1):
    topic = Topic(id=topic_id, domain_id=1, topic_name="Topic 1")
    db.add(topic)
    db.commit()
    return topic


def make_session(db, student_id, session_id, completed_at):
    completed_at_dt = datetime.fromisoformat(completed_at)
    session = AssessmentSession(
        id=session_id,
        student_id=student_id,
        quiz_id=1,
        status="completed",
        percentage=80.0,
        started_at=completed_at_dt,
        completed_at=completed_at_dt,
    )
    db.add(session)
    db.commit()
    return session


def test_get_student_overview_returns_only_latest_session_recommendations_sorted_by_priority(db_session):
    student = make_student(db_session)
    make_topic(db_session)

    older_session = make_session(db_session, student.id, 10, "2024-01-01T00:00:00")
    latest_session = make_session(db_session, student.id, 11, "2024-02-01T00:00:00")

    db_session.add_all(
        [
            LearningRecommendation(
                student_id=student.id,
                topic_id=1,
                assessment_session_id=older_session.id,
                recommendation_type="Advanced Learning",
                title="Advance Further",
                description="Old recommendation",
                priority="low",
                next_action="Advanced",
            ),
            LearningRecommendation(
                student_id=student.id,
                topic_id=1,
                assessment_session_id=latest_session.id,
                recommendation_type="Revision",
                title="Revision Required",
                description="Need revision",
                priority="high",
                next_action="Revision",
            ),
            LearningRecommendation(
                student_id=student.id,
                topic_id=1,
                assessment_session_id=latest_session.id,
                recommendation_type="Practice",
                title="Continue Practice",
                description="Practice more",
                priority="medium",
                next_action="Practice",
            ),
        ]
    )
    db_session.commit()

    overview = get_student_overview(db_session, student.id)

    assert overview["latest_assessment"] == latest_session.id
    assert overview["recommendations"] == [
        "high: Revision Required - Need revision",
        "medium: Continue Practice - Practice more",
    ]
