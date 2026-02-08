#!/bin/bash
set -e

echo "🚀 Publishing OpenSpawn CLI to npm..."

# Build the CLI
echo "📦 Building CLI..."
pnpm exec nx run cli:build

# Prepare publish directory
echo "📁 Preparing publish directory..."
rm -rf apps/cli/publish/openspawn.cjs
cp dist/apps/cli/openspawn.cjs apps/cli/publish/

# Copy README
cp apps/cli/README.md apps/cli/publish/ 2>/dev/null || echo "# OpenSpawn CLI

Multi-agent coordination platform CLI.

## Installation

\`\`\`bash
npm install -g openspawn
\`\`\`

## Usage

\`\`\`bash
# Login
openspawn auth login

# List agents
openspawn agents list

# Create a task
openspawn tasks create --title \"My Task\" --priority high

# Check credits
openspawn credits balance
\`\`\`

## Documentation

https://openspawn.github.io/openspawn/
" > apps/cli/publish/README.md

# Publish
echo "📤 Publishing to npm..."
cd apps/cli/publish
npm publish --access public

echo "✅ Published successfully!"
echo "   Install with: npm install -g openspawn"
echo "   Or run with:  npx openspawn"
