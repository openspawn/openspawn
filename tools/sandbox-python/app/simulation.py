"""Deterministic simulation engine — rule-based agent behavior, zero LLM calls."""

from __future__ import annotations

import asyncio
import random
import time
from typing import Callable

from .agents import make_agent
from .types import (
    ACPMessage,
    ACPType,
    AgentRole,
    AgentStats,
    AgentStatus,
    MetricsSnapshot,
    SandboxAgent,
    SandboxEvent,
    SandboxTask,
    TaskPriority,
    TaskStatus,
    TriggerMode,
    _acp_id,
    _now_ms,
)


# ── Domain keyword matching ──────────────────────────────────────────────────

DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "engineering": ["api", "backend", "frontend", "architecture", "code", "build", "develop", "bug", "fix", "deploy", "test", "database", "server", "sdk", "infrastructure"],
    "marketing": ["landing", "campaign", "blog", "seo", "brand", "launch", "content", "social", "press", "announce", "outreach", "website"],
    "finance": ["pricing", "projection", "revenue", "budget", "invoice", "financial", "cost", "billing", "model", "forecast", "report"],
    "sales": ["demo", "lead", "outreach", "pipeline", "prospect", "deal", "contract", "enterprise", "cold"],
    "support": ["ticket", "support", "customer", "help", "resolve", "backlog", "issue"],
    "hr": ["onboard", "hire", "recruit", "team", "culture", "training"],
    "security": ["security", "audit", "vulnerability", "pen-test", "compliance", "appsec"],
}


def detect_domain(text: str) -> str:
    lower = text.lower()
    best_domain, best_score = "engineering", 0
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = sum(1 for k in keywords if k in lower)
        if score > best_score:
            best_score = score
            best_domain = domain
    return best_domain


