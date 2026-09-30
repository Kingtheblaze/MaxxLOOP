from __future__ import annotations

from datetime import datetime, timedelta, timezone
from threading import Lock

from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import settings

SESSION_DAYS = 7
_client: MongoClient | None = None
_database: Database | None = None
_index_lock = Lock()
_indexes_ready = False


def get_auth_database() -> Database:
    """Connect lazily so non-auth endpoints such as health remain available."""
    global _client, _database
    if _database is None:
        if _client is None:
            _client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1500,
                connectTimeoutMS=1500,
            )
        _client.admin.command("ping")
        _database = _client[settings.MONGODB_DATABASE]
    return _database


def ensure_auth_indexes(database: Database) -> None:
    global _indexes_ready
    if _indexes_ready:
        return
    with _index_lock:
        if not _indexes_ready:
            database.users.create_index("email", unique=True, name="unique_normalized_email")
            database.sessions.create_index("expiresAt", expireAfterSeconds=0, name="expire_sessions")
            database.sessions.create_index("userId", name="sessions_by_user")
            _indexes_ready = True


def session_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
