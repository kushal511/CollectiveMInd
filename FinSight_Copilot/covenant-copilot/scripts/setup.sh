#!/bin/bash

# Covenant Monitoring Copilot - Development Setup Script

echo "🚀 Setting up Covenant Monitoring Copilot..."

# Check if Python 3.11+ is installed
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.11+ is required. Current version: $python_version"
    exit 1
fi

echo "✅ Python version check passed"

# Create virtual environment for API
echo "📦 Setting up Python virtual environment..."
cd apps/api
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install fastapi uvicorn sqlalchemy pandas PyPDF2 beautifulsoup4 requests python-multipart python-dotenv

# Try to install LandingAI ADE (optional)
echo "📦 Installing LandingAI ADE (optional)..."
pip install landingai-ade || echo "⚠️  LandingAI ADE installation failed - will use fallback methods"

# Install MCP dependencies
cd ../mcp
pip install -r ../api/requirements.txt || echo "⚠️  MCP dependencies will be installed separately"

# Setup Next.js frontend
echo "📦 Setting up Next.js frontend..."
cd ../web
npm install

# Create .env file from example
echo "📝 Creating environment configuration..."
cd ../..
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please update .env with your actual API keys and configuration"
else
    echo "✅ .env file already exists"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p memos
mkdir -p pathway_results
mkdir -p logs

# Initialize database
echo "🗄️  Initializing database..."
cd apps/api
python -c "from models import create_database; create_database(); print('Database initialized')"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development servers:"
echo "1. Backend API: cd apps/api && source venv/bin/activate && python main.py"
echo "2. Frontend: cd apps/web && npm run dev"
echo "3. MCP Server: cd apps/mcp && python server.py"
echo ""
echo "Or use: make dev"
