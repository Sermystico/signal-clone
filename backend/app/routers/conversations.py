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
        
        # Get member info for current_user
        member = next((m for m in conv.members if m.user_id == current_user.id), None)
        last_read_id = member.last_read_message_id if member else 0
        
        # Calculate unread count (messages not sent by current_user and id > last_read_id)
        unread_count = db.query(models.Message).filter(
            models.Message.conversation_id == conv.id,
            models.Message.sender_id != current_user.id,
            models.Message.id > last_read_id
        ).count()
        
        conv_dict = {
            "id": conv.id,
            "type": conv.type,
            "group_id": conv.group_id,
            "group": conv.group,
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
    my_direct_conv_ids_query = db.query(models.ConversationMember.conversation_id).join(models.Conversation).filter(
        models.ConversationMember.user_id == current_user.id,
        models.Conversation.type == 'direct'
    )
    
    existing_conv = db.query(models.Conversation).join(models.ConversationMember).filter(
        models.Conversation.id.in_(my_direct_conv_ids_query),
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

@router.post("/group", response_model=schemas.ConversationResponse)
def create_group_conversation(payload: schemas.GroupConversationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not payload.name:
        raise HTTPException(status_code=400, detail="Group name is required")
    
    # Ensure current_user is in member_ids
    member_ids = set(payload.member_ids)
    member_ids.add(current_user.id)
    
    if len(member_ids) < 2:
        raise HTTPException(status_code=400, detail="Group must have at least 2 members")
        
    # Verify all users exist
    users = db.query(models.User).filter(models.User.id.in_(member_ids)).all()
    if len(users) != len(member_ids):
        raise HTTPException(status_code=400, detail="One or more users do not exist")
        
    # Create Group
    group = models.Group(name=payload.name, created_by=current_user.id)
    db.add(group)
    db.commit()
    db.refresh(group)
    
    # Create Group Members
    group_members = []
    for uid in member_ids:
        role = 'admin' if uid == current_user.id else 'member'
        group_members.append(models.GroupMember(group_id=group.id, user_id=uid, role=role))
    db.add_all(group_members)
    
    # Create Conversation
    conv = models.Conversation(type="group", group_id=group.id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    
    # Create Conversation Members
    conv_members = []
    for uid in member_ids:
        conv_members.append(models.ConversationMember(conversation_id=conv.id, user_id=uid))
    db.add_all(conv_members)
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

@router.post("/{conversation_id}/members", response_model=schemas.ConversationResponse)
def add_group_member(conversation_id: int, payload: schemas.GroupMemberAdd, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id, models.Conversation.type == 'group').first()
    if not conv:
        raise HTTPException(status_code=404, detail="Group conversation not found")
        
    group = db.query(models.Group).filter(models.Group.id == conv.group_id).first()
    current_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group.id, models.GroupMember.user_id == current_user.id).first()
    
    if not current_member or current_member.role != 'admin':
        raise HTTPException(status_code=403, detail="Only administrators can add members")
        
    # Check if user to add exists
    user_to_add = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")
        
    existing_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group.id, models.GroupMember.user_id == payload.user_id).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member")
        
    db.add(models.GroupMember(group_id=group.id, user_id=payload.user_id, role='member'))
    db.add(models.ConversationMember(conversation_id=conv.id, user_id=payload.user_id))
    db.commit()
    db.refresh(conv)
    return conv

@router.delete("/{conversation_id}/members/{user_id}", response_model=schemas.ConversationResponse)
def remove_group_member(conversation_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id, models.Conversation.type == 'group').first()
    if not conv:
        raise HTTPException(status_code=404, detail="Group conversation not found")
        
    group = db.query(models.Group).filter(models.Group.id == conv.group_id).first()
    current_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group.id, models.GroupMember.user_id == current_user.id).first()
    
    if not current_member or current_member.role != 'admin':
        raise HTTPException(status_code=403, detail="Only administrators can remove members")
        
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself. Use leave endpoint.")
        
    member_to_remove = db.query(models.GroupMember).filter(models.GroupMember.group_id == group.id, models.GroupMember.user_id == user_id).first()
    if not member_to_remove:
        raise HTTPException(status_code=404, detail="Member not found")
        
    if member_to_remove.role == 'admin':
        admin_count = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group.id,
            models.GroupMember.role == 'admin'
        ).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the last remaining administrator")
        
    db.delete(member_to_remove)
    conv_member = db.query(models.ConversationMember).filter(models.ConversationMember.conversation_id == conv.id, models.ConversationMember.user_id == user_id).first()
    if conv_member:
        db.delete(conv_member)
    db.commit()
    db.refresh(conv)
    return conv

@router.delete("/{conversation_id}/leave", status_code=204)
def leave_group(conversation_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id, models.Conversation.type == 'group').first()
    if not conv:
        raise HTTPException(status_code=404, detail="Group conversation not found")
        
    group = db.query(models.Group).filter(models.Group.id == conv.group_id).first()
    current_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group.id, models.GroupMember.user_id == current_user.id).first()
    
    if not current_member:
        raise HTTPException(status_code=400, detail="Not a member of this group")
        
    is_admin = current_member.role == 'admin'
    
    db.delete(current_member)
    conv_member = db.query(models.ConversationMember).filter(models.ConversationMember.conversation_id == conv.id, models.ConversationMember.user_id == current_user.id).first()
    if conv_member:
        db.delete(conv_member)
    db.flush()
        
    # Administrator departure policy:
    # If the departing member is an admin and no other admins remain, assign admin role to the oldest remaining member.
    if is_admin:
        remaining_admin = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == group.id,
            models.GroupMember.user_id != current_user.id,
            models.GroupMember.role == 'admin'
        ).first()
        
        if not remaining_admin:
            oldest_member = db.query(models.GroupMember).filter(
                models.GroupMember.group_id == group.id,
                models.GroupMember.user_id != current_user.id
            ).order_by(models.GroupMember.joined_at.asc()).first()
            if oldest_member:
                oldest_member.role = 'admin'
            
    db.commit()
    return
