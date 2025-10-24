#!/bin/bash

# Lightweight CollectiveMind Startup (No Docker Required)
# This runs just the backend with mock data for quick AI testing

echo "🧠 Starting CollectiveMind (Lightweight Mode)"
echo "============================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run setup first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting backend server with AI capabilities..."
echo ""
echo "Available endpoints:"
echo "• Backend API: http://localhost:8000"
echo "• Health check: http://localhost:8000/health"
echo "• AI Chat: POST http://localhost:8000/api/chat/message"
echo "• Agentic Processing: POST http://localhost:8000/api/agentic/process"
echo ""
echo "Note: This lightweight mode uses mock data for Elasticsearch/PostgreSQL"
echo "For full functionality, start Docker and run ./start-collectivemind.sh"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start only the backend
cd packages/backend && npm run dev