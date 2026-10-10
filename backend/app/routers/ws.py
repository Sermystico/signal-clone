from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, auth
from ..websockets import manager
import jwt
import json
from datetime import datetime

router = APIRouter(tags=["websockets"])

async def get_current_user_ws(token: str, db: Session):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except jwt.PyJWTError:
        return None
        
    user = db.query(models.User).filter(models.User.username == username).first()
    return user

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...), db: Session = Depends(get_db)):
    user = await get_current_user_ws(token, db)
    if not user:
        await websocket.close(code=1008)
        return
        
    # Mark user as online if this is their first connection
    was_offline = user.id not in manager.active_connections
    await manager.connect(websocket, user.id)
    
    if was_offline:
        user.is_online = True
        
        # Mark messages sent to this user as delivered
        memberships = db.query(models.ConversationMember).filter(models.ConversationMember.user_id == user.id).all()
        for member in memberships:
            # Find messages in this conversation sent by others that have id > last_delivered
            undelivered = db.query(models.Message).filter(
                models.Message.conversation_id == member.conversation_id,
                models.Message.sender_id != user.id,
                models.Message.id > (member.last_delivered_message_id or 0)
            ).all()
            
            max_id = 0
            for msg in undelivered:
                if msg.id > max_id:
                    max_id = msg.id
                    
            if max_id > 0:
                member.last_delivered_message_id = max_id
                # Update status to delivered if it is still sent
                for msg in undelivered:
                    if msg.status == 'sent':
                        msg.status = 'delivered'
        
        db.commit()
        
        # Since we can't easily await inside the DB loop without complicating things, 
        # let's just broadcast the status events after commit
        for member in memberships:
            undelivered = db.query(models.Message).filter(
                models.Message.conversation_id == member.conversation_id,
                models.Message.sender_id != user.id,
                models.Message.status == 'delivered'
            ).all()
            for msg in undelivered:
                await manager.send_personal_message({
                    "type": "message.status",
                    "payload": {
                        "message_id": msg.id,
                        "conversation_id": msg.conversation_id,
                        "status": "delivered"
                    }
                }, msg.sender_id)

        await manager.broadcast({
            "type": "presence.update",
            "payload": {
                "user_id": user.id,
                "is_online": True,
                "last_seen": datetime.utcnow().isoformat()
            }
        })
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                event = json.loads(data)
                event_type = event.get("type")
                
                if event_type == "message.send":
                    payload = event.get("payload", {})
                    conv_id = payload.get("conversation_id")
                    content = payload.get("content")
                    
                    if conv_id and content:
                        # Check membership
                        membership = db.query(models.ConversationMember).filter(
                            models.ConversationMember.conversation_id == conv_id,
                            models.ConversationMember.user_id == user.id
                        ).first()
                        
                        if membership:
                            # Check if any other member is online
                            conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
                            is_delivered = False
                            for m in conv.members:
                                if m.user_id != user.id and m.user.is_online:
                                    is_delivered = True
                                    m.last_delivered_message_id = 999999999 # We will fix this after we get the msg.id
                                    
                            msg = models.Message(
                                conversation_id=conv_id,
                                sender_id=user.id,
                                content=content,
                                status="delivered" if is_delivered else "sent"
                            )
                            db.add(msg)
                            
                            conv.updated_at = datetime.utcnow()
                            db.commit()
                            db.refresh(msg)
                            db.refresh(conv)
                            
                            # Fix last_delivered_message_id now that we have msg.id
                            if is_delivered:
                                for m in conv.members:
                                    if m.user_id != user.id and m.user.is_online:
                                        m.last_delivered_message_id = msg.id
                                db.commit()
                            
                            # Broadcast
                            for member in conv.members:
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
                                
                elif event_type == "typing.start":
                    payload = event.get("payload", {})
                    conv_id = payload.get("conversation_id")
                    if conv_id is not None:
                        try:
                            conv_id_int = int(conv_id)
                        except (ValueError, TypeError):
                            conv_id_int = None
                        if conv_id_int is not None:
                            conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id_int).first()
                            if conv:
                                for member in conv.members:
                                    if member.user_id != user.id:
                                        await manager.send_personal_message({
                                            "type": "typing.started",
                                            "payload": {
                                                "conversation_id": conv_id_int,
                                                "user_id": user.id
                                            }
                                        }, member.user_id)
                                    
                elif event_type == "typing.stop":
                    payload = event.get("payload", {})
                    conv_id = payload.get("conversation_id")
                    if conv_id is not None:
                        try:
                            conv_id_int = int(conv_id)
                        except (ValueError, TypeError):
                            conv_id_int = None
                        if conv_id_int is not None:
                            conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id_int).first()
                            if conv:
                                for member in conv.members:
                                    if member.user_id != user.id:
                                        await manager.send_personal_message({
                                            "type": "typing.stopped",
                                            "payload": {
                                                "conversation_id": conv_id_int,
                                                "user_id": user.id
                                            }
                                        }, member.user_id)
                                    
                elif event_type == "message.read":
                    payload = event.get("payload", {})
                    message_id = payload.get("message_id")
                    conv_id = payload.get("conversation_id")
                    if message_id and conv_id:
                        msg = db.query(models.Message).filter(models.Message.id == message_id).first()
                        if msg:
                            # Update last_read_message_id for this user
                            membership = db.query(models.ConversationMember).filter(
                                models.ConversationMember.conversation_id == conv_id,
                                models.ConversationMember.user_id == user.id
                            ).first()
                            
                            was_updated = False
                            if membership and message_id > membership.last_read_message_id:
                                membership.last_read_message_id = message_id
                                was_updated = True
                                db.commit()
                                
                            # Only notify sender and update msg status if it wasn't already processed
                            if was_updated and msg.sender_id != user.id:
                                # For direct messages, we can globally set to read
                                conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
                                if conv and len(conv.members) == 2:
                                    msg.status = "read"
                                    msg.read_at = datetime.utcnow()
                                    db.commit()

                                await manager.send_personal_message({
                                    "type": "message.status",
                                    "payload": {
                                        "message_id": message_id,
                                        "conversation_id": conv_id,
                                        "status": "read"
                                    }
                                }, msg.sender_id)

            except json.JSONDecodeError:
                pass
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
        if user.id not in manager.active_connections:
            user.is_online = False
            user.last_seen = datetime.utcnow()
            db.commit()
            await manager.broadcast({
                "type": "presence.update",
                "payload": {
                    "user_id": user.id,
                    "is_online": False,
                    "last_seen": user.last_seen.isoformat()
                }
            })
