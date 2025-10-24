#!/bin/bash

# Simple Project Selection and Setup for CollectiveMind

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 CollectiveMind Project Setup"
echo "==============================="
echo ""

echo "Available projects:"
gcloud projects list --format="table(projectId,name,projectNumber)"
echo ""

read -p "Enter the project ID you want to use for CollectiveMind: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}No project ID provided. Exiting.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Setting up project: $PROJECT_ID${NC}"

# Set the project
gcloud config set project "$PROJECT_ID"

# Check if billing is enabled
echo ""
echo -e "${BLUE}Checking billing status...${NC}"
BILLING_ACCOUNT=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingAccountName)" 2>/dev/null || echo "")

if [ -z "$BILLING_ACCOUNT" ]; then
    echo -e "${YELLOW}⚠️  Billing is not enabled for this project.${NC}"
    echo ""
    echo "To enable billing:"
    echo "1. Go to: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
    echo "2. Link a billing account to your project"
    echo "3. Come back and run this script again"
    echo ""
    read -p "Do you want to continue anyway? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Billing is enabled${NC}"
fi

# Enable Vertex AI API (this should work even without billing for basic usage)
echo ""
echo -e "${BLUE}Enabling Vertex AI API...${NC}"
if gcloud services enable aiplatform.googleapis.com --project="$PROJECT_ID"; then
    echo -e "${GREEN}✓ Vertex AI API enabled${NC}"
else
    echo -e "${RED}✗ Failed to enable Vertex AI API${NC}"
fi

# Set up Application Default Credentials with no-browser flag
echo ""
echo -e "${BLUE}Setting up authentication...${NC}"
echo "This will open a browser window for authentication."
echo ""

if gcloud auth application-default login --no-browser; then
    echo -e "${GREEN}✓ Authentication successful${NC}"
else
    echo -e "${YELLOW}⚠️  Browser authentication failed. Trying alternative method...${NC}"
    
    # Try regular auth
    if gcloud auth login --no-browser; then
        echo -e "${GREEN}✓ Authentication successful${NC}"
        
        # Set application default credentials
        gcloud auth application-default login --no-browser
    else
        echo -e "${RED}✗ Authentication failed${NC}"
        echo ""
        echo "Manual authentication steps:"
        echo "1. Run: gcloud auth login"
        echo "2. Run: gcloud auth application-default login"
        echo "3. Then run this script again"
        exit 1
    fi
fi

# Create .env file
echo ""
echo -e "${BLUE}Creating .env configuration...${NC}"

cat > .env << EOF
# CollectiveMind Configuration
# Project: $PROJECT_ID

# Database
DATABASE_URL="postgresql://collectivemind:password@localhost:5432/collectivemind"

# Redis
REDIS_URL="redis://localhost:6379"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# JWT
JWT_SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'collectivemind-jwt-secret-key')"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID="$PROJECT_ID"
GOOGLE_CLOUD_LOCATION="us-central1"

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

echo -e "${GREEN}✓ .env file created${NC}"

# Test the setup
echo ""
echo -e "${BLUE}Testing setup...${NC}"

# Test project access
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
    echo -e "${GREEN}✓ Project access confirmed${NC}"
else
    echo -e "${RED}✗ Cannot access project${NC}"
fi

# Test Vertex AI API
if gcloud services list --enabled --filter="name:aiplatform.googleapis.com" --format="value(name)" --project="$PROJECT_ID" | grep -q "aiplatform"; then
    echo -e "${GREEN}✓ Vertex AI API is enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Vertex AI API status unclear${NC}"
fi

# Test authentication
if gcloud auth application-default print-access-token &>/dev/null; then
    echo -e "${GREEN}✓ Authentication is working${NC}"
else
    echo -e "${YELLOW}⚠️  Authentication needs verification${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Basic setup complete!${NC}"
echo ""
echo "Configuration:"
echo "• Project: $PROJECT_ID"
echo "• Vertex AI: Enabled"
echo "• Authentication: Application Default Credentials"
echo ""
echo "Next steps:"
echo "1. Install dependencies: npm install"
echo "2. Start CollectiveMind: ./start-collectivemind.sh"
echo "3. Verify AI: node verify-real-embeddings.js"
echo ""

if [ -z "$BILLING_ACCOUNT" ]; then
    echo -e "${YELLOW}Note: Some features may be limited without billing enabled.${NC}"
    echo "Enable billing at: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
    echo ""
fi

echo -e "${BLUE}Your CollectiveMind is ready for the hackathon! 🚀${NC}"