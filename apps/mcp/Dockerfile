# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mcp/package.json ./apps/mcp/
COPY libs/shared-types/package.json ./libs/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm nx build mcp

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm for production deps
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built artifacts
COPY --from=builder /app/apps/mcp/dist ./
COPY --from=builder /app/apps/mcp/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 mcp && \
    chown -R mcp:nodejs /app

USER mcp

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "main.js"]
