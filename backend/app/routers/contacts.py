from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/contacts", tags=["contacts"])

@router.get("/", response_model=List[schemas.ContactResponse])
def get_contacts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    contacts = db.query(models.Contact).filter(models.Contact.user_id == current_user.id).all()
    return contacts

@router.post("/{contact_user_id}", response_model=schemas.ContactResponse)
def add_contact(contact_user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if contact_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a contact")
    
    target_user = db.query(models.User).filter(models.User.id == contact_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    existing = db.query(models.Contact).filter(
        models.Contact.user_id == current_user.id,
        models.Contact.contact_user_id == contact_user_id
    ).first()
    if existing:
        return existing
        
    contact = models.Contact(user_id=current_user.id, contact_user_id=contact_user_id)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.delete("/{contact_user_id}")
def remove_contact(contact_user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    contact = db.query(models.Contact).filter(
        models.Contact.user_id == current_user.id,
        models.Contact.contact_user_id == contact_user_id
    ).first()
    if not contact:
        return {"detail": "Contact not found"}
    db.delete(contact)
    db.commit()
    return {"detail": "Contact removed"}

