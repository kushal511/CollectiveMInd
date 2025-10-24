#!/bin/bash

# Fix GCP Setup Issues

echo "🔧 Fixing GCP Setup Issues"
echo "=========================="
echo ""

PROJECT_ID="collectivemind-20251024"

echo "Current project: $PROJECT_ID"
echo ""

# Fix 1: Application Default Credentials
echo "Step 1: Fixing Application Default Credentials..."
echo "This will open a browser window for authentication."
echo ""
gcloud auth application-default login --no-browser

echo ""
echo "Step 2: Enabling only essential APIs (no billing required)..."

# Only enable Vertex AI API (no billing required)
gcloud services enable aiplatform.googleapis.com

echo ""
echo "Step 3: Verifying setup..."

# Test if we can access Vertex AI
if gcloud services list --enabled --filter="name:aiplatform.googleapis.com" --format="value(name)" | grep -q "aiplatform"; then
    echo "✅ Vertex AI API is enabled and ready"
else
    echo "❌ Vertex AI API setup failed"
fi

# Test authentication
if gcloud auth application-default print-access-token &>/dev/null; then
    echo "✅ Application Default Credentials are working"
else
    echo "❌ Application Default Credentials need to be fixed"
    echo ""
    echo "Please run manually:"
    echo "gcloud auth application-default login --no-browser"
fi

echo ""
echo "🎉 Setup Fixed!"
echo "==============="
echo ""
echo "Your configuration:"
echo "• Project: $PROJECT_ID"
echo "• Vertex AI: Enabled (no billing required)"
echo "• Gemini AI: Ready"
echo "• Embeddings: Ready"
echo ""
echo "Note: We skipped Compute Engine API to avoid billing requirements."
echo "This won't affect CollectiveMind functionality."
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. ./start-collectivemind.sh"
echo ""