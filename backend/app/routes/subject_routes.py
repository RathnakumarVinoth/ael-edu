from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from app.schemas.subject_schema import SubjectCreate, SubjectResponse
from app.models.subject import Subject
from app.core.security import require_role

router = APIRouter()


@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    subject = Subject(
        course_id=payload.course_id,
        subject_name=payload.subject_name,
        subject_code=payload.subject_code,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/subjects", response_model=list[SubjectResponse])
def list_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()


@router.get("/subjects/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    return subject


@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: int, payload: SubjectCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    subject.course_id = payload.course_id
    subject.subject_name = payload.subject_name
    subject.subject_code = payload.subject_code
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return None
