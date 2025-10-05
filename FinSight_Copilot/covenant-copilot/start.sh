#!/bin/bash

echo "🚀 Starting Covenant Monitoring Copilot..."

# Start API server
echo "Starting FastAPI server on port 8000..."
cd apps/api
source venv/bin/activate
python -c "
import uvicorn
from main import app
print('FastAPI server starting on http://localhost:8000')
uvicorn.run(app, host='0.0.0.0', port=8000, log_level='info')
" &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Start Frontend server
echo "Starting Next.js server on port 3000..."
cd ../web
npm run dev &
WEB_PID=$!

echo "✅ Servers started!"
echo "API: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap 'echo "Stopping servers..."; kill $API_PID $WEB_PID; exit' INT
wait
