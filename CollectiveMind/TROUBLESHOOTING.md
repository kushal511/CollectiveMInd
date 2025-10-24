# CollectiveMind Troubleshooting Guide

## 🚨 Quick Fix for Vertex AI Issues

If you're experiencing Vertex AI authentication or access issues during the hackathon, use our **Demo Mode** for a fully functional demonstration:

```bash
./setup-demo-mode.sh
```

This creates a complete working demo with mock AI services that showcase all CollectiveMind features.

## 🔧 Vertex AI Troubleshooting

### Issue: "Permission denied" or "API not enabled"

**Solution 1: Check API Status**
```bash
# Check if Vertex AI API is enabled
gcloud services list --enabled --project=gen-lang-client-0973625306 | grep aiplatform

# If not enabled, enable it
gcloud services enable aiplatform.googleapis.com --project=gen-lang-client-0973625306

# Wait 2-3 minutes for propagation
```

**Solution 2: Check Permissions**
```bash
# Check your current permissions
gcloud projects get-iam-policy gen-lang-client-0973625306 \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:$(gcloud config get-value account)"
```

**Solution 3: Re-authenticate**
```bash
# Clear existing auth
gcloud auth revoke --all

# Re-authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project gen-lang-client-0973625306
```

### Issue: "Quota exceeded" or "Rate limit"

**Solution: Use Demo Mode**
```bash
./setup-demo-mode.sh
```

Demo mode provides unlimited "AI" responses without API quotas.

### Issue: "Service account key not found"

**Solution 1: Use Application Default Credentials**
```bash
gcloud auth application-default login
```

**Solution 2: Create New Service Account**
```bash
# Run the full setup script
./setup-gcp.sh
```

## 🐛 Common Development Issues

### Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- "Database does not exist"

**Solutions:**
```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Create database
createdb collectivemind

# Run migrations
cd packages/backend
npm run db:migrate
```

### Redis Connection Issues

**Symptoms:**
- "Redis connection failed"
- "ECONNREFUSED 127.0.0.1:6379"

**Solutions:**
```bash
# Start Redis (macOS with Homebrew)
brew services start redis

# Or start manually
redis-server
```

### Elasticsearch Issues

**Symptoms:**
- "Elasticsearch cluster is down"
- "Connection timeout"

**Solutions:**
```bash
# Start Elasticsearch (macOS with Homebrew)
brew services start elasticsearch

# Or using Docker
docker run -d -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.11.0
```

### Frontend Build Issues

**Symptoms:**
- "Module not found" errors
- TypeScript compilation errors

**Solutions:**
```bash
cd packages/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Backend API Issues

**Symptoms:**
- "Port already in use"
- "Cannot start server"

**Solutions:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
export API_PORT=8001
```

## 🎯 Demo Mode Features

When using `./setup-demo-mode.sh`, you get:

### ✅ What Works in Demo Mode
- **Semantic Search**: Mock embeddings with realistic similarity
- **AI Chat**: Contextual responses using mock AI
- **Knowledge Management**: Full CRUD operations
- **Real-time Updates**: WebSocket connections
- **User Authentication**: Complete auth system
- **Data Visualization**: All charts and analytics
- **API Endpoints**: All REST and GraphQL endpoints

### 🔄 Automatic Fallback
The system automatically falls back to demo mode if:
- Vertex AI authentication fails
- API quotas are exceeded
- Network connectivity issues occur
- Service account permissions are insufficient

### 🧪 Testing Demo Mode
```bash
# Verify demo setup
node verify-demo-setup.js

# Check AI service status
curl http://localhost:8000/api/health

# Test embedding generation
curl -X POST http://localhost:8000/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"text": "test query"}'
```

## 🚀 Hackathon Quick Start

### Option 1: Full Vertex AI Setup (if working)
```bash
./setup-gcp.sh
npm install
npm run dev
```

### Option 2: Demo Mode (recommended for hackathon)
```bash
./setup-demo-mode.sh
npm install
npm run demo:start
```

### Option 3: Hybrid Approach
```bash
# Try real setup first
./setup-gcp.sh

# If issues occur, fallback to demo
./setup-demo-mode.sh
```

## 📊 Monitoring and Debugging

### Check Service Status
```bash
# Backend health check
curl http://localhost:8000/api/health

# Database connection
npm run db:status

# AI service status
curl http://localhost:8000/api/ai/status
```

### View Logs
```bash
# Backend logs
cd packages/backend
npm run logs

# Frontend logs
cd packages/frontend
npm run logs

# System logs (macOS)
log show --predicate 'process == "node"' --last 5m
```

### Performance Monitoring
```bash
# Check memory usage
ps aux | grep node

# Check port usage
lsof -i :8000
lsof -i :3000

# Check disk space
df -h
```

## 🆘 Emergency Hackathon Recovery

If everything breaks during the hackathon:

### 1. Nuclear Reset
```bash
# Stop all services
pkill -f node
pkill -f npm

# Clean everything
rm -rf node_modules packages/*/node_modules
rm -f .env packages/*/.env

# Fresh start with demo mode
./setup-demo-mode.sh
npm install
npm run demo:start
```

### 2. Minimal Working Demo
```bash
# Just the essentials
cd packages/backend
npm install --production
npm run db:migrate
npm run seed:demo
npm start &

cd ../frontend
npm install --production
npm run build
npm start
```

### 3. Static Demo (last resort)
```bash
# Build static version
cd packages/frontend
npm run build
npm run export

# Serve static files
npx serve out
```

## 📞 Getting Help

### During Hackathon
1. **Check this guide first**
2. **Use demo mode**: `./setup-demo-mode.sh`
3. **Check logs**: Look for error messages
4. **Verify setup**: `node verify-demo-setup.js`

### Debug Information to Collect
```bash
# System info
node --version
npm --version
gcloud --version

# Service status
brew services list | grep -E "(postgresql|redis|elasticsearch)"

# Environment
cat .env | grep -v SECRET
```

### Common Error Messages and Solutions

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Start the required service (DB/Redis/ES) |
| `Permission denied` | Run `./setup-demo-mode.sh` |
| `API not enabled` | Use demo mode or enable APIs |
| `Quota exceeded` | Switch to demo mode |
| `Module not found` | Run `npm install` |
| `Port in use` | Kill process or change port |

## 🎉 Success Indicators

Your CollectiveMind is working when:
- ✅ Backend starts without errors
- ✅ Frontend loads at http://localhost:3000
- ✅ Database queries work
- ✅ AI responses are generated (real or mock)
- ✅ Search returns relevant results
- ✅ Real-time updates work

Remember: **Demo mode provides a fully functional experience** - perfect for hackathon presentations!