# Base Imports
# ---
from fastapi import HTTPException
from typing import List
# ---

# Database Imports
# ---
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
# ---

# Import Models
# ---
from app.models.invite_code import Invite_Code
from app.models.group import Group
# ---

# Import Schemas
# ---
from app.schemas.invite_code import Invite_Code_Create, generate_code
from app.schemas import user_roles
# ---

# Import Services
# ---
from app.services.database import groups_table
# ---

# Get Sent Invite Codes
# ---
def get_sent_codes(
    db: Session,
    user_id: int,
) -> List[Invite_Code]:
    try:
        # Get Invite Codes
        # ---
        return db.scalars(
            select(Invite_Code)
            .where(
                Invite_Code.origin_id == user_id
            )
        ).all()
        # ---
    
    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve invitation codes",
        )
        # ---
# ---

# Get Invite Code
# ---
def get_invite_code(
    db: Session,
    code: int,
) -> Invite_Code:
    try:
        # Get Invite Code
        # ---
        invite_code = db.scalar(
            select(Invite_Code)
            .where(
                Invite_Code.code == code,
            )
        )
        # ---

        # Was found
        # ---
        if invite_code is None:
            raise HTTPException(
                status_code=404,
                detail="Invite code does not exist",
            )
        # ---

        # Return
        # ---
        return invite_code
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve invite code",
        )
        # ---

def get_invite_code_by_group(
    db: Session,
    group_id: int,
    role: user_roles.InviteRole
) -> Invite_Code:
    try:
        # Get Invite Code
        # ---
        invite_code:Invite_Code = db.scalar(
            select(Invite_Code)
            .where(
                Invite_Code.group_id == group_id,
                Invite_Code.role == role,
            )
        )
        # ---

        # Return
        # ---
        return invite_code
        # ---
    
    except SQLAlchemyError:

        # Database Error
        # ---
        raise HTTPException(
            status_code=400,
            detail="Error getting invite code",
        )
        # ---
# ---

# Create Invite Code
# ---
def create_invite_code(
    db: Session,
    origin_id: int,
    group_id: int,
    role: user_roles.InviteRole
) -> Invite_Code_Create:
    return Invite_Code_Create(
        origin_id=origin_id,
        group_id=group_id,
        role=role,
    )
# ---

# Add Invite Code
# ---
def add_invite_code(
    db: Session,
    invite_code_create: Invite_Code_Create, 
) -> Invite_Code:
    # Check Existence
    # ---
    test_invite_code:Invite_Code = get_invite_code_by_group(
        db=db,
        group_id=invite_code_create.group_id,
        role=invite_code_create.role,
    )
    if test_invite_code is not None:
        raise HTTPException(
            status_code=409,
            detail="Matching invite code already exists"
        )
    # ---
    while True:
        try:
            # Create New Invite Code
            # ---
            code = generate_code()
            new_invite_code = Invite_Code(
                code=code,
                origin_id=invite_code_create.origin_id,
                group_id=invite_code_create.group_id,
                role=invite_code_create.role,
            )
            # ---

            # Update Database
            # ---
            db.add(new_invite_code)
            db.commit()
            db.refresh(new_invite_code)
            # ---

            # Return
            # ---
            return new_invite_code
            # ---

        except IntegrityError as e:
            db.rollback()
            if "invite_codes_pkey" in str(e.orig):
                continue
            raise HTTPException(
                status_code=409,
                detail="Invite code violates a database constraint",
            )

        except SQLAlchemyError:
            # Database Error
            # ---
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Invite code was not created",
            )
            # ---
# ---

# Delete Invite Code
# ---
def delete_invite_code(
    db: Session,
    invite_code: Invite_Code,
) -> int:
    try:
        # Store Code
        # ---
        code:int = invite_code.code
        # ---

        # Update Database
        # ---
        db.delete(invite_code)
        db.commit()
        # ---

        # Return
        # ---
        return code
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Invite code was not deleted"
        )
        # ---
# ---