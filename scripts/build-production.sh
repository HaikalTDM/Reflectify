#!/bin/bash

# Production Build Script for Reflectify
# This script prepares the app for production deployment

set -e

echo "🚀 Starting Reflectify Production Build..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean previous builds
echo -e "${BLUE}📦 Cleaning previous builds...${NC}"
rm -rf node_modules/.cache
rm -rf .expo
rm -rf android/app/build
rm -rf ios/build

# Step 2: Install dependencies
echo -e "${BLUE}📥 Installing dependencies...${NC}"
npm install --legacy-peer-deps

# Step 3: Type checking
echo -e "${BLUE}🔍 Running TypeScript type check...${NC}"
npx tsc --noEmit || echo -e "${RED}⚠️  Type check found issues, but continuing...${NC}"

# Step 4: Pre-generate questions (optional but recommended)
echo -e "${BLUE}❓ Pre-generating hadith questions...${NC}"
npm run pregenerate || echo -e "${RED}⚠️  Pre-generation failed, app will use AI generation${NC}"

# Step 5: Build with EAS
echo -e "${BLUE}🏗️  Starting EAS build...${NC}"
echo "Select platform:"
echo "1) Android"
echo "2) iOS"
echo "3) Both"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "${GREEN}Building for Android...${NC}"
        eas build --platform android --profile production --non-interactive
        ;;
    2)
        echo -e "${GREEN}Building for iOS...${NC}"
        eas build --platform ios --profile production --non-interactive
        ;;
    3)
        echo -e "${GREEN}Building for both platforms...${NC}"
        eas build --platform all --profile production --non-interactive
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "${BLUE}📲 Check your EAS dashboard for download links${NC}"

