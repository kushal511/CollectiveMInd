#!/usr/bin/env python3
"""Test script for synthetic dataset generation."""

import sys
import os
from pathlib import Path

# Add the package to Python path
sys.path.insert(0, str(Path(__file__).parent))

from synthetic_dataset_generator.main import SyntheticDatasetGenerator


def test_basic_generation():
    """Test basic dataset generation functionality."""
    print("Testing synthetic dataset generation...")
    
    try:
        # Use default configuration
        generator = SyntheticDatasetGenerator()
        
        # Test organization generation
        print("\n1. Testing organization generation...")
        people = generator.organization_generator.generate()
        print(f"   Generated {len(people)} people")
        
        # Verify demo personas are included
        demo_names = [p["name"] for p in generator.config.demo_personas]
        generated_names = [p.full_name for p in people]
        
        for demo_name in demo_names:
            if demo_name in generated_names:
                print(f"   ✓ Demo persona '{demo_name}' included")
            else:
                print(f"   ✗ Demo persona '{demo_name}' missing")
        
        # Test document generation
        print("\n2. Testing document generation...")
        documents = generator.document_generator.generate()
        print(f"   Generated {len(documents)} documents")
        
        # Check document distribution by team
        doc_by_team = {}
        for doc in documents:
            doc_by_team[doc.team] = doc_by_team.get(doc.team, 0) + 1
        
        print("   Document distribution by team:")
        for team, count in doc_by_team.items():
            print(f"     {team}: {count} documents")
        
        # Test validation
        print("\n3. Testing validation...")
        validation_result = generator.context.ensure_referential_integrity()
        
        if validation_result.is_valid:
            print("   ✓ All references are valid")
        else:
            print(f"   ✗ Found {len(validation_result.errors)} validation errors")
            for error in validation_result.errors[:3]:
                print(f"     - {error}")
        
        print("\n✓ Basic generation test completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_data_quality():
    """Test data quality and consistency."""
    print("\nTesting data quality...")
    
    generator = SyntheticDatasetGenerator()
    
    # Generate data
    people = generator.organization_generator.generate()
    documents = generator.document_generator.generate()
    
    # Test people data quality
    print("\n1. People data quality:")
    
    # Check for unique IDs
    person_ids = [p.person_id for p in people]
    if len(person_ids) == len(set(person_ids)):
        print("   ✓ All person IDs are unique")
    else:
        print("   ✗ Duplicate person IDs found")
    
    # Check email format
    valid_emails = all("@technova.com" in p.email for p in people)
    if valid_emails:
        print("   ✓ All emails have correct domain")
    else:
        print("   ✗ Invalid email formats found")
    
    # Check manager assignments
    managers = [p for p in people if p.person_id in generator.context.managers]
    if len(managers) >= 3:
        print(f"   ✓ {len(managers)} managers assigned")
    else:
        print(f"   ✗ Only {len(managers)} managers found (expected 3+)")
    
    # Test document data quality
    print("\n2. Document data quality:")
    
    # Check for unique IDs
    doc_ids = [d.doc_id for d in documents]
    if len(doc_ids) == len(set(doc_ids)):
        print("   ✓ All document IDs are unique")
    else:
        print("   ✗ Duplicate document IDs found")
    
    # Check author references
    valid_authors = all(d.author_person_id in person_ids for d in documents)
    if valid_authors:
        print("   ✓ All document authors are valid")
    else:
        print("   ✗ Invalid author references found")
    
    # Check content length
    avg_content_length = sum(len(d.content) for d in documents) / len(documents)
    if avg_content_length > 100:
        print(f"   ✓ Average content length: {avg_content_length:.0f} characters")
    else:
        print(f"   ✗ Content too short: {avg_content_length:.0f} characters")
    
    print("\n✓ Data quality test completed!")


if __name__ == "__main__":
    print("=" * 60)
    print("SYNTHETIC DATASET GENERATOR - TEST SUITE")
    print("=" * 60)
    
    # Run basic generation test
    success = test_basic_generation()
    
    if success:
        # Run data quality test
        test_data_quality()
        
        print("\n" + "=" * 60)
        print("ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("TESTS FAILED - CHECK ERRORS ABOVE")
        print("=" * 60)
        sys.exit(1)