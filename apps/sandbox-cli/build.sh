#!/bin/bash
set -e
VERSION=$(node -p "require('./apps/sandbox-cli/publish/package.json').version")
esbuild apps/sandbox-cli/src/main.ts \
  --bundle --platform=node --target=node22 --format=cjs \
  --outfile=dist/apps/sandbox-cli/openspawn.cjs \
  --external:fsevents \
  --define:__CLI_VERSION__=\""$VERSION"\" \
  --minify-whitespace --minify-syntax --tree-shaking=true
