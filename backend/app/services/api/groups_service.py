# Base Imports
# ---
import importlib
from fastapi import Depends, HTTPException
from fastapi_pagination.ext.sqlalchemy import paginate
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
from app.models.user_group import User_Group
from app.models.location import Location
from app.models.group_location import Group_Location
from app.algorithms.algorithm_greedy import add_destination_to_group, delete_destination_from_group, refresh_group_ranking_after_input_overhaul
# ---

# Import Schemas
# ---
from app.schemas import user_roles
from app.schemas import user_group as user_group_schemas
from app.schemas.location import LocationCreate
# ---

# Import Services
# ---
from app.services.database import groups_table
from app.services.database import user_groups_table
from app.services.database import group_locations_table, users_table, locations_table
# ---

# Helper Functions
# ---
def _build_group_routing_inputs(
    db: Session,
    group_id: int,
    include_extra_data: bool = False,
):
    users_data = users_table.get_user_data(
        db=db,
        group_id=group_id,
    )

    coords = group_locations_table.get_location_data(
        db=db,
        group_id=group_id,
    )

    starts_data = {}
    starts_capacities = {}
    passengers_data = {}
    destinations_data = {}
    passenger_count = 0

    for user, user_group, location in users_data:
        if user_group.is_passenger:
            passengers_data[user.username] = (location.latitude, location.longitude)
            passenger_count += 1
        else:
            starts_data[user.username] = (location.latitude, location.longitude)
            starts_capacities[user.username] = user_group.car_capacity
            passenger_count -= user_group.car_capacity

    for group_location, location in coords:
        destinations_data[group_location.display_name] = (location.latitude, location.longitude)

    if include_extra_data:
        return users_data, coords, starts_data, starts_capacities, passengers_data, destinations_data, passenger_count
    return starts_data, starts_capacities, passengers_data, destinations_data, passenger_count

def refresh_group_ranking_cache(
    db: Session,
    group_id: int,
):
    starts_data, starts_capacities, passengers_data, destinations_data, passenger_count = _build_group_routing_inputs(
        db=db,
        group_id=group_id,
    )

    if not starts_data or not destinations_data or passenger_count > 0:
        destinations_data = {}

    return refresh_group_ranking_after_input_overhaul(
        group_id=group_id,
        starts_data=starts_data,
        starting_capacities=starts_capacities,
        passengers_data=passengers_data,
        destinations_data=destinations_data,
    )
# ---

# Get User Groups
# ---
def get_user_owned_groups(
    db: Session,
    current_user: User,
):
    return groups_table.get_user_groups(
        db=db,
        user_id=current_user.id,
        is_owned=True,
    )

def get_user_joined_groups(
    db: Session,
    current_user: User,
):
    return groups_table.get_user_groups(
        db=db,
        user_id=current_user.id,
        is_owned=False,
    )
# ---

