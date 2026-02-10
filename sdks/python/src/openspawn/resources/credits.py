"""Credits resource module."""

from typing import Any, Optional

from openspawn.http_client import AsyncHTTPClient, SyncHTTPClient
from openspawn.models import CreditTransaction, TransferCreditsRequest


class CreditsResource:
    """Synchronous credits resource."""

    def __init__(self, client: SyncHTTPClient) -> None:
        self._client = client

    def balance(self) -> int:
        """
        Get current agent's credit balance.

        Returns:
            Current balance
        """
        response = self._client.request("GET", "/credits/balance")
        return response["data"]

    def transfer(self, request: TransferCreditsRequest) -> CreditTransaction:
        """
        Transfer credits to another agent.

        Args:
            request: Transfer request

        Returns:
            Credit transaction
        """
        response = self._client.request(
            "POST",
            "/agents/credits/transfer",
            json_data=request.model_dump(by_alias=True),
            idempotent=True,
        )
        return CreditTransaction(**response["data"])

    def history(
        self, *, limit: int = 50, offset: int = 0
    ) -> tuple[list[CreditTransaction], dict[str, Any]]:
        """
        Get credit transaction history for current agent.

        Args:
            limit: Maximum number of transactions to return
            offset: Number of transactions to skip

        Returns:
            Tuple of (transactions list, metadata dict)
        """
        response = self._client.request(
            "GET",
            "/credits/history",
            params={"limit": str(limit), "offset": str(offset)},
        )
        transactions = [CreditTransaction(**tx) for tx in response["data"]]
        return transactions, response.get("meta", {})

    def spend(
        self,
        amount: int,
        reason: str,
        *,
        trigger_type: Optional[str] = None,
        source_task_id: Optional[str] = None,
        source_agent_id: Optional[str] = None,
    ) -> CreditTransaction:
        """
        Spend credits (record a debit transaction).

        Args:
            amount: Amount to spend
            reason: Reason for spending
            trigger_type: Type of trigger
            source_task_id: Related task ID
            source_agent_id: Related agent ID

        Returns:
            Credit transaction
        """
        response = self._client.request(
            "POST",
            "/credits/spend",
            json_data={
                "amount": amount,
                "reason": reason,
                "triggerType": trigger_type,
                "sourceTaskId": source_task_id,
                "sourceAgentId": source_agent_id,
            },
            idempotent=True,
        )
        return CreditTransaction(**response["data"])


class AsyncCreditsResource:
    """Asynchronous credits resource."""

    def __init__(self, client: AsyncHTTPClient) -> None:
        self._client = client

    async def balance(self) -> int:
        """
        Get current agent's credit balance.

        Returns:
            Current balance
        """
        response = await self._client.request("GET", "/credits/balance")
        return response["data"]

    async def transfer(self, request: TransferCreditsRequest) -> CreditTransaction:
        """
        Transfer credits to another agent.

        Args:
            request: Transfer request

        Returns:
            Credit transaction
        """
        response = await self._client.request(
            "POST",
            "/agents/credits/transfer",
            json_data=request.model_dump(by_alias=True),
            idempotent=True,
        )
        return CreditTransaction(**response["data"])

    async def history(
        self, *, limit: int = 50, offset: int = 0
    ) -> tuple[list[CreditTransaction], dict[str, Any]]:
        """
        Get credit transaction history for current agent.

        Args:
            limit: Maximum number of transactions to return
            offset: Number of transactions to skip

        Returns:
            Tuple of (transactions list, metadata dict)
        """
        response = await self._client.request(
            "GET",
            "/credits/history",
            params={"limit": str(limit), "offset": str(offset)},
        )
        transactions = [CreditTransaction(**tx) for tx in response["data"]]
        return transactions, response.get("meta", {})

    async def spend(
        self,
        amount: int,
        reason: str,
        *,
        trigger_type: Optional[str] = None,
        source_task_id: Optional[str] = None,
        source_agent_id: Optional[str] = None,
    ) -> CreditTransaction:
        """
        Spend credits (record a debit transaction).

        Args:
            amount: Amount to spend
            reason: Reason for spending
            trigger_type: Type of trigger
            source_task_id: Related task ID
            source_agent_id: Related agent ID

        Returns:
            Credit transaction
        """
        response = await self._client.request(
            "POST",
            "/credits/spend",
            json_data={
                "amount": amount,
                "reason": reason,
                "triggerType": trigger_type,
                "sourceTaskId": source_task_id,
                "sourceAgentId": source_agent_id,
            },
            idempotent=True,
        )
        return CreditTransaction(**response["data"])
