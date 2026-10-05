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
from app.models.location import Location
# ---

# Import Schemas
# ---
from app.schemas.location import LocationCreate
# ---

# Create Location
# ---
def create_location(
    db: Session,
    location: LocationCreate,
) -> Location:
    try:
        pass
    except:
        pass
# ---