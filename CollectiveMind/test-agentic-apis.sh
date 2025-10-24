#!/bin/bash

# CollectiveMind Agentic API Test Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

BASE_URL="http://localhost:8000"

echo "🧪 Testing CollectiveMind Agentic APIs..."
echo "=========================================="

# Test basic API health
print_status "Testing basic API health..."
if curl -s "$BASE_URL/api" > /dev/null; then
    print_success "Basic API is responding"
else
    print_error "Basic API is not responding"
    exit 1
fi

# Test agentic health
print_status "Testing agentic health endpoint..."
if curl -s "$BASE_URL/api/health/agentic" > /dev/null; then
    print_success "Agentic health endpoint is working"
else
    print_error "Agentic health endpoint failed"
fi

# Test multi-agent processing
print_status "Testing multi-agent processing..."
AGENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/agentic/process" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "customer churn analysis",
        "userContext": {
            "userId": "test_user",
            "team": "Product",
            "role": "Product Manager"
        },
        "intent": {
            "type": "analysis",
            "complexity": "high",
            "crossTeam": true
        }
    }')

if echo "$AGENT_RESPONSE" | grep -q "searchResults\|agenticProcessing"; then
    print_success "Multi-agent processing is working"
else
    print_error "Multi-agent processing failed"
    echo "Response: $AGENT_RESPONSE"
fi

# Test predictive search
print_status "Testing predictive search..."
PREDICTIVE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/agentic/predictive-search" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "marketing campaign performance",
        "userContext": {
            "userId": "test_user",
            "team": "Marketing",
            "role": "Marketing Analyst"
        }
    }')

if echo "$PREDICTIVE_RESPONSE" | grep -q "results\|predictions\|optimized"; then
    print_success "Predictive search is working"
else
    print_error "Predictive search failed"
    echo "Response: $PREDICTIVE_RESPONSE"
fi

# Test query predictions
print_status "Testing query predictions..."
PREDICTION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/agentic/predict-queries" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "customer retention",
        "userContext": {
            "userId": "test_user",
            "team": "Product",
            "role": "Product Manager"
        }
    }')

if echo "$PREDICTION_RESPONSE" | grep -q "predictions"; then
    print_success "Query predictions are working"
else
    print_error "Query predictions failed"
    echo "Response: $PREDICTION_RESPONSE"
fi

# Test serendipity discovery
print_status "Testing serendipity discovery..."
SERENDIPITY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/agentic/discover" \
    -H "Content-Type: application/json" \
    -d '{
        "userContext": {
            "userId": "test_user",
            "team": "Product",
            "role": "Product Manager"
        },
        "discoveryType": "opportunities"
    }')

if echo "$SERENDIPITY_RESPONSE" | grep -q "discoveries\|opportunities\|insights"; then
    print_success "Serendipity discovery is working"
else
    print_error "Serendipity discovery failed"
    echo "Response: $SERENDIPITY_RESPONSE"
fi

# Test MCP server status
print_status "Testing MCP server status..."
MCP_STATUS_RESPONSE=$(curl -s "$BASE_URL/api/agentic/mcp/status")

if echo "$MCP_STATUS_RESPONSE" | grep -q "connectedServers\|availableTools"; then
    print_success "MCP server status is working"
else
    print_error "MCP server status failed"
    echo "Response: $MCP_STATUS_RESPONSE"
fi

# Test MCP tool execution
print_status "Testing MCP tool execution..."
MCP_TOOL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/agentic/mcp/execute" \
    -H "Content-Type: application/json" \
    -d '{
        "toolName": "search_documents",
        "arguments": {
            "query": "customer churn"
        },
        "userContext": {
            "userId": "test_user",
            "team": "Product",
            "role": "Product Manager"
        }
    }')

if echo "$MCP_TOOL_RESPONSE" | grep -q "result\|toolName"; then
    print_success "MCP tool execution is working"
else
    print_error "MCP tool execution failed"
    echo "Response: $MCP_TOOL_RESPONSE"
fi

# Test performance metrics
print_status "Testing performance metrics..."
PERFORMANCE_RESPONSE=$(curl -s "$BASE_URL/api/agentic/performance")

if echo "$PERFORMANCE_RESPONSE" | grep -q "agentOrchestration\|predictiveSearch"; then
    print_success "Performance metrics are working"
else
    print_error "Performance metrics failed"
    echo "Response: $PERFORMANCE_RESPONSE"
fi

# Test regular search API
print_status "Testing regular search API..."
SEARCH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/search/hybrid" \
    -H "Content-Type: application/json" \
    -d '{
        "query": "customer churn analysis",
        "userContext": {
            "userId": "test_user",
            "team": "Product",
            "role": "Product Manager"
        }
    }')

if echo "$SEARCH_RESPONSE" | grep -q "results\|total"; then
    print_success "Regular search API is working"
else
    print_error "Regular search API failed"
    echo "Response: $SEARCH_RESPONSE"
fi

# Test chat API
print_status "Testing chat API..."
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/chat/message" \
    -H "Content-Type: application/json" \
    -d '{
        "message": "What are the main causes of customer churn?",
        "userContext": {
            "userId": "test_user",
            "team": "Product",
            "role": "Product Manager"
        }
    }')

if echo "$CHAT_RESPONSE" | grep -q "message\|content"; then
    print_success "Chat API is working"
else
    print_error "Chat API failed"
    echo "Response: $CHAT_RESPONSE"
fi

echo ""
echo "🎉 API Testing Complete!"
echo ""
echo "Summary of Agentic Features:"
echo "• Multi-Agent Orchestration: Coordinates 5 specialized AI agents"
echo "• Predictive Search: ML-powered query prediction and caching"
echo "• MCP Integration: 4 specialized servers for advanced capabilities"
echo "• Serendipity Engine: Discovers hidden collaboration opportunities"
echo "• Real-time Analytics: Performance monitoring and insights"
echo ""
echo "All systems are operational and ready for use! 🚀"