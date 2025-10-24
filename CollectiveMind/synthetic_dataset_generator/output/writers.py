"""File writers for different output formats."""

import json
import csv
import os
from typing import List, Dict, Any, TextIO
from pathlib import Path


class JSONLWriter:
    """Writer for JSON Lines format files."""
    
    def __init__(self, output_path: str):
        """Initialize JSONL writer.
        
        Args:
            output_path: Path to output file
        """
        self.output_path = output_path
        self._ensure_directory()
    
    def write_items(self, items: List[Any]) -> None:
        """Write items to JSONL file.
        
        Args:
            items: List of items to write (must have to_dict() method or be dicts)
        """
        with open(self.output_path, 'w', encoding='utf-8') as f:
            for item in items:
                if hasattr(item, 'to_dict'):
                    json_data = item.to_dict()
                else:
                    json_data = item
                
                # Ensure valid JSON
                json_line = json.dumps(json_data, ensure_ascii=False, separators=(',', ':'))
                f.write(json_line + '\n')
    
    def append_item(self, item: Any) -> None:
        """Append single item to JSONL file.
        
        Args:
            item: Item to append
        """
        with open(self.output_path, 'a', encoding='utf-8') as f:
            if hasattr(item, 'to_dict'):
                json_data = item.to_dict()
            else:
                json_data = item
            
            json_line = json.dumps(json_data, ensure_ascii=False, separators=(',', ':'))
            f.write(json_line + '\n')
    
    def _ensure_directory(self) -> None:
        """Ensure output directory exists."""
        directory = os.path.dirname(self.output_path)
        if directory:
            Path(directory).mkdir(parents=True, exist_ok=True)


class CSVWriter:
    """Writer for CSV format files."""
    
    def __init__(self, output_path: str, fieldnames: List[str]):
        """Initialize CSV writer.
        
        Args:
            output_path: Path to output file
            fieldnames: List of column names
        """
        self.output_path = output_path
        self.fieldnames = fieldnames
        self._ensure_directory()
    
    def write_items(self, items: List[Dict[str, Any]]) -> None:
        """Write items to CSV file.
        
        Args:
            items: List of dictionaries to write
        """
        with open(self.output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=self.fieldnames)
            writer.writeheader()
            writer.writerows(items)
    
    def append_items(self, items: List[Dict[str, Any]]) -> None:
        """Append items to existing CSV file.
        
        Args:
            items: List of dictionaries to append
        """
        file_exists = os.path.exists(self.output_path)
        
        with open(self.output_path, 'a', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=self.fieldnames)
            
            # Write header if file is new
            if not file_exists:
                writer.writeheader()
            
            writer.writerows(items)
    
    def _ensure_directory(self) -> None:
        """Ensure output directory exists."""
        directory = os.path.dirname(self.output_path)
        if directory:
            Path(directory).mkdir(parents=True, exist_ok=True)