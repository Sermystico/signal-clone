from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from sqlalchemy import desc

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.get("/", response_model=List[schemas.ConversationListResponse])
def get_conversations(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get all conversations where current_user is a member
    memberships = db.query(models.ConversationMember).filter(models.ConversationMember.user_id == current_user.id).all()
    conv_ids = [m.conversation_id for m in memberships]
    
    conversations = db.query(models.Conversation).filter(models.Conversation.id.in_(conv_ids)).order_by(desc(models.Conversation.updated_at)).all()
    
    result = []
    for conv in conversations:
        # Get last message
        last_message = db.query(models.Message).filter(models.Message.conversation_id == conv.id).order_by(desc(models.Message.created_at)).first()
        
        # Calculate unread count (messages not sent by current_user and status != 'read')
        unread_count = db.query(models.Message).filter(
            models.Message.conversation_id == conv.id,
            models.Message.sender_id != current_user.id,
            models.Message.status != 'read'
        ).count()
        
        conv_dict = {
            "id": conv.id,
            "type": conv.type,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "members": conv.members,
            "last_message": last_message,
            "unread_count": unread_count
        }
        result.append(conv_dict)
        
    return result

@router.post("/direct", response_model=schemas.ConversationResponse)
def create_direct_conversation(payload: schemas.DirectConversationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if payload.contact_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot create conversation with yourself")
        
    # Check if a direct conversation already exists between these two users
    my_direct_conv_ids = db.query(models.ConversationMember.conversation_id).join(models.Conversation).filter(
        models.ConversationMember.user_id == current_user.id,
        models.Conversation.type == 'direct'
    ).subquery()
    
    existing_conv = db.query(models.Conversation).join(models.ConversationMember).filter(
        models.Conversation.id.in_(my_direct_conv_ids),
        models.ConversationMember.user_id == payload.contact_user_id
    ).first()
    
    if existing_conv:
        return existing_conv
        
    # Create new
    conv = models.Conversation(type="direct")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    
    m1 = models.ConversationMember(conversation_id=conv.id, user_id=current_user.id)
    m2 = models.ConversationMember(conversation_id=conv.id, user_id=payload.contact_user_id)
    db.add_all([m1, m2])
    db.commit()
    db.refresh(conv)
    
    return conv

@router.get("/{conversation_id}", response_model=schemas.ConversationResponse)
def get_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    # Check membership
    is_member = any(m.user_id == current_user.id for m in conv.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this conversation")
        
    # Mark unread messages as read
    db.query(models.Message).filter(
        models.Message.conversation_id == conv.id,
        models.Message.sender_id != current_user.id,
        models.Message.status != 'read'
    ).update({"status": "read"})
    db.commit()
    
    return conv
