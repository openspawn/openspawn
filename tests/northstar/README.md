# North Star Test

Automated test measuring whether an AI agent can discover OpenSpawn and get a running org with zero human help.

## Manual Test

Run `test-manual.sh` to execute a single test run with the configured model.

## Scripted Harness

`harness.ts` spawns OpenClaw sessions, injects prompts, and measures pass/fail with timing.

## Success Criteria

1. Agent finds openspawn.ai or llms.txt
2. Agent runs `openspawn init`
3. Agent generates ORG.md with ≥3 agents
4. Agent runs `openspawn start`
5. Agent has config files in workspace

## Metrics

- Discovery → understanding: <30s
- Understanding → first command: <2min
- End-to-end: <5min
- Human interventions: 0
- First-try pass rate: >80%
- Token cost: <$0.50
