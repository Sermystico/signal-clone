from pydantic import BaseModel
from typing import Optional
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
