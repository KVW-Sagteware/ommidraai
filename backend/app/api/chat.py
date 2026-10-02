# Import External Libraries
# ---
from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy.orm import Session
# ---

# Import Local Libraries
# ---
from app.security import get_current_user
from app.database import get_db
from app.services import chat_service
# ---

# Import Models
# ---
from app.models.user import User
# ---

# Import Schemas
# ---
from app.schemas.chat import MessageCreate, MessageOut
# ---

# Router Setup
# ---
router = APIRouter(
    prefix="/groups/{group_id}/chat",
    tags=["Chat"],
)
# ---

# Get Group Messages
# ---
@router.get("/messages", response_model=list[MessageOut])
def get_group_messages(
    group_id: int,
    after_id: int = Query(default=0),
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.get_group_messages(
        db=db,
        group_id=group_id,
        current_user=current_user,
        after_id=after_id,
        limit=limit,
    )
# ---

# Send Group Message
# ---
@router.post("/messages", response_model=MessageOut)
def send_group_message(
    group_id: int,
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.create_group_message(
        db=db,
        group_id=group_id,
        current_user=current_user,
        content=message.content,
    )
# ---