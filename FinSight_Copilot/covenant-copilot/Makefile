.PHONY: dev setup clean install-api install-web install-mcp start-api start-web start-mcp

# Development targets
dev: install-api install-web
	@echo "🚀 Starting development servers..."
	@echo "Backend API: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo "MCP Server: Available via stdio"
	@echo ""
	@echo "Press Ctrl+C to stop all servers"
	@trap 'kill %1 %2' INT; \
	cd apps/api && source venv/bin/activate && python main.py & \
	cd apps/web && npm run dev & \
	wait

setup:
	@echo "🔧 Running setup script..."
	@chmod +x scripts/setup.sh
	@./scripts/setup.sh

# Installation targets
install-api:
	@echo "📦 Installing API dependencies..."
	@cd apps/api && python3 -m venv venv
	@cd apps/api && source venv/bin/activate && pip install -r requirements.txt

install-web:
	@echo "📦 Installing web dependencies..."
	@cd apps/web && npm install

install-mcp:
	@echo "📦 Installing MCP dependencies..."
	@cd apps/mcp && pip install -r ../api/requirements.txt

# Individual server targets
start-api:
	@echo "🚀 Starting FastAPI server..."
	@cd apps/api && source venv/bin/activate && python main.py

start-web:
	@echo "🚀 Starting Next.js server..."
	@cd apps/web && npm run dev

start-mcp:
	@echo "🚀 Starting MCP server..."
	@cd apps/mcp && python server.py

# Utility targets
clean:
	@echo "🧹 Cleaning up..."
	@rm -rf apps/api/venv
	@rm -rf apps/web/node_modules
	@rm -rf apps/web/.next
	@rm -rf memos/*
	@rm -rf pathway_results/*
	@rm -f *.db
	@rm -f watcher.pid

test-api:
	@echo "🧪 Testing API endpoints..."
	@curl -X GET http://localhost:8000/ || echo "API not running"

test-web:
	@echo "🧪 Testing web interface..."
	@curl -X GET http://localhost:3000/ || echo "Web server not running"

# Demo targets
demo:
	@echo "🎬 Running demo..."
	@echo "1. Starting API server..."
	@cd apps/api && source venv/bin/activate && python main.py &
	@echo "2. Waiting for API to start..."
	@sleep 5
	@echo "3. Running covenant check..."
	@curl -X POST http://localhost:8000/api/run-check \
		-H "Content-Type: application/json" \
		-d '{"company_name": "Tesla Inc.", "period": "Q2 2025"}' || echo "Demo check failed"
	@echo "4. Demo complete! Check http://localhost:3000 for the web interface"

help:
	@echo "Covenant Monitoring Copilot - Available targets:"
	@echo ""
	@echo "Development:"
	@echo "  dev          - Start all development servers"
	@echo "  setup        - Run initial setup script"
	@echo ""
	@echo "Installation:"
	@echo "  install-api  - Install API dependencies"
	@echo "  install-web  - Install web dependencies"
	@echo "  install-mcp  - Install MCP dependencies"
	@echo ""
	@echo "Individual servers:"
	@echo "  start-api    - Start FastAPI server only"
	@echo "  start-web    - Start Next.js server only"
	@echo "  start-mcp    - Start MCP server only"
	@echo ""
	@echo "Utilities:"
	@echo "  clean        - Clean up generated files"
	@echo "  test-api     - Test API endpoints"
	@echo "  test-web     - Test web interface"
	@echo "  demo         - Run quick demo"
	@echo "  help         - Show this help"
