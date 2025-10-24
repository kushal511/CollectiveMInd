#!/bin/bash

# Quick GCP Setup for Existing Account

echo "🚀 Quick GCP Setup for CollectiveMind"
echo "===================================="
echo ""

# Step 1: Login
echo "Step 1: Authenticate with your existing GCP account"
gcloud auth login

# Step 2: Set project
echo ""
echo "Step 2: Select your project"
echo "Available projects:"
gcloud projects list --format="table(projectId,name)"
echo ""
read -p "Enter your project ID (or press Enter to create a new one): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    # Create new project
    PROJECT_ID="collectivemind-$(date +%Y%m%d)"
    echo "Creating new project: $PROJECT_ID"
    gcloud projects create "$PROJECT_ID" --name="CollectiveMind Demo"
fi

gcloud config set project "$PROJECT_ID"

# Step 3: Enable APIs
echo ""
echo "Step 3: Enabling required APIs..."
gcloud services enable aiplatform.googleapis.com
gcloud services enable compute.googleapis.com

# Step 4: Set up Application Default Credentials
echo ""
echo "Step 4: Setting up authentication for the app..."
gcloud auth application-default login

# Step 5: Create .env file
echo ""
echo "Step 5: Creating configuration file..."
cat > .env << EOF
# Database
DATABASE_URL="postgresql://collectivemind:password@localhost:5432/collectivemind"

# Redis
REDIS_URL="redis://localhost:6379"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# JWT
JWT_SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'your-super-secret-jwt-key')"
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

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Configuration:"
echo "• Project: $PROJECT_ID"
echo "• Vertex AI: Enabled"
echo "• Authentication: Application Default Credentials"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. ./start-collectivemind.sh"
echo ""
echo "Your CollectiveMind is ready for real Vertex AI! 🚀"