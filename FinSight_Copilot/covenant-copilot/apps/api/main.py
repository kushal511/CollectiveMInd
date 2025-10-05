"""
FastAPI backend for Covenant Monitoring Copilot
"""
import os
import json
import smtplib
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=Path(__file__).parent.parent.parent.parent / ".env")

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn

from models import get_session, User, QASession, QAMessage, Company, Filing, Result, RedFlag, Memo, Alert
from covenant.extractor import CovenantExtractor, CovenantMonitor, PathwayMonitor

# Initialize FastAPI app
app = FastAPI(title="Covenant Monitoring Copilot API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3001"],  # Allow multiple origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class RunCheckRequest(BaseModel):
    company_name: Optional[str] = "Tesla Inc."
    period: Optional[str] = "Q2 2025"
    data_path: Optional[str] = "./data"

class RunCheckResponse(BaseModel):
    result_id: int
    company: str
    period: str
    overall_status: str
    tests: Dict[str, Any]
    red_flags: List[Dict[str, Any]]
    alerts: List[str]

class QuestionRequest(BaseModel):
    session_id: Optional[int] = None
    question: str

class QuestionResponse(BaseModel):
    answer: str
    session_id: int
    message_id: int

class MemoRequest(BaseModel):
    result_id: int

class MemoResponse(BaseModel):
    memo_id: int
    memo_md_path: str
    memo_pdf_path: str

class WatchRequest(BaseModel):
    duration: int = 60  # seconds
    data_path: str = "./data/JSON"

class AlertTestRequest(BaseModel):
    email_to: str
    company: str = "Tesla Inc."
    period: str = "Q2 2025"

# Global variables for watcher
watcher_process = None
watcher_pid_file = Path("./watcher.pid")

@app.get("/")
async def root():
    return {"message": "Covenant Monitoring Copilot API", "version": "1.0.0"}

@app.post("/api/run-check", response_model=RunCheckResponse)
async def run_covenant_check(request: RunCheckRequest):
    """Run covenant extraction and compliance check"""
    try:
        # Initialize extractor
        api_key = os.getenv("LANDING_AI_API_KEY")
        extractor = CovenantExtractor(api_key)
        
        # Set up paths
        data_path = Path(request.data_path)
        json_path = data_path / "JSON" / "file.json"
        
        # Fallback to local data if not found
        if not json_path.exists():
            json_path = Path("./data/JSON/file.json")
        
        if not json_path.exists():
            raise HTTPException(status_code=404, detail="JSON data file not found")
        
        # Extract financials
        financials = extractor.extract_from_json(json_path)
        
        # Get covenant terms (from image or default)
        image_path = data_path / "Image" / "file.jpeg"
        if image_path.exists():
            covenant_terms = extractor.extract_from_image(image_path)
        else:
            covenant_terms = extractor._get_default_covenant_terms("Default")
        
        # Check compliance
        monitor = CovenantMonitor(covenant_terms)
        results = monitor.check_compliance(financials)
        red_flags = monitor.collect_red_flags(results)
        
        # Save to database
        db = get_session()
        try:
            # Get or create company
            company = db.query(Company).filter(Company.name == request.company_name).first()
            if not company:
                company = Company(
                    name=request.company_name,
                    cik="0001318605",  # Tesla's CIK
                    ticker="TSLA"
                )
                db.add(company)
                db.commit()
                db.refresh(company)
            
            # Create result
            result = Result(
                company_id=company.id,
                period=request.period,
                overall_status=results['status'],
                details_json=json.dumps(results)
            )
            db.add(result)
            db.commit()
            db.refresh(result)
            
            # Create red flags
            for flag in red_flags:
                red_flag = RedFlag(
                    result_id=result.id,
                    rule_key=flag['rule'],
                    actual=flag['actual'],
                    threshold=flag['limit'],
                    status="BREACH",
                    message=flag['message']
                )
                db.add(red_flag)
            
            db.commit()
            
            return RunCheckResponse(
                result_id=result.id,
                company=results['company'],
                period=results['period'],
                overall_status=results['status'],
                tests=results['tests'],
                red_flags=red_flags,
                alerts=results['alerts']
            )
        finally:
            db.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/results/latest")
