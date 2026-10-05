# Base Imports
# ---
import importlib
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
from backend.app.models.location import Location
from backend.app.models.group_location import Group_Location
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
from backend.app.services.database import group_locations_table
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

# Get Group Data
# ---
ALGORITHMS = {
    "dijkstra": {
        "module": "app.algorithms.algoritm",
        "name": "Dijkstra + Mask",
    },
    "greedy": {
        "module": "app.algorithms.algorithm_greedy",
        "name": "Greedy Loops",
    },
    "ortools": {
        "module": "app.algorithms.algorithm_ortools",
        "name": "Optimized (Google OR-Tools)",
    },
}
def _get_algorithm_function(algorithm_name: str):
    """Resolve an algorithm key to its evaluate_destinations_with_osrm callable.

    Unknown keys fall back to the default Dijkstra implementation so the group
    data endpoint keeps working even when an unexpected value is supplied.
    """
    algorithm_key = algorithm_name.lower() if algorithm_name else "greedy"
    spec = ALGORITHMS.get(algorithm_key)

    if spec is None:
        algorithm_key = "greedy"
        spec = ALGORITHMS["greedy"]

    module = importlib.import_module(spec["module"])
    return algorithm_key, module.evaluate_destinations_with_osrm

def get_group_data(
    db: Session,
    current_user: User,
    group_id: int,
    algorithm_name: str = "greedy",
):
    try:
        # Is member
        # ---
        is_member: bool = user_groups_table.is_user_in_group(
            db=db,
            user_id=current_user.id,
            group_id=group_id,
        )
        # ---

        # Error if not member
        # ---
        if not is_member:
            raise HTTPException(
                status_code=403,
                detail="User is not a member of this group",
            )
        # ---

        # Calculate group data
        # ---
        users_data = db.execute(
            select(User, User_Group, Location)
            .join(User_Group, User.id == User_Group.user_id)
            .join(Location, Location.id == User.default_location_id) # Assume default location_id is the users location for now
            .where(User_Group.group_id == group_id)
        ).all()

        coords = db.execute(
            select(Group_Location, Location)
            .join(Group_Location, Location.id == Group_Location.location_id)
            .where(Group_Location.group_id == group_id)
        ).all()

        usernames = []
        starts_data = {}
        starts_capacities = {}
        passengers_data = {}
        destinations_data = {}
        passenger_count = 0
    
        for user, user_group, location in users_data:
            usernames.append(user.username)
            if user_group.is_passenger:
                passengers_data[user.username] = (location.latitude, location.longitude)
                passenger_count += 1
            else:
                starts_data[user.username] = (location.latitude, location.longitude)
                starts_capacities[user.username] = user_group.car_capacity
                passenger_count -= user_group.car_capacity
    
        for group_location, location in coords:
            destinations_data[group_location.display_name] = (location.latitude, location.longitude)
    
        routing_data = []
        selected_algorithm = algorithm_name.lower() if algorithm_name else "greedy"
        if selected_algorithm not in ALGORITHMS:
            selected_algorithm = "greedy"
    
        if starts_data and destinations_data and (passenger_count <= 0):
            try:
                _, evaluate_destinations = _get_algorithm_function(selected_algorithm)
                routing_data = evaluate_destinations(
                    starts_data=starts_data,
                    starting_capacities=starts_capacities,
                    passengers_data=passengers_data,
                    destinations_data=destinations_data,
                )
            except Exception as exc:
                routing_data = f"Algorithm '{selected_algorithm}' failed: {exc}"
        else:
            routing_data = "Input data for routing not valid"
    
        return {
            "users": [
                {
                    "user": {"username": u.username, "email": u.email},
                    "user_group": {"is_passenger": ug.is_passenger, "car_capacity": ug.car_capacity, "role": ug.role},
                    "location": {"latitude": loc.latitude, "longitude": loc.longitude}
                }
                for u, ug, loc in users_data
            ],
            "destinations": [
                {
                    "group_location": {"display_name": gl.display_name},
                    "location": {"latitude": loc.latitude, "longitude": loc.longitude}
                }
                for gl, loc in coords
            ],
            "algorithm": routing_data,
            "algorithm_name": selected_algorithm,
            "available_algorithms": [
                {"id": algorithm_id, "name": spec["name"]}
                for algorithm_id, spec in ALGORITHMS.items()
            ],
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=400,
            detail="Could not retrieve user group",
        )
# ---

# Get Group Destinations
# ---
def get_group_destinations(
    db: Session,
    current_user: User,
    group_id: int,
):
    # Check if user is apart of group
    # ---
    user_group = user_groups_table.get_user_group(
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

    # Get Group Destinations
    # ---
    group_destinations = group_locations_table.get_group_locations(
        db=db,
        group_id=group_id,
    )
    if group_destinations is None:
        raise HTTPException(
            status_code=404,
            detail="Group destinations not found",
        )
    # ---

    # Return
    # ---
    return group_destinations
    # ---
# ---

# Search Group Destinations
# ---
def search_group_destinations(
    db: Session,
    group_id: int,
    current_user: User,
    display_name: str,
):
    # Check if user is apart of group
    # ---
    user_group = user_groups_table.get_user_group(
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
    
    # Get Group Destinations
    # ---
    group_destinations = group_locations_table.get_group_locations(
        db=db,
        group_id=group_id,
        display_name=display_name,
    )
    if group_destinations is None:
        raise HTTPException(
            status_code=404,
            detail="Group destinations not found",
        )
    # ---
    
    # Return
    # ---
    return group_destinations
    # ---
# ---

# Create Group
# ---
def create_group(
    db: Session,
    current_user: User,
    group_name: str,
) -> str:
    try:
        #Check if group already exists
        # ---
        existing_group = groups_table.get_group(
            db=db,
            group_name=group_name,
        )

        if existing_group is not None:
            raise HTTPException(
                status_code=400,
                detail="Group already exists",
            )

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
        if group is None:
            raise HTTPException(
                status_code=404,
                detail="Group not found",
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