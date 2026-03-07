"""HTTP client for calling the OpenSpawn API with HMAC or API key auth."""

from __future__ import annotations

import hashlib
import hmac
import os
import time
import uuid

import httpx


class ApiClient:
    """Authenticated HTTP client for the OpenSpawn API."""

    def __init__(
        self,
        base_url: str | None = None,
        api_key: str | None = None,
        agent_id: str | None = None,
        agent_secret: str | None = None,
    ) -> None:
        self.base_url = (
            base_url
            or os.environ.get("OPENSPAWN_API_URL")
            or os.environ.get("API_URL")
            or "http://localhost:3000"
        )
        self.api_key = api_key or os.environ.get("OPENSPAWN_API_KEY")
        self.agent_id = (
            agent_id or os.environ.get("OPENSPAWN_AGENT_ID") or os.environ.get("AGENT_ID")
        )
        self.agent_secret = (
            agent_secret
            or os.environ.get("OPENSPAWN_AGENT_SECRET")
            or os.environ.get("AGENT_SECRET")
        )
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    def _hmac_headers(self, method: str, path: str, body: str = "") -> dict[str, str]:
        if not self.agent_id or not self.agent_secret:
            return {}
        timestamp = str(int(time.time()))
        nonce = uuid.uuid4().hex
        message = f"{method}{path}{timestamp}{nonce}{body}"
        signature = hmac.new(
            self.agent_secret.encode(), message.encode(), hashlib.sha256
        ).hexdigest()
        return {
            "X-Agent-Id": self.agent_id,
            "X-Timestamp": timestamp,
            "X-Nonce": nonce,
            "X-Signature": signature,
        }

    def _auth_headers(self, method: str, path: str, body: str = "") -> dict[str, str]:
        if self.api_key:
            return {"Authorization": f"Bearer {self.api_key}"}
        return self._hmac_headers(method, path, body)

    async def get(self, path: str, params: dict | None = None) -> dict:
        headers = self._auth_headers("GET", path)
        r = await self._client.get(path, params=params, headers=headers)
        r.raise_for_status()
        return r.json()

    async def post(self, path: str, json: dict | None = None) -> dict:
        import json as json_lib

        body_str = json_lib.dumps(json) if json else ""
        headers = self._auth_headers("POST", path, body_str)
        r = await self._client.post(path, json=json, headers=headers)
        r.raise_for_status()
        return r.json()

    async def close(self) -> None:
        await self._client.aclose()
