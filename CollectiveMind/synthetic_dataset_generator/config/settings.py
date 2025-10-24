"""Configuration settings and data classes."""

from dataclasses import dataclass, field
from typing import List, Dict, Any
from datetime import datetime


@dataclass
class OrganizationConfig:
    """Configuration for organizational structure."""
    company_name: str = "TechNova Inc"
    employee_count: int = 25
    teams: List[str] = field(default_factory=lambda: ["Marketing", "Product", "Engineering", "Finance", "HR"])
    manager_count: int = 3


@dataclass
class ContentVolumeConfig:
    """Configuration for content generation volumes."""
    documents: int = 160
    chat_threads: int = 220
    chat_messages_min: int = 2200
    chat_messages_max: int = 2800
    meetings: int = 30
    weekly_briefs: int = 17
    knowledge_graph_edges: int = 2500
    topics: int = 60
    overlaps_min: int = 15
    overlaps_max: int = 25


@dataclass
class TemporalConfig:
    """Configuration for temporal data generation."""
    start_date: str = "2024-01-01"
    end_date: str = "2025-10-24"
    business_hours: str = "09:00-17:00"
    timezones: List[str] = field(default_factory=lambda: [
        "America/Los_Angeles", 
        "America/New_York", 
        "Europe/London"
    ])


@dataclass
class OutputConfig:
    """Configuration for output formatting and validation."""
    format: str = "jsonl"
    compression: bool = False
    validation: bool = True
    manifest: bool = True
    output_dir: str = "technova_dataset"


@dataclass
class GenerationConfig:
    """Main configuration class combining all settings."""
    organization: OrganizationConfig = field(default_factory=OrganizationConfig)
    content_volumes: ContentVolumeConfig = field(default_factory=ContentVolumeConfig)
    temporal: TemporalConfig = field(default_factory=TemporalConfig)
    output: OutputConfig = field(default_factory=OutputConfig)
    
    # Demo personas
    demo_personas: List[Dict[str, str]] = field(default_factory=lambda: [
        {"name": "Maya Chen", "role": "Product Manager", "team": "Product"},
        {"name": "Rahul Sharma", "role": "Marketing Analyst", "team": "Marketing"},
        {"name": "Priya Patel", "role": "New Hire", "team": "Product"}
    ])

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return {
            "organization": {
                "company_name": self.organization.company_name,
                "employee_count": self.organization.employee_count,
                "teams": self.organization.teams,
                "manager_count": self.organization.manager_count
            },
            "content_volumes": {
                "documents": self.content_volumes.documents,
                "chat_threads": self.content_volumes.chat_threads,
                "chat_messages_range": [
                    self.content_volumes.chat_messages_min,
                    self.content_volumes.chat_messages_max
                ],
                "meetings": self.content_volumes.meetings,
                "weekly_briefs": self.content_volumes.weekly_briefs,
                "knowledge_graph_edges": self.content_volumes.knowledge_graph_edges,
                "topics": self.content_volumes.topics,
                "overlaps_range": [
                    self.content_volumes.overlaps_min,
                    self.content_volumes.overlaps_max
                ]
            },
            "temporal": {
                "start_date": self.temporal.start_date,
                "end_date": self.temporal.end_date,
                "business_hours": self.temporal.business_hours,
                "timezones": self.temporal.timezones
            },
            "output": {
                "format": self.output.format,
                "compression": self.output.compression,
                "validation": self.output.validation,
                "manifest": self.output.manifest,
                "output_dir": self.output.output_dir
            },
            "demo_personas": self.demo_personas
        }