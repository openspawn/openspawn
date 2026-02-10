#!/bin/bash
set -e

# Create directories
mkdir -p apps/api/src/telemetry
mkdir -p apps/dashboard/src/components/telemetry
mkdir -p docs/features

# Copy files from the bikinibottom-branding branch telemetry implementation
git show feat/bikinibottom-branding:apps/api/src/telemetry/telemetry.config.ts > apps/api/src/telemetry/telemetry.config.ts 2>/dev/null || true
git show feat/bikinibottom-branding:apps/api/src/telemetry/telemetry.service.ts > apps/api/src/telemetry/telemetry.service.ts 2>/dev/null || true
git show feat/bikinibottom-branding:apps/api/src/telemetry/telemetry.middleware.ts > apps/api/src/telemetry/telemetry.middleware.ts 2>/dev/null || true
git show feat/bikinibottom-branding:apps/api/src/telemetry/telemetry.module.ts > apps/api/src/telemetry/telemetry.module.ts 2>/dev/null || true
git show feat/bikinibottom-branding:apps/api/src/telemetry/index.ts > apps/api/src/telemetry/index.ts 2>/dev/null || true
git show feat/bikinibottom-branding:apps/api/src/telemetry/telemetry.service.spec.ts > apps/api/src/telemetry/telemetry.service.spec.ts 2>/dev/null || true

echo "Telemetry files created"
ls -la apps/api/src/telemetry/
