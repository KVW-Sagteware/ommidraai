# Base Imports
# ---
from fastapi import HTTPException
from pydantic import EmailStr
# ---

# Database Imports
# ---
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
# ---

# Security Imports
# ---
from app.security import hash_password
# ---

# Import Models
# ---
from app.models.user import User
from app.models.user_group import User_Group
from app.models.location import Location
# ---

# Import Schemas
# ---
from app.schemas.user import UserCreate
# ---

# Get User
# ---
def get_user(
    db: Session,
    user_id: int,
) -> User:
    try:
        # Get User
        # ---
        user: User = db.scalar(
            select(User)
            .where(
                User.id == user_id,
            )
        )
        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )
        # ---

        # Return
        # ---
        return user
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve user",
        )
        # ---

def get_user_by_name(
    db: Session,
    username: str,
) -> User:
    try:
        # Get User
        # ---
        return db.scalar(
            select(User)
            .where(
                User.username == username,
            )
        )
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not get User",
        )
        # ---
# ---

# Get User Data for Groups
# ---
def get_user_data(
    db: Session,
    group_id: int,
):
    try:
        # Get Data
        # ---
        users_data = db.execute(
            select(User, User_Group, Location)
            .join(User_Group, User.id == User_Group.user_id)
            .join(Location, Location.id == User.default_location_id)
            .where(User_Group.group_id == group_id)
        ).all()
        # ---

        # Return
        # ---
        return users_data
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve user data",
        )
        # ---
# ---

# Get User ID
# ---
def get_user_id(
    db: Session,
    user_name: str,
) -> int:
    try:
        # Get User
        # ---
        user: User = db.scalar(
            select(User)
            .where(
                User.username == user_name,
            )
        )
        if  user is None:
            raise HTTPException(
                status_code=404,
                detail=f"User '{user_name}' not found",
            )
        # ---

        # Return
        # ---
        return user.id
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve user id",
        )
        # ---
# ---

# Create User
# ---
def create_user(
    db: Session,
    user: UserCreate,
    default_location_id: int,
) -> User:
    try:
        # Create New User
        # ---
        hashed = hash_password(user.password)
        new_user = User(
            username=user.username,
            email=user.email,
            password_hash=hashed,
            default_location_id=default_location_id,
        )
        # ---

        # Update Database
        # ---
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
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
            status_code=500,
            detail="Email already in use",
        )
        # ---
# ---

# Edit User
# ---
def change_username(
    db: Session,
    user: User,
    new_user_name: str,
) -> str:
    try:
        # Update Database
        # ---
        user.username = new_user_name
        db.commit()
        db.refresh(user)
        # ---

        # Return
        # ---
        return user.username
        # ---
    
    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not change username",
        )
        # ---

def change_password(
    db: Session,
    user: User,
    new_password: str,
) -> str:
    try:
        # Hash Password
        # ---
        hashed = hash_password(password=password)
        # ---

        # Update Database
        # ---
        user.password_hash = hashed
        db.commit()
        db.refresh(user)
        # ---

        # Return
        # ---
        return "Password changed"
        # ---
    
    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not change password",
        )
        # ---

def change_email(
    db: Session,
    user: User,
    new_email: EmailStr,
) -> str:
    try:
        # Update Database
        # ---
        user.email = new_email
        db.commit()
        db.refresh(user)
        # ---

        # Return
        # ---
        return user.email
        # ---
    
    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not change email",
        )
        # ---

def change_default_location(
    db: Session,
    user: User,
    default_location_id: int,
) -> int:
    try:
        # Update Database
        # ---
        user.default_location_id = default_location_id
        db.commit()
        db.refresh(user)
        # ---

        # Return
        # ---
        return user.default_location_id
        # ---
    
    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not change default location",
        )
        # ---
# ---

# Delete User
# ---
def delete_user(
    db: Session,
    user: User,
) -> str:
    try:
        # Store Username
        # ---
        user_name: UserCreate.username = user.username
        # ---

        # Update Database
        # ---
        db.delete(user)
        db.commit()
        # ---

        # Return
        # ---
        return user_name
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="User was not deleted",
        )
        # ---
# ---