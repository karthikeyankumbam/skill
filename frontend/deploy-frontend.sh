#!/bin/bash

# Frontend Deployment Script for SkillLink
# This script builds and deploys the frontend to EC2

set -e  # Exit on error

echo "🚀 Starting SkillLink Frontend Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if we're on EC2 (optional check)
if [ -f "/sys/hypervisor/uuid" ] || [ -d "/sys/class/dmi/id" ]; then
    echo -e "${GREEN}✓${NC} Running on EC2 instance"
else
    echo -e "${YELLOW}⚠${NC} Not running on EC2 (this is okay if deploying from local)"
fi

# Check Node.js
echo -e "${YELLOW}📦${NC} Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗${NC} Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓${NC} Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗${NC} npm is not installed."
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓${NC} npm version: $NPM_VERSION"

# Check if .env.production exists
echo ""
echo -e "${YELLOW}📝${NC} Checking environment configuration..."
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠${NC} .env.production not found. Creating template..."
    cat > .env.production << EOF
# Production API URL
# Replace YOUR_EC2_IP with your actual EC2 public IP address
VITE_API_URL=http://YOUR_EC2_IP:5000/api
EOF
    echo -e "${YELLOW}⚠${NC} Please edit .env.production and set VITE_API_URL to your backend URL"
    echo -e "${YELLOW}⚠${NC} Then run this script again."
    exit 1
fi

echo -e "${GREEN}✓${NC} .env.production found"

# Pull latest changes (if in git repo)
if [ -d ".git" ]; then
    echo ""
    echo -e "${YELLOW}📥${NC} Pulling latest changes from git..."
    git pull origin main || echo -e "${YELLOW}⚠${NC} Could not pull from git (this is okay)"
fi

# Install dependencies
echo ""
echo -e "${YELLOW}📦${NC} Installing dependencies..."
npm install

# Build frontend
echo ""
echo -e "${YELLOW}🔨${NC} Building frontend for production..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}✗${NC} Build failed! dist/ directory not found."
    exit 1
fi

echo -e "${GREEN}✓${NC} Build successful! dist/ directory created."

# Check if running as root or with sudo (for Nginx reload)
if [ "$EUID" -eq 0 ] || sudo -n true 2>/dev/null; then
    # Reload Nginx if it exists
    if command -v nginx &> /dev/null; then
        echo ""
        echo -e "${YELLOW}🔄${NC} Testing Nginx configuration..."
        if sudo nginx -t 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Nginx configuration is valid"
            echo -e "${YELLOW}🔄${NC} Reloading Nginx..."
            sudo systemctl reload nginx
            echo -e "${GREEN}✓${NC} Nginx reloaded"
        else
            echo -e "${YELLOW}⚠${NC} Nginx configuration test failed. Please check manually."
        fi
    else
        echo -e "${YELLOW}⚠${NC} Nginx not found. Skipping Nginx reload."
    fi
else
    echo ""
    echo -e "${YELLOW}⚠${NC} Not running as root. Skipping Nginx reload."
    echo -e "${YELLOW}ℹ${NC} To reload Nginx, run: sudo systemctl reload nginx"
fi

# Set proper permissions
echo ""
echo -e "${YELLOW}🔐${NC} Setting file permissions..."
if [ "$EUID" -eq 0 ] || sudo -n true 2>/dev/null; then
    sudo chown -R www-data:www-data dist/ 2>/dev/null || echo -e "${YELLOW}⚠${NC} Could not change ownership (this is okay)"
    sudo chmod -R 755 dist/ 2>/dev/null || echo -e "${YELLOW}⚠${NC} Could not change permissions (this is okay)"
else
    chmod -R 755 dist/ 2>/dev/null || echo -e "${YELLOW}⚠${NC} Could not change permissions"
fi

echo ""
echo -e "${GREEN}✅${NC} Deployment complete!"
echo ""
echo -e "${GREEN}📊${NC} Build Summary:"
echo "   - Build directory: $(pwd)/dist"
echo "   - Build size: $(du -sh dist/ | cut -f1)"
echo ""
echo -e "${GREEN}🌐${NC} Next steps:"
echo "   1. Verify Nginx is configured to serve from: $(pwd)/dist"
echo "   2. Test frontend in browser"
echo "   3. Check API connectivity"
echo ""
echo -e "${GREEN}🎉${NC} Frontend deployment successful!"

