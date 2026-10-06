# Base Imports
# ---
from fastapi import HTTPException
# ---

# Database Imports
# ---
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
# ---

# Import Models
# ---
from app.models.group_location import Group_Location
from app.models.location import Location
# ---

# Get Group Locations
# ---
def get_group_locations(
    db: Session,
    group_id: int,
    display_name: str = None,
) -> Group_Location:
    try:
        # Get Group Location
        # ---
        group_location = db.scalars(
            select(Group_Location)
            .where(
                Group_Location.group_id == group_id,
                Group_Location.display_name == display_name if display_name is not None else True
            )
        ).all()
        # ---

        # Error Handling
        # ---
        if group_location is None:
            raise HTTPException(
                status_code=404,
                detail="Group locations not found",
            )
        # ---

        # Return
        # ---
        return group_location
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Group locations were not retrieved",
        )
        # ---
# ---

# Get Group Location Data for Groups
# ---
def get_location_data(
    db: Session,
    group_id: int,
):
    try:
        # Get Data
        # ---
        coords = db.execute(
            select(Group_Location, Location)
            .join(Group_Location, Location.id == Group_Location.location_id)
            .where(Group_Location.group_id == group_id)
        ).all()
        # ---

        # Return
        # ---
        return coords
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve location data",
        )
        # ---
# ---

# Add Group Location
# ---
def add_group_location(
    db: Session,
    group_id: int,
    display_name: str,
    location_id: int,
) -> Group_Location:
    try:
        # Create Group Location
        # ---
        new_group_location: Group_Location = Group_Location(
            group_id=group_id,
            location_id=location_id,
            display_name=display_name
        )
        # ---

        # Update Database
        # ---
        db.add(new_group_location)
        db.commit()
        db.refresh(new_group_location)
        # ---

        # Return
        # ---
        return new_group_location
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Group location was not added",
        )
        # ---
# ---

# Delete Group Location
# ---
def remove_group_location(
    db: Session,
    group_id: int,
    display_name: str,
) -> str:
    try:
        # Get Group Location
        # ---
        group_location = db.scalar(
            select(Group_Location)
            .where(
                Group_Location.group_id == group_id,
                Group_Location.display_name == display_name
            )
        )
        # ---

        # Error Handling
        # ---
        if group_location is None:
            raise HTTPException(
                status_code=404,
                detail="Group location not found",
            )
        # ---

        # Delete Group Location
        # ---
        db.delete(group_location)
        db.commit()
        # ---

        return "Location removed successfully"

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Group location was not deleted",
        )
        # ---