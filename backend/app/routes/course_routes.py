from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from app.schemas.course_schema import CourseCreate, CourseResponse
from app.models.course import Course
from app.core.security import get_current_user, require_role

router = APIRouter()


@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    course = Course(
        course_name=payload.course_name,
        course_code=payload.course_code,
        description=payload.description,
        created_by=user.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/courses", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()


@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.put("/courses/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, payload: CourseCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    course.course_name = payload.course_name
    course.course_code = payload.course_code
    course.description = payload.description
    db.commit()
    db.refresh(course)
    return course


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    db.delete(course)
    db.commit()
    return None
