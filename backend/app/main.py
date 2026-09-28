# Imports
# ---
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_pagination import add_pagination
from sqlalchemy import text
from app.database import engine
# --

# Router Imports
# ---
from app.api.auth import router as auth_router
from app.api.groups import router as group_router
from app.api.invite import router as invite_router
from app.api.user import router as user_router
from app.api.chat import router as chat_router
from app.api.dev.dev import router as dev_database_router
# ---

app = FastAPI()

# Enable CORSMiddleware
# ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---

# CORS
# ---
#app.add_middleware(
#    CORSMiddleware,
#    allow_origins=["*"],
#    allow_methods=["*"],
#    allow_headers=["*"],
#)
# ---

# Root Call
# ---
@app.get("/", tags=["Root"])
def root():
    return {"message": "Backend is running"}
# ---

# Routing
# ---
app.include_router(auth_router)
app.include_router(group_router)
app.include_router(invite_router)
app.include_router(user_router)
app.include_router(chat_router)
app.include_router(dev_database_router)
# ---

# Pagination
# ---
add_pagination(app)
# ---