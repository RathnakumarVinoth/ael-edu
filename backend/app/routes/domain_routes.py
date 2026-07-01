from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from app.schemas.domain_schema import DomainCreate, DomainResponse
from app.models.domain import Domain
from app.core.security import require_role

router = APIRouter()


@router.post("/domains", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
def create_domain(payload: DomainCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    domain = Domain(
        subject_id=payload.subject_id,
        domain_name=payload.domain_name,
        description=payload.description,
    )
    db.add(domain)
    db.commit()
    db.refresh(domain)
    return domain


@router.get("/domains", response_model=list[DomainResponse])
def list_domains(db: Session = Depends(get_db)):
    return db.query(Domain).all()


@router.get("/domains/{domain_id}", response_model=DomainResponse)
def get_domain(domain_id: int, db: Session = Depends(get_db)):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
    return domain


@router.put("/domains/{domain_id}", response_model=DomainResponse)
def update_domain(domain_id: int, payload: DomainCreate, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
    domain.subject_id = payload.subject_id
    domain.domain_name = payload.domain_name
    domain.description = payload.description
    db.commit()
    db.refresh(domain)
    return domain


@router.delete("/domains/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_domain(domain_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin", "lecturer"))):
    domain = db.query(Domain).filter(Domain.id == domain_id).first()
    if not domain:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Domain not found")
    db.delete(domain)
    db.commit()
    return None
