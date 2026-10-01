import os

from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

def normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return "postgresql+psycopg://" + database_url.removeprefix("postgres://")
    if database_url.startswith("postgresql://"):
        return "postgresql+psycopg://" + database_url.removeprefix("postgresql://")
    return database_url


database_url = normalize_database_url(settings.DATABASE_URL)
if os.getenv("VERCEL") and database_url.startswith("sqlite"):
    raise RuntimeError("Set DATABASE_URL to hosted PostgreSQL for Vercel deployments.")

is_sqlite = database_url.startswith("sqlite")
engine_options = {"echo": False}
if is_sqlite:
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    engine_options.update(pool_pre_ping=True, pool_size=1, max_overflow=0)

engine = create_engine(database_url, **engine_options)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
