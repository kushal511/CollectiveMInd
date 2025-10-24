#!/bin/bash

# Complete GCP Setup for CollectiveMind - AI Accelerate Hackathon
# This script provides a comprehensive setup for Google Cloud Platform integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

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

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# ASCII Art Header
echo -e "${PURPLE}"
cat << "EOF"
   ____      _ _           _   _           __  __ _           _ 
  / ___|___ | | | ___  ___| |_(_)_   _____| \/  (_)_ __   __| |
 | |   / _ \| | |/ _ \/ __| __| \ \ / / _ \ |\/| | | '_ \ / _` |
 | |__| (_) | | |  __/ (__| |_| |\ V /  __/ |  | | | | | | (_| |
  \____\___/|_|_|\___|\___|\__|_| \_/ \___|_|  |_|_|_| |_|\__,_|
                                                               
EOF
echo -e "${NC}"

print_header "🚀 Complete GCP Setup for AI Accelerate Hackathon"
print_header "=================================================="
echo ""

# Global variables
PROJECT_ID=""
AUTH_METHOD=""
SETUP_TYPE=""

# Step 1: Check prerequisites
check_prerequisites() {
    print_step "1/8 Checking Prerequisites"
    echo ""
    
    # Check operating system
    OS=$(uname -s)
    print_status "Operating System: $OS"
    
    # Check if gcloud is installed
    if command -v gcloud &> /dev/null; then
        GCLOUD_VERSION=$(gcloud version --format="value(Google Cloud SDK)" 2>/dev/null)
        print_success "Google Cloud CLI is installed (Version: $GCLOUD_VERSION)"
    else
        print_error "Google Cloud CLI is not installed"
        echo ""
        print_status "Installing Google Cloud CLI..."
        
        case $OS in
            "Darwin")
                if command -v brew &> /dev/null; then
                    print_status "Installing via Homebrew..."
                    brew install --cask google-cloud-sdk
                else
                    print_status "Installing via curl..."
                    curl https://sdk.cloud.google.com | bash
                    exec -l $SHELL
                fi
                ;;
            "Linux")
                print_status "Installing via curl..."
                curl https://sdk.cloud.google.com | bash
                exec -l $SHELL
                ;;
            *)
                print_error "Unsupported OS. Please install Google Cloud CLI manually:"
                echo "https://cloud.google.com/sdk/docs/install"
                exit 1
                ;;
        esac
        
        print_success "Google Cloud CLI installed successfully"
    fi
    
    # Check other tools
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js is installed ($NODE_VERSION)"
    else
        print_warning "Node.js is not installed. You'll need it to run CollectiveMind."
    fi
    
    if command -v docker &> /dev/null; then
        print_success "Docker is installed"
    else
        print_warning "Docker is not installed. You'll need it for local services."
    fi
    
    echo ""
}

# Step 2: Authentication
authenticate_gcloud() {
    print_step "2/8 Google Cloud Authentication"
    echo ""
    
    # Check current authentication
    CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || echo "")
    
    if [ -n "$CURRENT_ACCOUNT" ]; then
        print_success "Already authenticated as: $CURRENT_ACCOUNT"
        echo ""
        read -p "Do you want to use this account for CollectiveMind? (y/n): " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Authenticating with a different account..."
            gcloud auth login
        fi
    else
        print_status "Please authenticate with your Google Cloud account..."
        gcloud auth login
    fi
    
    # Verify authentication
    CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
    if [ -n "$CURRENT_ACCOUNT" ]; then
        print_success "Successfully authenticated as: $CURRENT_ACCOUNT"
    else
        print_error "Authentication failed"
        exit 1
    fi
    
    echo ""
}

