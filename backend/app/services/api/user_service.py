# Base Imports
# ---
from fastapi import Depends, HTTPException
from typing import List
# ---

# Database Imports
# ---
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
# ---

# Import Models
# ---
from app.models.user import User
from app.models.user_location import User_Location
# ---

# Import Schemas
# ---
from app.schemas.user_location import UserLocationCreate, UserLocationResponse
# ---

# Import Services
# ---
from app.services.database import users_table
from app.services.database import user_locations_table
from app.services.database import user_groups_table
# ---

# Get User Locations
# ---
def get_current_user_locations(
    db: Session,
    user_id: int,
) -> List[UserLocationResponse]:
    try:
        # Get User Locations
        # ---
        return user_locations_table.get_user_locations(
            db=db,
            user_id=user_id,
        )
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Could not get location info",
        )
        # ---
# ---

# Get Default Location
# ---
def get_current_user_default_location(
    db: Session,
    current_user: User,
) -> User_Location:
    try:
        # Get Default User Location
        # ---
        return user_locations_table.get_default_user_location(
            db=db,
            user=current_user,
        )
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve default user location",
        )
        # ---
# ---

# Add User Location
# ---
def add_user_location(
    db: Session,
    current_user: User,
    user_location_create: UserLocationCreate,
) -> str:
    try:
        # Add User Location
        # ---
        return user_locations_table.create_user_location(
            db=db,
            user=current_user,
            user_location_create=user_location_create,
        )
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not add user location",
        )
        # ---
# ---

# Edit Default Location
# ---
def edit_default_user_location(
    db: Session,
    current_user: User,
    location_name: str,
) -> User:
    try:
        from app.services.api import groups_service

        # Get User Location
        # ---
        user_location:User_Location = user_locations_table.get_user_location_by_name(
            db=db,
            user=current_user,
            name=location_name,
        )
        # ---

        # Change Default Location
        # ---
        current_user.default_location_id = user_location.location_id
        db.commit()
        db.refresh(current_user)

        for user_group in user_groups_table.get_user_groups(
            db=db,
            user_id=current_user.id,
        ):
            groups_service.refresh_group_ranking_cache(
                db=db,
                group_id=user_group.group_id,
            )
        # ---

        # Return
        # ---
        return current_user
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Default user location was not updated",
        )
        # ---
# ---

# Remove User Location
# ---
def remove_user_location(
    db: Session,
    current_user: User,
    location_name: str,
) -> str:
    try:
        # Get User Location
        # ---
        user_location:User_Location = user_locations_table.get_user_location_by_name(
            db=db,
            user=current_user,
            name=location_name,
        )
        # ---

        # Delete User Location
        # ---
        message:str = user_locations_table.delete_user_location(
            db=db,
            user_location=user_location,
        )
        # ---

        # Return
        # ---
        return {"message": message}
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="User Location was not removed",
        )
        # ---
# ---