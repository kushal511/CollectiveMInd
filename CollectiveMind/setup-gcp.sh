#!/bin/bash

# CollectiveMind GCP Setup Script for AI Accelerate Hackathon
# This script sets up Google Cloud Platform for real Vertex AI integration

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

echo "🚀 CollectiveMind GCP Setup for AI Accelerate Hackathon"
echo "======================================================"
echo ""

# Check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI is not installed."
        echo ""
        echo "Please install it from: https://cloud.google.com/sdk/docs/install"
        echo ""
        echo "Quick install options:"
        echo "  macOS: brew install --cask google-cloud-sdk"
        echo "  Linux: curl https://sdk.cloud.google.com | bash"
        echo ""
        exit 1
    fi
    print_success "Google Cloud CLI is installed"
}

# Authenticate with Google Cloud
authenticate_gcloud() {
    print_status "Checking Google Cloud authentication..."
    
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q "@"; then
        CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
        print_success "Already authenticated as: $CURRENT_ACCOUNT"
        
        read -p "Do you want to use this account? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Authenticating with a different account..."
            gcloud auth login
        fi
    else
        print_status "Authenticating with Google Cloud..."
        gcloud auth login
    fi
}

# Create or select project
setup_project() {
    print_status "Setting up Google Cloud project..."
    
    # Check if project is already set
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
    
    if [ -n "$CURRENT_PROJECT" ] && [ "$CURRENT_PROJECT" != "(unset)" ]; then
        print_success "Current project: $CURRENT_PROJECT"
        
        read -p "Do you want to use this project for CollectiveMind? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            PROJECT_ID="$CURRENT_PROJECT"
            return
        fi
    fi
    
    echo ""
    echo "Choose an option:"
    echo "1. Create a new project"
    echo "2. Use an existing project"
    echo ""
    read -p "Enter your choice (1 or 2): " -n 1 -r
    echo ""
    
    if [[ $REPLY == "1" ]]; then
        # Create new project
        echo ""
        read -p "Enter a project ID for CollectiveMind (e.g., collectivemind-demo-2024): " PROJECT_ID
        
        if [ -z "$PROJECT_ID" ]; then
            PROJECT_ID="collectivemind-demo-$(date +%Y%m%d)"
            print_warning "Using default project ID: $PROJECT_ID"
        fi
        
        print_status "Creating project: $PROJECT_ID"
        gcloud projects create "$PROJECT_ID" --name="CollectiveMind Demo" || {
            print_error "Failed to create project. It might already exist."
            read -p "Enter an existing project ID to use: " PROJECT_ID
        }
        
    else
        # Use existing project
        echo ""
        print_status "Available projects:"
        gcloud projects list --format="table(projectId,name,projectNumber)"
        echo ""
        read -p "Enter the project ID you want to use: " PROJECT_ID
    fi
    
    # Set the project
    print_status "Setting project to: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
    
    print_success "Project set to: $PROJECT_ID"
}

# Enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    APIS=(
        "aiplatform.googleapis.com"
        "compute.googleapis.com"
        "storage.googleapis.com"
    )
    
    for api in "${APIS[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable "$api"
    done
    
    print_success "All required APIs enabled"
}

# Set up authentication
setup_authentication() {
    print_status "Setting up authentication for CollectiveMind..."
    
    echo ""
    echo "Choose authentication method:"
    echo "1. Application Default Credentials (recommended for development)"
    echo "2. Service Account Key (for production deployment)"
    echo ""
    read -p "Enter your choice (1 or 2): " -n 1 -r
    echo ""
    
    if [[ $REPLY == "1" ]]; then
        # Application Default Credentials
        print_status "Setting up Application Default Credentials..."
        gcloud auth application-default login
        
        AUTH_METHOD="adc"
        print_success "Application Default Credentials configured"
        
    else
        # Service Account Key
        print_status "Creating service account..."
        
        SERVICE_ACCOUNT="collectivemind-ai"
        SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"
        
        # Create service account
        gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
            --display-name="CollectiveMind AI Service Account" \
            --description="Service account for CollectiveMind AI operations" || {
            print_warning "Service account might already exist"
        }
        
        # Grant permissions
        print_status "Granting permissions..."
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
            --role="roles/aiplatform.user"
        
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
            --role="roles/storage.objectViewer"
        
        # Create and download key
        print_status "Creating service account key..."
        gcloud iam service-accounts keys create ./service-account-key.json \
            --iam-account="$SERVICE_ACCOUNT_EMAIL"
        
        AUTH_METHOD="service_account"
        print_success "Service account key created: ./service-account-key.json"
    fi
}

# Create .env file
create_env_file() {
    print_status "Creating .env configuration file..."
    
    if [ -f .env ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Skipping .env file creation"
            return
        fi
    fi
    
    # Create .env file
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://collectivemind:password@localhost:5432/collectivemind"

# Redis
REDIS_URL="redis://localhost:6379"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# JWT
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID="$PROJECT_ID"
GOOGLE_CLOUD_LOCATION="us-central1"

EOF

    if [ "$AUTH_METHOD" == "service_account" ]; then
        echo '# Google Cloud Authentication - Service Account' >> .env
        echo 'GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"' >> .env
    else
        echo '# Google Cloud Authentication - Application Default Credentials' >> .env
        echo '# No additional configuration needed' >> .env
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

# Logging
LOG_LEVEL="info"
LOG_FORMAT="json"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_WS_URL="ws://localhost:8000"
EOF

    print_success ".env file created successfully"
}

# Test the setup
test_setup() {
    print_status "Testing Google Cloud setup..."
    
    # Test gcloud access
    if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
        print_success "Project access confirmed"
    else
        print_error "Cannot access project $PROJECT_ID"
        return 1
    fi
    
    # Test Vertex AI API
    if gcloud services list --enabled --filter="name:aiplatform.googleapis.com" --format="value(name)" | grep -q "aiplatform"; then
        print_success "Vertex AI API is enabled"
    else
        print_error "Vertex AI API is not enabled"
        return 1
    fi
    
    print_success "Google Cloud setup test passed!"
}

# Main execution
main() {
    check_gcloud
    authenticate_gcloud
    setup_project
    enable_apis
    setup_authentication
    create_env_file
    test_setup
    
    echo ""
    echo "🎉 GCP Setup Complete!"
    echo "====================="
    echo ""
    echo "Configuration Summary:"
    echo "• Project ID: $PROJECT_ID"
    echo "• Authentication: $AUTH_METHOD"
    echo "• Vertex AI: Enabled"
    echo "• Gemini AI: Ready"
    echo "• Embeddings: text-embedding-004"
    echo ""
    echo "Next Steps:"
    echo "1. Run: npm install"
    echo "2. Run: ./start-collectivemind.sh"
    echo "3. Test: node verify-real-embeddings.js"
    echo ""
    echo "Your CollectiveMind is now ready for the AI Accelerate Hackathon! 🚀"
}

# Run main function
main "$@"