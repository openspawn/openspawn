# OpenClaw + OpenSpawn Integration Test Environment
FROM node:22-slim

# Install pnpm and basic tools
RUN npm install -g pnpm@9 openclaw && \
    apt-get update && \
    apt-get install -y curl git && \
    rm -rf /var/lib/apt/lists/*

# Create openclaw user
RUN useradd -m -s /bin/bash openclaw
USER openclaw
WORKDIR /home/openclaw

# Initialize OpenClaw workspace
RUN mkdir -p .openclaw/workspace

# Copy MCP config template
COPY --chown=openclaw:openclaw mcp-config.json .openclaw/mcp.json

# Default command: start OpenClaw gateway
CMD ["openclaw", "gateway", "start", "--foreground"]
