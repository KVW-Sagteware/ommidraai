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
from sqlalchemy.dialects.postgresql import insert, Insert
# ---

# Import Models
# ---
from app.models.location import Location
# ---

# Import Schemas
# ---
from app.schemas.location import LocationCreate
# ---

# Create Location
# ---
def create_location(
    db: Session,
    location: LocationCreate,
) -> int:
    try:
        # Create Statement
        # ---
        stmt:Insert = (
            insert(Location)
            .values(
                latitude=location.latitude,
                longitude=location.longitude,
            )
            .on_conflict_do_nothing(
                constraint="uq_lat_lon"
            )
            .returning(Location.id)
        )
        # ---

        # Attempt Database Addition
        # ---
        location_id:int = db.execute(stmt).scalar_one_or_none()
        # ---

        # If Location Existed
        # ---
        if location_id is None:
            location_id = get_location_id(
                db=db,
                location=location,
            )
        # ---

        # Return
        # ---
        db.commit()
        return location_id
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not add location"
        )
        # ---
# ---

# Get Location ID
# ---
def get_location_id(
    db: Session,
    location: Location,
) -> int | None:
    try:
        # Return Location ID
        # ---
        return db.scalar(
            select(Location.id)
            .where(
                Location.latitude == location.latitude,
                Location.longitude == location.longitude,
            )
        )
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve location ID",
        )
        # ---
# ---