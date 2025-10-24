#!/bin/bash

# Google Cloud Setup Script for CollectiveMind
echo "🚀 Setting up Google Cloud for CollectiveMind..."

# Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
    echo "🔐 Please authenticate with Google Cloud:"
    gcloud auth login
    gcloud auth application-default login
fi

# Set project if not already set
if [ -z "$GOOGLE_CLOUD_PROJECT_ID" ]; then
    echo "📋 Available projects:"
    gcloud projects list --format="table(projectId,name)"
    echo ""
    read -p "Enter your Google Cloud Project ID: " PROJECT_ID
    export GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID
    gcloud config set project $PROJECT_ID
else
    echo "✅ Using project: $GOOGLE_CLOUD_PROJECT_ID"
    gcloud config set project $GOOGLE_CLOUD_PROJECT_ID
fi

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable aiplatform.googleapis.com
gcloud services enable vertexai.googleapis.com

# Set default region
if [ -z "$GOOGLE_CLOUD_LOCATION" ]; then
    export GOOGLE_CLOUD_LOCATION="us-central1"
fi

echo "✅ Google Cloud setup complete!"
echo ""
echo "📝 Environment variables to set:"
echo "   export GOOGLE_CLOUD_PROJECT_ID=$GOOGLE_CLOUD_PROJECT_ID"
echo "   export GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION"
echo ""
echo "💡 Add these to your .env file in the backend directory"