from app.core.database import normalize_database_url


def test_normalize_postgres_url_for_psycopg():
    assert normalize_database_url("postgres://user:pass@host/db") == (
        "postgresql+psycopg://user:pass@host/db"
    )
    assert normalize_database_url("postgresql://user:pass@host/db") == (
        "postgresql+psycopg://user:pass@host/db"
    )


def test_preserve_local_sqlite_url():
    assert normalize_database_url("sqlite:///./maxxloop.db") == "sqlite:///./maxxloop.db"