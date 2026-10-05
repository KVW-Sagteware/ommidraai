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
from app.models.user_location import User_Location
# ---

# Import Schemas
# ---
from app.schemas.user_location import UserLocationResponse
# ---

# Import Services
# ---
from app.services.database import users_table
# ---

# Get User Locations
# ---
def get_current_user_locations(
    db: Session,
    user_id: int,
) -> List[UserLocationResponse]:
    try:
        # Get User Locations
        # ---
        user_locations: List[User_Location] = None
        # ---
# ---