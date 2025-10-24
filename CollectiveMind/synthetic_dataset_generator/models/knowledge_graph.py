"""Knowledge graph models for relationships and overlaps."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class KnowledgeGraphEdge:
    """Represents an edge in the organizational knowledge graph."""
    edge_id: str
    edge_type: str  # VIEWED|AUTHORED|MENTIONED|CO_OCCURS_WITH|SIMILAR_TOPIC|TEAM_OVERLAP|REPLACES|VERSION_OF|ASKED_ABOUT|WORKED_WITH
    src_type: str  # PERSON|DOC|TOPIC|TEAM|THREAD
    src_id: str
    dst_type: str  # PERSON|DOC|TOPIC|TEAM|THREAD
    dst_id: str
    weight: float = 0.0
    first_seen_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    evidence: str = ""

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "edge_id": self.edge_id,
            "edge_type": self.edge_type,
            "src_type": self.src_type,
            "src_id": self.src_id,
            "dst_type": self.dst_type,
            "dst_id": self.dst_id,
            "weight": self.weight,
            "first_seen_at": self.first_seen_at.isoformat() if self.first_seen_at else None,
            "last_seen_at": self.last_seen_at.isoformat() if self.last_seen_at else None,
            "evidence": self.evidence
        }


@dataclass
class Overlap:
    """Represents cross-team overlap insights."""
    overlap_id: str
    topic_name: str
    teams_involved: List[str] = field(default_factory=list)
    people_suggested: List[str] = field(default_factory=list)
    supporting_docs: List[str] = field(default_factory=list)
    supporting_threads: List[str] = field(default_factory=list)
    summary: str = ""
    action_suggestion: str = ""
    confidence: float = 0.0

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "overlap_id": self.overlap_id,
            "topic_name": self.topic_name,
            "teams_involved": self.teams_involved,
            "people_suggested": self.people_suggested,
            "supporting_docs": self.supporting_docs,
            "supporting_threads": self.supporting_threads,
            "summary": self.summary,
            "action_suggestion": self.action_suggestion,
            "confidence": self.confidence
        }