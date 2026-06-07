"""
Local development settings for Reserva.

This module keeps SQLite as the zero-config fallback, but uses a Postgres
database when DATABASE_URL or split DB_* credentials are present in backend/.env.
"""

import os
from urllib.parse import urlparse

from . import *  # noqa: F403,F401


def _database_from_url(database_url):
    database_url = database_url.strip().strip('"').strip("'")
    if database_url.startswith("railwaypostgresql://"):
        database_url = database_url.replace("railwaypostgresql://", "postgresql://", 1)

    parsed = urlparse(database_url)
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": parsed.path.lstrip("/"),
        "USER": parsed.username,
        "PASSWORD": parsed.password,
        "HOST": parsed.hostname,
        "PORT": parsed.port or 5432,
    }


if os.environ.get("DATABASE_URL"):
    DATABASES = {"default": _database_from_url(os.environ["DATABASE_URL"])}
elif os.environ.get("DB_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("DB_NAME"),
            "USER": os.environ.get("DB_USER"),
            "PASSWORD": os.environ.get("DB_PASSWORD"),
            "HOST": os.environ.get("DB_HOST", "localhost"),
            "PORT": os.environ.get("DB_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }
