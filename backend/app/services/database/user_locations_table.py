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
from app.models.user_location import User_Location
from app.models.location import Location
# ---

# Import Schemas
# ---
from app.schemas.user_location import UserLocationCreate
from app.schemas.location import LocationCreate
# ---

# Import Services
# ---

# ---

# Create User Location
# ---
def create_user_location(
    db: Session,
    user_location_create: UserLocationCreate,
) -> User_Location:
    pass
# ---