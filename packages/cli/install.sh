#!/bin/sh
# OpenSpawn CLI installer
# Usage: curl -fsSL https://raw.githubusercontent.com/openspawn/openspawn/main/packages/cli/install.sh | sh

set -e

REPO="openspawn/openspawn"
BINARY="openspawn"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
  x86_64|amd64) ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

case "$OS" in
  linux|darwin) ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

# Get latest release tag for the CLI
LATEST=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases" | \
  grep '"tag_name"' | grep 'packages/cli/' | head -1 | \
  sed 's/.*"tag_name": "packages\/cli\/\(.*\)".*/\1/')

if [ -z "$LATEST" ]; then
  echo "Could not determine latest version. Check https://github.com/${REPO}/releases"
  exit 1
fi

VERSION="${LATEST#v}"
FILENAME="${BINARY}_${VERSION}_${OS}_${ARCH}.tar.gz"
URL="https://github.com/${REPO}/releases/download/packages%2Fcli%2Fv${VERSION}/${FILENAME}"

echo "Installing ${BINARY} v${VERSION} (${OS}/${ARCH})..."

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

curl -fsSL "$URL" -o "${TMP}/${FILENAME}"
tar -xzf "${TMP}/${FILENAME}" -C "$TMP"

if [ -w "$INSTALL_DIR" ]; then
  mv "${TMP}/${BINARY}" "${INSTALL_DIR}/${BINARY}"
else
  echo "Installing to ${INSTALL_DIR} (requires sudo)..."
  sudo mv "${TMP}/${BINARY}" "${INSTALL_DIR}/${BINARY}"
fi

chmod +x "${INSTALL_DIR}/${BINARY}"

echo ""
echo "✅ ${BINARY} v${VERSION} installed to ${INSTALL_DIR}/${BINARY}"
echo ""
echo "Get started:"
echo "  openspawn init my-team"
echo ""
