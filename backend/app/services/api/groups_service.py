# Base Imports
# ---
from fastapi import Depends, HTTPException
from fastapi_pagination.ext.sqlalchemy import paginate
# ---

# Database Imports
# ---
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
# ---

# Import Models
# ---
from app.models.user import User
from app.models.group import Group
from app.models.user_group import User_Group
# ---

# Import Schemas
# ---
from app.schemas import user_roles
from app.schemas import user_group as user_group_schemas
# ---

# Import Services
# ---
from app.services.database import groups_table
from app.services.database import user_groups_table
# ---

# Get User Groups
# ---
def get_user_owned_groups(
    db: Session,
    current_user: User,
):
    return paginate(db,
        select(User_Group, Group)
        .join(Group, Group.id == User_Group.group_id)
        .where(
            User_Group.user_id == current_user.id,
            User_Group.role == user_roles.UserRole.owner,
        )
        .order_by(User_Group.group_id.desc())
    )

def get_user_joined_groups(
    db: Session,
    current_user: User,
):
    return paginate(db,
        select(User_Group, Group)
        .join(Group, Group.id == User_Group.group_id)
        .where(
            User_Group.user_id == current_user.id,
            User_Group.role != user_roles.UserRole.owner,
        )
        .order_by(User_Group.group_id.desc())
    )
# ---

# Get Group Name
# ---
def get_group_name(
    db: Session,
    current_user: User,
    group_id: int,
) -> str:
    if user_groups_table.is_in_group(
        db=db,
        group_id=group_id,
        user_id=current_user.id,
    ):
        return groups_table.get_group_name(
            db=db,
            group_id=group_id,
        )
    else:
        raise HTTPException(
            status_code=404,
            detail="User not found in selected group",
        )
# ---

# Get Group Data
# ---
def get_group_data(
    db: Session,
    current_user: User,
):
    pass
# ---

# Get Group Destinations
# ---
def get_group_destinations(
    db: Session,
    current_user: User,
):
    pass
# ---

# Search Group Destinations
# ---
def search_group_destinations(
    db: Session,
    current_user: User,
):
    pass
# ---

# Create Group
# ---
def create_group(
    db: Session,
    current_user: User,
    group_name: str,
) -> str:
    try:
        # Create Named Group
        # ---
        group_id: int = groups_table.create_group(
            db=db,
            group_name=group_name,
        ).id
        # ---

        # Build Schema
        # ---
        user_group_create: user_group_schemas.UserGroupCreate = user_group_schemas.UserGroupCreate(
            user_id= current_user.id,
            group_id= group_id,
            role= user_roles.UserRole.owner,
            car_capacity= 0,
            is_passenger= False,
        )
        # ---

        # Add Current User
        # ---
        user_groups_table.add_user(
            db=db,
            user_group_create=user_group_create,
        )
        # ---

        # Return
        # ---
        return f"Group '{group_name}' was created"
        # ---
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Group not created",
        )
# ---

# Delete Group
# ---
def delete_group(
    db: Session,
    current_user: User,
    group_name: str,
) -> str:
    try:
        # Get Group
        # ---
        group_id: int= groups_table.get_group_id(
                db=db,
                group_name=group_name,
        )
        group: group = groups_table.get_group(
            db=db,
            group_id=group_id,
        )
        # ---

        # Get User Group
        # ---
        user_group: User_Group = user_groups_table.get_user_group(
            db=db,
            user_group_select=user_group_schemas.UserGroupSelect(
                group_id=group_id,
                user_id=current_user.id,
            )
        )
        if user_group is None:
            raise HTTPException(
                status_code=404,
                detail="User not in group",
            )
        # ---

        # Check User Permissions
        # ---
        if not user_roles.can_delete_group(
            role=user_group.role,
        ):
            raise HTTPException(
                status_code=403,
                detail="Permission denied",
            )
        # ---

        # Empty Database
        # ---
        user_groups_table.remove_all_users(
            db=db,
            user_groups=user_groups_table.get_group_users(
                db=db,
                group_id=group_id,
            )
        )
        # ---

        # Delete Group
        # ---
        return groups_table.delete_group(
            db=db,
            group=group,
        )
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Group was not deleted",
        )
        # ---
# ---