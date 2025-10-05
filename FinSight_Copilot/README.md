# 🏆 FinSight Copilot - Due Diligence AI Assistant

**Real-time Covenant Monitoring with AI-Powered Document Extraction**

An intelligent financial agent that monitors loan covenants in real-time, extracting data from complex financial documents and alerting on breaches instantly.

## 🎯 Problem Statement

Investors, M&A professionals, and finance leaders need to monitor covenant compliance across evolving data rooms. Manual tracking is slow, error-prone, and misses critical breaches.

**Our Solution:** An AI-powered copilot that:
- ✅ Extracts covenant terms from PDFs, images, and tables using **LandingAI DPT-2**
- ✅ Monitors financial data in real-time using **Pathway framework**
- ✅ Detects breaches instantly with red flag alerts
- ✅ Sends automated email notifications
- ✅ Generates living memos that auto-update
- ✅ Provides conversational Q&A interface

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA ROOM (Live Files)                   │
│  PDF │ JSON │ Images │ CSV │ HTML/iXBRL                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              PATHWAY LIVE FILE MONITOR                      │
│  (Watches for new/modified files - instant processing)      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           LANDINGAI ADE (DPT-2) EXTRACTION                  │
│  • Covenant terms from PDFs/Images                          │
│  • Financial tables with high accuracy                      │
│  • Parallel extraction for speed                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              COVENANT COMPLIANCE ENGINE                     │
│  • Leverage Ratio Check                                     │
│  • Interest Coverage Check                                  │
│  • Liquidity Check                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  INTELLIGENT OUTPUTS                        │
│  📧 Email Alerts  │  📝 Living Memos  │  💬 Chatbot Q&A    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

### Core Technologies (Required)
- **LandingAI ADE (DPT-2)**: Document extraction with vision capabilities
- **Pathway Framework**: Live file monitoring and real-time indexing

### Supporting Stack
- **Python 3.10+**: Core language
- **PyPDF2**: PDF processing and truncation
- **Watchdog**: File system monitoring
- **SMTP**: Email alert delivery
- **FastAPI**: REST API (optional)

---

## 📁 Project Structure

```
FinSight_Copilot/
├── hackathon_copilot.py          # Main copilot implementation
├── pathway_monitor.py             # Live file monitoring
├── due_diligence_copilot (1).py  # Original prototype
├── .env                           # Environment configuration
├── covenant-copilot/
│   ├── data/                      # Data room
│   │   ├── JSON/file.json        # SEC financial data
│   │   ├── PDF/file.pdf          # Credit agreements
│   │   ├── Image/file.jpeg       # Covenant tables
│   │   ├── CSV/                  # Normalized data
│   │   └── HTML : iXBRL/         # SEC filings
│   ├── apps/
│   │   └── api/                  # FastAPI backend
│   └── memos/                    # Generated memos
└── HACKATHON_README.md           # This file
```

---

## 🔧 Setup & Installation

### 1. Clone Repository
```bash
git clone https://github.com/kushal511/FinSight_Copilot.git
cd FinSight_Copilot
```

### 2. Create Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install pandas beautifulsoup4 lxml requests PyPDF2 pillow pdf2image \
            watchdog python-dotenv landingai_ade fastapi uvicorn
```

### 4. Configure Environment
Create `.env` file:
```bash
# LandingAI API Key (get from https://va.landing.ai/)
LANDING_AI_API_KEY=your_api_key_here

# Data paths
LOCAL_DATA_PATH=./covenant-copilot/data

# Email alerts (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=alerts@covenantcopilot.ai
EMAIL_PASSWORD=your_app_password
ALERT_RECIPIENTS=analyst@company.com,manager@company.com
```

### 5. Prepare Data Room
Ensure these files exist in `covenant-copilot/data/`:
- `JSON/file.json` - SEC CompanyFacts API data
- `PDF/file.pdf` - Credit agreement (auto-truncated to 50 pages)
- `Image/file.jpeg` - Covenant table screenshot
- `CSV/file.csv` - Normalized financial metrics

---

## 🎬 Demo Execution

### Option 1: Full Demo (All Features)
```bash
python hackathon_copilot.py
```

**What it does:**
1. ✅ Extracts covenant terms using LandingAI DPT-2
2. ✅ Analyzes financial data from SEC JSON
3. ✅ Runs covenant compliance checks
4. ✅ Detects red flags and breaches
5. ✅ Sends email alerts (or saves to file)
6. ✅ Generates living memo (Markdown + HTML)
7. ✅ Runs conversational chatbot demo

**Expected Output:**
```
🏆 HACKWITHBAY 2025 - DUE DILIGENCE COPILOT
   Track 1: Covenant Monitoring with Live Updates
================================================================================

📋 STEP 1: Document Extraction (LandingAI DPT-2)
--------------------------------------------------------------------------------
🖼️  Extracting from Image: file.jpeg
  ✅ Extracted 7 chunks

📊 STEP 2: Financial Data Extraction
--------------------------------------------------------------------------------
📊 Reading SEC JSON: file.json
  ✅ Debt=$4994M, EBITDA=$1322M, Cash=$15587M

🔍 STEP 3: Covenant Compliance Check
--------------------------------------------------------------------------------
Company: Tesla Inc.
Period: Q2 2025
Status: 🔴 BREACH

