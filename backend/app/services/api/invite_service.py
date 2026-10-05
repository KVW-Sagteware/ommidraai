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
from app.models.group import Group
from app.models.invite import Invite
from app.models.invite_code import Invite_Code
# ---

# Import Schemas
# ---
from app.schemas import user_roles
from app.schemas import user_group as user_group_schemas
from app.schemas import invite as invite_schemas
# ---

# Import Services
# ---
from app.services.database import invite_codes_table
from app.services.database import user_groups_table
from app.services.database import groups_table
from app.services.database import invites_table
from app.services.database import users_table
# ---

# Get Incoming Invites
# ---
def get_incoming_invites(
    db: Session,
    current_user: User,
) -> List[Invite]:
    try:
        # Get Invites
        # ---
        return invites_table.get_invitations_by_user(
            db=db,
            user_id=current_user.id,
        )
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Could not get invites",
        )
        # ---
# ---

# Get Sent Invites
# ---
def get_sent_invites(
    db: Session,
    current_user: User,
) -> List[Invite]:
    try:
        # Get Invites
        # ---
        return invites_table.get_invitations_by_origin(
            db=db,
            origin_id=current_user.id,
        )
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Could not get invites",
        )
        # ---
# ---

# Accept Invitation
# ---
def accept_invite(
    db: Session,
    current_user: User,
    group_id: int,
) -> str:
    try:
        # Get Invite
        # ---
        invite:Invite = invites_table.get_invitation_to_group(
            db=db,
            group_id=group_id,
            user_id=current_user.id,
        )
        if invite is None:
            raise HTTPException(
                status_code=404,
                detail="Invite not found",
            )
        # ---

        # Add to group
        # ---
        user_group_create:user_group_schemas.UserGroupCreate=user_group_schemas.UserGroupCreate(
            user_id=current_user.id,
            group_id=group_id,
            role=invite.role,
            car_capacity=0,
            is_passenger=False,
        )
        user_groups_table.add_user(
            db=db,
            user_group_create=user_group_create,
        )
        # ---

        # Delete Invite
        # ---
        if invites_table.delete_invite(
            db=db,
            invite=invite,
        ):
            return "Accepted invite removed"
        else:
            return "Invite not removed"
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Invite not accepted",
        )
        # ---
# ---

# Decline Invitation
# ---
def decline_invite(
    db: Session,
    current_user: User,
    group_id: int,
) -> str:
    try:
        # Get Invite
        # ---
        invite:Invite = invites_table.get_invitation_to_group(
            db=db,
            group_id=group_id,
            user_id=current_user.id,
        )
        if invite is None:
            raise HTTPException(
                status_code=404,
                detail="Invite not found",
            )
        # ---

        # Delete Invite
        # ---
        if invites_table.delete_invite(
            db=db,
            invite=invite,
        ):
            return "Declined Invite"
        # ---

        # Return
        # ---
        return "Invite not declined"
        # ---

    except SQLAlchemyError:

        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Error declining invite",
        )
        # ---
# ---

# Invite User
# ---
def invite_user(
    db: Session,
    current_user: User,
    group_id: int,
    username: str,
    role: user_roles.InviteRole,
) -> Invite:
    try:
        # Check Permissions
        # ---
        if not user_roles.can_manage_user(
            actor=user_groups_table.get_user_group(
                db=db,
                user_group_select=user_group_schemas.UserGroupSelect(
                    group_id=group_id,
                    user_id=current_user.id,
                )
            ).role,
            target=role,
        ):
            raise HTTPException(
                status_code=403,
                detail="Permission denied",
            )
        # ---

        # Return
        # ---
        return invites_table.create_invite(
            db=db,
            group_id=group_id,
            user_id=users_table.get_user_id(
                db=db,
                user_name=username,
            ),
            origin_id=current_user.id,
            role=role,
        )
        # ---
        
    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="User was not invited",
        )
        # ---
# ---

# Create Invite Code
# ---
def create_invite_code(
    db: Session,
    current_user: User,
    group_id: int,
    role: user_roles.UserRole
) -> Invite_Code:
    try:
        # Check Permissions
        # ---
        if not user_roles.can_manage_user(
            actor=user_groups_table.get_user_group(
                db=db,
                user_group_select=user_group_schemas.UserGroupSelect(
                    group_id=group_id,
                    user_id=current_user.id,
                )
            ).role,
            target=role,
        ):
            raise HTTPException(
                status_code=403,
                detail="Permission denied",
            )
        # ---

        # Create Schema
        # ---
        invite_code_create = invite_codes_table.create_invite_code(
            db=db,
            origin_id=current_user.id,
            group_id=group_id,
            role=role,
        )
        # ---

        # Return
        # ---
        return invite_codes_table.add_invite_code(
            db=db,
            invite_code_create=invite_code_create,
        )
        # ---
    
    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail=("Could not create an invite code")
        )
        # ---
# ---

# Join Using Code
# ---
def join_with_invite_code(
    db: Session,
    current_user: User,
    code: int,
) -> Group:
    try:
        # Get Invite Code
        # ---
        invite_code = invite_codes_table.get_invite_code(
            db=db,
            code=code,
        )
        # ---

        # Create User Group
        # ---
        user_group = user_groups_table.add_user(
            db=db,
            user_group_create=user_groups_table.user_group_schema(
                db=db,
                user_id=current_user.id,
                group_id=invite_code.group_id,
                role=invite_code.role,
            )
        )
        # ---

        # Return
        # ---
        return groups_table.get_group(
            db=db,
            group_id=user_group.group_id,
        )
        # ---
        
    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not join group",
        )
        # ---
# ---

# Delete Invite Code
# ---
def delete_invite_code(
    db: Session,
    current_user: User,
    code: int,
) -> str:
    try:
        # Get Invite Code
        # ---
        invite_code:Invite_Code = invite_codes_table.get_invite_code(
            db=db,
            code=code,
        )
        # ---

        # Check Permissions
        # ---
        if not user_roles.can_manage_user(
            actor=user_groups_table.get_user_group(
                db=db,
                user_group_select=user_group_schemas.UserGroupSelect(
                    group_id=invite_code.group_id,
                    user_id=current_user.id,
                )
            ).role,
            target=invite_code.role,
        ):
            raise HTTPException(
                status_code=403,
                detail="Permission denied",
            )
        # ---

        # Check Existence
        # ---
        if invite_code is None:
            raise HTTPException(
                status_code=404,
                detail="Invite code not found",
            )
        # ---

        # Delete Invite Code
        # ---
        invite_codes_table.delete_invite_code(
            db=db,
            invite_code=invite_code,
        )
        # ---

        # Return
        # ---
        return f"Deleted code {code}"
        # ---
    
    except SQLAlchemyError:

        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Invite code was not deleted"
        )
        # ---
# ---
