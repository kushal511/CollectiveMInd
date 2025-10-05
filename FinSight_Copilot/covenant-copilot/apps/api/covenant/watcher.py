"""
File watcher for live covenant monitoring
"""
import os
import time
import json
from pathlib import Path
from datetime import datetime
from covenant.extractor import CovenantExtractor, CovenantMonitor

def run_watcher(data_path: str, duration: int = 60):
    """Run file watcher for specified duration"""
    print(f"Starting watcher for {duration} seconds on {data_path}")
    
    watch_dir = Path(data_path)
    if not watch_dir.exists():
        print(f"Watch directory {data_path} does not exist")
        return
    
    # Initialize extractor
    api_key = os.getenv("LANDING_AI_API_KEY")
    extractor = CovenantExtractor(api_key)
    
    # Default covenant terms
    covenant_terms = {
        "max_leverage_ratio": 3.5,
        "min_coverage_ratio": 2.0,
        "min_liquidity": 100.0
    }
    
    processed_files = set()
    start_time = time.time()
    
    while time.time() - start_time < duration:
        try:
            # Check for new JSON files
            for json_file in watch_dir.glob("*.json"):
                if json_file not in processed_files:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Processing new file: {json_file.name}")
                    
                    # Extract financials
                    financials = extractor.extract_from_json(json_file)
                    
                    # Check compliance
                    monitor = CovenantMonitor(covenant_terms)
                    results = monitor.check_compliance(financials)
                    
                    print(f"  Status: {results['status']}")
                    
                    # If breach detected, send alert
                    if results['status'] == 'BREACH':
                        print("  ALERT: Breach detected!")
                        red_flags = monitor.collect_red_flags(results)
                        
                        # Send email alert (simplified)
                        send_alert_email(results, red_flags)
                    
                    processed_files.add(json_file)
            
            time.sleep(3)  # Check every 3 seconds
            
        except KeyboardInterrupt:
            print("Watcher stopped by user")
            break
        except Exception as e:
            print(f"Error in watcher: {e}")
            time.sleep(5)
    
    print(f"Watcher completed. Processed {len(processed_files)} files.")

def send_alert_email(results: dict, red_flags: list):
    """Send alert email for breach detection"""
    try:
        # For demo, just print the alert
        print(f"\n{'='*50}")
        print("BREACH ALERT EMAIL")
        print(f"{'='*50}")
        print(f"Company: {results['company']}")
        print(f"Period: {results['period']}")
        print(f"Status: {results['status']}")
        print("\nRed Flags:")
        for flag in red_flags:
            print(f"- {flag['message']}")
        print(f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*50}\n")
        
        # In production, would send actual email here
        return True
    except Exception as e:
        print(f"Failed to send alert: {e}")
        return False

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        data_path = sys.argv[1]
        duration = int(sys.argv[2]) if len(sys.argv) > 2 else 60
        run_watcher(data_path, duration)
    else:
        print("Usage: python watcher.py <data_path> [duration_seconds]")
