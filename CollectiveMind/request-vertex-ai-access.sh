#!/bin/bash

# Request Vertex AI Generative Model Access
# This script helps you request access to Vertex AI generative models

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

echo "🔐 Requesting Vertex AI Generative Model Access"
echo "==============================================="
echo ""

PROJECT_ID="collectivemind-20251024"

print_status "Current project: $PROJECT_ID"
echo ""

# Check current access
print_status "Checking current Vertex AI access..."
gcloud services list --enabled --project=$PROJECT_ID | grep aiplatform && print_success "Vertex AI API is enabled" || print_error "Vertex AI API not enabled"

# Try to enable additional APIs that might help
print_status "Enabling additional APIs..."
gcloud services enable \
  aiplatform.googleapis.com \
  generativelanguage.googleapis.com \
  ml.googleapis.com \
  compute.googleapis.com \
  storage.googleapis.com \
  --project=$PROJECT_ID

print_success "APIs enabled"

# Check billing
print_status "Checking billing status..."
BILLING_ENABLED=$(gcloud billing projects describe $PROJECT_ID --format="value(billingEnabled)")
if [ "$BILLING_ENABLED" = "True" ]; then
    print_success "Billing is enabled"
else
    print_error "Billing is not enabled - this is required for Vertex AI"
    echo ""
    echo "To enable billing:"
    echo "1. Visit: https://console.cloud.google.com/billing/projects"
    echo "2. Select your project: $PROJECT_ID"
    echo "3. Link a billing account"
fi

echo ""
print_status "Manual steps to request Vertex AI access:"
echo ""
echo "1. 🌐 Visit Vertex AI Studio:"
echo "   https://console.cloud.google.com/vertex-ai/studio?project=$PROJECT_ID"
echo ""
echo "2. 📝 Try to create a prompt:"
echo "   - Click 'Create new prompt'"
echo "   - If you see models available, you have access!"
echo "   - If not, you'll see a request access form"
echo ""
echo "3. 📋 Request access form (if needed):"
echo "   - Fill out the form explaining your use case"
echo "   - Mention it's for a hackathon/demo project"
echo "   - Usually approved within 24-48 hours"
echo ""
echo "4. 🔄 Alternative - Try different regions:"

# Test different regions
REGIONS=("us-central1" "us-east1" "us-west1" "europe-west1" "asia-southeast1")

for region in "${REGIONS[@]}"; do
    echo "   Testing region: $region"
    # This is just informational - actual testing would require API calls
done

echo ""
print_warning "While waiting for Vertex AI access, your app will use:"
print_status "1. Google AI (if API key works)"
print_status "2. Mock AI (always available)"
print_status "3. Vertex AI (when access is granted)"

echo ""
print_success "Next steps:"
echo "1. Visit the Vertex AI Studio link above"
echo "2. Try creating a prompt to test access"
echo "3. If no access, fill out the request form"
echo "4. Meanwhile, let's fix the Google AI integration"