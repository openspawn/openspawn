---
title: Self-Claim Tasks
layout: default
parent: Features
nav_order: 2
---

# Self-Claim Task Mechanics

> Phase 7.1 - Autonomous Task Claiming

## Overview

Agents can autonomously claim available tasks from the pool, enabling pull-based work distribution.

## API

```graphql
mutation ClaimNextTask($orgId: ID!, $agentId: ID!) {
  claimNextTask(orgId: $orgId, agentId: $agentId) {
    success message task { id identifier title status priority }
  }
}

query ClaimableTaskCount($orgId: ID!, $agentId: ID!) {
  claimableTaskCount(orgId: $orgId, agentId: $agentId)
}
```

## Features

- Priority-based selection (URGENT > HIGH > NORMAL > LOW)
- Row-level locking prevents race conditions
- Confetti celebration on successful claim
- Real-time task count updates
