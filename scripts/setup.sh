#!/bin/bash
set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${YELLOW}🦜 Ella — Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org (v18+)"
    exit 1
fi
echo "  ✓ Node.js $(node -v)"

# Install
echo -e "\n${CYAN}Installing dependencies...${NC}"
npm install
echo -e "  ${GREEN}✓ Done${NC}"

# Env
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "  ${GREEN}✓ Created .env — fill in your keys${NC}"
fi

# Git
if command -v git &> /dev/null && [ ! -d .git ]; then
    echo -e "\n${CYAN}Initializing git...${NC}"
    git init && git add -A && git commit -m "Initial commit: Ella — LinkedIn Content Engine"
    echo -e "  ${GREEN}✓ Repo initialized${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Ready!${NC}"
echo ""
echo "  1. Fill in .env with your Supabase + Anthropic keys"
echo "  2. Run the Supabase migration: supabase/migrations/001_initial_schema.sql"
echo -e "  3. Start dev server: ${YELLOW}npm run dev${NC}"
echo -e "  4. Open Claude Code: ${YELLOW}claude${NC}"
echo ""
