from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from app.core.security import require_role
from app.services.dashboard_service import (
    get_student_overview,
    get_lecturer_overview,
    get_student_progress,
    get_student_analytics,
)
from app.schemas.dashboard_schema import (
    StudentOverviewResponse,
    LecturerOverviewResponse,
    StudentProgressItem,
    StudentAnalyticsResponse,
)

router = APIRouter()


@router.get("/dashboard/student/overview", response_model=StudentOverviewResponse)
def student_overview(db: Session = Depends(get_db), user=Depends(require_role("student"))):
    return get_student_overview(db, user.id)


@router.get("/dashboard/lecturer/overview", response_model=LecturerOverviewResponse)
def lecturer_overview(db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    return get_lecturer_overview(db)


@router.get("/dashboard/student/progress", response_model=List[StudentProgressItem])
def student_progress(db: Session = Depends(get_db), user=Depends(require_role("student"))):
    return get_student_progress(db, user.id)


@router.get("/dashboard/lecturer/student/{student_id}", response_model=StudentAnalyticsResponse)
def lecturer_student_analytics(student_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    analytics = get_student_analytics(db, student_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Student not found")
    return analytics
