"""Basic smoke tests for the OpenSpawn SDK."""

import pytest
from openspawn import OpenSpawn, TaskPriority, OpenSpawnError


def test_client_init():
    """Test client initialization."""
    client = OpenSpawn(api_url="https://api.example.com", org_id="test-org", api_key="test-key")
    assert client.api_url == "https://api.example.com"
    assert client.org_id == "test-org"
    assert client.api_key == "test-key"


def test_client_requires_org_id():
    """Test that operations requiring org_id fail when not set."""
    client = OpenSpawn(api_key="test-key")  # no org_id
    
    with pytest.raises(OpenSpawnError, match="org_id is required"):
        client.tasks.list()