async def get_latest_results(company: str = "Tesla Inc."):
    """Get latest covenant check results for a company"""
    db = get_session()
    try:
        company_obj = db.query(Company).filter(Company.name == company).first()
        if not company_obj:
            raise HTTPException(status_code=404, detail="Company not found")
        
        result = db.query(Result).filter(Result.company_id == company_obj.id).order_by(Result.created_at.desc()).first()
        if not result:
            raise HTTPException(status_code=404, detail="No results found")
        
        details = json.loads(result.details_json)
        red_flags = db.query(RedFlag).filter(RedFlag.result_id == result.id).all()
        
        return {
            "result_id": result.id,
            "company": details['company'],
            "period": details['period'],
            "overall_status": result.overall_status,
            "tests": details['tests'],
            "red_flags": [{"rule": rf.rule_key, "actual": rf.actual, "threshold": rf.threshold, "message": rf.message} for rf in red_flags],
            "created_at": result.created_at.isoformat()
        }
    finally:
        db.close()

@app.get("/api/red-flags")
async def get_red_flags(result_id: int):
    """Get red flags for a specific result"""
    db = get_session()
    try:
        red_flags = db.query(RedFlag).filter(RedFlag.result_id == result_id).all()
        return [{"id": rf.id, "rule": rf.rule_key, "actual": rf.actual, "threshold": rf.threshold, "message": rf.message, "created_at": rf.created_at.isoformat()} for rf in red_flags]
    finally:
        db.close()

@app.post("/api/questions", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """Ask a question and get an answer with context"""
    db = get_session()
    try:
        # Get or create session
        if request.session_id:
            session = db.query(QASession).filter(QASession.id == request.session_id).first()
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            # Create new session
            user = db.query(User).first()  # Get first user or create default
            if not user:
                user = User(email="demo@example.com", name="Demo User")
                db.add(user)
                db.commit()
                db.refresh(user)
            
            session = QASession(user_id=user.id, title=f"Session {datetime.now().strftime('%Y-%m-%d %H:%M')}")
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # Save user question
        user_message = QAMessage(session_id=session.id, role="user", text=request.question)
        db.add(user_message)
        db.commit()
        db.refresh(user_message)
        
        # Generate answer (simplified - in production, use AI/LLM)
        answer = generate_answer(request.question, db)
        
        # Save assistant response
        assistant_message = QAMessage(session_id=session.id, role="assistant", text=answer)
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)
        
        return QuestionResponse(
            answer=answer,
            session_id=session.id,
            message_id=assistant_message.id
        )
    finally:
        db.close()

def generate_answer(question: str, db) -> str:
    """Generate answer based on question and stored data"""
    # Get latest results
    result = db.query(Result).order_by(Result.created_at.desc()).first()
    if not result:
        return "No covenant data available. Please run a covenant check first."
    
    details = json.loads(result.details_json)
    
    # Simple keyword-based answering
    question_lower = question.lower()
    
    if "leverage" in question_lower:
        leverage = details['tests']['leverage']
        return f"{details['company']} {details['period']} — Leverage: {leverage['actual']}x vs {leverage['limit']}x limit → {leverage['status']} (margin: {leverage['margin']:.2f}x)"
    
    elif "coverage" in question_lower:
        coverage = details['tests']['coverage']
        return f"{details['company']} {details['period']} — Coverage: {coverage['actual']}x vs {coverage['limit']}x limit → {coverage['status']} (margin: {coverage['margin']:.2f}x)"
    
    elif "liquidity" in question_lower:
        liquidity = details['tests']['liquidity']
        return f"{details['company']} {details['period']} — Liquidity: ${liquidity['actual']:.0f}M vs ${liquidity['limit']:.0f}M limit → {liquidity['status']} (margin: ${liquidity['margin']:.0f}M)"
    
    elif "breach" in question_lower or "red flag" in question_lower:
        red_flags = db.query(RedFlag).filter(RedFlag.result_id == result.id).all()
        if red_flags:
            flag_summary = "; ".join([rf.message for rf in red_flags])
            return f"Red flags detected: {flag_summary}"
        else:
            return "No red flags detected in the latest covenant check."
    
    elif "status" in question_lower or "overall" in question_lower:
        return f"{details['company']} {details['period']} — Overall Status: {result.overall_status}"
    
    else:
        return f"Based on the latest covenant check for {details['company']} {details['period']}: Overall status is {result.overall_status}. Ask about specific metrics like leverage, coverage, or liquidity for more details."

