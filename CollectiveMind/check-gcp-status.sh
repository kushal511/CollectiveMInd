#!/bin/bash

# Quick GCP Status Checker for CollectiveMind

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[CHECK]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

echo "🔍 CollectiveMind GCP Status Check"
echo "=================================="
echo ""

# Check gcloud installation
if command -v gcloud &> /dev/null; then
    print_success "Google Cloud CLI is installed"
    GCLOUD_VERSION=$(gcloud version --format="value(Google Cloud SDK)" 2>/dev/null)
    echo "   Version: $GCLOUD_VERSION"
else
    print_error "Google Cloud CLI is not installed"
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo ""

# Check authentication
print_status "Checking authentication..."
CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
if [ -n "$CURRENT_ACCOUNT" ]; then
    print_success "Authenticated as: $CURRENT_ACCOUNT"
else
    print_error "Not authenticated with Google Cloud"
    echo "   Run: gcloud auth login"
fi

echo ""

# Check project
print_status "Checking project configuration..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -n "$CURRENT_PROJECT" ] && [ "$CURRENT_PROJECT" != "(unset)" ]; then
    print_success "Project set: $CURRENT_PROJECT"
    
    # Check if project exists and is accessible
    if gcloud projects describe "$CURRENT_PROJECT" &>/dev/null; then
        print_success "Project is accessible"
    else
        print_error "Cannot access project $CURRENT_PROJECT"
    fi
else
    print_error "No project configured"
    echo "   Run: gcloud config set project YOUR_PROJECT_ID"
fi

echo ""

# Check APIs
print_status "Checking required APIs..."
if [ -n "$CURRENT_PROJECT" ] && [ "$CURRENT_PROJECT" != "(unset)" ]; then
    
    # Check Vertex AI API
    if gcloud services list --enabled --filter="name:aiplatform.googleapis.com" --format="value(name)" 2>/dev/null | grep -q "aiplatform"; then
        print_success "Vertex AI API is enabled"
    else
        print_error "Vertex AI API is not enabled"
        echo "   Run: gcloud services enable aiplatform.googleapis.com"
    fi
    
    # Check Compute API
    if gcloud services list --enabled --filter="name:compute.googleapis.com" --format="value(name)" 2>/dev/null | grep -q "compute"; then
        print_success "Compute Engine API is enabled"
    else
        print_warning "Compute Engine API is not enabled (optional)"
    fi
    
else
    print_warning "Cannot check APIs - no project configured"
fi

echo ""

# Check .env file
print_status "Checking environment configuration..."
if [ -f .env ]; then
    print_success ".env file exists"
    
    # Check required variables
    if grep -q "GOOGLE_CLOUD_PROJECT_ID=" .env; then
        PROJECT_FROM_ENV=$(grep "GOOGLE_CLOUD_PROJECT_ID=" .env | cut -d'=' -f2 | tr -d '"')
        if [ "$PROJECT_FROM_ENV" == "your-project-id" ]; then
            print_warning "GOOGLE_CLOUD_PROJECT_ID needs to be updated in .env"
        else
            print_success "GOOGLE_CLOUD_PROJECT_ID is configured: $PROJECT_FROM_ENV"
        fi
    else
        print_error "GOOGLE_CLOUD_PROJECT_ID not found in .env"
    fi
    
    if grep -q "GOOGLE_APPLICATION_CREDENTIALS=" .env; then
        CREDS_FILE=$(grep "GOOGLE_APPLICATION_CREDENTIALS=" .env | cut -d'=' -f2 | tr -d '"')
        if [ -f "$CREDS_FILE" ]; then
            print_success "Service account key file exists: $CREDS_FILE"
        else
            print_warning "Service account key file not found: $CREDS_FILE"
        fi
    else
        print_success "Using Application Default Credentials"
    fi
    
else
    print_error ".env file not found"
    echo "   Run: cp .env.example .env and configure it"
fi

echo ""

# Check Application Default Credentials
print_status "Checking Application Default Credentials..."
if gcloud auth application-default print-access-token &>/dev/null; then
    print_success "Application Default Credentials are configured"
else
    print_warning "Application Default Credentials not configured"
    echo "   Run: gcloud auth application-default login"
fi

echo ""

# Summary
echo "📊 Status Summary"
echo "================="

ISSUES=0

if [ -z "$CURRENT_ACCOUNT" ]; then
    print_error "❌ Not authenticated with Google Cloud"
    ((ISSUES++))
fi

if [ -z "$CURRENT_PROJECT" ] || [ "$CURRENT_PROJECT" == "(unset)" ]; then
    print_error "❌ No project configured"
    ((ISSUES++))
fi

if [ -n "$CURRENT_PROJECT" ] && [ "$CURRENT_PROJECT" != "(unset)" ]; then
    if ! gcloud services list --enabled --filter="name:aiplatform.googleapis.com" --format="value(name)" 2>/dev/null | grep -q "aiplatform"; then
        print_error "❌ Vertex AI API not enabled"
        ((ISSUES++))
    fi
fi

if [ ! -f .env ]; then
    print_error "❌ .env file missing"
    ((ISSUES++))
fi

echo ""

if [ $ISSUES -eq 0 ]; then
    print_success "🎉 All checks passed! Your GCP setup is ready for CollectiveMind."
    echo ""
    echo "Next steps:"
    echo "1. Run: ./start-collectivemind.sh"
    echo "2. Test: node verify-real-embeddings.js"
else
    print_warning "⚠️  Found $ISSUES issue(s) that need attention."
    echo ""
    echo "Quick fix:"
    echo "Run: ./setup-gcp.sh"
fi

echo ""