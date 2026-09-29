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

# Get Invitations
# ---
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