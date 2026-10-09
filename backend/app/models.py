from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    display_name = Column(String)
    avatar_url = Column(String, nullable=True)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    contacts = relationship("Contact", foreign_keys="[Contact.user_id]", back_populates="user")
    messages = relationship("Message", back_populates="sender")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    contact_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], back_populates="contacts")
    contact_user = relationship("User", foreign_keys=[contact_user_id])

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String) # 'direct' or 'group'
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship("ConversationMember", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation")
    group = relationship("Group", back_populates="conversation")

class ConversationMember(Base):
    __tablename__ = "conversation_members"

    conversation_id = Column(Integer, ForeignKey("conversations.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_read_message_id = Column(Integer, default=0)
    last_delivered_message_id = Column(Integer, default=0)

    conversation = relationship("Conversation", back_populates="members")
    user = relationship("User")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    status = Column(String) # 'sending', 'sent', 'delivered', 'read'
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", back_populates="messages")

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    avatar_url = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("GroupMember", back_populates="group")
    conversation = relationship("Conversation", back_populates="group", uselist=False)

class GroupMember(Base):
    __tablename__ = "group_members"

    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role = Column(String, default="member") # 'admin', 'member'
    joined_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="members")
    user = relationship("User")
