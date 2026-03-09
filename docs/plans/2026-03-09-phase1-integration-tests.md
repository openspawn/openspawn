# Phase 1 Integration Tests — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate the agent spawning foundation end-to-end ($0, no LLM calls, deterministic)

**Architecture:** Expand existing pytest + vitest suites to cover 3 gaps: (1) process.py subprocess logic at 0% coverage, (2) API endpoints + MCP tool schemas on SQLite, (3) CLI start.ts bridge. All tests mock external dependencies (claude CLI, network) and run against SQLite in-memory/tmp.

**Tech Stack:** pytest + httpx ASGI transport (Python), vitest (TypeScript), tmp_path fixtures, unittest.mock

**Issues:** #612 (FastAPI + MCP), #613 (CLI init + start)

---

## Tasks

### Task 1: Process spawner unit tests (process.py — 0% → covered)
### Task 2: MCP tool schema validation (all 33 tools have valid schemas)
### Task 3: REST endpoint smoke tests on SQLite (auth gates work)
### Task 4: Seeder end-to-end on SQLite (ORG.md → DB round-trip)
### Task 5: CLI start command unit tests (TS bridge)
### Task 6: CLI init scaffold smoke tests (template validation)