# Get Group Name
# ---
def get_group_name(
    db: Session,
    group_id: int,
    current_user: User,
):
    # Check if user is apart of group
    # ---
    is_member: bool = user_groups_table.is_member_of_group(
        db=db,
        user_id=current_user.id,
        group_id=group_id,
    )

    if not is_member:
        raise HTTPException(
            status_code=403,
            detail="User is not a member of this group",
        )
    # ---

    # Get group
    # ---
    group = groups_table.get_group(
        db=db,
        group_id=group_id,
    )

    if group is None:
        raise HTTPException(
            status_code=404,
            detail="Group not found",
        )
    # ---

    # Return
    # ---
    return group.name
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
    if algorithm_key == "greedy":
        return algorithm_key, module.group_page_load_ranking
    else:
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
        is_member: bool = user_groups_table.is_member_of_group(
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
        users_data, coords, starts_data, starts_capacities, passengers_data, destinations_data, passenger_count = _build_group_routing_inputs(
            db=db,
            group_id=group_id,
            include_extra_data=True,
        )

        routing_data = []
        selected_algorithm = algorithm_name.lower() if algorithm_name else "greedy"
        if selected_algorithm not in ALGORITHMS:
            selected_algorithm = "greedy"
    
        if starts_data and destinations_data and (passenger_count <= 0):
            try:
                _, evaluate_destinations = _get_algorithm_function(selected_algorithm)
                routing_data = evaluate_destinations(
                    group_id=group_id,
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
        existing_group = groups_table.get_group_by_name(
            db=db,
            group_name=group_name,
        )

        if existing_group is not None:
            raise HTTPException(
                status_code=400,
                detail="Group already exists",
            )
        # ---

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

# Add Location to Group
# ---
def add_group_location(
    db: Session,
    current_user: User,
    group_id: int,
    location: LocationCreate,
    display_name: str,
):
    # Check if display name is provided
    # ---
    if display_name is None:
            raise HTTPException(
                status_code=400,
                detail="Display Name required"
            )
    # ---
    
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

    # Check permissions
    # ---
    if not user_roles.can_manage_locations(
        role=user_group.role,
    ):
        raise HTTPException(
            status_code=403,
            detail="Permission denied",
        )
    # ---

    # Create Location
    # ---
    location_id = locations_table.create_location(
        db=db,
        location=location,
    )
    # ---

    # Add Location to Group
    # ---
    group_location = group_locations_table.add_group_location(
        db=db,
        location_id=location_id,
        group_id=group_id,
        display_name=display_name,
    )
    # ---

    # Update Red-Black Tree Cache
    # ---
    starts_data, starts_capacities, passengers_data, destinations_data, passenger_count = _build_group_routing_inputs(
        db=db,
        group_id=group_id,
    )

    if not starts_data or not destinations_data or passenger_count > 0:
        refresh_group_ranking_cache(db=db, group_id=group_id)
        raise HTTPException(
            status_code=400,
            detail="Input data for routing not valid",
        )

    add_destination_to_group(
        group_id=group_id,
        new_dest=display_name,
        starts_data=starts_data,
        starting_capacities=starts_capacities,
        passengers_data=passengers_data,
        destinations_data=destinations_data,
    )
    # ---

    # Return
    # ---
    return group_location
    # ---
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
        group = groups_table.get_group(
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

# Update User Role
# ---
def update_user_role(
    db: Session,
    current_user: User,
    group_name: str,
    user_name: str,
    role: user_roles.UserRole,
) -> str:
    try:
        # Get Group
        # ---
        group_id: int = groups_table.get_group_id(
            db=db,
            group_name=group_name,
        )
        if group_id is None:
            raise HTTPException(
                status_code=404,
                detail="Group not found",
            )
        # ---

        # Get User
        # ---
        user_id: int = users_table.get_user_id(
            db=db,
            user_name=user_name,
        )
        if user_id is None:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )
        # ---

        # Get User Group
        # ---
        user_group: User_Group = user_groups_table.get_user_group(
            db=db,
            user_group_select=user_group_schemas.UserGroupSelect(
                group_id=group_id,
                user_id=user_id,
            )
        )
        if user_group is None:
            raise HTTPException(
                status_code=404,
                detail="User not in group",
            )
        # ---

        # Get Current User Group
        # ---
        current_user_group: User_Group = user_groups_table.get_user_group(
            db=db,
            user_group_select=user_group_schemas.UserGroupSelect(
                group_id=group_id,
                user_id=current_user.id,
            )
        )
        if current_user_group is None:
            raise HTTPException(
                status_code=404,
                detail="Current user not in group",
            )
        # ---

        # Check Current User Permissions
        # ---
        if not user_roles.can_manage_user(
            actor=current_user_group.role,
            target=user_group.role,
        ):
            raise HTTPException(
                status_code=403,
                detail="Permission denied",
            )
        # ---

        # Update User Role
        # ---
        return user_groups_table.update_user_role(
            db=db,
            user_group=user_group,
            role=role,
        )
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="User role was not updated",
        )
        # ---
# ---

# Update User Group Data
# ---
def update_user_group_data(
    db: Session,
    current_user: User,
    group_id: int,
    is_passenger: bool,
    car_capacity: int,
) -> str:
    try:
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

        # Update User Group Data
        # ---
        user_groups = user_groups_table.update_user_group_data(
            db=db,
            user_group=user_group,
            is_passenger=is_passenger,
            car_capacity=car_capacity,
        )
        # ---

        # Update Red-Black Tree Cache
        # ---
        refresh_group_ranking_cache(db=db, group_id=group_id)
        # ---

        # Return
        # ---
        return user_groups
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="User group data was not updated",
        )
        # ---

