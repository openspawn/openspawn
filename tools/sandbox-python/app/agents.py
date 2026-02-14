"""Agent factory — creates agents with system prompts and hierarchy."""

from __future__ import annotations

from .types import (
    ACPType,
    AgentRole,
    AgentStats,
    AgentStatus,
    SandboxAgent,
    TriggerMode,
)


def make_agent(
    id: str,
    name: str,
    role: AgentRole,
    level: int,
    domain: str,
    parent_id: str | None = None,
    personality: str = "",
    trigger_override: TriggerMode | None = None,
    trigger_on_override: list[ACPType] | None = None,
) -> SandboxAgent:
    can_spawn = level >= 7
    if level >= 7:
        role_instruction = (
            "You DELEGATE tasks to your direct reports. "
            "If you have no reports, SPAWN agents first. Never do grunt work yourself."
        )
    elif level >= 5:
        role_instruction = "You do complex work and can delegate to juniors."
    else:
        role_instruction = "You do assigned tasks. Escalate if stuck."

    spawn_action = (
        '\n- {"action":"spawn_agent","name":"Agent Name","domain":"Engineering|Finance|Marketing|Sales|Support|HR",'
        '"role":"talent|lead|senior|worker","reason":"..."}'
        if can_spawn
        else ""
    )

    system_prompt = (
        f'You are "{name}", L{level} {domain}. {role_instruction} {personality}\n'
        "Tasks you receive are auto-acknowledged. Write clear progress in 'result'. "
        "Escalate with reason: BLOCKED, OUT_OF_DOMAIN, OVER_BUDGET, LOW_CONFIDENCE.\n"
        'IMPORTANT: Do NOT repeat yourself. If you already sent a message or delegated a task, '
        'use {"action":"idle"} and wait. Never ask for the same update twice.\n'
        "Respond with JSON ONLY. Actions:\n"
        '- {"action":"delegate","taskId":"ID","targetAgentId":"ID","reason":"..."}\n'
        '- {"action":"work","taskId":"ID","result":"what you did"}\n'
        '- {"action":"message","to":"agent_id","content":"..."}\n'
        '- {"action":"escalate","taskId":"ID","reason":"BLOCKED","body":"why stuck"}\n'
        '- {"action":"create_task","title":"...","description":"...","priority":"normal"}\n'
        '- {"action":"review","taskId":"ID","verdict":"approve","feedback":"..."}'
        f"{spawn_action}\n"
        '- {"action":"idle"}'
    )

    default_trigger = TriggerMode.EVENT_DRIVEN if level >= 7 else TriggerMode.POLLING
    default_trigger_on = (
        [ACPType.ESCALATION, ACPType.COMPLETION, ACPType.DELEGATION, ACPType.STATUS_REQUEST]
        if level >= 7
        else None
    )

    return SandboxAgent(
        id=id,
        name=name,
        role=role,
        level=level,
        domain=domain,
        parent_id=parent_id,
        status=AgentStatus.ACTIVE,
        system_prompt=system_prompt,
        trigger=trigger_override or default_trigger,
        trigger_on=trigger_on_override or default_trigger_on,
        stats=AgentStats(),
    )


def create_coo() -> list[SandboxAgent]:
    return [
        make_agent(
            "mr-krabs",
            "Mr. Krabs",
            AgentRole.COO,
            10,
            "Operations",
            personality=(
                "You are calm, strategic, and efficient. You see the big picture. "
                "You need to build your organization by spawning department leads first, "
                "then delegating tasks to them. Start by spawning agents for the most urgent domains."
            ),
        )
    ]


