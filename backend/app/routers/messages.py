from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/messages", tags=["messages"])

@router.get("/{conversation_id}", response_model=List[schemas.MessageResponse])
def get_messages(conversation_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check membership
    membership = db.query(models.ConversationMember).filter(
        models.ConversationMember.conversation_id == conversation_id,
        models.ConversationMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member")
        
    messages = db.query(models.Message).filter(models.Message.conversation_id == conversation_id).order_by(models.Message.created_at.asc()).all()
    return messages

@router.post("/", response_model=schemas.MessageResponse)
def create_message(payload: schemas.MessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check membership
    membership = db.query(models.ConversationMember).filter(
        models.ConversationMember.conversation_id == payload.conversation_id,
        models.ConversationMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member")
        
    msg = models.Message(
        conversation_id=payload.conversation_id,
        sender_id=current_user.id,
        content=payload.content,
        status="sent" # Will be updated via WebSocket delivery receipts later
    )
    db.add(msg)
    
    # Update conversation updated_at
    conv = db.query(models.Conversation).filter(models.Conversation.id == payload.conversation_id).first()
    conv.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(msg)
    return msg
