from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import uuid

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/search", response_model=List[schemas.UserResponse])
def search_users(q: str = Query("", min_length=0), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.User).filter(models.User.id != current_user.id)
    raw_q = q.strip()
    clean_q = raw_q.lstrip("@").strip()
    if clean_q:
        search_str = f"%{clean_q}%"
        query = query.filter(
            (models.User.username.ilike(search_str)) | 
            (models.User.display_name.ilike(search_str)) |
            (models.User.phone.ilike(search_str))
        )
    users = query.limit(50).all()
    return users

@router.post("/avatar", response_model=schemas.UserResponse)
def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"{request.base_url}uploads/{filename}"
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/avatar", response_model=schemas.UserResponse)
def update_avatar_url(
    payload: schemas.AvatarUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    current_user.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/avatar", response_model=schemas.UserResponse)
def remove_avatar(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    current_user.avatar_url = None
    db.commit()
    db.refresh(current_user)
    return current_user
