#!/bin/bash

echo "🧪 Testing Covenant Monitoring Copilot..."

# Test API
echo "1. Testing API..."
if curl -s http://localhost:8000/ > /dev/null; then
    echo "   ✅ API is running at http://localhost:8000"
else
    echo "   ❌ API is not running"
fi

# Test Frontend
echo "2. Testing Frontend..."
if curl -s http://localhost:3000/ > /dev/null; then
    echo "   ✅ Frontend is running at http://localhost:3000"
else
    echo "   ❌ Frontend is not running"
fi

# Test Covenant Check
echo "3. Testing Covenant Check..."
response=$(curl -s -X POST http://localhost:8000/api/run-check \
    -H "Content-Type: application/json" \
    -d '{"company_name": "Tesla Inc.", "period": "Q2 2025"}')

if echo "$response" | grep -q "result_id"; then
    echo "   ✅ Covenant check successful"
    echo "   📊 Response: $(echo $response | jq -r '.overall_status // "Unknown"')"
else
    echo "   ❌ Covenant check failed"
fi

echo ""
echo "🌐 Access Points:"
echo "   Dashboard: http://localhost:3000"
echo "   Chat: http://localhost:3000/chat"
echo "   Results: http://localhost:3000/results"
echo "   API Docs: http://localhost:8000/docs"
