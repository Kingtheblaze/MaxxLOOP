from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.core.auth_store import ensure_auth_indexes, get_auth_database, session_expiry
from app.core.config import settings
from app.core.database import get_session
from app.models.models import User
from sqlmodel import Session

password_hasher = PasswordHasher()
_dummy_password_hash = password_hasher.hash(secrets.token_urlsafe(32))


class AuthenticatedUser(BaseModel):
    id: str
    name: str
    email: EmailStr
    created_at: datetime

    def public_data(self) -> dict[str, str]:
        return {
            "id": self.id,
            "name": self.name,
            "email": str(self.email),
            "createdAt": self.created_at.isoformat(),
        }


def _auth_unavailable() -> HTTPException:
    return HTTPException(status_code=503, detail="Authentication storage is unavailable.")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _public_user(document: dict[str, Any]) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=str(document["_id"]),
        name=document["name"],
        email=document["email"],
        created_at=document["createdAt"],
    )


def create_account(name: str, email: str, password: str) -> AuthenticatedUser:
    try:
        database = get_auth_database()
        ensure_auth_indexes(database)
        normalized_email = _normalize_email(email)
        now = datetime.now(timezone.utc)
        document = {
            "_id": secrets.token_urlsafe(18),
            "name": name.strip(),
            "email": normalized_email,
            "passwordHash": password_hasher.hash(password),
            "createdAt": now,
            "updatedAt": now,
        }
        database.users.insert_one(document)
        return _public_user(document)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    except PyMongoError:
        raise _auth_unavailable()


def verify_credentials(email: str, password: str) -> AuthenticatedUser:
    try:
        database = get_auth_database()
        ensure_auth_indexes(database)
        document = database.users.find_one({"email": _normalize_email(email)})
        password_hash = document.get("passwordHash") if document else _dummy_password_hash
        try:
            password_hasher.verify(password_hash, password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        if document is None:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        return _public_user(document)
    except PyMongoError:
        raise _auth_unavailable()


def start_session(user: AuthenticatedUser) -> str:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    try:
        database = get_auth_database()
        ensure_auth_indexes(database)
        now = datetime.now(timezone.utc)
        database.sessions.insert_one({
            "_id": token_hash,
            "userId": user.id,
            "createdAt": now,
            "expiresAt": session_expiry(),
        })
        return token
    except PyMongoError:
        raise _auth_unavailable()


def end_session(token: str | None) -> None:
    if not token:
        return
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    try:
        get_auth_database().sessions.delete_one({"_id": token_hash})
    except PyMongoError:
        raise _auth_unavailable()


def get_current_user(request: Request) -> AuthenticatedUser:
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    try:
        database = get_auth_database()
        ensure_auth_indexes(database)
        session_doc = database.sessions.find_one({
            "_id": token_hash,
            "expiresAt": {"$gt": datetime.now(timezone.utc)},
        })
        user_doc = database.users.find_one({"_id": session_doc["userId"]}) if session_doc else None
        if not user_doc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
        return _public_user(user_doc)
    except PyMongoError:
        raise _auth_unavailable()


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.APP_ENV.lower() not in {"development", "dev", "local", "test"},
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        httponly=True,
        secure=settings.APP_ENV.lower() not in {"development", "dev", "local", "test"},
        samesite="lax",
        path="/",
    )


def get_current_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> User:
    """Return the SQLite preferences profile belonging to the signed-in account."""
    profile = session.get(User, current_user.id)
    if profile is None:
        profile = User(id=current_user.id, display_name=current_user.name)
        session.add(profile)
        session.commit()
        session.refresh(profile)
    elif profile.display_name != current_user.name:
        profile.display_name = current_user.name
        session.add(profile)
        session.commit()
    return profile