❌ LEVERAGE: 3.78 (limit: 3.5) - BREACH
✅ COVERAGE: 8.16 (limit: 2.0) - PASS
✅ LIQUIDITY: 15587.0 (limit: 100.0) - PASS

📧 STEP 4: Email Alert System
--------------------------------------------------------------------------------
📧 Sending breach alert to 1 recipients...
  ✅ Alert saved to: covenant-copilot/data/breach_alert_20251004_183331.html

📝 STEP 5: Living Memo Generation
--------------------------------------------------------------------------------
📝 Generating living memo...
  ✅ Memo saved to: covenant-copilot/data/memos/covenant_memo_20251004_183331.md
  ✅ HTML version: covenant-copilot/data/memos/covenant_memo_20251004_183331.html

💬 STEP 6: Conversational Chatbot Demo
--------------------------------------------------------------------------------
❓ Q: What is the overall covenant status?
💡 A: The overall covenant status for Tesla Inc. is **BREACH**. There are 1 red flag(s) detected.

❓ Q: What is the leverage ratio?
💡 A: The leverage ratio is 3.78x against a limit of 3.5x. Status: BREACH. Margin: -0.28x.

✅ DEMO COMPLETE - All Components Working
```

### Option 2: Pathway Live Monitoring
```bash
# Monitor for 30 seconds
python pathway_monitor.py 30

# Monitor indefinitely (Ctrl+C to stop)
python pathway_monitor.py
```

**What it does:**
1. 🔍 Scans existing files in data room
2. 👀 Watches for new/modified files
3. ⚡ Processes changes instantly
4. 🚨 Triggers alerts on breaches
5. 📝 Updates living memos automatically

**Demo Scenario:**
1. Start monitoring: `python pathway_monitor.py`
2. In another terminal, update a file:
   ```bash
   # Simulate new financial data
   cp covenant-copilot/data/JSON/file.json covenant-copilot/data/JSON/file_updated.json
   ```
3. Watch instant processing and alerts!

### Option 3: FastAPI Server
```bash
cd covenant-copilot/apps/api
venv/bin/uvicorn main:app --reload --port 8000
```

Access API docs: http://localhost:8000/docs

---

## 📊 Key Features & Differentiators

### 1. **LandingAI DPT-2 Integration** ✨
- **Accurate table extraction** from covenant documents
- **Parallel processing** for faster parsing
- **Vision capabilities** for scanned documents
- **Automatic PDF truncation** to 50 pages for API limits

### 2. **Pathway Live Monitoring** 🔄
- **Real-time file watching** with instant processing
- **Hybrid indexing** (ready for vector + BM25)
- **Event-driven architecture** for scalability
- **Automatic re-processing** on file updates

### 3. **Intelligent Alerting** 🚨
- **Red flag detection** with severity levels
- **Email notifications** with HTML formatting
- **Evidence-based alerts** with source citations
- **Configurable thresholds** per covenant type

### 4. **Living Memo** 📝
- **Auto-updating documentation** on every check
- **Markdown + HTML** formats for flexibility
- **Executive summary** with actionable insights
- **Audit trail** with timestamps

### 5. **Conversational Interface** 💬
- **Natural language Q&A** about covenant status
- **Context-aware responses** with financial data
- **Conversation history** tracking
- **Extensible to LLM** for advanced queries

---

## 📈 Results & Outputs

### Generated Artifacts
1. **covenant_results.json** - Full compliance check results
2. **red_flags.json** - Detected breaches with severity
3. **covenant_memo_*.md** - Living memo (Markdown)
4. **covenant_memo_*.html** - Living memo (HTML)
5. **breach_alert_*.html** - Email alert (HTML)
6. **chatbot_conversation.json** - Q&A history
7. **pathway_results/check_*.json** - Live monitoring results

### Sample Output: Red Flags
```json
[
  {
    "rule": "leverage",
    "actual": 3.78,
    "limit": 3.5,
    "margin": 0.28,
    "severity": "HIGH",
    "message": "🚨 LEVERAGE BREACH: 3.78x exceeds 3.5x limit",
    "timestamp": "2025-10-04T18:33:31.481529"
  }
]
```

---

## 📚 References

### LandingAI Resources
- Playground: https://va.landing.ai/
- Developer Docs: https://docs.landing.ai/ade/ade-overview
- Python Library: https://github.com/landing-ai/ade-python
- Discord: https://discord.com/invite/RVcW3j9RgR

### Pathway Resources
- Documentation: https://pathway.com/developers/
- GitHub: https://github.com/pathwaycom/pathway
- RAG 101 Bootcamp: https://pathway.com/developers/showcases/

---

## 🎯 Future Enhancements

- **LLM Integration**: Advanced conversational AI with GPT-4
- **Vector Search**: Hybrid indexing for intelligent document search
- **Multi-Company Support**: Monitor multiple portfolios simultaneously
- **Mobile Applications**: iOS/Android apps for on-the-go monitoring
- **Enterprise Integrations**: Slack, Teams, Bloomberg Terminal connectivity

---

## 📄 License

MIT License - Built for HackWithBay 2025

---

**🚀 Ready to revolutionize covenant monitoring!**
