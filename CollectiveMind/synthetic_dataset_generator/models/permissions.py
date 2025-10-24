"""Permission and access control models."""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ACL:
    """Represents access control list for resources."""
    resource_type: str  # DOC|THREAD|PACK
    resource_id: str
    allow_person_ids: List[str] = field(default_factory=list)
    allow_teams: List[str] = field(default_factory=list)
    deny_person_ids: List[str] = field(default_factory=list)
    acl_warning: bool = False  # Flag for mis-permissioned resources

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "allow_person_ids": self.allow_person_ids,
            "allow_teams": self.allow_teams,
            "deny_person_ids": self.deny_person_ids,
            "acl_warning": self.acl_warning
        }