from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pymongo.errors import PyMongoError

from app.core.auth import (
    AuthenticatedUser,
    clear_session_cookie,
    create_account,
    end_session,
    get_current_user,
    set_session_cookie,
    start_session,
    verify_credentials,
)
from app.core.auth_store import get_auth_database
from app.core.config import settings
from app.models.auth_schemas import LoginRequest, SignUpRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(body: SignUpRequest, response: Response):
    user = create_account(body.name, str(body.email), body.password)
    token = start_session(user)
    set_session_cookie(response, token)
    return {"user": user.public_data()}


@router.post("/login")
def login(body: LoginRequest, response: Response):
    user = verify_credentials(str(body.email), body.password)
    token = start_session(user)
    set_session_cookie(response, token)
    return {"user": user.public_data()}


@router.post("/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    end_session(token)
    clear_session_cookie(response)
    return {"status": "signed_out"}


@router.get("/me")
def current_user(user: AuthenticatedUser = Depends(get_current_user)):
    return {"user": user.public_data()}
