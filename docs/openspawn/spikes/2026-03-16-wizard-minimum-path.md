# Wizard Minimum-Path Spike

## Hypothesis

The quick-path wizard (currently 7 prompts: template, name, provider, default model, senior model, port, docker) can be reduced to **3 prompts** (template, name, port) by deferring LLM model selection to template-derived defaults — without meaningfully degrading first-run outcomes.

## Context

The `openspawn init` wizard was restructured from 15 flat prompts into a 3-step core + optional advanced section. The current quick path:

| Step               | Prompts | What                                  |
| ------------------ | ------- | ------------------------------------- |
| 1 · Organization   | 2       | template, org name                    |
| 2 · AI Models      | 3       | provider, default model, senior model |
| 3 · Infrastructure | 2       | port, docker                          |

The question: is Step 2 (AI Models) essential for first-run, or can we defer it?

## Arguments For (3 prompts)

- **Fastest possible time-to-running** — template + name + port is ~30 seconds
- **Model defaults are already good** — Anthropic + Sonnet/Opus covers 90% of users
- **Users who need Ollama/Groq know it** — they'll find `openspawn.config.json`
- **Reduces decision fatigue** — a new user hasn't even seen agents run; model choice is premature
- **Non-interactive mode already does this** — `--yes` flag skips all prompts

## Arguments Against (keep 7 prompts)

- **Provider choice affects API key setup** — user needs to know which key to export
- **Ollama users get broken setup** — default is Anthropic, Ollama needs different model names
- **Model selection is the most consequential cost decision** — Opus vs Sonnet is 5× price difference
- **7 prompts is already fast** — ~60 seconds vs ~30 seconds is marginal

## Experiment Plan

1. Add a `--minimal` flag that skips Step 2 (uses Anthropic + default models)
2. Run 5 first-time user sessions with 7-prompt path, 5 with 3-prompt path
3. Measure: time-to-first-agent-run, confusion points, config edits within 1 hour
4. Interview: "Did you feel anything was missing?" / "Was anything unnecessary?"

## Metrics

- **Time to first `openspawn start`** (seconds from init to running coordinator)
- **Post-init config edits** (how many users change LLM settings within first hour)
- **Support questions** (what do users ask about immediately after init)
- **Drop-off rate** (do users abandon init before completion)

## Risks

- Users on non-Anthropic providers get a broken default and must debug config manually
- Users might not realize they're paying for Opus on senior agents
- Removing model prompts removes a natural moment to explain the L1–L6 / L7+ tiering

## Decision

**Deferred** — needs user testing. Current implementation keeps 7 prompts as quick path, with the option to add `--minimal` flag later based on test results.

## Related

- `openspawn init` wizard restructure (PR pending)
- Issue: `openspawn regenerate` command (filed)
