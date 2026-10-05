# Base Imports
# ---
from fastapi import HTTPException
from typing import List
# ---

# Database Imports
# ---
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
# ---

# Import Models
# ---
from app.models.user_location import User_Location
from app.models.location import Location
from app.models.user import User
# ---

# Import Schemas
# ---
from app.schemas.user_location import UserLocationCreate, UserLocationResponse
from app.schemas.location import LocationCreate
# ---

# Import Services
# ---
from app.services.database import locations_table
# ---

# Get User Locations
# ---
def get_user_locations(
    db: Session,
    user_id: int,
) -> List[UserLocationResponse]:
    try:
        # Get Statement
        # ---
        stmt = db.execute(
            select(User_Location, Location)
            .join(Location, Location.id == User_Location.location_id)
            .where(
                User_Location.user_id == user_id,
            )
        ).all()
        # ---

        # Create Response
        # ---
        return [
            UserLocationResponse(
                name=ul.name,
                latitude=loc.latitude,
                longitude=loc.longitude,
            )
            for ul, loc in stmt
        ]
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve user location info",
        )
        # ---
# ---

# Get Default User Location
# ---
def get_default_user_location(
    db: Session,
    user: User,
) -> User_Location:
    try:
        # Get User Location
        # ---
        user_location: User_Location = db.scalar(
            select(User_Location)
            .where(
                User_Location.location_id == user.default_location_id,
            )
        )
        # ---

        # Validate Location Existence
        # ---
        if user_location is None:
            raise HTTPException(
                status_code=404,
                detail="Location not found",
            )
        # ---

        # Return

        # ---
        return user_location
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Default location not returned",
        )
        # ---
# ---

# Get User Location
# ---
def get_user_location_by_name(
    db: Session,
    user: User,
    name: str,
) -> User_Location:
    try:
        # Get User Location
        # ---
        user_location:User_Location = db.scalar(
            select(User_Location)
            .where(
                User_Location.user_id == user.id,
                User_Location.name == name,
            )
        )
        if user_location is None:
            raise HTTPException(
                status_code=404,
                detail="User location cannot be found",
            )
        # ---

        # Return
        # ---
        return user_location
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve user location",
        )
        # ---
# ---

# Create User Location
# ---
def create_user_location(
    db: Session,
    user: User,
    user_location_create: UserLocationCreate,
) -> User_Location:
    try:
        # Check Location Name
        # ---
        user_location_check:User_Location = db.scalar(
            select(User_Location)
            .where(
                User_Location.name == user_location_create.name,
                User_Location.user_id == user.id,
            )
        )
        if user_location_check is not None:
            raise HTTPException(
                status_code=400,
                detail=f'Name "{user_location_check.name}" already in use'
            )
        # ---

        # Create/Retrieve Location
        # ---
        location_id:int = locations_table.create_location(
            db=db,
            location=user_location_create.location
        )
        # ---

        # Create New User Location
        # ---
        new_user_location:User_Location = User_Location(
            location_id=location_id,
            user_id=user.id,
            name=user_location_create.name,
        )
        # ---

        # Append Database
        # ---
        db.add(new_user_location)
        db.commit()
        db.refresh(new_user_location)
        # ---

        # Return
        # ---
        return UserLocationResponse(
            name=new_user_location.name,
            latitude=user_location_create.location.latitude,
            longitude=user_location_create.location.longitude,
        )
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="User location was not added",
        )
        # ---
# ---

# Delete User Location
# ---
def delete_user_location(
    db: Session,
    user_location: User_Location,
) -> str:
    try:
        # Save Name
        # ---
        name:str = user_location.name
        # ---

        # Delete User Location
        # ---
        db.delete(user_location)
        db.commit()
        # ---

        # Return
        # ---
        return f'Deleted location "{name}"'
        # ---
    
    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not delete user location",
        )
        # ---
# ---