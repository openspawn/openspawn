#!/bin/bash
# ── BikiniBottom VPS Setup Script ─────────────────────────────────────────────
# Run this once on a fresh Hetzner CX22 (Ubuntu 24.04)
# Usage: ssh root@your-vps-ip 'bash -s' < deploy/setup-vps.sh

set -euo pipefail

echo "🌊 Setting up BikiniBottom VPS..."

# ── System updates ────────────────────────────────────────────────────────────
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw

# ── Firewall ──────────────────────────────────────────────────────────────────
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── Docker ────────────────────────────────────────────────────────────────────
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# ── Create deploy user ────────────────────────────────────────────────────────
useradd -m -s /bin/bash -G docker deploy || true
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# ── App directory ─────────────────────────────────────────────────────────────
mkdir -p /opt/bikinibottom
chown deploy:deploy /opt/bikinibottom

echo ""
echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy docker-compose.yml + Caddyfile to /opt/bikinibottom/"
echo "  2. Create /opt/bikinibottom/.env.production with GROQ_API_KEY"
echo "  3. Point bikinibottom.ai DNS (A record) to this server's IP"
echo "  4. Set GitHub secrets: VPS_HOST, VPS_USER=deploy, VPS_SSH_KEY"
echo "  5. Push to main — GitHub Actions will deploy automatically"
echo ""
