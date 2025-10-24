#!/bin/bash

# Foolproof GCP Setup for CollectiveMind

echo "🧠 CollectiveMind - Foolproof GCP Setup"
echo "======================================="
echo ""

# Step 1: Select project
echo "📋 Available projects:"
gcloud projects list --format="table(projectId,name)"
echo ""

echo "🎯 Recommended project: gen-lang-client-0973625306 (already set up for AI)"
echo ""
read -p "Enter project ID (or press Enter for gen-lang-client-0973625306): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID="gen-lang-client-0973625306"
    echo "Using recommended project: $PROJECT_ID"
fi

# Set project
echo ""
echo "Setting project to: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Step 2: Enable Vertex AI API
echo ""
echo "🔧 Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com --project="$PROJECT_ID"

# Step 3: Authentication with multiple fallbacks
echo ""
echo "🔐 Setting up authentication..."
echo ""
echo "Choose authentication method:"
echo "1. Browser authentication (recommended)"
echo "2. Copy-paste authentication (if browser doesn't work)"
echo "3. Skip authentication (use existing)"
echo ""
read -p "Choose (1-3): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo "Opening browser for authentication..."
        if gcloud auth application-default login; then
            echo "✅ Authentication successful!"
        else
            echo "❌ Browser authentication failed. Try option 2."
            exit 1
        fi
        ;;
    2)
        echo ""
        echo "📋 Copy and paste this URL into your browser:"
        echo ""
        gcloud auth application-default login --no-launch-browser
        ;;
    3)
        echo "Skipping authentication setup..."
        ;;
    *)
        echo "Invalid option. Trying browser authentication..."
        gcloud auth application-default login
        ;;
esac

# Step 4: Create .env file
echo ""
echo "📝 Creating .env configuration..."

cat > .env << EOF
# CollectiveMind Configuration
# Project: $PROJECT_ID
# Generated: $(date)

# Database
DATABASE_URL="postgresql://collectivemind:password@localhost:5432/collectivemind"

# Redis  
REDIS_URL="redis://localhost:6379"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# JWT
JWT_SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'collectivemind-secret-key')"
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

echo "✅ .env file created!"

# Step 5: Quick test
echo ""
echo "🧪 Quick test..."

# Test project access
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
    echo "✅ Project access: OK"
else
    echo "❌ Project access: Failed"
fi

# Test auth
if gcloud auth application-default print-access-token &>/dev/null; then
    echo "✅ Authentication: OK"
else
    echo "⚠️  Authentication: Needs verification"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your configuration:"
echo "• Project: $PROJECT_ID"
echo "• Vertex AI: Enabled"
echo "• Config file: .env created"
echo ""
echo "🚀 Ready to start CollectiveMind:"
echo "1. npm install"
echo "2. ./start-collectivemind.sh"
echo ""
echo "🧪 Test real AI integration:"
echo "node verify-real-embeddings.js"
echo ""
echo "Your CollectiveMind is ready for the AI Accelerate Hackathon! 🏆"