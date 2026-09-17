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
from app.models.group import Group
# ---

# Get Group
# ---
def get_group(
    db: Session,
    group_id: int,
) -> Group:
    try:
        # Get Group
        # ---
        group = db.scalar(
            select(Group)
            .where(
                Group.id == group_id
            )
        )
        if group is None:
            raise HTTPException(
                status_code=404,
                detail="Group not found",
            )
        # ---

        # Return
        # ---
        return group
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Group was not retrieved",
        )
        # ---

def get_group_by_name(
    db: Session,
    group_name: str,
) -> Group:
    try:
        # Get Group
        # ---
        group = db.scalar(
            select(Group)
            .where(
                Group.name == group_name
            )
        )
        if group is None:
            raise HTTPException(
                status_code=404,
                detail="Group not found",
            )
        # ---

        # Return
        # ---
        return group
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Group was not retrieved",
        )
        # ---
# ---

# Group ID
# ---
def get_group_id(
    db: Session,
    group_name: str,
) -> int:
    try:
        # Get Group
        # ---
        group: Group = db.scalar(
            select(Group)
            .where(
                Group.name == group_name
            )
        )
        if group is None:
            raise HTTPException(
                status_code=404,
                detail=f"Group '{group_name}' not found"
            )
        # ---

        # Return
        # ---
        return group.id
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve group id",
        )
        # ---
# ---

# Group Name
# ---
def get_group_name(
    db:Session,
    group_id: int,
) -> str:
    try:
        # Get Group
        # ---
        group: Group = db.scalar(
            select(Group)
            .where(
                Group.id == group_id,
            )
        )
        if group is None:
            raise HTTPException(
                status_code=404,
                detail=f"Group with id '{group_id}' not found",
            )
        # ---

        # Return
        # ---
        return group.name
        # ---

    except SQLAlchemyError:
        # Database error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve group name"
        )
        # ---

# ---

# Create Group
# ---
def create_group(
    db: Session,
    group_name: str,
) -> Group:
    try:
        # Create Group
        # ---
        new_group: Group = Group(
            name= group_name
        )
        # ---

        # Update Database
        # ---
        db.add(new_group)
        db.commit()
        db.refresh(new_group)
        # ---

        # Return
        # ---
        return new_group
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Group was not created",
        )
        # ---
# ---

# Edit Group
# ---
def rename_group(
    db: Session,
    new_group_name: str,
    group: Group,
) -> Group:
    try:
        # Update Database
        # ---
        group.name = new_group_name
        db.commit()
        db.refresh(group)
        # ---

        # Return
        # ---
        return group
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Group name was not changed",
        )
        # ---
# ---

# Delete Group
# ---
def delete_group(
    db: Session,
    group: Group,
) -> str:
    try:
        # Store group name
        # ---
        group_name: str = group.name
        # ---

        # Update database
        # ---
        db.delete(group)
        db.commit()
        # ---

        # Return
        # ---
        return f"Group '{group_name}' was deleted"
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Could not delete group",
        )
        # ---
# ---