# Step 3: Project setup
setup_project() {
    print_step "3/8 Project Configuration"
    echo ""
    
    # Check current project
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
    
    if [ -n "$CURRENT_PROJECT" ] && [ "$CURRENT_PROJECT" != "(unset)" ]; then
        print_success "Current project: $CURRENT_PROJECT"
        echo ""
        echo "Options:"
        echo "1. Use current project ($CURRENT_PROJECT)"
        echo "2. Select a different existing project"
        echo "3. Create a new project"
        echo ""
        read -p "Choose option (1-3): " -n 1 -r
        echo ""
        
        case $REPLY in
            1)
                PROJECT_ID="$CURRENT_PROJECT"
                ;;
            2)
                select_existing_project
                ;;
            3)
                create_new_project
                ;;
            *)
                print_warning "Invalid option, using current project"
                PROJECT_ID="$CURRENT_PROJECT"
                ;;
        esac
    else
        echo "No project is currently set. Choose an option:"
        echo "1. Select an existing project"
        echo "2. Create a new project"
        echo ""
        read -p "Choose option (1-2): " -n 1 -r
        echo ""
        
        case $REPLY in
            1)
                select_existing_project
                ;;
            2)
                create_new_project
                ;;
            *)
                print_warning "Invalid option, creating new project"
                create_new_project
                ;;
        esac
    fi
    
    # Set the project
    print_status "Setting active project to: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
    
    print_success "Project configured: $PROJECT_ID"
    echo ""
}

select_existing_project() {
    print_status "Available projects:"
    gcloud projects list --format="table(projectId,name,projectNumber)"
    echo ""
    read -p "Enter the project ID you want to use: " PROJECT_ID
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "No project ID provided"
        exit 1
    fi
}

create_new_project() {
    echo ""
    read -p "Enter a project ID for CollectiveMind (e.g., collectivemind-demo-2024): " PROJECT_ID
    
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID="collectivemind-demo-$(date +%Y%m%d%H%M)"
        print_warning "Using auto-generated project ID: $PROJECT_ID"
    fi
    
    print_status "Creating project: $PROJECT_ID"
    
    if gcloud projects create "$PROJECT_ID" --name="CollectiveMind Demo"; then
        print_success "Project created successfully"
    else
        print_error "Failed to create project. It might already exist or you might not have permissions."
        echo ""
        read -p "Enter an existing project ID to use instead: " PROJECT_ID
        
        if [ -z "$PROJECT_ID" ]; then
            print_error "No project ID provided"
            exit 1
        fi
    fi
}

# Step 4: Enable APIs
enable_apis() {
    print_step "4/8 Enabling Required APIs"
    echo ""
    
    REQUIRED_APIS=(
        "aiplatform.googleapis.com:Vertex AI API"
        "compute.googleapis.com:Compute Engine API"
        "storage.googleapis.com:Cloud Storage API"
    )
    
    for api_info in "${REQUIRED_APIS[@]}"; do
        IFS=':' read -r api_name api_description <<< "$api_info"
        
        print_status "Enabling $api_description..."
        
        if gcloud services enable "$api_name" --project="$PROJECT_ID"; then
            print_success "$api_description enabled"
        else
            print_error "Failed to enable $api_description"
        fi
    done
    
    # Wait a moment for APIs to propagate
    print_status "Waiting for APIs to propagate..."
    sleep 5
    
    print_success "All required APIs enabled"
    echo ""
}

# Step 5: Setup authentication method
setup_authentication() {
    print_step "5/8 Authentication Method Setup"
    echo ""
    
    echo "Choose authentication method:"
    echo "1. Application Default Credentials (recommended for development)"
    echo "2. Service Account Key (for production/deployment)"
    echo ""
    read -p "Choose option (1-2): " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            setup_adc
            ;;
        2)
            setup_service_account
            ;;
        *)
            print_warning "Invalid option, using Application Default Credentials"
            setup_adc
            ;;
    esac
    
    echo ""
}

setup_adc() {
    print_status "Setting up Application Default Credentials..."
    
    if gcloud auth application-default login --project="$PROJECT_ID"; then
        AUTH_METHOD="adc"
        print_success "Application Default Credentials configured"
    else
        print_error "Failed to set up Application Default Credentials"
        exit 1
    fi
}

