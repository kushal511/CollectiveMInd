# Covenant Monitoring Copilot

A comprehensive AI-powered covenant monitoring and compliance system built with Next.js, FastAPI, and MCP (Model Context Protocol).

## 🚀 Features

- **Multi-Format Data Extraction**: Supports PDF, JSON, HTML/iXBRL, CSV, and Image files
- **AI-Powered Analysis**: Uses LandingAI ADE for document extraction and analysis
- **Real-Time Monitoring**: Pathway-like file watcher for live covenant monitoring
- **Q&A Chat Interface**: Interactive chat with historical context and follow-up questions
- **Automated Alerts**: Email notifications for covenant breaches
- **Memo Generation**: Automated PDF memo generation with breach analysis
- **Modern Web UI**: Clean, responsive interface built with Next.js and shadcn/ui

## 🏗️ Architecture

```
covenant-copilot/
├── apps/
│   ├── web/                 # Next.js 14 frontend
│   ├── api/                 # FastAPI backend
│   └── mcp/                 # MCP server (financial agent)
├── packages/
│   └── shared/              # Shared types and models
├── data/                    # Sample data and test files
├── scripts/                 # Development and setup scripts
└── memos/                   # Generated memos
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Zustand** for state management
- **React Query** for data fetching

### Backend
- **FastAPI** for REST API
- **SQLAlchemy** for database ORM
- **SQLite** for development (PostgreSQL for production)
- **Pydantic** for data validation
- **Uvicorn** as ASGI server

### AI & Extraction
- **LandingAI ADE** for document extraction
- **PyPDF2** for PDF processing
- **BeautifulSoup** for HTML parsing
- **Pandas** for data manipulation

### MCP Server
- **JSON-RPC over stdio** for tool communication
- **Financial agent tools** for covenant monitoring
- **Email integration** for breach alerts
- **Memo generation** with Markdown → PDF

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### 1. Clone and Setup
```bash
git clone <repository-url>
cd covenant-copilot
make setup
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 3. Start Development Servers
```bash
make dev
```

This will start:
- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **MCP Server**: Available via stdio

### 4. Run Demo
```bash
make demo
```

## 📋 API Endpoints

### Core Endpoints
- `POST /api/run-check` - Run covenant extraction and compliance check
- `GET /api/results/latest` - Get latest results for a company
- `GET /api/red-flags` - Get red flags for a specific result
- `POST /api/questions` - Ask questions about covenant data
- `GET /api/questions/history` - Get chat history for a session
- `POST /api/memo` - Generate memo for a result
- `GET /api/memo/{id}/download` - Download memo in PDF/MD format

### Monitoring Endpoints
- `POST /api/watch/start` - Start file watcher
- `POST /api/watch/stop` - Stop file watcher
- `POST /api/alert-test` - Send test breach alert

## 🔧 MCP Server Tools

The MCP server provides these financial agent tools:

- `run_extraction` - Multi-format data extraction
- `check_covenants` - Covenant compliance checking
- `watch_drive_folder` - File system monitoring
- `list_red_flags` - Red flag enumeration
- `send_breach_email` - Breach alert notifications
- `generate_memo` - Memo generation
- `answer_question` - Q&A with context

## 📊 Covenant Rules

Default covenant thresholds:
- **Leverage Ratio**: ≤ 3.5x (Total Debt ÷ EBITDA)
- **Interest Coverage**: ≥ 2.0x (EBITDA ÷ Interest Expense)
- **Minimum Liquidity**: ≥ $100M (Cash & Equivalents)

## 🎯 Usage Examples

### 1. Run Covenant Check
```bash
curl -X POST http://localhost:8000/api/run-check \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Tesla Inc.", "period": "Q2 2025"}'
```

### 2. Ask Questions
```bash
curl -X POST http://localhost:8000/api/questions \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Tesla'\''s current leverage ratio?"}'
```

