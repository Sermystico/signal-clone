from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, database, auth

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # Verify the submitted OTP before creating the user's session.
    if user_data.otp != auth.DEMO_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    db_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    new_user = models.User(
        username=user_data.username,
        phone=user_data.phone,
        display_name=user_data.display_name,
        avatar_url=user_data.avatar_url
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    # Verify the submitted OTP before creating the user's session.
    if login_data.otp != auth.DEMO_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    db_user = db.query(models.User).filter(models.User.username == login_data.username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    # Return the profile of the currently authenticated user
    return current_user
