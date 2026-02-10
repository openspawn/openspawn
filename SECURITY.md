# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in BikiniBottom, please report it responsibly.

**Email:** security@openspawn.dev

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix timeline:** Depends on severity (critical: ASAP, high: 1-2 weeks, medium: next release)

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅        |
| < Latest | ❌       |

## Scope

- API authentication and authorization
- Webhook signature verification (HMAC-SHA256)
- SQL injection and XSS prevention
- Dependency vulnerabilities
- Credit system integrity

## Out of Scope

- Self-hosted deployment misconfigurations
- Social engineering
- Denial of service (unless trivially exploitable)

Thank you for helping keep BikiniBottom secure! 🌊
