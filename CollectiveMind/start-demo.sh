#!/bin/bash

# CollectiveMind Demo Startup Script
# Quick start for hackathon demo

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting CollectiveMind Demo${NC}"
echo "=================================="
echo ""

# Check if setup is complete
if [ ! -f packages/backend/dev.db ]; then
    echo -e "${YELLOW}⚠️  Demo not set up yet. Running setup...${NC}"
    ./setup-demo-mode.sh
fi

# Verify setup
echo -e "${BLUE}🔍 Verifying setup...${NC}"
node verify-demo-setup.js

echo ""
echo -e "${GREEN}🎯 Starting CollectiveMind Services${NC}"
echo "===================================="

# Start backend in background
echo -e "${BLUE}📡 Starting backend server...${NC}"
cd packages/backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if we have a frontend
if [ -d "../frontend" ]; then
    echo -e "${BLUE}🌐 Starting frontend server...${NC}"
    cd ../frontend
    npm run dev &
    FRONTEND_PID=$!
    
    echo ""
    echo -e "${GREEN}✅ CollectiveMind Demo Started!${NC}"
    echo "=============================="
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "📡 Backend:  http://localhost:8000"
    echo "📊 API Docs: http://localhost:8000/api/docs"
    echo ""
    echo "🎯 Demo Features:"
    echo "• Semantic Search with Mock AI"
    echo "• Knowledge Management"
    echo "• Real-time Updates"
    echo "• Collective Intelligence"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for user to stop
    trap "echo -e '\n${YELLOW}🛑 Stopping services...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
    wait
else
    echo ""
    echo -e "${GREEN}✅ Backend Started!${NC}"
    echo "=================="
    echo ""
    echo "📡 Backend: http://localhost:8000"
    echo "📊 API:     http://localhost:8000/api"
    echo ""
    echo "Press Ctrl+C to stop"
    
    # Wait for user to stop
    trap "echo -e '\n${YELLOW}🛑 Stopping backend...${NC}'; kill $BACKEND_PID 2>/dev/null; exit 0" INT
    wait
fi