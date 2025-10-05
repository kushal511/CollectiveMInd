#!/usr/bin/env python3
"""
Pathway Live File Monitoring for Covenant Copilot
Real-time monitoring of data room files with instant covenant checks
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
from dotenv import load_dotenv
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

load_dotenv()

# Import from hackathon_copilot
from hackathon_copilot import (
    DocumentExtractor, 
    extract_financials_from_json,
    CovenantMonitor,
    EmailAlertSystem,
    LivingMemoGenerator
)

BASE_PATH = Path(os.getenv('LOCAL_DATA_PATH', './covenant-copilot/data'))
LANDING_AI_API_KEY = os.getenv('LANDING_AI_API_KEY')


class PathwayFileMonitor(FileSystemEventHandler):
    """
    Pathway-style live file monitoring
    Watches data room for changes and triggers instant covenant checks
    """
    
    def __init__(self, watch_dir: Path, covenant_terms: Dict[str, Any]):
        self.watch_dir = watch_dir
        self.covenant_terms = covenant_terms
        self.processed_files = set()
        self.results_dir = BASE_PATH / 'pathway_results'
        self.results_dir.mkdir(exist_ok=True)
        
        # Initialize components
        self.extractor = DocumentExtractor(LANDING_AI_API_KEY)
        self.monitor = CovenantMonitor(covenant_terms)
        self.email_system = EmailAlertSystem(
            os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
            int(os.getenv('SMTP_PORT', '587')),
            os.getenv('EMAIL_FROM', 'alerts@covenantcopilot.ai'),
            os.getenv('EMAIL_PASSWORD', '')
        )
        self.memo_generator = LivingMemoGenerator(BASE_PATH / 'memos')
        
        print(f"\n🔄 Pathway Monitor Active")
        print(f"   Watching: {self.watch_dir}")
        print(f"   Results: {self.results_dir}")
    
    def on_created(self, event):
        """Handle new file creation"""
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        
        # Only process relevant files
        if file_path.suffix.lower() in ['.json', '.pdf', '.jpeg', '.jpg', '.png', '.csv']:
            print(f"\n🆕 New file detected: {file_path.name}")
            self.process_file(file_path)
    
    def on_modified(self, event):
        """Handle file modification"""
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        
        # Only process relevant files
        if file_path.suffix.lower() in ['.json', '.pdf', '.jpeg', '.jpg', '.png', '.csv']:
            print(f"\n📝 File modified: {file_path.name}")
            self.process_file(file_path)
    
    def process_file(self, file_path: Path):
        """Process file and run covenant check"""
        timestamp = datetime.now()
        print(f"   [{timestamp:%H:%M:%S}] Processing...")
        
        try:
            # Extract financial data based on file type
            if file_path.suffix.lower() == '.json':
                financials = extract_financials_from_json(file_path)
            else:
                print(f"   ⚠️  File type {file_path.suffix} not yet supported for auto-processing")
                return
            
            # Run covenant check
            results = self.monitor.check_compliance(financials)
            
            # Save results
            result_file = self.results_dir / f"check_{timestamp:%Y%m%d_%H%M%S}.json"
            with open(result_file, 'w') as f:
                json.dump(results, f, indent=2)
            
            # Print status
            status_icon = "🔴" if results['status'] == "BREACH" else "🟢"
            print(f"   {status_icon} Status: {results['status']}")
            print(f"   💾 Saved: {result_file.name}")
            
            # Send alert if breach
            if results['status'] == 'BREACH':
                print(f"   🚨 BREACH DETECTED - Sending alerts...")
                self.email_system.send_breach_alert(
                    results, 
                    os.getenv('ALERT_RECIPIENTS', 'analyst@company.com').split(',')
                )
                
                # Generate updated memo
                self.memo_generator.generate_memo(results, financials, self.covenant_terms)
            
            self.processed_files.add(file_path)
            
        except Exception as e:
            print(f"   ❌ Error processing file: {e}")
    
    def scan_existing_files(self):
        """Scan existing files on startup"""
        print(f"\n🔍 Scanning existing files...")
        
        for file_path in self.watch_dir.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in ['.json', '.pdf', '.jpeg', '.jpg', '.png', '.csv']:
                if file_path not in self.processed_files:
                    print(f"   Found: {file_path.name}")
                    self.process_file(file_path)


def run_pathway_monitor(duration_seconds: int = None):
    """
    Run Pathway-style live monitoring
    
    Args:
        duration_seconds: How long to monitor (None = forever)
    """
    
    print("="*80)
    print("🔄 PATHWAY LIVE FILE MONITORING")
    print("   Real-time covenant checks on data room updates")
    print("="*80)
    
    # Get covenant terms (use defaults for demo)
    covenant_terms = {
        "max_leverage_ratio": 3.5,
        "min_coverage_ratio": 2.0,
        "min_liquidity": 100.0,
        "reporting_frequency": "Quarterly",
        "source": "Default",
        "status": "configured"
    }
    
    # Try to load from existing extraction
    try:
        extractor = DocumentExtractor(LANDING_AI_API_KEY)
        covenant_terms = extractor.extract_from_image(BASE_PATH / 'Image/file.jpeg')
    except:
        pass
    
    # Create monitor
    event_handler = PathwayFileMonitor(BASE_PATH, covenant_terms)
    
    # Scan existing files first
    event_handler.scan_existing_files()
    
    # Start watching
    observer = Observer()
    observer.schedule(event_handler, str(BASE_PATH), recursive=True)
    observer.start()
    
    print(f"\n👀 Monitoring active... (Press Ctrl+C to stop)")
    
    try:
        if duration_seconds:
            print(f"   Running for {duration_seconds} seconds")
            time.sleep(duration_seconds)
            observer.stop()
            print(f"\n⏱️  Monitoring duration complete")
        else:
            while True:
                time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print(f"\n⏹️  Monitoring stopped by user")
    
    observer.join()
    
    print(f"\n📊 Monitoring Summary:")
    print(f"   Files processed: {len(event_handler.processed_files)}")
    print(f"   Results saved: {event_handler.results_dir}")


if __name__ == "__main__":
    import sys
    
    # Get duration from command line (optional)
    duration = int(sys.argv[1]) if len(sys.argv) > 1 else None
    
    run_pathway_monitor(duration)