def detect_domains(text: str) -> list[str]:
    lower = text.lower()
    scored = []
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = sum(1 for k in keywords if k in lower)
        if score > 0:
            scored.append((domain, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return [d for d, _ in scored] if scored else ["engineering"]


def parse_order_into_tasks(order: str) -> list[dict]:
    """Parse a human order into discrete task definitions."""
    import re

    tasks: list[dict] = []

    # Numbered list: "1) ... 2) ..."
    for m in re.finditer(r"\d+\)\s*([^.!?\d]+(?:[.!?]|$))", order, re.IGNORECASE):
        clean = m.group(1).strip().rstrip(".!?").strip()
        if len(clean) > 5:
            tasks.append({"title": clean, "domain": detect_domain(clean), "priority": "high"})

    # Bullet points
    for m in re.finditer(r"[-•]\s+([^\n]+)", order):
        clean = m.group(1).strip()
        if len(clean) > 5 and not any(clean.lower()[:20] in t["title"].lower() for t in tasks):
            tasks.append({"title": clean, "domain": detect_domain(clean), "priority": "high"})

    if not tasks:
        domains = detect_domains(order)
        if len(domains) > 1:
            for d in domains:
                tasks.append({"title": f"{d.capitalize()} work for: {order[:60]}", "domain": d, "priority": "high"})
        else:
            tasks.append({"title": order[:100], "domain": domains[0], "priority": "high"})

    return tasks


# ── Flavor text ──────────────────────────────────────────────────────────────

DELEGATION_FLAVORS = [
    lambda task, to: f'{to}, I\'m assigning "{task}" to you. Make it happen.',
    lambda task, to: f'Hey {to}, take ownership of "{task}". Report back when done.',
    lambda task, to: f'{to} — "{task}" is yours. Priority.',
    lambda task, to: f'Delegating "{task}" to {to}. Let me know if you hit blockers.',
]
PROGRESS_FLAVORS = [
    lambda task: f'Making progress on "{task}". About halfway through.',
    lambda task: f'"{task}" — moving along. Found a good approach.',
    lambda task: f'Update: "{task}" is coming together nicely.',
]
COMPLETION_FLAVORS = [
    lambda task: f'Done with "{task}". Ready for review.',
    lambda task: f'"{task}" is complete. Everything checks out.',
    lambda task: f'Wrapped up "{task}". Moving on to the next one.',
]
ESCALATION_FLAVORS = [
    lambda task, reason: f'Blocked on "{task}": {reason}. Need your input.',
    lambda task, reason: f'Can\'t proceed with "{task}" — {reason}. Escalating.',
]
HIRE_FLAVORS = [
    lambda name, domain: f"Bringing on {name} for {domain}. They'll be a great fit.",
    lambda name, domain: f"Hired {name} to handle {domain} work.",
]
BLOCKED_REASONS = ["Missing requirements", "Dependency not ready", "Need clarification", "Waiting on external service"]


# ── Seed tasks ───────────────────────────────────────────────────────────────

_task_counter = 0


def _next_task_id() -> str:
    global _task_counter
    _task_counter += 1
    return f"TASK-{_task_counter:04d}"


def create_seed_tasks() -> list[SandboxTask]:
    seeds = [
        ("Fix Safari login crash", "Reproduce and fix.", TaskPriority.CRITICAL),
        ("Q1 financial report", "Compile Q1 revenue, expenses, and projections.", TaskPriority.HIGH),
        ("Launch blog post for v2.0", "Write and publish announcement post.", TaskPriority.HIGH),
        ("Onboard 3 new agents", "Process onboarding for recently approved agents.", TaskPriority.NORMAL),
        ("Resolve ticket backlog", "47 unresolved support tickets from last week.", TaskPriority.HIGH),
        ("Enterprise demo prep", "Prepare demo environment for Acme Corp eval.", TaskPriority.CRITICAL),
        ("Add rate limiting to API", "Implement token bucket rate limiter.", TaskPriority.HIGH),
        ("SEO audit for docs site", "Run full SEO audit on docs.", TaskPriority.NORMAL),
        ("Update pricing page", "Refresh pricing page with new tiers.", TaskPriority.NORMAL),
        ("Automate invoice generation", "Script monthly invoice generation.", TaskPriority.NORMAL),
        ("Write E2E tests for dashboard", "Cover critical flows.", TaskPriority.HIGH),
        ("Cold outreach campaign", "Launch email campaign to 200 leads.", TaskPriority.NORMAL),
    ]
    now = _now_ms()
    return [
        SandboxTask(id=_next_task_id(), title=t, description=d, priority=p, creator_id="mr-krabs", created_at=now, updated_at=now)
        for t, d, p in seeds
    ]


# ── Helpers ──────────────────────────────────────────────────────────────────


def _push_message(agents: list[SandboxAgent], msg: ACPMessage) -> None:
    for agent in agents:
        if agent.id in (msg.from_agent, msg.to):
            agent.recent_messages.append(msg)
            if len(agent.recent_messages) > 10:
                agent.recent_messages = agent.recent_messages[-10:]
        if agent.id == msg.to and agent.trigger == TriggerMode.EVENT_DRIVEN:
            if not agent.trigger_on or msg.type in agent.trigger_on:
                agent.inbox.append(msg)


def _make_acp(type: ACPType, from_agent: str, to: str, task_id: str = "", **extra) -> ACPMessage:
    return ACPMessage(id=_acp_id(), type=type, **{"from": from_agent}, to=to, taskId=task_id, timestamp=_now_ms(), **extra)


# ── Simulation ───────────────────────────────────────────────────────────────


class Simulation:
    """Deterministic tick-based multi-agent simulation."""

    def __init__(self, agents: list[SandboxAgent], tick_interval_ms: int = 5000):
        self.agents = agents
        self.tasks: list[SandboxTask] = []
        self.events: list[SandboxEvent] = []
        self.tick = 0
        self.tick_interval_ms = tick_interval_ms
        self.metrics_history: list[MetricsSnapshot] = []
        self._sse_listeners: list[Callable[[SandboxEvent], None]] = []
        self._pending_hires: list[str] = []
        self._pending_tasks: list[dict] = []
        self._spawn_queue: list[SandboxAgent] = []
        self._running = False

        # Staggered spawn: only COO starts active
        coo = next((a for a in agents if a.role == AgentRole.COO or a.level >= 9), None)
        others = [a for a in agents if a is not coo]
        random.shuffle(others)
        for a in others:
            a.status = AgentStatus.PENDING
        self._spawn_queue = others

        self._log("🌊 BikiniBottom Sandbox started (FastAPI + deterministic)")
        self._log(f"   {len(agents)} agents | tick interval: {tick_interval_ms}ms")

    # ── Event system ─────────────────────────────────────────────────────

    def _log(self, msg: str) -> None:
        event = SandboxEvent(type="system", message=msg)
        self.events.append(event)
        self._emit(event)
        print(msg)

    def _log_agent(self, agent: SandboxAgent, msg: str, task_id: str | None = None) -> None:
        event = SandboxEvent(type="agent_action", agent_id=agent.id, task_id=task_id, message=msg)
        self.events.append(event)
        self._emit(event)

    def _emit(self, event: SandboxEvent) -> None:
        for listener in self._sse_listeners:
            try:
                listener(event)
            except Exception:
                pass

    def on_event(self, callback: Callable[[SandboxEvent], None]) -> Callable[[], None]:
        self._sse_listeners.append(callback)
        return lambda: self._sse_listeners.remove(callback)

    # ── Order processing ─────────────────────────────────────────────────

    def process_order(self, order: str) -> None:
        coo = next((a for a in self.agents if a.role == AgentRole.COO or a.level >= 9), None)
        if not coo:
            return

        self._log_agent(coo, f'📢 Received order: "{order[:80]}..."')
        task_defs = parse_order_into_tasks(order)
        self._log_agent(coo, f"📋 Parsed {len(task_defs)} tasks from order")

        needed_domains = list({t["domain"] for t in task_defs})
        existing_lead_domains = {
            a.domain.lower() for a in self.agents if a.role == AgentRole.LEAD and a.parent_id == coo.id
        }
        for domain in needed_domains:
            if domain not in existing_lead_domains:
                self._pending_hires.append(domain)

        self._pending_tasks.extend(task_defs)

    # ── Tick logic ───────────────────────────────────────────────────────

    def _tick_coo(self, coo: SandboxAgent) -> None:
        # Hire pending leads
        if self._pending_hires:
            domain = self._pending_hires.pop(0)
            name = f"{domain.capitalize()} Lead"
            aid = name.lower().replace(" ", "-")
            if not any(a.id == aid for a in self.agents):
                new_agent = make_agent(aid, name, AgentRole.LEAD, 7, domain, coo.id, f"{domain} department lead")
                self.agents.append(new_agent)
                self._log_agent(coo, f'🐣 Hired "{name}" (L7 {domain} lead)')
                msg = _make_acp(ACPType.DELEGATION, coo.id, new_agent.id, body=random.choice(HIRE_FLAVORS)(name, domain))
                _push_message(self.agents, msg)
                coo.stats.messages_sent += 1
            return

        # Create and delegate pending tasks
        if self._pending_tasks:
            task_def = self._pending_tasks.pop(0)
            task = SandboxTask(
                id=_next_task_id(),
                title=task_def["title"],
                description=task_def["title"],
                priority=TaskPriority(task_def["priority"]),
                creator_id=coo.id,
            )
            self.tasks.append(task)

            lead = next(
                (a for a in self.agents if a.parent_id == coo.id and a.domain.lower().startswith(task_def["domain"])),
                next((a for a in self.agents if a.parent_id == coo.id and a.role == AgentRole.LEAD), None),
            )
            if lead:
                task.assignee_id = lead.id
                task.status = TaskStatus.ASSIGNED
                lead.task_ids.append(task.id)

                delegation_msg = _make_acp(
                    ACPType.DELEGATION, coo.id, lead.id, task.id,
                    body=random.choice(DELEGATION_FLAVORS)(task.title, lead.name),
                )
                _push_message(self.agents, delegation_msg)
                task.activity_log.append(delegation_msg)

                ack = _make_acp(ACPType.ACK, lead.id, coo.id, task.id, body=f'Acknowledged: "{task.title}"')
                _push_message(self.agents, ack)
                task.activity_log.append(ack)
                task.acked = True

                self._log_agent(coo, f'📋 Created & delegated "{task.title}" → {lead.name}', task.id)
                coo.stats.messages_sent += 1
            else:
                self._log_agent(coo, f'📝 Created "{task.title}" (no lead available yet)', task.id)

    def _tick_lead(self, lead: SandboxAgent) -> None:
        my_tasks = [t for t in self.tasks if t.assignee_id == lead.id and t.status in (TaskStatus.ASSIGNED, TaskStatus.BACKLOG)]
        for task in my_tasks:
            workers = [a for a in self.agents if a.parent_id == lead.id and a.role in (AgentRole.WORKER, AgentRole.SENIOR, AgentRole.INTERN)]
            available = next(
                (w for w in workers if sum(1 for t in self.tasks if t.assignee_id == w.id and t.status not in (TaskStatus.DONE, TaskStatus.REJECTED)) < 2),
                None,
            )
            if available:
                task.assignee_id = available.id
                task.status = TaskStatus.ASSIGNED
                available.task_ids.append(task.id)

                msg = _make_acp(ACPType.DELEGATION, lead.id, available.id, task.id, body=random.choice(DELEGATION_FLAVORS)(task.title, available.name))
                _push_message(self.agents, msg)
                task.activity_log.append(msg)
                lead.stats.messages_sent += 1
                self._log_agent(lead, f'📋 Assigned "{task.title}" → {available.name}', task.id)
            elif len(workers) < 3:
                # Hire a worker
                name = f"{lead.domain} Worker {len(workers) + 1}"
                aid = name.lower().replace(" ", "-")
                if not any(a.id == aid for a in self.agents):
                    new_agent = make_agent(aid, name, AgentRole.WORKER, 4, lead.domain, lead.id)
                    self.agents.append(new_agent)
                    self._log_agent(lead, f"👥 Hired {new_agent.name}")
                break

    def _tick_worker(self, worker: SandboxAgent) -> None:
        my_tasks = [
            t for t in self.tasks
            if t.assignee_id == worker.id and t.status not in (TaskStatus.DONE, TaskStatus.REJECTED, TaskStatus.BACKLOG, TaskStatus.BLOCKED)
        ]
        for task in my_tasks:
            ticks_per_stage = 2 if task.priority == TaskPriority.CRITICAL else 3 if task.priority == TaskPriority.HIGH else 4
            if task._stage_tick_count < ticks_per_stage:
                task._stage_tick_count += 1
                continue

            task._stage_tick_count = 0
            parent = next((a for a in self.agents if a.id == worker.parent_id), None)

            if task.status == TaskStatus.ASSIGNED:
                task.status = TaskStatus.IN_PROGRESS
                task.updated_at = _now_ms()
                if parent:
                    msg = _make_acp(ACPType.PROGRESS, worker.id, parent.id, task.id, body=random.choice(PROGRESS_FLAVORS)(task.title), pct=30)
                    _push_message(self.agents, msg)
                    task.activity_log.append(msg)
                    worker.stats.messages_sent += 1
                self._log_agent(worker, f'🔨 Working on "{task.title}" → in_progress', task.id)

            elif task.status == TaskStatus.IN_PROGRESS:
                if random.random() < 0.10:
                    task.status = TaskStatus.BLOCKED
                    task.blocked_reason = random.choice(BLOCKED_REASONS)
                    task.updated_at = _now_ms()
                    if parent:
                        msg = _make_acp(ACPType.ESCALATION, worker.id, parent.id, task.id, reason="BLOCKED", body=random.choice(ESCALATION_FLAVORS)(task.title, task.blocked_reason))
                        _push_message(self.agents, msg)
                        task.activity_log.append(msg)
                        worker.stats.messages_sent += 1
                    self._log_agent(worker, f'⬆️ Escalated "{task.title}": {task.blocked_reason}', task.id)
                else:
                    task.status = TaskStatus.REVIEW
                    task.updated_at = _now_ms()
                    if parent:
                        msg = _make_acp(ACPType.PROGRESS, worker.id, parent.id, task.id, body=f'"{task.title}" ready for review', pct=80)
                        _push_message(self.agents, msg)
                        task.activity_log.append(msg)
                    self._log_agent(worker, f'📝 "{task.title}" → review', task.id)

            elif task.status == TaskStatus.REVIEW:
                task.status = TaskStatus.DONE
                task.updated_at = _now_ms()
                worker.stats.tasks_completed += 1
                reward = {TaskPriority.CRITICAL: 100, TaskPriority.HIGH: 50}.get(task.priority, 25)
                worker.stats.credits_earned += reward
                if parent:
                    msg = _make_acp(ACPType.COMPLETION, worker.id, parent.id, task.id, summary=random.choice(COMPLETION_FLAVORS)(task.title), body=f'Completed: "{task.title}"')
                    _push_message(self.agents, msg)
                    task.activity_log.append(msg)
                    worker.stats.messages_sent += 1
                self._log_agent(worker, f'✅ Completed "{task.title}"', task.id)

    def _tick_unblock(self, manager: SandboxAgent) -> None:
        blocked = [t for t in self.tasks if t.status == TaskStatus.BLOCKED and (t.creator_id == manager.id or t.assignee_id == manager.id)]
        for task in blocked:
            if task._blocked_ticks >= 3:
                task.status = TaskStatus.IN_PROGRESS
                task.blocked_reason = None
                task._blocked_ticks = 0
                task._stage_tick_count = 0
                self._log_agent(manager, f'🔓 Unblocked "{task.title}"', task.id)
            else:
                task._blocked_ticks += 1

    async def run_tick(self) -> None:
        self.tick += 1

        # Staggered spawn
        for _ in range(min(2, len(self._spawn_queue))):
            agent = self._spawn_queue.pop(0)
            agent.status = AgentStatus.ACTIVE
            self._log(f"✨ {agent.name} has joined the organization")

        done = sum(1 for t in self.tasks if t.status == TaskStatus.DONE)
        active = sum(1 for t in self.tasks if t.status != TaskStatus.DONE and t.status != TaskStatus.REJECTED)
        print(f"\n{'═' * 60}\n🕐 TICK {self.tick}  |  Agents: {len(self.agents)}  |  Tasks: {len(self.tasks)} ({done} done, {active} active)\n{'═' * 60}")

        sorted_agents = sorted(
            (a for a in self.agents if a.status == AgentStatus.ACTIVE),
            key=lambda a: a.level,
            reverse=True,
        )

        for agent in sorted_agents:
            if agent.role == AgentRole.COO or agent.level >= 9:
                self._tick_coo(agent)
                self._tick_unblock(agent)
            elif agent.role == AgentRole.LEAD:
                self._tick_lead(agent)
                self._tick_unblock(agent)
            else:
                self._tick_worker(agent)

        self.metrics_history.append(
            MetricsSnapshot(
                tick=self.tick,
                timestamp=_now_ms(),
                active_agents=sum(1 for a in self.agents if a.status == AgentStatus.ACTIVE),
                total_tasks=len(self.tasks),
                tasks_done=sum(1 for t in self.tasks if t.status == TaskStatus.DONE),
                tasks_in_progress=sum(1 for t in self.tasks if t.status == TaskStatus.IN_PROGRESS),
                tasks_in_review=sum(1 for t in self.tasks if t.status == TaskStatus.REVIEW),
                total_credits_earned=sum(a.stats.credits_earned for a in self.agents),
                total_credits_spent=sum(a.stats.credits_spent for a in self.agents),
                message_count=sum(a.stats.messages_sent for a in self.agents),
            )
        )

    async def restart(self, mode: str = "organic") -> None:
        from .agents import create_all_agents, create_coo

        if mode == "full":
            self.agents = create_all_agents()
        else:
            self.agents = create_coo()
        self.tasks = []
        self.events = []
        self.metrics_history = []
        self._pending_hires = []
        self._pending_tasks = []
        self._spawn_queue = []
        self.tick = 0
        self._log(f"🔄 Reset ({mode}) — {len(self.agents)} agents")

    async def run(self) -> None:
        """Run the simulation loop forever."""
        self._running = True
        while self._running:
            await self.run_tick()
            await asyncio.sleep(self.tick_interval_ms / 1000)

    def stop(self) -> None:
        self._running = False