### 3. Generate Memo
```bash
curl -X POST http://localhost:8000/api/memo \
  -H "Content-Type: application/json" \
  -d '{"result_id": 1}'
```

### 4. Start Monitoring
```bash
curl -X POST http://localhost:8000/api/watch/start \
  -H "Content-Type: application/json" \
  -d '{"duration": 60, "data_path": "./data/JSON"}'
```

## 🔐 Environment Variables

```bash
# LandingAI API Configuration
LANDING_AI_API_KEY=your_landing_ai_api_key_here

# SEC API Configuration
SEC_USER_AGENT="HackWithBay2025 covenant-monitor demo@hackathon.com"

# Data Paths
GOOGLE_DRIVE_DATA_PATH=/content/drive/MyDrive/data
LOCAL_DATA_PATH=./data

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ALERT_TO=analyst-team@yourfirm.com
ALERT_FROM=alerts@duecopilot.ai

# Database Configuration
DATABASE_URL=sqlite:///./copilot.db

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8000
API_PORT=8000
WEB_PORT=3000
MCP_PORT=3001
```

## 🧪 Testing

### Test API Endpoints
```bash
make test-api
```

### Test Web Interface
```bash
make test-web
```

### Run Full Demo
```bash
make demo
```

## 📁 Sample Data

The `data/` directory contains sample files for testing:
- `JSON/file.json` - Tesla SEC CompanyFacts data
- `CSV/file.csv` - Financial metrics
- `CSV/covenant_metrics.csv` - Covenant calculations
- `PDF/file.pdf` - Credit agreement (placeholder)
- `Image/file.jpeg` - Covenant table image (placeholder)

## 🚨 Breach Alert Example

When a covenant breach is detected, the system sends an email alert:

```
Subject: [Covenant Breach] Tesla Inc. Q2 2025 — Leverage: 3.78x vs 3.5x

Body:
Covenant Monitoring Copilot Alert
Company: Tesla Inc. | Period: Q2 2025
Overall: BREACH

Breach:
- LEVERAGE: 3.78x exceeds 3.5x (margin -0.28x)
  Source: /JSON/file.json (SEC CompanyFacts)

Supporting:
- Total Debt: $4,994M
- EBITDA: $1,322M
- Interest Expense: $162M
- Cash & Equivalents: $15,587M

Next steps:
- Review memo: http://localhost:8000/api/memo/1/download?format=pdf
- View dashboard: http://localhost:3000/results

Generated at 2025-01-04 10:00 PT
```

## 🔄 Development Workflow

1. **Setup**: `make setup`
2. **Start Development**: `make dev`
3. **Test Changes**: `make test-api && make test-web`
4. **Run Demo**: `make demo`
5. **Clean Up**: `make clean`

## 🐳 Docker Support

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run individual services
docker build -t covenant-api apps/api/
docker build -t covenant-web apps/web/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **LandingAI ADE not available**: The system gracefully falls back to PyPDF2 and JSON parsing
2. **Email not sending**: Check SMTP credentials in `.env` file
3. **Database errors**: Run `make clean` and restart
4. **Port conflicts**: Change ports in `.env` file

### Getting Help

- Check the logs in the terminal output
- Verify environment variables are set correctly
- Ensure all dependencies are installed
- Test individual components with `make test-api` and `make test-web`

## 🎉 Demo Results

The system successfully detects Tesla's leverage breach:
- **Leverage**: 3.78x vs 3.5x limit → **BREACH**
- **Coverage**: 8.16x vs 2.0x limit → **PASS**
- **Liquidity**: $15,587M vs $100M limit → **PASS**

This demonstrates the system's ability to:
✅ Extract financial data from multiple sources
✅ Calculate covenant ratios accurately
✅ Detect breaches and generate alerts
✅ Provide interactive Q&A about the results
✅ Generate professional memos with analysis
✅ Monitor files for real-time updates

Ready for your hackathon presentation! 🏆
