import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from datetime import datetime
from ..websockets import manager

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/upload")
async def upload_attachment(
    file: UploadFile = File(...),
    request: Request = None,
    current_user: models.User = Depends(get_current_user)
):
    os.makedirs("uploads", exist_ok=True)
    safe_name = os.path.basename(file.filename).replace(" ", "_")
    unique_id = uuid.uuid4().hex[:10]
    filename = f"{unique_id}_{safe_name}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    base_url = str(request.base_url) if request else "http://localhost:8000/"
    if not base_url.endswith("/"):
        base_url += "/"
    file_url = f"{base_url}uploads/{filename}"
    
    return {
        "url": file_url,
        "filename": file.filename,
        "size": os.path.getsize(filepath),
        "content_type": file.content_type or "application/octet-stream"
    }

@router.get("/{conversation_id}", response_model=List[schemas.MessageResponse])
async def get_messages(conversation_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check membership
    membership = db.query(models.ConversationMember).filter(
        models.ConversationMember.conversation_id == conversation_id,
        models.ConversationMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member")
        
    messages = db.query(models.Message).filter(models.Message.conversation_id == conversation_id).order_by(models.Message.created_at.asc()).all()
    
    if messages:
        current_max_id = max(m.id for m in messages)
        if current_max_id > membership.last_read_message_id:
            old_last_read = membership.last_read_message_id
            membership.last_read_message_id = current_max_id
            db.commit()
            
            # Find messages that were just read by this user
            newly_read_msgs = [m for m in messages if m.sender_id != current_user.id and m.id > old_last_read]
            
            # Notify senders
            senders_to_notify = set()
            for m in newly_read_msgs:
                senders_to_notify.add((m.sender_id, m.id))
                
            for sender_id, msg_id in senders_to_notify:
                await manager.send_personal_message({
                    "type": "message.status",
                    "payload": {
                        "message_id": msg_id,
                        "conversation_id": conversation_id,
                        "status": "read"
                    }
                }, sender_id)
                
            # Optionally update global message status if everyone has read it
            conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
            if len(conv.members) == 2:
                for m in newly_read_msgs:
                    db_msg = db.query(models.Message).filter(models.Message.id == m.id).first()
                    db_msg.status = 'read'
                db.commit()
    
    return messages

@router.post("/", response_model=schemas.MessageResponse)
async def create_message(payload: schemas.MessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check membership
    membership = db.query(models.ConversationMember).filter(
        models.ConversationMember.conversation_id == payload.conversation_id,
        models.ConversationMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member")
        
    conv = db.query(models.Conversation).filter(models.Conversation.id == payload.conversation_id).first()
    
    is_delivered = False
    for m in conv.members:
        if m.user_id != current_user.id and m.user.is_online:
            is_delivered = True
            m.last_delivered_message_id = 999999999
            
    msg = models.Message(
        conversation_id=payload.conversation_id,
        sender_id=current_user.id,
        content=payload.content,
        status="delivered" if is_delivered else "sent"
    )
    db.add(msg)
    
    # Update conversation updated_at
    conv.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(msg)
    
    if is_delivered:
        for m in conv.members:
            if m.user_id != current_user.id and m.user.is_online:
                m.last_delivered_message_id = msg.id
        db.commit()
    
    # Broadcast to other members via WebSocket
    for member in conv.members:
        if member.user_id != current_user.id:
            await manager.send_personal_message({
                "type": "message.new",
                "payload": {
                    "id": msg.id,
                    "conversation_id": msg.conversation_id,
                    "sender_id": msg.sender_id,
                    "content": msg.content,
                    "status": msg.status,
                    "created_at": msg.created_at.isoformat()
                }
            }, member.user_id)
            
    return msg
