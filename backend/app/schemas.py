from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    phone: Optional[str] = None
    display_name: str
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    otp: str

class UserLogin(BaseModel):
    username: str
    otp: str

class UserResponse(UserBase):
    id: int
    is_online: bool
    last_seen: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ContactResponse(BaseModel):
    id: int
    contact_user: UserResponse
    created_at: datetime
    
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str
    conversation_id: int

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    status: str
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ConversationMemberResponse(BaseModel):
    user_id: int
    user: UserResponse
    joined_at: datetime
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    type: str
    created_at: datetime
    updated_at: datetime
    members: List[ConversationMemberResponse]
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True

class ConversationListResponse(BaseModel):
    id: int
    type: str
    created_at: datetime
    updated_at: datetime
    members: List[ConversationMemberResponse]
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    
    class Config:
        from_attributes = True

class DirectConversationCreate(BaseModel):
    contact_user_id: int
