# Import External Libraries
# ---
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select, exists
from fastapi import HTTPException
# ---

# Import Local Libraries
# ---
from app.schemas.chat import MAX_MESSAGE_LENGTH
# ---

# Import Models
# ---
from app.models.chat_message import Chat_Message
from app.models.user import User
from app.models.user_group import User_Group
# ---

# Membership Check
# ---
def _ensure_group_member(
    db: Session,
    group_id: int,
    current_user: User,
) -> None:
    is_member = db.scalar(
        select(exists().where(
            User_Group.group_id == group_id,
            User_Group.user_id == current_user.id,
        ))
    )

    if not is_member:
        raise HTTPException(
            status_code=403,
            detail="User is not a member of this group",
        )
# ---

# Build Message Response
# ---
def _format_message(
    message: Chat_Message,
    username: str,
    role: str,
) -> dict:
    return {
        "id": message.id,
        "group_id": message.group_id,
        "user_id": message.user_id,
        "username": username,
        "role": role,
        "content": message.content,
        "created_at": message.created_at,
    }
# ---

# Get Group Messages
# ---
def get_group_messages(
    db: Session,
    group_id: int,
    current_user: User,
    after_id: int = 0,
    limit: int = 100,
):
    _ensure_group_member(
        db=db,
        group_id=group_id,
        current_user=current_user,
    )

    try:
        rows = db.execute(
            select(Chat_Message, User, User_Group)
            .join(User, User.id == Chat_Message.user_id)
            .join(
                User_Group,
                (User_Group.group_id == Chat_Message.group_id)
                & (User_Group.user_id == Chat_Message.user_id),
            )
            .where(
                Chat_Message.group_id == group_id,
                Chat_Message.id > after_id,
            )
            .order_by(Chat_Message.id.asc())
            .limit(limit)
        ).all()

        return [
            _format_message(
                message=message,
                username=user.username,
                role=user_group.role,
            )
            for message, user, user_group in rows
        ]
    except SQLAlchemyError:
        raise HTTPException(
            status_code=400,
            detail="Could not load chat messages",
        )
# ---

# Create Group Message
# ---
def create_group_message(
    db: Session,
    group_id: int,
    current_user: User,
    content: str,
):
    _ensure_group_member(
        db=db,
        group_id=group_id,
        current_user=current_user,
    )

    if not content.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    if len(content) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Message cannot be longer than {MAX_MESSAGE_LENGTH} characters",
        )

    user_group: User_Group = db.scalar(
        select(User_Group)
        .where(
            User_Group.group_id == group_id,
            User_Group.user_id == current_user.id,
        )
    )

    try:
        new_message = Chat_Message(
            group_id=group_id,
            user_id=current_user.id,
            content=content.strip(),
        )
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Could not save chat message",
        )

    return _format_message(
        message=new_message,
        username=current_user.username,
        role=user_group.role,
    )
# ---