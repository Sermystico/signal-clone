from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/search", response_model=List[schemas.UserResponse])
def search_users(q: str = Query(..., min_length=1), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    users = db.query(models.User).filter(
        (models.User.username.ilike(f"%{q}%")) | 
        (models.User.display_name.ilike(f"%{q}%")) |
        (models.User.phone.ilike(f"%{q}%"))
    ).filter(models.User.id != current_user.id).limit(20).all()
    return users
