# Base Imports
# ---
from fastapi import Depends, HTTPException
# ---

# Database Imports
# ---
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError
# ---

# Security Imports
# ---
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token
)
# ---

# Import Schemas
# ---
from app.schemas.location import LocationCreate
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate, UserUpdate
# ---

# Import Models
# ---
from app.models.user import User
from app.models.location import Location
from app.models.user_location import User_Location
# ---

# Import Services
# ---
from app.services.database import user_locations_table
from app.services.database import users_table
from app.services.database import locations_table
# ---

# Register Service
# ---
def register(
    db: Session,
    user: UserCreate,
    location: LocationCreate
) -> User:

    try:
        # Create Default Location
        # ---
        default_location_id = locations_table.create_location(
            db=db,
            location=location,
        )
        # ---

        # Hash Password
        # ---
        hashed = hash_password(user.password)
        # ---

        # Create New User
        # ---
        new_user: User = users_table.create_user(
            db=db,
            user=user,
            default_location_id=default_location_id,
        )
        # ---

        # Create Default User Location
        # ---
        user_location: User_Location = user_locations_table.create_user_location(
            db=db,
            user=new_user,
            user_location_create=location,
        )
        # ---

        # Return
        # ---
        return new_user
        # ---

    except IntegrityError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Email already in use",
        )
        # ---
# ---

# Login
# ---
def login(
    db: Session,
    credentials: LoginRequest,
) -> str:
    # Get User
    # ---
    stmt: User = users_table.get_user_by_name(
        db=db,
        username=credentials.username,
    )
    # ---

    # Check User Exists
    # ---
    if user is None:
        raise HTTPException(
            status_code=403,
            detail="Invalid username or password",
        )
    # ---

    # Verify Password
    # ---
    if not verify_password(
        credentials.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=403,
            detail="Invalid username or password",
        )
    # ---

    # Create Tokens
    # ---
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "type": "access",
        }
    )
    refresh_token = create_refresh_token(
        data={
            "sub": str(user.id),
            "type": "refresh",
        }
    )
    # ---

    # Return
    # ---
    return access_token, refresh_token, credentials.username
    # ---
# ---

# Refresh Access Token
# ---
def refresh(
    refresh_token: str,
) -> str:
    # Get User ID
    # ---
    user_id:int = verify_refresh_token(
        token=refresh_token,
    )
    # ---

    # Get Access Token
    # ---
    access_token:str = create_access_token(
        {
            "sub": str(user_id),
            "type": "access",
        }
    )
    # ---

    # Return
    # ---
    return access_token
    # ---
# ---

# Get User
# ---
def get_user_by_id(
    db: Session,
    user_id: int,
) -> User | None:
    try:
        # Get User
        # ---
        return db.scalar(
            select(User).where(User.id == user_id)
        )
        # ---
    
    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve user",
        )
        # ---
# ---

# Update User Username
# ---
def update_username(
    db: Session,
    current_user: User,
    user_update: UserUpdate,
) -> User:
    try:
        # Change Password
        # ---
        return users_table.change_username(
            db=db,
            user=current_user,
            new_user_name=user_update.username,
        )
        # ---
    
    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not change username",
        )
        # ---
# ---