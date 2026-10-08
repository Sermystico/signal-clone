from .database import SessionLocal, engine
from . import models
import os

def seed_db():
    print("Initializing seed data...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    if db.query(models.User).first():
        print("Database already seeded.")
        db.close()
        return

    # Seed Demo Users
    user1 = models.User(username="alice", phone="+1234567890", display_name="Alice", avatar_url="https://i.pravatar.cc/150?u=alice")
    user2 = models.User(username="bob", phone="+1987654321", display_name="Bob", avatar_url="https://i.pravatar.cc/150?u=bob")
    user3 = models.User(username="charlie", phone="+1122334455", display_name="Charlie", avatar_url="https://i.pravatar.cc/150?u=charlie")
    
    db.add_all([user1, user2, user3])
    db.commit()
    db.refresh(user1)
    db.refresh(user2)
    db.refresh(user3)

    # Seed Contacts
    c1 = models.Contact(user_id=user1.id, contact_user_id=user2.id)
    c2 = models.Contact(user_id=user1.id, contact_user_id=user3.id)
    c3 = models.Contact(user_id=user2.id, contact_user_id=user1.id)
    db.add_all([c1, c2, c3])

    # Seed Direct Conversation
    conv1 = models.Conversation(type="direct")
    db.add(conv1)
    db.commit()
    db.refresh(conv1)
    
    cm1 = models.ConversationMember(conversation_id=conv1.id, user_id=user1.id)
    cm2 = models.ConversationMember(conversation_id=conv1.id, user_id=user2.id)
    db.add_all([cm1, cm2])

    # Seed Messages
    m1 = models.Message(conversation_id=conv1.id, sender_id=user1.id, content="Hi Bob!", status="read")
    m2 = models.Message(conversation_id=conv1.id, sender_id=user2.id, content="Hey Alice, how are you?", status="delivered")
    db.add_all([m1, m2])

    # Seed Group Conversation
    group = models.Group(name="Secret Agents", created_by=user1.id)
    db.add(group)
    db.commit()
    db.refresh(group)
    
    gm1 = models.GroupMember(group_id=group.id, user_id=user1.id, role="admin")
    gm2 = models.GroupMember(group_id=group.id, user_id=user2.id, role="member")
    gm3 = models.GroupMember(group_id=group.id, user_id=user3.id, role="member")
    db.add_all([gm1, gm2, gm3])

    conv2 = models.Conversation(type="group", group_id=group.id)
    db.add(conv2)
    db.commit()
    db.refresh(conv2)
    
    gcm1 = models.ConversationMember(conversation_id=conv2.id, user_id=user1.id)
    gcm2 = models.ConversationMember(conversation_id=conv2.id, user_id=user2.id)
    gcm3 = models.ConversationMember(conversation_id=conv2.id, user_id=user3.id)
    db.add_all([gcm1, gcm2, gcm3])

    # Seed Group Message
    gm_msg = models.Message(conversation_id=conv2.id, sender_id=user1.id, content="Welcome to the group everyone!", status="sent")
    db.add(gm_msg)

    db.commit()
    print("Database seeding completed successfully.")
    db.close()

if __name__ == "__main__":
    seed_db()