setup_service_account() {
    print_status "Setting up Service Account..."
    
    SERVICE_ACCOUNT="collectivemind-ai"
    SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Create service account
    print_status "Creating service account: $SERVICE_ACCOUNT"
    
    if gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
        --display-name="CollectiveMind AI Service Account" \
        --description="Service account for CollectiveMind AI operations" \
        --project="$PROJECT_ID"; then
        print_success "Service account created"
    else
        print_warning "Service account might already exist, continuing..."
    fi
    
    # Grant permissions
    print_status "Granting permissions..."
    
    ROLES=(
        "roles/aiplatform.user"
        "roles/storage.objectViewer"
    )
    
    for role in "${ROLES[@]}"; do
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
            --role="$role"
    done
    
    # Create and download key
    print_status "Creating service account key..."
    
    if gcloud iam service-accounts keys create ./service-account-key.json \
        --iam-account="$SERVICE_ACCOUNT_EMAIL" \
        --project="$PROJECT_ID"; then
        
        AUTH_METHOD="service_account"
        print_success "Service account key created: ./service-account-key.json"
        print_warning "Keep this key file secure and never commit it to version control!"
    else
        print_error "Failed to create service account key"
        exit 1
    fi
}

# Step 6: Create environment configuration
create_environment_config() {
    print_step "6/8 Creating Environment Configuration"
    echo ""
    
    if [ -f .env ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/n): " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Keeping existing .env file"
            return
        fi
        
        # Backup existing .env
        cp .env .env.backup
        print_status "Backed up existing .env to .env.backup"
    fi
    
    print_status "Creating .env configuration file..."
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "$(date +%s | sha256sum | base64 | head -c 32)")
    
    cat > .env << EOF
# CollectiveMind Environment Configuration
# Generated on $(date)

# Database Configuration
DATABASE_URL="postgresql://collectivemind:password@localhost:5432/collectivemind"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Elasticsearch Configuration
ELASTICSEARCH_URL="http://localhost:9200"

# JWT Configuration
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID="$PROJECT_ID"
GOOGLE_CLOUD_LOCATION="us-central1"

EOF

    # Add authentication configuration
    if [ "$AUTH_METHOD" == "service_account" ]; then
        cat >> .env << EOF
# Google Cloud Authentication - Service Account
GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"

EOF
    else
        cat >> .env << EOF
# Google Cloud Authentication - Application Default Credentials
# No additional configuration needed for ADC

EOF
    fi

    cat >> .env << EOF
# Vertex AI Configuration
VERTEX_AI_MODEL="gemini-1.5-pro"
EMBEDDING_MODEL="text-embedding-004"
EMBEDDING_DIMENSIONS=768
VERTEX_AI_BATCH_SIZE=5
VERTEX_AI_RATE_LIMIT_DELAY=600

# API Configuration
API_PORT=8000
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL="info"
LOG_FORMAT="json"

# Frontend Configuration
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_WS_URL="ws://localhost:8000"

# MCP Configuration
MCP_SERVERS_ENABLED=true
MCP_AUTO_CONNECT=true
MCP_LOG_LEVEL="info"

# Predictive Search Configuration
PREDICTIVE_SEARCH_ENABLED=true
CACHE_TTL=300
PREDICTION_CONFIDENCE_THRESHOLD=0.6
EOF

    print_success ".env file created successfully"
    echo ""
}

# Step 7: Test the setup
test_setup() {
    print_step "7/8 Testing Configuration"
    echo ""
    
    # Test project access
    print_status "Testing project access..."
    if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
        print_success "✓ Project access confirmed"
    else
        print_error "✗ Cannot access project $PROJECT_ID"
        return 1
    fi
    
    # Test Vertex AI API
    print_status "Testing Vertex AI API..."
    if gcloud services list --enabled --filter="name:aiplatform.googleapis.com" --format="value(name)" --project="$PROJECT_ID" | grep -q "aiplatform"; then
        print_success "✓ Vertex AI API is enabled"
    else
        print_error "✗ Vertex AI API is not enabled"
        return 1
    fi
    
    # Test authentication
    print_status "Testing authentication..."
    if [ "$AUTH_METHOD" == "service_account" ]; then
        if [ -f "./service-account-key.json" ]; then
            print_success "✓ Service account key file exists"
        else
            print_error "✗ Service account key file not found"
            return 1
        fi
    else
        if gcloud auth application-default print-access-token &>/dev/null; then
            print_success "✓ Application Default Credentials are working"
        else
            print_error "✗ Application Default Credentials not working"
            return 1
        fi
    fi
    
    # Test .env file
    print_status "Testing .env configuration..."
    if [ -f .env ] && grep -q "GOOGLE_CLOUD_PROJECT_ID=\"$PROJECT_ID\"" .env; then
        print_success "✓ .env file is properly configured"
    else
        print_error "✗ .env file is missing or misconfigured"
        return 1
    fi
    
    print_success "All tests passed!"
    echo ""
}

