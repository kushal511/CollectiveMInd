#!/bin/bash

# CollectiveMind Agentic System Startup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🧠 Starting CollectiveMind Agentic System..."
echo "============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start infrastructure services
print_status "Starting infrastructure services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 15

# Check Elasticsearch
print_status "Checking Elasticsearch..."
for i in {1..30}; do
    if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        print_success "Elasticsearch is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_warning "Elasticsearch may not be ready, but continuing..."
    fi
    sleep 2
done

# Check PostgreSQL
print_status "Checking PostgreSQL..."
for i in {1..15}; do
    if docker-compose exec -T postgres pg_isready -U collectivemind > /dev/null 2>&1; then
        print_success "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 15 ]; then
        print_warning "PostgreSQL may not be ready, but continuing..."
    fi
    sleep 2
done

# Check Redis
print_status "Checking Redis..."
for i in {1..15}; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is ready"
        break
    fi
    if [ $i -eq 15 ]; then
        print_warning "Redis may not be ready, but continuing..."
    fi
    sleep 2
done

print_success "Infrastructure services are ready!"

# Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_warning "Please update .env with your Google Cloud configuration before using AI features"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

print_status "Starting CollectiveMind application..."

# Start the application
echo ""
echo "🚀 CollectiveMind Agentic System is starting..."
echo ""
echo "Available endpoints:"
echo "• Frontend: http://localhost:3000"
echo "• Backend API: http://localhost:8000"
echo "• API Documentation: http://localhost:8000/api"
echo ""
echo "Agentic API Endpoints:"
echo "• Multi-agent processing: POST /api/agentic/process"
echo "• Predictive search: POST /api/agentic/predictive-search"
echo "• Query predictions: POST /api/agentic/predict-queries"
echo "• Serendipity discovery: POST /api/agentic/discover"
echo "• MCP tools: POST /api/agentic/mcp/execute"
echo "• Performance metrics: GET /api/agentic/performance"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start both frontend and backend
npm run dev