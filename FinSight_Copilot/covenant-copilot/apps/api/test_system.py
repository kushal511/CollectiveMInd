#!/usr/bin/env python3
"""
Simple test script to verify the Covenant Monitoring Copilot system
"""
import sys
import os
sys.path.append('.')

def test_imports():
    """Test that all modules can be imported"""
    try:
        from models import create_database
        print("✅ Models imported successfully")
        
        from covenant.extractor import CovenantExtractor, CovenantMonitor
        print("✅ Covenant extractor imported successfully")
        
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_database():
    """Test database creation"""
    try:
        from models import create_database
        engine = create_database()
        print("✅ Database created successfully")
        return True
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

def test_extraction():
    """Test covenant extraction"""
    try:
        from covenant.extractor import CovenantExtractor, CovenantMonitor
        from pathlib import Path
        
        # Test with sample data
        extractor = CovenantExtractor()
        json_path = Path("../../data/JSON/file.json")
        
        if json_path.exists():
            financials = extractor.extract_from_json(json_path)
            print(f"✅ Financial extraction successful: {financials['company_name']}")
            
            # Test covenant monitoring
            terms = {
                "max_leverage_ratio": 3.5,
                "min_coverage_ratio": 2.0,
                "min_liquidity": 100.0
            }
            
            monitor = CovenantMonitor(terms)
            results = monitor.check_compliance(financials)
            print(f"✅ Covenant check successful: {results['status']}")
            
            return True
        else:
            print("⚠️ Sample data not found, skipping extraction test")
            return True
    except Exception as e:
        print(f"❌ Extraction error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Covenant Monitoring Copilot...")
    print("=" * 50)
    
    tests = [
        ("Import Test", test_imports),
        ("Database Test", test_database),
        ("Extraction Test", test_extraction),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print("\n" + "=" * 50)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! System is ready.")
        return True
    else:
        print("❌ Some tests failed. Check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