@app.get("/api/questions/history")
async def get_question_history(session_id: int):
    """Get chat history for a session"""
    db = get_session()
    try:
        messages = db.query(QAMessage).filter(QAMessage.session_id == session_id).order_by(QAMessage.created_at).all()
        return [{"id": msg.id, "role": msg.role, "text": msg.text, "created_at": msg.created_at.isoformat()} for msg in messages]
    finally:
        db.close()

@app.post("/api/memo", response_model=MemoResponse)
async def generate_memo(request: MemoRequest):
    """Generate memo for a covenant check result"""
    db = get_session()
    try:
        result = db.query(Result).filter(Result.id == request.result_id).first()
        if not result:
            raise HTTPException(status_code=404, detail="Result not found")
        
        details = json.loads(result.details_json)
        red_flags = db.query(RedFlag).filter(RedFlag.result_id == result.id).all()
        
        # Generate memo content
        memo_content = generate_memo_content(details, red_flags)
        
        # Save memo files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        memo_dir = Path("./memos")
        memo_dir.mkdir(exist_ok=True)
        
        memo_md_path = memo_dir / f"{details['company'].replace(' ', '_')}_{details['period'].replace(' ', '_')}_{timestamp}.md"
        memo_pdf_path = memo_dir / f"{details['company'].replace(' ', '_')}_{details['period'].replace(' ', '_')}_{timestamp}.pdf"
        
        # Write markdown
        with open(memo_md_path, 'w') as f:
            f.write(memo_content)
        
        # Convert to PDF (simplified - in production use weasyprint)
        try:
            import markdown
            html_content = markdown.markdown(memo_content)
            # For demo, just copy markdown as PDF
            with open(memo_pdf_path, 'w') as f:
                f.write(memo_content)
        except ImportError:
            # Fallback: copy markdown as PDF
            with open(memo_pdf_path, 'w') as f:
                f.write(memo_content)
        
        # Save memo record
        memo = Memo(
            result_id=result.id,
            memo_md_path=str(memo_md_path),
            memo_pdf_path=str(memo_pdf_path)
        )
        db.add(memo)
        db.commit()
        db.refresh(memo)
        
        return MemoResponse(
            memo_id=memo.id,
            memo_md_path=str(memo_md_path),
            memo_pdf_path=str(memo_pdf_path)
        )
    finally:
        db.close()

