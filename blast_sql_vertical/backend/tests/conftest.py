"""Pytest fixtures for backend tests."""

import os

# Disable strict content validation for tests (lesson content may have encoding quirks)
os.environ.setdefault("STRICT_CONTENT_VALIDATION", "0")
import tempfile
from pathlib import Path

import pytest

# Use a temporary SQLite DB for tests
os.environ.setdefault("USER_DB_PATH", str(Path(tempfile.gettempdir()) / "blast_sql_test.db"))


@pytest.fixture(autouse=True)
def isolate_db():
    """Ensure test DB path is set before imports that touch user_db."""
    yield
