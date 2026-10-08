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
        
    await manager.connect(websocket, user.id)
    
    # Mark user as online
    user.is_online = True
    db.commit()
    
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
                            msg = models.Message(
                                conversation_id=conv_id,
                                sender_id=user.id,
                                content=content,
                                status="sent"
                            )
                            db.add(msg)
                            
                            conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
                            conv.updated_at = datetime.utcnow()
                            
                            db.commit()
                            db.refresh(msg)
                            db.refresh(conv)
                            
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
                    if conv_id:
                        conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
                        if conv:
                            for member in conv.members:
                                if member.user_id != user.id:
                                    await manager.send_personal_message({
                                        "type": "typing.started",
                                        "payload": {
                                            "conversation_id": conv_id,
                                            "user_id": user.id
                                        }
                                    }, member.user_id)
                                    
                elif event_type == "typing.stop":
                    payload = event.get("payload", {})
                    conv_id = payload.get("conversation_id")
                    if conv_id:
                        conv = db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()
                        if conv:
                            for member in conv.members:
                                if member.user_id != user.id:
                                    await manager.send_personal_message({
                                        "type": "typing.stopped",
                                        "payload": {
                                            "conversation_id": conv_id,
                                            "user_id": user.id
                                        }
                                    }, member.user_id)
                                    
                elif event_type == "message.read":
                    payload = event.get("payload", {})
                    message_id = payload.get("message_id")
                    conv_id = payload.get("conversation_id")
                    if message_id and conv_id:
                        msg = db.query(models.Message).filter(models.Message.id == message_id).first()
                        if msg and msg.sender_id != user.id:
                            msg.status = "read"
                            msg.read_at = datetime.utcnow()
                            db.commit()
                            
                            # Notify sender
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
        user.is_online = False
        user.last_seen = datetime.utcnow()
        db.commit()
