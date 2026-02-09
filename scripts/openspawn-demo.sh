#!/bin/bash
cd ~/github/openspawn/openspawn
exec pnpm exec tsx apps/cli/src/main.ts "$@" --demo
