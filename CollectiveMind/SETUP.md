# CollectiveMind Setup Guide

## 🚀 Quick Start with Real-Time AI

This guide will help you set up CollectiveMind with **real Vertex AI** and **synthetic data** for a complete demo experience.

## Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Google Cloud account (for real AI features)

## 1. Google Cloud Setup (Required for Real AI)

### Create Google Cloud Project
```bash
# Install Google Cloud CLI if not already installed
# Visit: https://cloud.google.com/sdk/docs/install

# Create a new project
gcloud projects create your-collectivemind-project --name="CollectiveMind Demo"

# Set the project
gcloud config set project your-collectivemind-project
```

### Enable Required APIs
```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com

# Enable other required APIs
gcloud services enable compute.googleapis.com
gcloud services enable storage.googleapis.com
```

### Authentication Setup (Choose One Method)

#### Method A: Service Account (Recommended for Production)
```bash
# Create service account
gcloud iam service-accounts create collectivemind-ai \
    --display-name="CollectiveMind AI Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding your-collectivemind-project \
    --member="serviceAccount:collectivemind-ai@your-collectivemind-project.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create ./service-account-key.json \
    --iam-account=collectivemind-ai@your-collectivemind-project.iam.gserviceaccount.com
```

#### Method B: Application Default Credentials (Easier for Development)
```bash
# Authenticate with your Google account
gcloud auth application-default login
```

## 2. Project Setup

### Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd collectivemind-app

# Install dependencies
npm install
```

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env
```

**Required Environment Variables:**
```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID="your-collectivemind-project"
GOOGLE_CLOUD_LOCATION="us-central1"

# If using service account key (Method A)
GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"

# Database and Services (use defaults for local development)
DATABASE_URL="postgresql://collectivemind:password@localhost:5432/collectivemind"
REDIS_URL="redis://localhost:6379"
ELASTICSEARCH_URL="http://localhost:9200"
```

## 3. Start Services

### Start Infrastructure Services
```bash
# Start Elasticsearch, PostgreSQL, and Redis
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
docker-compose logs -f elasticsearch
# Wait until you see "started" in the logs, then Ctrl+C
```

### Initialize Data
```bash
# Start the backend server
npm run dev:backend

# In another terminal, initialize the system
curl -X POST http://localhost:8000/api/ingestion/setup \
  -H "Content-Type: application/json" \
  -d '{"datasetPath": "./technova_dataset"}'

# This will:
# 1. Create Elasticsearch indices
# 2. Ingest synthetic data
# 3. Generate real embeddings using Vertex AI
```

### Start Frontend
```bash
# In another terminal
npm run dev:frontend
```

## 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Elasticsearch**: http://localhost:9200
- **API Documentation**: http://localhost:8000/api

## 5. Test Real-Time Features

### Test Search
```bash
# Test hybrid search
curl -X POST http://localhost:8000/api/search/hybrid \
  -H "Content-Type: application/json" \
  -d '{
    "query": "customer churn analysis",
    "userContext": {
      "userId": "maya_chen",
      "team": "Product",
      "role": "Product Manager"
    }
  }'
```

### Test AI Chat
```bash
# Test AI chat
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the main causes of customer churn?",
    "userContext": {
      "userId": "maya_chen",
      "team": "Product",
      "role": "Product Manager"
    }
  }'
```

## 6. Features Available

### ✅ Real-Time Services
- **Elasticsearch**: Hybrid search with keyword + semantic similarity
- **PostgreSQL**: User data and session management
- **Redis**: Caching and real-time features
- **WebSocket**: Live search results and chat streaming

### ✅ Real AI Integration
- **Vertex AI Embeddings**: Real 768-dimensional vectors for semantic search
- **Gemini AI Chat**: Intelligent conversations with context awareness
- **Real-time Streaming**: Live AI responses with citations

### ✅ Synthetic Data
- **Safe Demo Data**: No sensitive company information
- **Realistic Scenarios**: Product, Marketing, Engineering teams
- **Cross-team Collaboration**: Realistic overlap detection

## 7. Monitoring and Logs

### Check Service Health
```bash
# Backend health
curl http://localhost:8000/health

# Elasticsearch health
curl http://localhost:9200/_cluster/health

# Check ingestion progress
curl http://localhost:8000/api/ingestion/progress

# Check embedding progress
curl http://localhost:8000/api/ingestion/embeddings/progress
```

### View Logs
```bash
# Backend logs
npm run dev:backend

# Docker services logs
docker-compose logs -f elasticsearch
docker-compose logs -f postgres
docker-compose logs -f redis
```

## 8. Troubleshooting

### Common Issues

**Google Cloud Authentication Error:**
```bash
# Verify authentication
gcloud auth list
gcloud config get-value project

# Re-authenticate if needed
gcloud auth application-default login
```

**Elasticsearch Connection Error:**
```bash
# Check if Elasticsearch is running
docker-compose ps elasticsearch

# Restart if needed
docker-compose restart elasticsearch
```

**Vertex AI API Error:**
```bash
# Verify API is enabled
gcloud services list --enabled | grep aiplatform

# Check quotas
gcloud compute project-info describe --project=your-collectivemind-project
```

### Performance Tips

1. **Embedding Generation**: Initial setup takes 5-10 minutes for real embeddings
2. **Search Performance**: First searches may be slower as indices warm up
3. **AI Responses**: Gemini responses typically take 1-3 seconds

## 9. Cost Estimation

### Google Cloud Costs (Approximate)
- **Vertex AI Embeddings**: ~$0.10 for full dataset (~1000 documents)
- **Gemini API**: ~$0.50 per 100 chat interactions
- **Monthly Demo Usage**: Typically under $5-10

### Free Tier Benefits
- Google Cloud offers $300 free credits for new accounts
- Vertex AI has generous free quotas for development

## 🎉 You're Ready!

Your CollectiveMind instance is now running with:
- **Real-time hybrid search** powered by Elasticsearch + Vertex AI
- **Intelligent AI chat** with Gemini and contextual citations
- **Live WebSocket updates** for seamless user experience
- **Safe synthetic data** for realistic demonstrations

Visit http://localhost:3000 to start exploring your organizational memory platform!