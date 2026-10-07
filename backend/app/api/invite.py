# Import External Libraries
# ---
from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.orm import Session
# ---

# Import Local Libraries
# ---
from app.database import get_db
from app.services.api import invite_service
from app.security import get_current_user
from app.models.user import User
from app.schemas import invite
from app.schemas import user_roles
# ---

# Setup API Router
# ---
router = APIRouter(
    prefix="/invite",
    tags=["Invites"],
)
# ---

# Get User Invites
# ---
@router.get("/")
def get_user_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return invite_service.get_incoming_invites(
        db=db,
        current_user=current_user
	)
# ---

# Get User Invites (no trailing slash required)
# ---
@router.get("", include_in_schema=False)
def get_user_invites_no_slash(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return invite_service.get_incoming_invites(
        db=db,
        current_user=current_user
	)
# ---

# Get Pending Invites
# ---
@router.get("/sent")
def get_user_sent_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return invite_service.get_sent_invites(
        db=db,
        current_user=current_user,
    )
# ---

# Get Group Invite Codes
# ---
@router.get("/code/{group_id}")
def get_invite_codes_to_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return invite_service.get_invite_codes(
        db=db,
        current_user=current_user,
        group_id=group_id,
    )
# ---

# Accept Invite
# ---
@router.post("/accept")
def accept_invite(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return invite_service.accept_invite(
        db=db,
        current_user=current_user,
        group_id=group_id,
    )
# ---

# Decline Invite
# ---
@router.post("/decline")
def decline_invite(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return invite_service.decline_invite(
        db=db,
        current_user=current_user,
        group_id=group_id,
    )
# ---

# Invite User
# ---
@router.post("/{group_id}")
def invite_user(
    group_id: int,
    username: str,
    role: user_roles.InviteRole,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return invite_service.invite_user(
        db=db,
        current_user=current_user,
        group_id=group_id,
        username=username,
        role=role
    )
# ---

# Create Invite Code
# ---
@router.post("/code/generate")
def generate_invite_code(
    group_id: int,
    role: user_roles.InviteRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return invite_service.create_invite_code(
        db=db,
        current_user=current_user,
        group_id=group_id,
        role=role,
    )
# ---

# Join With Invite Code
# ---
@router.post("/code/join/{join_code}")
def join_with_invite_code(
    join_code: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return invite_service.join_with_invite_code(
        db=db,
        current_user=current_user,
        code=int(join_code),
    )
# ---

# Delete Invite Code
# ---
@router.delete("/code/delete/{invite_code}")
def delete_invite_code(
    invite_code: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return invite_service.delete_invite_code(
        db=db,
        current_user=current_user,
        code=invite_code,
    )
# ---