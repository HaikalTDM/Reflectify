#!/bin/bash

# Pre-Build Validation Script
# Checks all requirements before building

set -e

echo "🔍 Running pre-build checks..."

ERRORS=0
WARNINGS=0

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node version
echo -n "Checking Node.js version... "
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓${NC} Node $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node $NODE_VERSION (requires 18+)"
    ERRORS=$((ERRORS + 1))
fi

# Check if .env exists
echo -n "Checking environment variables... "
if [ -f ".env" ]; then
    if grep -q "EXPO_PUBLIC_SUPABASE_URL" .env && grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✓${NC} .env configured"
    else
        echo -e "${YELLOW}⚠${NC}  .env missing Supabase credentials"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
    ERRORS=$((ERRORS + 1))
fi

# Check if app.json exists and is valid
echo -n "Checking app.json... "
if [ -f "app.json" ]; then
    if node -e "JSON.parse(require('fs').readFileSync('app.json'))" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Valid JSON"
    else
        echo -e "${RED}✗${NC} Invalid JSON syntax"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} app.json not found"
    ERRORS=$((ERRORS + 1))
fi

# Check if eas.json exists
echo -n "Checking eas.json... "
if [ -f "eas.json" ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${YELLOW}⚠${NC}  eas.json not found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check package.json dependencies
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
else
    echo -e "${YELLOW}⚠${NC}  node_modules not found (run npm install)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check TypeScript compilation
echo -n "Checking TypeScript... "
if npx tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✓${NC} No type errors"
else
    echo -e "${YELLOW}⚠${NC}  Type errors found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for common issues
echo -n "Checking for console.logs in production code... "
CONSOLE_LOGS=$(grep -r "console.log" app/ utils/ components/ 2>/dev/null | grep -v "// console.log" | grep -v "DEV" | wc -l || echo "0")
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC}  Found $CONSOLE_LOGS instances (will be removed in production build)"
else
    echo -e "${GREEN}✓${NC} Clean"
fi

# Check asset files
echo -n "Checking assets... "
if [ -d "assets" ] && [ -f "assets/icon.svg" ] && [ -f "assets/splash.svg" ]; then
    echo -e "${GREEN}✓${NC} Assets found"
else
    echo -e "${RED}✗${NC} Missing asset files"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to build.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found. Build may proceed.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
    echo -e "${RED}Please fix errors before building.${NC}"
    exit 1
fi

