#!/usr/bin/env bash
#
# OpenSpawn Quick Install
# Usage: curl -fsSL https://raw.githubusercontent.com/openspawn/openspawn/main/scripts/install.sh | bash
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Banner
echo ""
echo -e "${CYAN}${BOLD}"
cat << 'EOF'
   ____                   _____                           
  / __ \                 / ____|                          
 | |  | |_ __   ___ _ __| (___  _ __   __ ___      ___ __  
 | |  | | '_ \ / _ \ '_ \\___ \| '_ \ / _` \ \ /\ / / '_ \ 
 | |__| | |_) |  __/ | | |___) | |_) | (_| |\ V  V /| | | |
  \____/| .__/ \___|_| |_|____/| .__/ \__,_| \_/\_/ |_| |_|
        | |                    | |                         
        |_|                    |_|                         
EOF
echo -e "${NC}"
echo -e "${BOLD}Command center for your AI agent army${NC}"
echo ""

# Check prerequisites
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    fi
}

echo -e "${BOLD}Checking prerequisites...${NC}"
echo ""

MISSING=0
check_command "docker" || MISSING=1
check_command "git" || MISSING=1

# Check docker compose (v2 style)
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✓ docker compose${NC}"
else
    echo -e "${RED}✗ docker compose is not available${NC}"
    MISSING=1
fi

echo ""

if [ $MISSING -eq 1 ]; then
    echo -e "${RED}${BOLD}Missing prerequisites. Please install them first:${NC}"
    echo ""
    echo "  Docker: https://docs.docker.com/get-docker/"
    echo ""
    exit 1
fi

# Set install directory
INSTALL_DIR="${OPENSPAWN_DIR:-$HOME/openspawn}"

echo -e "${BOLD}Installing to: ${CYAN}$INSTALL_DIR${NC}"
echo ""

# Clone or update
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Directory exists. Updating...${NC}"
    cd "$INSTALL_DIR"
    git pull --ff-only origin main || {
        echo -e "${RED}Failed to update. Please resolve conflicts manually.${NC}"
        exit 1
    }
else
    echo -e "${BLUE}Cloning OpenSpawn...${NC}"
    git clone --depth 1 https://github.com/openspawn/openspawn.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo ""

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${BLUE}Creating .env file...${NC}"
    
    # Generate secrets
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    HMAC_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    
    cat > .env << EOF
# OpenSpawn Configuration
DATABASE_URL=postgres://openspawn:openspawn@localhost:5432/openspawn
JWT_SECRET=$JWT_SECRET
HMAC_SECRET=$HMAC_SECRET

# Optional: LiteLLM proxy for model routing
# LITELLM_API_BASE=http://localhost:4000
# LITELLM_API_KEY=sk-...
EOF
    echo -e "${GREEN}✓ Created .env with secure secrets${NC}"
fi

echo ""
echo -e "${BLUE}Starting services...${NC}"
echo ""

# Start with docker compose
docker compose up -d postgres

echo ""
echo -e "${YELLOW}Waiting for Postgres to be ready...${NC}"

# Wait for postgres
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U openspawn &>/dev/null; then
        echo -e "${GREEN}✓ Postgres is ready${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}Postgres failed to start. Check: docker compose logs postgres${NC}"
        exit 1
    fi
done

echo ""
echo -e "${BLUE}Building and starting API and Dashboard...${NC}"
echo -e "${YELLOW}(This may take a few minutes on first run)${NC}"
echo ""
docker compose up -d api dashboard

echo ""
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check if services are up
API_UP=0
DASH_UP=0

for i in {1..60}; do
    if curl -s http://localhost:3000/health &>/dev/null; then
        API_UP=1
    fi
    if curl -s http://localhost:8080 &>/dev/null; then
        DASH_UP=1
    fi
    if [ $API_UP -eq 1 ] && [ $DASH_UP -eq 1 ]; then
        break
    fi
    sleep 2
    # Show progress
    if [ $((i % 5)) -eq 0 ]; then
        echo -e "${YELLOW}  Still starting... (${i}s)${NC}"
    fi
done

echo ""
echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $API_UP -eq 1 ] && [ $DASH_UP -eq 1 ]; then
    echo -e "${GREEN}${BOLD}  🚀 OpenSpawn is running!${NC}"
    echo ""
    echo -e "  ${BOLD}Dashboard${NC}  → ${CYAN}http://localhost:8080${NC}"
    echo -e "  ${BOLD}API${NC}        → ${CYAN}http://localhost:3000${NC}"
    echo -e "  ${BOLD}GraphQL${NC}    → ${CYAN}http://localhost:3000/graphql${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${BOLD}Next steps:${NC}"
    echo ""
    echo -e "  1. Open ${CYAN}http://localhost:8080${NC} in your browser"
    echo -e "  2. Click 'Demo Mode' to explore with sample data"
    echo -e "  3. Or sign up to create your own agent organization"
    echo ""
    echo -e "  ${BOLD}Useful commands:${NC}"
    echo ""
    echo -e "  ${YELLOW}cd $INSTALL_DIR${NC}"
    echo -e "  ${YELLOW}docker compose logs -f${NC}       # View logs"
    echo -e "  ${YELLOW}docker compose down${NC}          # Stop services"
    echo -e "  ${YELLOW}docker compose up -d${NC}         # Start services"
    echo ""
    echo -e "  ${BOLD}Documentation:${NC} ${CYAN}https://openspawn.github.io/openspawn${NC}"
    echo ""
else
    echo -e "${YELLOW}${BOLD}  ⚠️  Services are starting...${NC}"
    echo ""
    echo -e "  It may take a minute for everything to initialize."
    echo ""
    echo -e "  Check status with:"
    echo -e "  ${YELLOW}cd $INSTALL_DIR && docker compose ps${NC}"
    echo ""
    echo -e "  View logs with:"
    echo -e "  ${YELLOW}docker compose logs -f${NC}"
    echo ""
fi
