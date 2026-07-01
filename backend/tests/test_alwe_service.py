import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.alwe_service import classify_alwe_score


def test_zero_score_is_at_risk():
    assert classify_alwe_score(0) == "At-Risk Student"


def test_boundary_thresholds_map_to_expected_categories():
    assert classify_alwe_score(39.9) == "At-Risk Student"
    assert classify_alwe_score(40) == "Weak Student"
    assert classify_alwe_score(54.9) == "Weak Student"
    assert classify_alwe_score(55) == "Average Student"
    assert classify_alwe_score(69.9) == "Average Student"
    assert classify_alwe_score(70) == "Good Student"
    assert classify_alwe_score(84.9) == "Good Student"
    assert classify_alwe_score(85) == "Advanced Student"
