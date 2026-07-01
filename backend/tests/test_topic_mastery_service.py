import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.topic_mastery_service import upsert_topic_mastery_record


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


def test_upsert_replaces_stale_mastery_values():
    db = DummySession()
    record = upsert_topic_mastery_record(
        db=db,
        student_id=1,
        topic_id=10,
        mastery_percentage=0.0,
        total_questions=2,
        correct_answers=0,
        total_marks=4,
        obtained_marks=0,
    )

    assert db.committed is True
    assert len(db.added) == 1
    assert record.mastery_percentage == 0.0
    assert record.correct_answers == 0
    assert record.obtained_marks == 0
    assert record.status == "weak"