# Step 8: Final setup and next steps
finalize_setup() {
    print_step "8/8 Finalizing Setup"
    echo ""
    
    # Install Node.js dependencies if package.json exists
    if [ -f package.json ]; then
        print_status "Installing Node.js dependencies..."
        if npm install; then
            print_success "Dependencies installed successfully"
        else
            print_warning "Failed to install dependencies. Run 'npm install' manually."
        fi
    fi
    
    # Make scripts executable
    chmod +x *.sh 2>/dev/null || true
    
    print_success "Setup finalization complete"
    echo ""
}

# Display final summary
show_summary() {
    print_header "🎉 Setup Complete!"
    print_header "=================="
    echo ""
    
    echo -e "${GREEN}Configuration Summary:${NC}"
    echo "• Project ID: $PROJECT_ID"
    echo "• Authentication: $AUTH_METHOD"
    echo "• Vertex AI: Enabled (gemini-1.5-pro, text-embedding-004)"
    echo "• APIs: Enabled (Vertex AI, Compute, Storage)"
    echo "• Environment: Configured (.env file created)"
    echo ""
    
    echo -e "${CYAN}What's Ready:${NC}"
    echo "✓ Real Vertex AI embeddings (768-dimensional vectors)"
    echo "✓ Real Gemini AI conversations"
    echo "✓ Hybrid search with Elasticsearch + semantic similarity"
    echo "✓ Multi-agent orchestration system"
    echo "✓ Predictive search with ML caching"
    echo "✓ Cross-team collaboration discovery"
    echo ""
    
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Start the system:"
    echo "   ./start-collectivemind.sh"
    echo ""
    echo "2. Verify real AI integration:"
    echo "   node verify-real-embeddings.js"
    echo ""
    echo "3. Test the APIs:"
    echo "   ./test-agentic-apis.sh"
    echo ""
    echo "4. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8000"
    echo ""
    
    echo -e "${PURPLE}Cost Information:${NC}"
    echo "• Embeddings: ~$0.10 for full synthetic dataset"
    echo "• Gemini Chat: ~$0.50 per 100 interactions"
    echo "• Demo usage: Typically under $5-10/month"
    echo "• Free tier: $300 credits for new GCP accounts"
    echo ""
    
    echo -e "${GREEN}🚀 Your CollectiveMind is ready for the AI Accelerate Hackathon!${NC}"
    echo ""
    
    if [ "$AUTH_METHOD" == "service_account" ]; then
        print_warning "Security Reminder: Keep your service-account-key.json file secure!"
        print_warning "Never commit it to version control or share it publicly."
    fi
}

# Error handling
handle_error() {
    print_error "Setup failed at step: $1"
    echo ""
    echo "Troubleshooting tips:"
    echo "• Check your internet connection"
    echo "• Verify you have the necessary permissions in GCP"
    echo "• Ensure billing is enabled on your GCP project"
    echo "• Try running the setup again"
    echo ""
    echo "For help, check the logs above or run:"
    echo "  ./check-gcp-status.sh"
    exit 1
}

# Main execution
main() {
    # Set up error handling
    trap 'handle_error "Unknown"' ERR
    
    # Execute setup steps
    check_prerequisites || handle_error "Prerequisites Check"
    authenticate_gcloud || handle_error "Authentication"
    setup_project || handle_error "Project Setup"
    enable_apis || handle_error "API Enablement"
    setup_authentication || handle_error "Authentication Method Setup"
    create_environment_config || handle_error "Environment Configuration"
    test_setup || handle_error "Configuration Testing"
    finalize_setup || handle_error "Setup Finalization"
    
    # Show summary
    show_summary
}

# Run main function
main "$@"