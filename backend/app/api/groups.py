# Import External Libraries
# ---
from fastapi import (
    APIRouter,
    Depends,
)
from fastapi_pagination import Page
from sqlalchemy.orm import Session
# ---

# Import Local Libraries
# ---
from app.security import get_current_user
from app.database import get_db
from app.services import group_service
from app.services.api import groups_service
# ---

# Import Models
# ---
from app.models.user import User
# ---

# Import Schemas
# ---
from app.schemas import invite
from app.schemas.user_group import UserGroupResponse
from app.schemas.group import GroupCreate
from app.schemas.location import LocationCreate
from app.schemas import user_roles
# ---

# Router Setup
# ---
router = APIRouter(
    prefix="/groups",
    tags=["Groups"],
)
# ---

# Get User Groups
# ---
@router.get("/get/owned", response_model=Page[UserGroupResponse])
def get_user_owned_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return groups_service.get_user_owned_groups(
        db=db,
        current_user=current_user,
    )

@router.get("/get/joined", response_model=Page[UserGroupResponse])
def get_user_joined_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return groups_service.get_user_joined_groups(
        db=db,
        current_user=current_user,
    )
# ---

# Get Group Name
# ---
@router.get("/{group_id}/name")
def get_group_name(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return groups_service.get_group_name(
        db=db,
        group_id=group_id,
        current_user=current_user
	)
# ---

# Get Group Data
# ---
@router.get("/{group_id}")
def get_group_data(
    group_id: int,
    algorithm: str = "greedy",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return group_service.get_group_data(
        db=db,
        group_id=group_id,
        current_user=current_user,
        algorithm_name=algorithm,
	)
# ---

# Get Group Destinations
# ---
@router.get("/{group_id}/locations")
def get_group_destinations(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return group_service.get_group_destinations(
        db=db,
        group_id=group_id,
    )
# ---

# Search Group Destinations
# ---
@router.get("/{group_id}/locations/{display_name}")
def search_group_destinations(
    group_id: int,
    display_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return group_service.search_group_destinations(
        db=db,
        group_id=group_id,
        display_name=display_name,
    )
# ---

# Create Group
# ---
@router.post("/{group_name}/create")
def create_group(
    group_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return groups_service.create_group(
        db=db,
        current_user=current_user,
        group_name=group_name,
    )
# ---

# Add Location
# ---
@router.post("/{group_id}/location/add")
def add_location(
    group_id: int,
    location: LocationCreate,
    display_name: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return group_service.add_group_location(
        db=db,
        location=location,
        current_user=current_user,
        group_id=group_id,
        display_name=display_name,
    )
# ---

# Leave Group
# ---
@router.post("/{group_id}/leave")
def leave_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return group_service.leave_user_group_by_id(
        db=db,
        current_user=current_user,
        group_id=group_id,
    )
# ---

# Edit Member Roles
# ---
@router.put("/{group_name}/user/{user_name}/role")
def update_member_role(
    group_name: str,
    user_name: str,
    role: user_roles.UserRole,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return group_service.update_user_role(
        db=db,
        current_user=current_user,
        group_name=group_name,
        user_name=user_name,
        role=role,
    )
# ---

# Edit User Properties
# ---
@router.put("/{group_id}/user/properties")
def update_user_properties(
    group_id: int,
    car_capacity: int,
    is_passenger: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return group_service.update_user_group_data(
        db=db,
        current_user=current_user,
        group_id=group_id,
        car_capacity=car_capacity,
        is_passenger=is_passenger,
	)
# ---

# Remove Location
# ---
@router.delete("/{group_id}/location/delete")
def remove_location(
    group_id: int,
    location_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return group_service.remove_group_location(
        db=db,
        current_user=current_user,
        location_name=location_name,
        group_id=group_id,
    )
# ---

# Delete Group
# ---
@router.delete("/{group_id}/delete")
def delete_group(
    group_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return groups_service.delete_group(
        db=db,
        current_user=current_user,
        group_name=group_name,
    )
# ---

# Kick User from Group
# ---
@router.delete("/{group_id}/user/{username}")
def kick_user_from_group(
    group_id: int,
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return group_service.remove_group_user(
        db=db,
        current_user=current_user,
        group_id=group_id,
        username=username,
    )
# ---