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
from app.models.invite import Invite
# ---

# Import Schemas
# ---
from app.schemas.invite import InviteCreate
from app.schemas import user_roles
# ---

# Import Services
# ---
from app.services.database import groups_table
from app.services.database import user_groups_table
# ---

# Create Invite
# ---
def create_invite(
    db: Session,
    group_id: int,
    user_id: int,
    origin_id: int,
    role: user_roles.InviteRole,
) -> Invite:
    try:
        # Check Existence
        # ---
        check_invite: Invite = get_invitation_to_group(
            db=db,
            group_id=group_id,
            user_id=user_id,
        )
        if check_invite is not None:
            if check_invite.role == role:
                return None
            else:
                delete_invite(
                    db=db,
                    invite=check_invite,
                )
        # ---

        # Create Invite
        # ---
        new_invite: Invite = Invite(
            group_id=group_id,
            user_id=user_id,
            origin_id=origin_id,
            role=role,
        )
        # ---

        # Update Database
        # ---
        db.add(new_invite)
        db.commit()
        db.refresh(new_invite)
        # ---

        # Return
        # ---
        return new_invite
        # ---

    except SQLAlchemyError:

        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Could not create invite"
        )
        # ---
# ---

# Delete Invite
# ---
def delete_invite(
    db: Session,
    invite: Invite,
) -> bool:
    try:
        # Delete Invite
        # ---
        db.delete(invite)
        db.commit()
        # ---

        # Return
        # ---
        return True
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Could not delete invite",
        )
        # ---
# ---

# Get Invitations
# ---
def get_invitations_by_user(
    db: Session,
    user_id: int,
) -> List[Invite]:
    pass

def get_invitations_by_origin(
    db: Session,
    origin_id: int,
) -> List[Invite]:
    try:
        # Get Invitations
        # ---
        return db.scalars(
            select(Invite)
            .where(
                Invite.origin_id == origin_id,
            )
        ).all()
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve invites"
        )
        # ---
# ---

# Get Invitation
# ---
def get_invitation_to_group(
    db: Session,
    group_id: int,
    user_id: int,
) -> Invite:
    try:
        # Get invites
        # ---
        invite:Invite = db.scalar(
            select(Invite)
            .where(
                Invite.group_id == group_id,
                Invite.user_id == user_id,
            )
        )
        # ---

        # Return
        # ---
        return invite
        # ---
    
    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Error attempting to retrieve invite to group",
        )
        # ---
# ---