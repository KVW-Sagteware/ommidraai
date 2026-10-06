# Imports
# ---
from fastapi import APIRouter
from app.api.dev.tables import router as tables_router
# ---

# Router Setup
# ---
router = APIRouter(
    prefix="/dev"
)
# ---

# Add Routers
# ---
router.include_router(tables_router)
# ---