from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user
from sqlalchemy import desc
import re

router = APIRouter(prefix="/search", tags=["search"])

def normalize_phone(phone: str) -> str:
    """Normalize phone number by removing spaces, hyphens, parentheses."""
    if not phone:
        return ""
    return re.sub(r'[\s\-\(\)]', '', phone)

@router.get("/", response_model=Dict[str, Any])
def global_search(
    q: str = Query(..., min_length=1), 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    raw_q = q.strip()
    clean_q = raw_q.lstrip("@").strip() or raw_q
    normalized_q = normalize_phone(raw_q)
    is_phone_query = len(normalized_q) > 3 and any(c.isdigit() for c in normalized_q)

    # 1. Search Users (Contacts and other registered users)
    user_query = db.query(models.User).filter(models.User.id != current_user.id)
    if is_phone_query:
        user_query = user_query.filter(
            (models.User.username.ilike(f"%{clean_q}%")) |
            (models.User.display_name.ilike(f"%{clean_q}%")) |
            (models.User.phone.contains(normalized_q)) |
            (models.User.phone.contains(raw_q))
        )
    else:
        user_query = user_query.filter(
            (models.User.username.ilike(f"%{clean_q}%")) |
            (models.User.display_name.ilike(f"%{clean_q}%")) |
            (models.User.phone.ilike(f"%{clean_q}%"))
        )
    users = user_query.limit(20).all()

    # Get user's conversation IDs
    memberships = db.query(models.ConversationMember).filter(models.ConversationMember.user_id == current_user.id).all()
    conv_ids = [m.conversation_id for m in memberships]

    # 2. Search Conversations (Group names)
    conversations = []
    if conv_ids:
        conversations = db.query(models.Conversation).join(models.Group).filter(
            models.Conversation.id.in_(conv_ids),
            models.Group.name.ilike(f"%{q}%")
        ).limit(20).all()

    # 3. Search Messages
    messages = []
    if conv_ids:
        msg_query = db.query(models.Message).filter(models.Message.conversation_id.in_(conv_ids))
        if is_phone_query:
            msg_query = msg_query.filter(
                (models.Message.content.ilike(f"%{q}%")) |
                (models.Message.content.contains(normalized_q))
            )
        else:
            msg_query = msg_query.filter(models.Message.content.ilike(f"%{q}%"))
            
        messages = msg_query.order_by(desc(models.Message.created_at)).limit(20).all()

    return {
        "users": [schemas.UserResponse.model_validate(u).model_dump() for u in users],
        "conversations": [
            {
                "id": c.id,
                "type": c.type,
                "group": schemas.GroupResponse.model_validate(c.group).model_dump() if c.group else None
            } for c in conversations
        ],
        "messages": [schemas.MessageResponse.model_validate(m).model_dump() for m in messages]
    }