def generate_memo_content(details: Dict[str, Any], red_flags: List[RedFlag]) -> str:
    """Generate memo content in markdown format"""
    content = f"""# Covenant Compliance Memo

**Company:** {details['company']}  
**Period:** {details['period']}  
**Overall Status:** {details['status']}  
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Executive Summary

The covenant compliance check for {details['company']} for {details['period']} resulted in a **{details['status']}** status.

## Covenant Test Results

| Covenant | Actual | Limit | Status | Margin |
|----------|--------|-------|--------|--------|
"""
    
    for test_name, test_data in details['tests'].items():
        content += f"| {test_name.title()} | {test_data['actual']} | {test_data['limit']} | {test_data['status']} | {test_data['margin']} |\n"
    
    if red_flags:
        content += f"""
## Red Flags Detected

"""
        for flag in red_flags:
            content += f"- **{flag.rule_key.upper()}**: {flag.message}\n"
        
        content += f"""
## Why This Red Flag Triggered

"""
        for flag in red_flags:
            if flag.rule_key == 'leverage':
                content += f"- **Leverage Ratio**: {flag.actual:.2f}x exceeds the {flag.threshold:.2f}x limit by {abs(flag.actual - flag.threshold):.2f}x. This indicates the company's debt burden relative to earnings is too high.\n"
            elif flag.rule_key == 'coverage':
                content += f"- **Interest Coverage**: {flag.actual:.2f}x is below the {flag.threshold:.2f}x minimum by {abs(flag.actual - flag.threshold):.2f}x. This suggests insufficient earnings to cover interest payments.\n"
            elif flag.rule_key == 'liquidity':
                content += f"- **Liquidity**: ${flag.actual:.0f}M is below the ${flag.threshold:.0f}M minimum by ${abs(flag.actual - flag.threshold):.0f}M. This indicates insufficient cash reserves.\n"
    
    content += f"""
## Supporting Metrics

- **Total Debt**: ${details.get('total_debt', 0):.0f}M
- **EBITDA**: ${details.get('ebitda', 0):.0f}M  
- **Interest Expense**: ${details.get('interest_expense', 0):.0f}M
- **Cash & Equivalents**: ${details.get('cash_equivalents', 0):.0f}M

## Source Attribution

- **Data Source**: SEC CompanyFacts API
- **Extraction Method**: LandingAI ADE + JSON parsing
- **Calculation Method**: Standard covenant formulas

## Appendix

### Raw Covenant Calculations

- **Leverage Ratio**: Total Debt ÷ EBITDA = {details['tests']['leverage']['actual']:.2f}x
- **Interest Coverage**: EBITDA ÷ Interest Expense = {details['tests']['coverage']['actual']:.2f}x  
- **Liquidity**: Cash & Equivalents = ${details['tests']['liquidity']['actual']:.0f}M

### System Information

- **Generated by**: Covenant Monitoring Copilot
- **Version**: 1.0.0
- **Build**: Demo Version
"""
    
    return content

@app.get("/api/memo/{memo_id}/download")
async def download_memo(memo_id: int, format: str = "pdf"):
    """Download memo in specified format"""
    db = get_session()
    try:
        memo = db.query(Memo).filter(Memo.id == memo_id).first()
        if not memo:
            raise HTTPException(status_code=404, detail="Memo not found")
        
        file_path = memo.memo_pdf_path if format == "pdf" else memo.memo_md_path
        
        if not Path(file_path).exists():
            raise HTTPException(status_code=404, detail="Memo file not found")
        
        return FileResponse(file_path, media_type="application/pdf" if format == "pdf" else "text/markdown")
    finally:
        db.close()