# Leave User Group by ID
# ---
def leave_user_group_by_id(
    db: Session,
    current_user: User,
    group_id: int,
) -> str:
    try:
        # Get Group
        # ---
        group: Group = groups_table.get_group(
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

        # Remove User from Group
        # ---
        user_groups = user_groups_table.remove_user(
            db=db,
            user_group=user_group,
        )
        # ---

        # Update Red-Black Tree Cache
        # ---
        refresh_group_ranking_cache(db=db, group_id=group_id)
        # ---

        # Return
        # ---
        return user_groups
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="User was not removed from group",
        )

# Delete location from group
# ---
def remove_group_location(
    db: Session,
    current_user: User,
    group_id: int,
    location_name: str,
) -> str:
    try:
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

        # Check if location exists in group
        # ---
        location = group_locations_table.get_group_locations(
            db=db,
            group_id=group_id,
            display_name=location_name,
        )
        if location is None:
            raise HTTPException(
                status_code=404,
                detail="Location not found in group",
            )
        # ---

        # Check permissions
        # ---
        if not user_roles.can_manage_locations(
            role=user_group.role,
        ):
            raise HTTPException(
                status_code=403,
                detail="Permission denied",
            )
        # ---

        # Remove Location from Group
        # ---
        group_location = group_locations_table.remove_group_location(
            db=db,
            group_id=group_id,
            display_name=location_name,
        )
        # ---

        # Update Red-Black Tree Cache
        # ---
        delete_destination_from_group(
            group_id=group_id,
            dest_id=location_name,
        )
        # ---

        # Return
        # ---
        return group_location
        # ---

    except SQLAlchemyError:
        # Database Error
        # ---
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Group location was not removed",
        )

# Remove user from group
# ---
def remove_group_user(
    db: Session,
    current_user: User,
    group_id: int,
    username: str,
) -> str:
    try:
        # Get Group
        # ---
        group: Group = groups_table.get_group(
            db=db,
            group_id=group_id,
        )
        if group is None:
            raise HTTPException(
                status_code=404,
                detail="Group not found",
            )
        # ---

        # Get User
        # ---
        user_id: int = users_table.get_user_id(
            db=db,
            user_name=username,
        )
        if user_id is None:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )
        # ---

        # Get User Group
        # ---
        user_group: User_Group = user_groups_table.get_user_group(
            db=db,
            user_group_select=user_group_schemas.UserGroupSelect(
                group_id=group_id,
                user_id=user_id,
            )
        )
        if user_group is None:
            raise HTTPException(
                status_code=404,
                detail="User not in group",
            )
        # ---

        # Get Current User Group
        # ---
        current_user_group: User_Group = user_groups_table.get_user_group(
            db=db,
            user_group_select=user_group_schemas.UserGroupSelect(
                group_id=group_id,
                user_id=current_user.id,
            )
        )
        if current_user_group is None:
            raise HTTPException(
                status_code=404,
                detail="Current user not in group",
            )
        # ---

        # Check Current User Permissions
        # ---
        if not user_roles.can_manage_user(
            actor=current_user_group.role,
            target=user_group.role,
        ):
            raise HTTPException(
                status_code=403,
                detail="Permission denied",
            )
        # ---

        # Remove User from Group
        # ---
        user_groups = user_groups_table.remove_user(
            db=db,
            user_group=user_group,
        )

        # Update Red-Black Tree Cache
        # ---
        refresh_group_ranking_cache(db=db, group_id=group_id)
        # ---

        # Return
        # ---
        return user_groups
        # ---

    except SQLAlchemyError:
            # Database Error
            # ---
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail="User was not removed from location",
            )