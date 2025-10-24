"""User event and interaction models."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class UserEvent:
    """Represents a user interaction event."""
    event_id: str
    person_id: str
    event_type: str  # VIEWED|SEARCHED|CLICKED
    resource_type: str  # DOC|THREAD|PACK|TOPIC
    resource_id: str
    timestamp: Optional[datetime] = None
    query: Optional[str] = None  # For search events

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "event_id": self.event_id,
            "person_id": self.person_id,
            "event_type": self.event_type,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "query": self.query
        }