@app.post("/api/alert-test")
async def test_alert(request: AlertTestRequest):
    """Send a test breach alert email"""
    try:
        # Create test breach data
        test_data = {
            "company": request.company,
            "period": request.period,
            "leverage": {"actual": 3.78, "limit": 3.5, "status": "BREACH"},
            "coverage": {"actual": 8.2, "limit": 2.0, "status": "PASS"},
            "liquidity": {"actual": 15587, "limit": 100, "status": "PASS"}
        }
        
        # Send email
        success = send_breach_email(request.email_to, test_data)
        
        return {"status": "success" if success else "failed", "message": "Test alert sent" if success else "Failed to send alert"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def send_breach_email(email_to: str, breach_data: Dict[str, Any]) -> bool:
    """Send breach alert email"""
    try:
        # Email configuration
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        alert_from = os.getenv("ALERT_FROM", "alerts@duecopilot.ai")
        
        if not all([smtp_user, smtp_pass]):
            print("SMTP credentials not configured, printing email instead")
            print_email_content(email_to, breach_data)
            return True
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = alert_from
        msg['To'] = email_to
        msg['Subject'] = f"[Covenant Breach] {breach_data['company']} {breach_data['period']} — Leverage: {breach_data['leverage']['actual']}x vs {breach_data['leverage']['limit']}x"
        
        # Email body
        body = f"""Covenant Monitoring Copilot Alert
Company: {breach_data['company']} | Period: {breach_data['period']}
Overall: BREACH

Breach:
- LEVERAGE: {breach_data['leverage']['actual']}x exceeds {breach_data['leverage']['limit']}x (margin -{breach_data['leverage']['actual'] - breach_data['leverage']['limit']:.2f}x)
  Source: /JSON/file.json (SEC CompanyFacts)

Supporting:
- Total Debt: $4,994M
- EBITDA: $1,322M
- Interest Expense: $162M
- Cash & Equivalents: $15,587M

Next steps:
- Review memo: {os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:8000')}/api/memo/download
- View dashboard: {os.getenv('NEXT_PUBLIC_API_URL', 'http://localhost:8000')}/results

Generated at {datetime.now().strftime('%Y-%m-%d %H:%M PT')}
"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        text = msg.as_string()
        server.sendmail(alert_from, email_to, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        print_email_content(email_to, breach_data)
        return False

def print_email_content(email_to: str, breach_data: Dict[str, Any]):
    """Print email content for demo purposes"""
    print(f"\n{'='*50}")
    print(f"EMAIL ALERT (would be sent to {email_to})")
    print(f"{'='*50}")
    print(f"Subject: [Covenant Breach] {breach_data['company']} {breach_data['period']} — Leverage: {breach_data['leverage']['actual']}x vs {breach_data['leverage']['limit']}x")
    print(f"\nBody:")
    print(f"Covenant Monitoring Copilot Alert")
    print(f"Company: {breach_data['company']} | Period: {breach_data['period']}")
    print(f"Overall: BREACH")
    print(f"\nBreach:")
    print(f"- LEVERAGE: {breach_data['leverage']['actual']}x exceeds {breach_data['leverage']['limit']}x")
    print(f"  Source: /JSON/file.json (SEC CompanyFacts)")
    print(f"\nGenerated at {datetime.now().strftime('%Y-%m-%d %H:%M PT')}")
    print(f"{'='*50}\n")

@app.post("/api/watch/start")
async def start_watcher(request: WatchRequest):
    """Start file watcher for live monitoring"""
    global watcher_process
    
    if watcher_process and watcher_process.poll() is None:
        return {"status": "already_running", "pid": watcher_process.pid}
    
    try:
        import subprocess
        import sys
        
        # Start watcher as subprocess
        watcher_process = subprocess.Popen([
            sys.executable, "-c", 
            f"""
import sys
sys.path.append('.')
from apps.api.covenant.watcher import run_watcher
run_watcher('{request.data_path}', {request.duration})
"""
        ])
        
        # Save PID
        with open(watcher_pid_file, 'w') as f:
            f.write(str(watcher_process.pid))
        
        return {"status": "started", "pid": watcher_process.pid, "duration": request.duration}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/watch/stop")
async def stop_watcher():
    """Stop file watcher"""
    global watcher_process
    
    try:
        if watcher_process and watcher_process.poll() is None:
            watcher_process.terminate()
            watcher_process.wait()
        
        # Remove PID file
        if watcher_pid_file.exists():
            watcher_pid_file.unlink()
        
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SendEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str

@app.post("/api/send-email")
async def send_email(request: SendEmailRequest):
    """Send actual email alert"""
    try:
        # Get SMTP configuration from environment
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        email_from = os.getenv("EMAIL_FROM", "alerts@finsight.ai")
        email_password = os.getenv("EMAIL_PASSWORD", "")
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = request.subject
        msg['From'] = email_from
        msg['To'] = request.to_email
        
        # Attach HTML body
        html_part = MIMEText(request.body, 'html')
        msg.attach(html_part)
        
        # Send email
        if email_password:
            # Use SMTP if configured
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(email_from, email_password)
                server.send_message(msg)
            
            return {
                "status": "sent",
                "to": request.to_email,
                "method": "smtp"
            }
        else:
            # Save to file if SMTP not configured
            output_dir = Path("./emails")
            output_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            email_file = output_dir / f"email_{timestamp}.html"
            
            with open(email_file, 'w') as f:
                f.write(f"To: {request.to_email}\n")
                f.write(f"Subject: {request.subject}\n\n")
                f.write(request.body)
            
            return {
                "status": "saved",
                "to": request.to_email,
                "file": str(email_file),
                "method": "file",
                "message": "Email saved to file. Configure SMTP_SERVER and EMAIL_PASSWORD in .env to send actual emails."
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
