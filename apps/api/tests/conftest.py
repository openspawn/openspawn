import os
from collections.abc import AsyncGenerator
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture(autouse=True)
def _auth_mode_full():
    """Force AUTH_MODE=full for all tests.

    Auth gate tests verify that endpoints return 401 without credentials.
    With AUTH_MODE=none (the default for local dev), require_auth() returns
    a synthetic owner — breaking those assertions. Setting full mode ensures
    auth enforcement is tested correctly.

    Tests that specifically test mode=none behavior (e.g. test_auth_router.py)
    override this by patching get_settings() directly.
    """
    with patch.dict(os.environ, {"AUTH_MODE": "full"}):
        from importlib import reload

        import app.config

        reload(app.config)
        yield
        reload(app.config)


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient]:
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
