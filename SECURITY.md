# Security Policy

If you believe you have found a security issue in OpenSpawn, please report it privately.

## Reporting

Email: security@openspawn.ai

Or use GitHub Security Advisories:
https://github.com/openspawn/openspawn/security/advisories/new

## What to Include

1. **Description** of the vulnerability
2. **Steps to reproduce**
3. **Impact assessment** (what an attacker could do)
4. **Affected component** (API, CLI, sandbox, dashboard, etc.)
5. **Suggested fix** (if you have one)

## Scope

### In Scope
- API authentication and authorization bypass
- Agent permission escalation (agent acting beyond its level)
- HMAC signature forgery or bypass
- Cross-org data leakage
- Task injection or manipulation
- Credit/budget system bypass
- Sandbox escape

### Out of Scope
- Prompt injection (agents are expected to handle untrusted input)
- Denial of service via normal API usage
- Self-hosted configuration mistakes
- Social engineering attacks
- Issues in third-party dependencies (report upstream)

## Trust Model

OpenSpawn's trust model centers on the ORG.md:

- **Agent levels** (L1-L10) define capability boundaries
- **Policies** define budget limits and approval thresholds
- **The human principal** is the ultimate authority
- **Agents cannot escalate their own permissions**
- **HMAC authentication** secures agent-to-coordinator communication

Vulnerabilities that bypass these boundaries are high priority.

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix timeline:** Depends on severity (critical: ASAP, high: 1-2 weeks)

## Recognition

We appreciate responsible disclosure. Contributors who report valid vulnerabilities will be credited in the changelog and security advisories (unless they prefer anonymity).
