# Imports
# ---
from datetime import datetime
from pydantic import BaseModel, Field
# ---

# Constants
# ---
MAX_MESSAGE_LENGTH = 255
# ---

# Classes
# ---
class MessageCreate(BaseModel):
    content: str = Field(
        min_length=1,
        max_length=MAX_MESSAGE_LENGTH,
    )

# ---

class MessageOut(BaseModel):
    id: int
    group_id: int
    user_id: int
    username: str
    role: str
    content: str
    created_at: datetime
# ---