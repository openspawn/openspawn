#!/bin/bash
set -e

echo "🎨 Generating PWA icons..."

# Check for rsvg-convert (librsvg)
if ! command -v rsvg-convert &> /dev/null; then
  echo "Installing librsvg..."
  brew install librsvg
fi

cd apps/dashboard/public

# Generate icons from SVG
rsvg-convert -w 192 -h 192 favicon.svg > icon-192.png
rsvg-convert -w 512 -h 512 favicon.svg > icon-512.png
rsvg-convert -w 180 -h 180 favicon.svg > apple-touch-icon.png

echo "✅ Icons generated:"
ls -la icon-*.png apple-touch-icon.png
