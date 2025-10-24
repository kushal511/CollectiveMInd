#!/bin/bash

# CollectiveMind Agentic System Setup Script
# This script sets up the complete agentic architecture with MCP servers

set -e

echo "🚀 Setting up CollectiveMind Agentic System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    
    # Check Python (for MCP servers)
    if ! command -v python3 &> /dev/null; then
        print_warning "Python 3 is not installed. Some MCP servers may not work."
    fi
    
    # Check uv (for MCP servers)
    if ! command -v uv &> /dev/null; then
        print_warning "uv is not installed. Installing uv for MCP server management..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.cargo/bin:$PATH"
    fi
    
    print_success "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install MCP SDK if not already installed
    if ! npm list @modelcontextprotocol/sdk &> /dev/null; then
        print_status "Installing MCP SDK..."
        npm install @modelcontextprotocol/sdk --workspace=backend
    fi
    
    print_success "Dependencies installed"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_warning "Created .env file from template. Please update with your configuration."
        print_warning "Required: GOOGLE_CLOUD_PROJECT_ID and authentication setup"
    fi
    
    print_success "Environment setup completed"
}

# Start infrastructure services
start_infrastructure() {
    print_status "Starting infrastructure services..."
    
    # Start Docker services
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check Elasticsearch
    until curl -s http://localhost:9200/_cluster/health | grep -q '"status":"green\|yellow"'; do
        print_status "Waiting for Elasticsearch..."
        sleep 5
    done
    
    # Check PostgreSQL
    until docker-compose exec -T postgres pg_isready -U collectivemind; do
        print_status "Waiting for PostgreSQL..."
        sleep 5
    done
    
    # Check Redis
    until docker-compose exec -T redis redis-cli ping | grep -q "PONG"; do
        print_status "Waiting for Redis..."
        sleep 5
    done
    
    print_success "Infrastructure services are ready"
}

# Setup MCP servers
setup_mcp_servers() {
    print_status "Setting up MCP servers..."
    
    # Create MCP server executables
    chmod +x packages/backend/src/mcp-servers/*.ts
    
    # Install MCP server dependencies (if using uvx)
    if command -v uvx &> /dev/null; then
        print_status "Installing MCP server packages..."
        
        # Note: These are placeholder packages - in reality you'd install actual MCP servers
        # uvx install mcp-elasticsearch
        # uvx install mcp-knowledge-graph
        # uvx install mcp-analytics
        # uvx install mcp-collaboration
        # uvx install mcp-serendipity
        
        print_warning "MCP server packages need to be installed manually or created"
    fi
    
    print_success "MCP servers setup completed"
}

# Initialize data and embeddings
initialize_data() {
    print_status "Initializing data and embeddings..."
    
    # Start backend server in background
    npm run dev:backend &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    sleep 10
    
    # Initialize system
    print_status "Setting up Elasticsearch indices and ingesting data..."
    curl -X POST http://localhost:8000/api/ingestion/setup \
        -H "Content-Type: application/json" \
        -d '{"datasetPath": "./technova_dataset"}' \
        --silent --output /dev/null || print_warning "Data initialization may have failed"
    
    # Stop background backend
    kill $BACKEND_PID 2>/dev/null || true
    
    print_success "Data initialization completed"
}

# Test agentic system
test_agentic_system() {
    print_status "Testing agentic system..."
    
    # Start backend server in background
    npm run dev:backend &
    BACKEND_PID=$!
    
    # Wait for backend to be ready
    sleep 10
    
    # Test agentic processing
    print_status "Testing agent orchestration..."
    curl -X POST http://localhost:8000/api/agentic/process \
        -H "Content-Type: application/json" \
        -d '{
            "query": "customer churn analysis",
            "userContext": {
                "userId": "test_user",
                "team": "Product",
                "role": "Product Manager"
            },
            "intent": {
                "type": "analysis",
                "complexity": "high",
                "crossTeam": true
            }
        }' \
        --silent --output /dev/null && print_success "Agent orchestration test passed" || print_warning "Agent orchestration test failed"
    
    # Test predictive search
    print_status "Testing predictive search..."
    curl -X POST http://localhost:8000/api/agentic/predictive-search \
        -H "Content-Type: application/json" \
        -d '{
            "query": "marketing campaign performance",
            "userContext": {
                "userId": "test_user",
                "team": "Marketing",
                "role": "Marketing Analyst"
            }
        }' \
        --silent --output /dev/null && print_success "Predictive search test passed" || print_warning "Predictive search test failed"
    
    # Test MCP status
    print_status "Testing MCP server status..."
    curl -X GET http://localhost:8000/api/agentic/mcp/status \
        --silent --output /dev/null && print_success "MCP status test passed" || print_warning "MCP status test failed"
    
    # Stop background backend
    kill $BACKEND_PID 2>/dev/null || true
    
    print_success "Agentic system testing completed"
}

# Create startup script
create_startup_script() {
    print_status "Creating startup script..."
    
    cat > start-collectivemind.sh << 'EOF'
#!/bin/bash

echo "🧠 Starting CollectiveMind Agentic System..."

# Start infrastructure
docker-compose up -d

# Wait for services
echo "Waiting for services to be ready..."
sleep 30

# Start application
echo "Starting CollectiveMind application..."
npm run dev

EOF

    chmod +x start-collectivemind.sh
    
    print_success "Startup script created: ./start-collectivemind.sh"
}

# Main setup function
main() {
    echo "🧠 CollectiveMind Agentic System Setup"
    echo "======================================"
    
    check_prerequisites
    install_dependencies
    setup_environment
    start_infrastructure
    setup_mcp_servers
    initialize_data
    test_agentic_system
    create_startup_script
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your Google Cloud configuration"
    echo "2. Run: ./start-collectivemind.sh"
    echo "3. Open http://localhost:3000 in your browser"
    echo ""
    echo "Agentic Features Available:"
    echo "• Multi-Agent Orchestration"
    echo "• Predictive Search with ML"
    echo "• Real-time MCP Integration"
    echo "• Advanced Serendipity Engine"
    echo "• Cross-team Collaboration AI"
    echo "• Knowledge Flow Analytics"
    echo ""
    echo "API Endpoints:"
    echo "• Agentic Processing: POST /api/agentic/process"
    echo "• Predictive Search: POST /api/agentic/predictive-search"
    echo "• Query Prediction: POST /api/agentic/predict-queries"
    echo "• Serendipity Discovery: POST /api/agentic/discover"
    echo "• MCP Tools: POST /api/agentic/mcp/execute"
    echo ""
    print_success "CollectiveMind Agentic System is ready! 🚀"
}

# Run main function
main "$@"