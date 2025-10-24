#!/bin/bash

# Simple GCP Setup - Manual Steps

echo "🔧 Simple GCP Setup for CollectiveMind"
echo "======================================"
echo ""

# Get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
echo "Current project: $CURRENT_PROJECT"
echo ""

# Create .env file with current project
if [ -n "$CURRENT_PROJECT" ] && [ "$CURRENT_PROJECT" != "(unset)" ]; then
    echo "Creating .env file with project: $CURRENT_PROJECT"
    
    cat > .env << EOF
# CollectiveMind Configuration
DATABASE_URL="postgresql://collectivemind:password@localhost:5432/collectivemind"
REDIS_URL="redis://localhost:6379"
ELASTICSEARCH_URL="http://localhost:9200"

# JWT
JWT_SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'collectivemind-jwt-secret')"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID="$CURRENT_PROJECT"
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

    echo "✅ .env file created successfully!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Enable billing for your project (if not already enabled):"
    echo "   https://console.cloud.google.com/billing/linkedaccount?project=$CURRENT_PROJECT"
    echo ""
    echo "2. Enable Vertex AI API:"
    echo "   https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=$CURRENT_PROJECT"
    echo ""
    echo "3. Set up authentication in browser:"
    echo "   gcloud auth application-default login"
    echo ""
    echo "4. Start CollectiveMind:"
    echo "   ./start-collectivemind.sh"
    echo ""
    echo "🚀 Your project $CURRENT_PROJECT is ready for CollectiveMind!"
    
else
    echo "❌ No project found. Please set a project first:"
    echo ""
    echo "Available projects:"
    gcloud projects list --format="table(projectId,name)"
    echo ""
    echo "Set a project with:"
    echo "gcloud config set project YOUR_PROJECT_ID"
    echo ""
    echo "Then run this script again."
fi