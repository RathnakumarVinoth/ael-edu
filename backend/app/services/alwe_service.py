def classify_alwe_score(score: float) -> str:
    if score >= 85:
        return "Advanced Student"
    if score >= 70:
        return "Good Student"
    if score >= 55:
        return "Average Student"
    if score >= 40:
        return "Weak Student"
    return "At-Risk Student"
