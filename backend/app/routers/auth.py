from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas, database, auth

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/check-phone", response_model=schemas.CheckPhoneResponse)
def check_phone(payload: schemas.CheckPhoneRequest, db: Session = Depends(database.get_db)):
    phone_clean = payload.phone.strip()
    if not phone_clean:
        raise HTTPException(status_code=400, detail="Phone number is required")
    db_user = db.query(models.User).filter(models.User.phone == phone_clean).first()
    return {"exists": db_user is not None, "phone": phone_clean}

@router.post("/verify-otp", response_model=schemas.VerifyOtpResponse)
def verify_otp(payload: schemas.VerifyOtpRequest):
    if payload.otp != auth.DEMO_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    return {"valid": True}

@router.post("/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Verify the submitted OTP before creating the user's account
    if user_data.otp != auth.DEMO_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    phone_clean = user_data.phone.strip() if user_data.phone else ""
    username_clean = user_data.username.strip().lower()
    display_name_clean = user_data.display_name.strip()

    if not phone_clean:
        raise HTTPException(status_code=400, detail="Phone number is required")
    if not username_clean:
        raise HTTPException(status_code=400, detail="Username is required")
    if not display_name_clean:
        raise HTTPException(status_code=400, detail="Display name is required")

    # Check if phone is already registered
    existing_phone = db.query(models.User).filter(models.User.phone == phone_clean).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # Check if username is already registered
    existing_user = db.query(models.User).filter(func.lower(models.User.username) == username_clean).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    new_user = models.User(
        username=username_clean,
        phone=phone_clean,
        display_name=display_name_clean,
        avatar_url=user_data.avatar_url
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    # Verify the submitted OTP before creating the user's session
    if login_data.otp != auth.DEMO_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    identifier = (login_data.identifier or login_data.username or "").strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Username or display name is required")
        
    # 1. Search by exact username first (case-insensitive)
    db_user = db.query(models.User).filter(func.lower(models.User.username) == identifier.lower()).first()
    
    # 2. If not found by username, search by display name
    if not db_user:
        matching_users = db.query(models.User).filter(func.lower(models.User.display_name) == identifier.lower()).all()
        if len(matching_users) > 1:
            raise HTTPException(
                status_code=400, 
                detail="Multiple accounts found with this display name. Please log in using your unique username."
            )
        elif len(matching_users) == 1:
            db_user = matching_users[0]
            
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/phone", response_model=schemas.Token)
def login_phone(login_data: schemas.UserLoginPhone, db: Session = Depends(database.get_db)):
    # Verify the submitted OTP before creating the user's session
    if login_data.otp != auth.DEMO_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    phone_clean = login_data.phone.strip()
    if not phone_clean:
        raise HTTPException(status_code=400, detail="Phone number is required")
        
    db_user = db.query(models.User).filter(models.User.phone == phone_clean).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Account not found with this phone number. Please register first.")
        
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    # Return the profile of the currently authenticated user
    return current_user
