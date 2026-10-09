import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.database import SessionLocal
from app import models, auth, schemas
from app.routers import contacts, conversations, messages
from fastapi import HTTPException

def run():
    print("=== VERIFYING BACKEND LOGIC & INTEGRITY ===")
    db = SessionLocal()

    # 1. Check users
    alice = db.query(models.User).filter(models.User.username == "alice").first()
    bob = db.query(models.User).filter(models.User.username == "bob").first()
    charlie = db.query(models.User).filter(models.User.username == "charlie").first()
    test2 = db.query(models.User).filter(models.User.username == "test2").first()

    assert alice and bob and charlie and test2, "Required users must exist in DB"
    print(f"[PASS] Found test users: Alice (id={alice.id}), Bob (id={bob.id}), Charlie (id={charlie.id}), Test2 (id={test2.id})")

    # -------------------------------------------------------------
    # 1. CONTACT MANAGEMENT: ADD & REMOVE (ONE-WAY)
    # -------------------------------------------------------------
    print("\n--- 1. Testing Contact Management ---")
    
    # 1.1 Test2 adds Alice
    contacts.add_contact(contact_user_id=alice.id, db=db, current_user=test2)
    test2_contacts = contacts.get_contacts(db=db, current_user=test2)
    test2_contact_ids = [c.contact_user.id for c in test2_contacts]
    assert alice.id in test2_contact_ids, "Alice should be in test2's contacts"
    print("[PASS] test2 successfully added alice as a contact")

    # 1.2 Verify Alice does NOT automatically have test2 (One-Way)
    alice_contacts = contacts.get_contacts(db=db, current_user=alice)
    alice_contact_ids = [c.contact_user.id for c in alice_contacts]
    assert test2.id not in alice_contact_ids, "Alice's contacts must NOT automatically include test2"
    print("[PASS] One-way contact relationship verified (Alice does not have test2)")

    # 1.3 Create direct conversation between test2 and Alice
    direct_conv = conversations.create_direct_conversation(
        payload=schemas.DirectConversationCreate(contact_user_id=alice.id),
        db=db,
        current_user=test2
    )
    assert direct_conv.type == "direct"
    print(f"[PASS] Direct conversation exists (id={direct_conv.id})")

    # 1.4 Test2 removes Alice from contacts
    contacts.remove_contact(contact_user_id=alice.id, db=db, current_user=test2)
    test2_contacts_after = contacts.get_contacts(db=db, current_user=test2)
    test2_contact_ids_after = [c.contact_user.id for c in test2_contacts_after]
    assert alice.id not in test2_contact_ids_after, "Alice should no longer be in test2's contacts"
    print("[PASS] test2 successfully removed alice from contacts")

    # 1.5 Verify direct conversation and messages are NOT deleted when contact is removed
    conv_check = conversations.get_conversation(conversation_id=direct_conv.id, db=db, current_user=test2)
    assert conv_check.id == direct_conv.id, "Conversation must remain intact after removing contact"
    print("[PASS] Direct conversation remains fully accessible after removing contact")

    # -------------------------------------------------------------
    # 2. GROUP CREATION & PERSISTENCE
    # -------------------------------------------------------------
    print("\n--- 2. Testing Group Creation & Persistence ---")
    
    # 2.1 Attempt creating group with 0 members (should raise HTTPException 400)
    try:
        conversations.create_group_conversation(
            payload=schemas.GroupConversationCreate(name="Fail Group", member_ids=[]),
            db=db,
            current_user=alice
        )
        assert False, "Should fail when member_ids is empty"
    except HTTPException as e:
        assert e.status_code == 400
        print("[PASS] Group creation with < 2 members correctly rejected (400)")

    # 2.2 Alice creates group with Bob and Charlie
    import uuid
    group_name = f"Project Alpha {uuid.uuid4().hex[:6]}"
    group_conv = conversations.create_group_conversation(
        payload=schemas.GroupConversationCreate(name=group_name, member_ids=[bob.id, charlie.id]),
        db=db,
        current_user=alice
    )
    assert group_conv.type == "group"
    assert group_conv.group.name == group_name
    print(f"[PASS] Group '{group_name}' created successfully (conv_id={group_conv.id}, group_id={group_conv.group_id})")

    # Verify admin role
    group_id = group_conv.group_id
    group_members = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).all()
    alice_m = next(m for m in group_members if m.user_id == alice.id)
    bob_m = next(m for m in group_members if m.user_id == bob.id)
    charlie_m = next(m for m in group_members if m.user_id == charlie.id)

    assert alice_m.role == "admin", "Alice (creator) must be admin"
    assert bob_m.role == "member", "Bob must be member"
    assert charlie_m.role == "member", "Charlie must be member"
    print("[PASS] Admin and Member roles correctly assigned")

    # -------------------------------------------------------------
    # 3. ADMIN MEMBER MANAGEMENT & AUTHORIZATION
    # -------------------------------------------------------------
    print("\n--- 3. Testing Admin Member Management & Authorization ---")

    # 3.1 Non-admin (Bob) attempts to add test2 -> raises 403
    try:
        conversations.add_group_member(
            conversation_id=group_conv.id,
            payload=schemas.GroupMemberAdd(user_id=test2.id),
            db=db,
            current_user=bob
        )
        assert False, "Non-admin should not be able to add member"
    except HTTPException as e:
        assert e.status_code == 403
        print("[PASS] Non-admin (Bob) blocked with 403 Forbidden from adding member")

    # 3.2 Admin (Alice) adds test2 -> succeeds
    conversations.add_group_member(
        conversation_id=group_conv.id,
        payload=schemas.GroupMemberAdd(user_id=test2.id),
        db=db,
        current_user=alice
    )
    # Verify test2 is in group
    test2_in_group = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == test2.id
    ).first()
    assert test2_in_group is not None
    print("[PASS] Admin (Alice) successfully added test2 to the group")

    # 3.3 Non-admin (Charlie) attempts to remove Bob -> raises 403
    try:
        conversations.remove_group_member(
            conversation_id=group_conv.id,
            user_id=bob.id,
            db=db,
            current_user=charlie
        )
        assert False, "Non-admin should not be able to remove member"
    except HTTPException as e:
        assert e.status_code == 403
        print("[PASS] Non-admin (Charlie) blocked with 403 Forbidden from removing member")

    # 3.4 Admin (Alice) removes test2 from group
    conversations.remove_group_member(
        conversation_id=group_conv.id,
        user_id=test2.id,
        db=db,
        current_user=alice
    )
    test2_in_group_after = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == test2.id
    ).first()
    assert test2_in_group_after is None
    print("[PASS] Admin (Alice) successfully removed test2 from group")

    # 3.5 Removed user (test2) is blocked from accessing group (403)
    try:
        conversations.get_conversation(
            conversation_id=group_conv.id,
            db=db,
            current_user=test2
        )
        assert False, "Removed user should not be able to access group"
    except HTTPException as e:
        assert e.status_code == 403
        print("[PASS] Removed user (test2) blocked with 403 from accessing group conversation")

    # 3.6 Cannot remove the last remaining admin
    try:
        # If Alice tries to remove herself via remove_group_member
        conversations.remove_group_member(
            conversation_id=group_conv.id,
            user_id=alice.id,
            db=db,
            current_user=alice
        )
        assert False, "Cannot remove self"
    except HTTPException as e:
        assert e.status_code == 400
        print("[PASS] Self-removal correctly rejected (400)")

    # -------------------------------------------------------------
    # 4. LEAVE GROUP & ADMIN SUCCESSION
    # -------------------------------------------------------------
    print("\n--- 4. Testing Leave Group & Admin Succession ---")

    # Charlie leaves the group
    conversations.leave_group(conversation_id=group_conv.id, db=db, current_user=charlie)
    charlie_in_group = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == charlie.id
    ).first()
    assert charlie_in_group is None
    print("[PASS] Charlie successfully left group")

    # Alice (sole admin) leaves the group -> Bob should become admin
    conversations.leave_group(conversation_id=group_conv.id, db=db, current_user=alice)
    alice_in_group = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == alice.id
    ).first()
    assert alice_in_group is None

    bob_after_leave = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == bob.id
    ).first()
    assert bob_after_leave.role == "admin", "Bob must be promoted to admin when Alice leaves"
    print("[PASS] Bob promoted to Admin upon Alice's departure")

    db.close()
    print("\n=======================================================")
    print("ALL BACKEND & PERSISTENCE TESTS COMPLETED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == "__main__":
    run()
