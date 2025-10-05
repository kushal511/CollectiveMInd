"""
MCP Server for Covenant Monitoring Copilot
Provides financial agent tools via JSON-RPC over stdio
"""
import json
import sys
import os
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

# Add the API path to sys.path for imports
sys.path.append(str(Path(__file__).parent.parent))

from covenant.extractor import CovenantExtractor, CovenantMonitor, PathwayMonitor

class MCPServer:
    """MCP Server for financial agent tools"""
    
    def __init__(self):
        self.tools = {
            "run_extraction": self.run_extraction,
            "check_covenants": self.check_covenants,
            "watch_drive_folder": self.watch_drive_folder,
            "list_red_flags": self.list_red_flags,
            "send_breach_email": self.send_breach_email,
            "generate_memo": self.generate_memo,
            "answer_question": self.answer_question,
        }
    
    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle JSON-RPC request"""
        try:
            method = request.get("method")
            params = request.get("params", {})
            request_id = request.get("id")
            
            if method not in self.tools:
                return {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "error": {"code": -32601, "message": f"Method not found: {method}"}
                }
            
            result = self.tools[method](**params)
            
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": result
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "error": {"code": -32603, "message": str(e)}
            }
    
    def run_extraction(self, data_path: str = "./data") -> Dict[str, Any]:
        """Run multi-format extraction using LandingAI ADE + JSON"""
        try:
            api_key = os.getenv("LANDING_AI_API_KEY")
            extractor = CovenantExtractor(api_key)
            
            data_dir = Path(data_path)
            
            # Extract from different formats
            results = {}
            
            # Image extraction
            image_path = data_dir / "Image" / "file.jpeg"
            if image_path.exists():
                results["image"] = extractor.extract_from_image(image_path)
            
            # PDF extraction
            pdf_path = data_dir / "PDF" / "file.pdf"
            if pdf_path.exists():
                results["pdf"] = extractor.extract_from_pdf(pdf_path)
            
            # JSON extraction (primary)
            json_path = data_dir / "JSON" / "file.json"
            if json_path.exists():
                results["json"] = extractor.extract_from_json(json_path)
            
            # CSV extraction
            csv_path = data_dir / "CSV" / "file.csv"
            if csv_path.exists():
                results["csv"] = extractor.extract_from_csv(csv_path)
            
            return {
                "status": "success",
                "extractions": results,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def check_covenants(self, financials: Dict[str, Any], terms: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Check covenant compliance"""
        try:
            if not terms:
                terms = {
                    "max_leverage_ratio": 3.5,
                    "min_coverage_ratio": 2.0,
                    "min_liquidity": 100.0
                }
            
            monitor = CovenantMonitor(terms)
            results = monitor.check_compliance(financials)
            red_flags = monitor.collect_red_flags(results)
            
            return {
                "status": "success",
                "results": results,
                "red_flags": red_flags,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def watch_drive_folder(self, folder_path: str, duration: int = 60) -> Dict[str, Any]:
        """Watch folder for changes and trigger re-checks"""
        try:
            watch_dir = Path(folder_path)
            if not watch_dir.exists():
                return {
                    "status": "error",
                    "error": f"Watch directory {folder_path} does not exist"
                }
            
            # Start watcher subprocess
            watcher_script = Path(__file__).parent.parent / "covenant" / "watcher.py"
            process = subprocess.Popen([
                sys.executable, str(watcher_script), folder_path, str(duration)
            ])
            
            return {
                "status": "success",
                "pid": process.pid,
                "duration": duration,
                "watch_path": folder_path,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def list_red_flags(self, company: str = "Tesla Inc.", period: str = "Q2 2025") -> Dict[str, Any]:
        """List latest red flags for a company/period"""
        try:
            # This would typically query the database
            # For demo, return sample red flags
            sample_flags = [
                {
                    "rule": "leverage",
                    "actual": 3.78,
                    "limit": 3.5,
                    "margin": -0.28,
                    "message": "LEVERAGE BREACH: 3.78x vs 3.5x",
                    "timestamp": datetime.utcnow().isoformat()
                }
            ]
            
            return {
                "status": "success",
                "company": company,
                "period": period,
                "red_flags": sample_flags,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def send_breach_email(self, email_to: str, breach_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send breach alert email"""
        try:
            # Email configuration
            smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            smtp_user = os.getenv("SMTP_USER")
            smtp_pass = os.getenv("SMTP_PASS")
            alert_from = os.getenv("ALERT_FROM", "alerts@duecopilot.ai")
            
            # For demo, just print the email
            print(f"\n{'='*50}")
            print(f"BREACH EMAIL ALERT")
            print(f"{'='*50}")
            print(f"To: {email_to}")
            print(f"Subject: [Covenant Breach] {breach_data.get('company', 'Company')} {breach_data.get('period', 'Period')}")
            print(f"\nBody:")
            print(f"Company: {breach_data.get('company', 'N/A')}")
            print(f"Period: {breach_data.get('period', 'N/A')}")
            print(f"Status: BREACH")
            print(f"\nRed Flags:")
            for flag in breach_data.get('red_flags', []):
                print(f"- {flag.get('message', 'Unknown breach')}")
            print(f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*50}\n")
            
            return {
                "status": "success",
                "email_to": email_to,
                "sent": True,  # In demo mode
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def generate_memo(self, result_data: Dict[str, Any], red_flags: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate memo from results and red flags"""
        try:
            memo_content = f"""# Covenant Compliance Memo

**Company:** {result_data.get('company', 'N/A')}  
**Period:** {result_data.get('period', 'N/A')}  
**Overall Status:** {result_data.get('status', 'N/A')}  
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Executive Summary

The covenant compliance check resulted in a **{result_data.get('status', 'N/A')}** status.

## Covenant Test Results

| Covenant | Actual | Limit | Status | Margin |
|----------|--------|-------|--------|--------|
"""
            
            tests = result_data.get('tests', {})
            for test_name, test_data in tests.items():
                memo_content += f"| {test_name.title()} | {test_data['actual']} | {test_data['limit']} | {test_data['status']} | {test_data['margin']} |\n"
            
            if red_flags:
                memo_content += f"""
## Red Flags Detected

"""
                for flag in red_flags:
                    memo_content += f"- **{flag['rule'].upper()}**: {flag['message']}\n"
            
            memo_content += f"""
## Supporting Metrics

- **Total Debt**: ${result_data.get('total_debt', 0):.0f}M
- **EBITDA**: ${result_data.get('ebitda', 0):.0f}M  
- **Interest Expense**: ${result_data.get('interest_expense', 0):.0f}M
- **Cash & Equivalents**: ${result_data.get('cash_equivalents', 0):.0f}M

## Source Attribution

- **Generated by**: Covenant Monitoring Copilot MCP Server
- **Version**: 1.0.0
- **Timestamp**: {datetime.now().isoformat()}
"""
            
            # Save memo
            memo_dir = Path("./memos")
            memo_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            company_name = result_data.get('company', 'Company').replace(' ', '_')
            period = result_data.get('period', 'Period').replace(' ', '_')
            
            memo_md_path = memo_dir / f"{company_name}_{period}_{timestamp}.md"
            memo_pdf_path = memo_dir / f"{company_name}_{period}_{timestamp}.pdf"
            
            with open(memo_md_path, 'w') as f:
                f.write(memo_content)
            
            # For demo, copy markdown as PDF
            with open(memo_pdf_path, 'w') as f:
                f.write(memo_content)
            
            return {
                "status": "success",
                "memo_md_path": str(memo_md_path),
                "memo_pdf_path": str(memo_pdf_path),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def answer_question(self, question: str, context_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Answer questions about covenant data"""
        try:
            if not context_data:
                context_data = {
                    "company": "Tesla Inc.",
                    "period": "Q2 2025",
                    "tests": {
                        "leverage": {"actual": 3.78, "limit": 3.5, "status": "BREACH"},
                        "coverage": {"actual": 8.2, "limit": 2.0, "status": "PASS"},
                        "liquidity": {"actual": 15587, "limit": 100, "status": "PASS"}
                    }
                }
            
            question_lower = question.lower()
            
            if "leverage" in question_lower:
                leverage = context_data['tests']['leverage']
                answer = f"{context_data['company']} {context_data['period']} — Leverage: {leverage['actual']}x vs {leverage['limit']}x limit → {leverage['status']}"
            elif "coverage" in question_lower:
                coverage = context_data['tests']['coverage']
                answer = f"{context_data['company']} {context_data['period']} — Coverage: {coverage['actual']}x vs {coverage['limit']}x limit → {coverage['status']}"
            elif "liquidity" in question_lower:
                liquidity = context_data['tests']['liquidity']
                answer = f"{context_data['company']} {context_data['period']} — Liquidity: ${liquidity['actual']:.0f}M vs ${liquidity['limit']:.0f}M limit → {liquidity['status']}"
            elif "breach" in question_lower or "red flag" in question_lower:
                breaches = [test for test in context_data['tests'].values() if test['status'] == 'BREACH']
                if breaches:
                    answer = f"Red flags detected: {len(breaches)} covenant breach(es) found in {context_data['company']} {context_data['period']}"
                else:
                    answer = "No red flags detected in the latest covenant check."
            else:
                answer = f"Based on the latest covenant check for {context_data['company']} {context_data['period']}: Overall status shows covenant compliance. Ask about specific metrics for details."
            
            return {
                "status": "success",
                "question": question,
                "answer": answer,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

def main():
    """Main MCP server loop"""
    server = MCPServer()
    
    print("MCP Server started", file=sys.stderr)
    
    try:
        for line in sys.stdin:
            try:
                request = json.loads(line.strip())
                response = server.handle_request(request)
                print(json.dumps(response))
                sys.stdout.flush()
            except json.JSONDecodeError:
                continue
            except Exception as e:
                error_response = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32603, "message": str(e)}
                }
                print(json.dumps(error_response))
                sys.stdout.flush()
    except KeyboardInterrupt:
        print("MCP Server stopped", file=sys.stderr)

if __name__ == "__main__":
    main()