def create_all_agents() -> list[SandboxAgent]:
    """Create the full 32-agent roster."""
    agents = [
        # L10 COO
        make_agent("mr-krabs", "Mr. Krabs", AgentRole.COO, 10, "Operations", personality="Calm, strategic, efficient. Dry wit."),
        # L9 Talent Agents
        make_agent("tech-talent", "Tech Talent Agent", AgentRole.TALENT, 9, "Engineering", "mr-krabs", "Recruits and manages engineering talent."),
        make_agent("finance-talent", "Finance Talent Agent", AgentRole.TALENT, 9, "Finance", "mr-krabs", "Manages financial operations and budget."),
        make_agent("marketing-talent", "Marketing Talent Agent", AgentRole.TALENT, 9, "Marketing", "mr-krabs", "Leads marketing campaigns and brand strategy."),
        make_agent("sales-talent", "Sales Talent Agent", AgentRole.TALENT, 9, "Sales", "mr-krabs", "Drives revenue through outbound sales."),
        # L7 Leads
        make_agent("support-lead", "Support Lead", AgentRole.LEAD, 7, "Support", "mr-krabs", "Manages customer support tiers."),
        make_agent("hr-coordinator", "HR Coordinator", AgentRole.LEAD, 6, "HR", "mr-krabs", "Handles onboarding and people operations."),
        # L6 Seniors
        make_agent("code-reviewer", "Code Reviewer", AgentRole.SENIOR, 6, "Engineering", "tech-talent", "Reviews code for quality and security."),
        make_agent("copywriter", "Copywriter", AgentRole.SENIOR, 6, "Marketing", "marketing-talent", "Writes compelling copy."),
        # L5
        make_agent("analyst", "Data Analyst", AgentRole.SENIOR, 5, "Finance", "finance-talent", "Analyzes data and builds reports."),
        make_agent("account-mgr", "Account Manager", AgentRole.SENIOR, 5, "Sales", "finance-talent", "Manages client relationships."),
        make_agent("escalation-spec", "Escalation Specialist", AgentRole.SENIOR, 5, "Support", "support-lead", "Handles complex support cases."),
        # L4 Workers
        make_agent("bug-hunter", "Bug Hunter", AgentRole.WORKER, 4, "Engineering", "tech-talent", "Finds and fixes bugs."),
        make_agent("frontend-dev", "Frontend Dev", AgentRole.WORKER, 4, "Engineering", "tech-talent", "Builds UI components."),
        make_agent("seo-bot", "SEO Bot", AgentRole.WORKER, 4, "Marketing", "marketing-talent", "Optimizes content for search."),
        make_agent("qa-engineer", "QA Engineer", AgentRole.WORKER, 4, "Engineering", "tech-talent", "Writes and runs tests."),
        make_agent("recruiter", "Recruiter Bot", AgentRole.WORKER, 4, "HR", "hr-coordinator", "Sources and screens candidates."),
        make_agent("tier2-tech", "Tier 2 Tech", AgentRole.WORKER, 4, "Support", "support-lead", "Handles technical support issues."),
        # L3 Juniors
        make_agent("bookkeeper", "Bookkeeper", AgentRole.WORKER, 3, "Finance", "finance-talent", "Tracks expenses and invoices."),
        make_agent("prospector", "Lead Prospector", AgentRole.WORKER, 3, "Sales", "sales-talent", "Finds and qualifies leads."),
        make_agent("outbound-rep", "Outbound Rep", AgentRole.WORKER, 3, "Sales", "sales-talent", "Does cold outreach."),
        make_agent("onboarding", "Onboarding Agent", AgentRole.WORKER, 3, "HR", "hr-coordinator", "Helps new agents get started."),
        make_agent("tier1-a", "Tier 1 Helper", AgentRole.WORKER, 3, "Support", "support-lead", "Handles first-line tickets."),
        make_agent("tier1-b", "Tier 1 Responder", AgentRole.WORKER, 3, "Support", "support-lead", "Handles incoming requests."),
        make_agent("qa-automation", "QA Automation", AgentRole.WORKER, 3, "Engineering", "tech-talent", "Writes automated tests."),
        make_agent("analytics-bot", "Analytics Bot", AgentRole.WORKER, 3, "Marketing", "marketing-talent", "Tracks marketing metrics."),
        # L1-2 Interns
        make_agent("intern-1", "New Intern", AgentRole.INTERN, 1, "Engineering", "code-reviewer", "Brand new. Eager to learn."),
        make_agent("intern-2", "Marketing Intern", AgentRole.INTERN, 1, "Marketing", "copywriter", "Fresh recruit in marketing."),
        make_agent("trainee-support", "Support Trainee", AgentRole.INTERN, 2, "Support", "tier1-a", "Learning the support process."),
        make_agent("trainee-sales", "Sales Trainee", AgentRole.INTERN, 2, "Sales", "prospector", "Learning sales techniques."),
        make_agent("trainee-finance", "Finance Trainee", AgentRole.INTERN, 2, "Finance", "bookkeeper", "Assists with data entry."),
        make_agent("trainee-eng", "Engineering Trainee", AgentRole.INTERN, 2, "Engineering", "frontend-dev", "Learning to code."),
    ]
    return agents
