import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.recommendation_service import upsert_learning_recommendation


class DummySession:
    def __init__(self):
        self.added = []
        self.committed = False
        self.refreshed = []

    def query(self, model):
        return self

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return None

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        self.refreshed.append(obj)


def test_upsert_learning_recommendation_creates_latest_session_recommendation():
    db = DummySession()
    recommendation = upsert_learning_recommendation(
        db=db,
        student_id=1,
        topic_id=10,
        assessment_session_id=2,
        status="weak",
    )

    assert db.committed is True
    assert len(db.added) == 1
    assert recommendation.title == "Revision Required"
    assert recommendation.priority == "high"
    assert recommendation.recommendation_type == "Revision"
