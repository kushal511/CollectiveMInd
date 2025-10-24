"""Core data models for organizational entities."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
import json


@dataclass
class Person:
    """Represents an employee in the organization."""
    person_id: str
    full_name: str
    email: str
    role_title: str
    team: str
    manager_id: Optional[str] = None
    skills: List[str] = field(default_factory=list)
    tenure_months: int = 0
    active: bool = True
    previous_teams: List[str] = field(default_factory=list)
    timezone: str = "America/Los_Angeles"

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "person_id": self.person_id,
            "full_name": self.full_name,
            "email": self.email,
            "role_title": self.role_title,
            "team": self.team,
            "manager_id": self.manager_id,
            "skills": self.skills,
            "tenure_months": self.tenure_months,
            "active": self.active,
            "previous_teams": self.previous_teams,
            "timezone": self.timezone
        }


@dataclass
class Document:
    """Represents a document in the organizational knowledge base."""
    doc_id: str
    title: str
    content: str
    team: str
    author_person_id: str
    co_authors: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    status: str = "draft"  # draft/final
    visibility: str = "internal"  # public/internal/restricted
    source_type: str = "native_internal"
    language: str = "en"
    confidentiality: str = "medium"  # low/medium/high
    related_doc_ids: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "doc_id": self.doc_id,
            "title": self.title,
            "content": self.content,
            "team": self.team,
            "author_person_id": self.author_person_id,
            "co_authors": self.co_authors,
            "tags": self.tags,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "status": self.status,
            "visibility": self.visibility,
            "source_type": self.source_type,
            "language": self.language,
            "confidentiality": self.confidentiality,
            "related_doc_ids": self.related_doc_ids
        }


@dataclass
class ChatThread:
    """Represents a chat thread/channel."""
    thread_id: str
    channel: str
    topic_tags: List[str] = field(default_factory=list)
    created_at: Optional[datetime] = None
    participants: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "thread_id": self.thread_id,
            "channel": self.channel,
            "topic_tags": self.topic_tags,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "participants": self.participants
        }


@dataclass
class ChatMessage:
    """Represents a message in a chat thread."""
    message_id: str
    thread_id: str
    sender_person_id: str
    timestamp: Optional[datetime] = None
    text: str = ""
    emotions: str = "calm"  # calm/frustrated/urgent/optimistic/confused
    mentions: List[str] = field(default_factory=list)
    doc_refs: List[str] = field(default_factory=list)
    action_items: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "message_id": self.message_id,
            "thread_id": self.thread_id,
            "sender_person_id": self.sender_person_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "text": self.text,
            "emotions": self.emotions,
            "mentions": self.mentions,
            "doc_refs": self.doc_refs,
            "action_items": self.action_items
        }


@dataclass
class Meeting:
    """Represents a meeting summary."""
    meeting_id: str
    title: str
    attendees: List[str] = field(default_factory=list)
    date: Optional[datetime] = None
    summary: str = ""
    decisions: List[str] = field(default_factory=list)
    action_items: List[str] = field(default_factory=list)
    team_dependencies: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "meeting_id": self.meeting_id,
            "title": self.title,
            "attendees": self.attendees,
            "date": self.date.isoformat() if self.date else None,
            "summary": self.summary,
            "decisions": self.decisions,
            "action_items": self.action_items,
            "team_dependencies": self.team_dependencies
        }


@dataclass
class Topic:
    """Represents a topic in the knowledge graph."""
    topic_id: str
    name: str
    aliases: List[str] = field(default_factory=list)
    emerging_score: float = 0.0
    related_topic_ids: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "topic_id": self.topic_id,
            "name": self.name,
            "aliases": self.aliases,
            "emerging_score": self.emerging_score,
            "related_topic_ids": self.related_topic_ids
        }