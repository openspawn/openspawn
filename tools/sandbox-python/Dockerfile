# ── Build dashboard ──────────────────────────────────────────────────────────
FROM node:24-alpine AS dashboard-build
WORKDIR /app
COPY package.json pnpm-lock.yaml nx.json tsconfig.base.json ./
COPY apps/dashboard ./apps/dashboard
COPY libs ./libs
RUN corepack enable && pnpm install --frozen-lockfile
RUN npx nx build dashboard

# ── Python runtime ───────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY tools/sandbox-python/pyproject.toml .
RUN pip install --no-cache-dir .

# Copy app
COPY tools/sandbox-python/app ./app
COPY tools/sandbox-python/run.py .

# Copy built dashboard
COPY --from=dashboard-build /app/dist/apps/dashboard ./dashboard-dist

ENV SERVE_DASHBOARD=1
ENV DASHBOARD_DIR=/app/dashboard-dist
ENV SANDBOX_PORT=3333

EXPOSE 3333

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:3333/api/state')" || exit 1

CMD ["python", "run.py"]
