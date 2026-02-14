"""Unit tests for domain types."""

from app.types import (
    ACPMessage,
    ACPType,
    AgentRole,
    AgentStats,
    AgentStatus,
    SandboxAgent,
    SandboxTask,
    TaskPriority,
    TaskStatus,
    TriggerMode,
)


class TestACPMessage:
    def test_creates_with_defaults(self):
        msg = ACPMessage(type=ACPType.ACK, **{"from": "agent-a"}, to="agent-b")
        assert msg.id.startswith("acp-")
        assert msg.type == ACPType.ACK
        assert msg.from_agent == "agent-a"
        assert msg.to == "agent-b"
        assert msg.task_id == ""
        assert msg.timestamp > 0

    def test_creates_with_all_fields(self):
        msg = ACPMessage(
            type=ACPType.ESCALATION,
            **{"from": "worker-1"},
            to="lead-1",
            taskId="TASK-0001",
            body="Blocked on dependency",
            reason="BLOCKED",
            pct=30,
        )
        assert msg.task_id == "TASK-0001"
        assert msg.reason == "BLOCKED"
        assert msg.pct == 30


class TestSandboxAgent:
    def test_default_stats(self):
        agent = SandboxAgent(id="test", name="Test", role=AgentRole.WORKER, level=4, domain="Engineering")
        assert agent.stats.tasks_completed == 0
        assert agent.stats.credits_earned == 0
        assert agent.status == AgentStatus.ACTIVE
        assert agent.trigger == TriggerMode.POLLING
        assert agent.inbox == []
        assert agent.task_ids == []

    def test_all_roles_valid(self):
        for role in AgentRole:
            agent = SandboxAgent(id=f"test-{role.value}", name=f"Test {role.value}", role=role, level=1, domain="Test")
            assert agent.role == role


class TestSandboxTask:
    def test_defaults(self):
        task = SandboxTask(id="TASK-0001", title="Fix bug")
        assert task.status == TaskStatus.BACKLOG
        assert task.priority == TaskPriority.NORMAL
        assert task.assignee_id is None
        assert task.acked is False
        assert task.activity_log == []

    def test_all_statuses(self):
        for status in TaskStatus:
            task = SandboxTask(id="t", title="t", status=status)
            assert task.status == status

    def test_all_priorities(self):
        for priority in TaskPriority:
            task = SandboxTask(id="t", title="t", priority=priority)
            assert task.priority == priority
