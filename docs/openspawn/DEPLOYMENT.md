---
layout: default
title: Deployment Guide - OpenSpawn
---

# OpenSpawn — Deployment Guide

This guide covers deploying OpenSpawn to production environments.

---

## Quick Start (Development)

```bash
# Clone and install
git clone https://github.com/openspawn/openspawn.git
cd openspawn && pnpm install

# Start database
docker compose up -d postgres

# Initialize database
node scripts/sync-db.mjs

# Seed admin user
node scripts/seed-admin.mjs admin@example.com yourpassword

# Start services
pnpm exec nx run-many -t serve -p api,dashboard
```

- **Dashboard:** http://localhost:4200
- **API:** http://localhost:3000

---

## Docker Compose (Recommended)

### Production Stack

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Start all services
docker compose up -d

# Check status
docker compose ps
docker compose logs -f api
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL 16 database |
| `api` | 3000 | NestJS REST/GraphQL API |
| `dashboard` | 4200 | React dashboard (nginx) |
| `mcp` | 3002 | MCP server for AI agents |
| `litellm` | 4000 | LLM proxy (optional) |

### Health Checks

```bash
# API health
curl http://localhost:3000/health

# All services
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

---

## Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/openspawn

# Security
JWT_SECRET=your-32-char-minimum-secret
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
SESSION_SECRET=your-session-secret
```

### Optional

```bash
# API
API_PORT=3000
API_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:4200

# Dashboard
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_URL=http://localhost:3000/graphql
VITE_DEMO_MODE=false

# OAuth (if using)
OAUTH_CLIENT_ID=your-client-id
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=http://localhost:4200/auth/callback

# LiteLLM (if using)
LITELLM_API_KEY=your-litellm-key
LITELLM_CALLBACK_URL=http://api:3000/credits/litellm-callback
```

### Generating Secrets

```bash
# JWT secret
openssl rand -hex 32

# Encryption key (32 bytes = 64 hex chars)
openssl rand -hex 32
```

---

## Database Setup

### Initialize Schema

```bash
# Using scripts
node scripts/sync-db.mjs

# Or using TypeORM directly
pnpm exec typeorm schema:sync -d libs/database/src/data-source.cli.cjs
```

### Create Admin User

```bash
node scripts/seed-admin.mjs admin@example.com password123
```

### Backup & Restore

```bash
# Backup
docker compose exec postgres pg_dump -U openspawn openspawn > backup.sql

# Restore
docker compose exec -T postgres psql -U openspawn openspawn < backup.sql
```

---

## Nginx Configuration

For production deployments behind nginx:

```nginx
upstream openspawn_api {
    server 127.0.0.1:3000;
}

upstream openspawn_dashboard {
    server 127.0.0.1:4200;
}

server {
    listen 443 ssl http2;
    server_name openspawn.example.com;

    ssl_certificate /etc/ssl/certs/openspawn.crt;
    ssl_certificate_key /etc/ssl/private/openspawn.key;

    # Dashboard
    location / {
        proxy_pass http://openspawn_dashboard;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://openspawn_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # GraphQL WebSocket
    location /graphql {
        proxy_pass http://openspawn_api/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Kubernetes

### Basic Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: openspawn-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: openspawn-api
  template:
    metadata:
      labels:
        app: openspawn-api
    spec:
      containers:
        - name: api
          image: openspawn/api:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: openspawn-secrets
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: openspawn-secrets
                  key: jwt-secret
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: openspawn-api
spec:
  selector:
    app: openspawn-api
  ports:
    - port: 80
      targetPort: 3000
```

---

## Monitoring

### Prometheus Metrics

The API exposes metrics at `/metrics`:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'openspawn'
    static_configs:
      - targets: ['api:3000']
    metrics_path: /metrics
```

### Key Metrics

- `openspawn_agents_total` — Total agents by status
- `openspawn_tasks_total` — Tasks by status
- `openspawn_credits_spent_total` — Total credits spent
- `openspawn_api_requests_total` — API request count

### Logging

Logs are JSON-formatted for easy parsing:

```bash
# View API logs
docker compose logs -f api | jq '.'

# Filter by level
docker compose logs api | jq 'select(.level == "error")'
```

---

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Change default ENCRYPTION_KEY
- [ ] Enable HTTPS (TLS)
- [ ] Configure CORS_ORIGINS restrictively
- [ ] Set up database backups
- [ ] Enable rate limiting (nginx or API middleware)
- [ ] Configure firewall rules
- [ ] Set up log aggregation
- [ ] Enable 2FA for admin users
- [ ] Review agent permissions regularly

---

## Troubleshooting

### Database Connection Failed

```bash
# Check postgres is running
docker compose ps postgres

# Check connection
docker compose exec postgres psql -U openspawn -c "SELECT 1"

# Check DATABASE_URL format
# postgresql://user:password@host:port/database
```

### API Won't Start

```bash
# Check logs
docker compose logs api

# Common issues:
# - DATABASE_URL not set
# - JWT_SECRET too short (min 32 chars)
# - Port already in use
```

### Dashboard Shows No Data

```bash
# Check API is reachable from dashboard
curl http://localhost:3000/health

# Check CORS settings in .env
# CORS_ORIGINS should include dashboard URL
```

### MCP Connection Issues

```bash
# Verify agent credentials
curl -X GET http://localhost:3000/agents \
  -H "X-Agent-Id: your-agent-id" \
  -H "X-Timestamp: $(date -u +%s)" \
  -H "X-Nonce: $(openssl rand -hex 8)" \
  -H "X-Signature: computed-signature"
```

---

## Updates

### Updating Services

```bash
# Pull latest images
docker compose pull

# Restart with new images
docker compose up -d

# Run migrations if needed
docker compose exec api node scripts/sync-db.mjs
```

### Version Compatibility

Check the [CHANGELOG](https://github.com/openspawn/openspawn/blob/main/CHANGELOG.md) for breaking changes between versions.
