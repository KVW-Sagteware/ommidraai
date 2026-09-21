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
# ---

def get_group_locations(
    db: Session,
    group_id: int,
) -> Group_Location:
    try:
        # Get Group Location
        # ---
        group_location = db.scalar(
            select(Group_Location)
            .where(
                Group_Location.group_id == group_id
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