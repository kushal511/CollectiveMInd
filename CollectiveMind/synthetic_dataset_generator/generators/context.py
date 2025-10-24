"""Context manager for maintaining shared state and references."""

from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
from collections import defaultdict
import random

from ..models.core import Person, Document, Topic, ChatThread
from ..config.settings import GenerationConfig


class Timeline:
    """Manages temporal consistency across generated events."""
    
    def __init__(self, start_date: datetime, end_date: datetime):
        """Initialize timeline with date range.
        
        Args:
            start_date: Start of timeline
            end_date: End of timeline
        """
        self.start_date = start_date
        self.end_date = end_date
        self.events: List[Dict[str, Any]] = []
    
    def add_event(self, event_type: str, entity_id: str, timestamp: datetime, 
                  metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add event to timeline.
        
        Args:
            event_type: Type of event (e.g., 'document_created', 'person_joined')
            entity_id: ID of entity involved in event
            timestamp: When event occurred
            metadata: Additional event metadata
        """
        event = {
            'event_type': event_type,
            'entity_id': entity_id,
            'timestamp': timestamp,
            'metadata': metadata or {}
        }
        self.events.append(event)
    
    def get_events_before(self, timestamp: datetime, event_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get events that occurred before given timestamp.
        
        Args:
            timestamp: Cutoff timestamp
            event_type: Optional filter by event type
            
        Returns:
            List of events before timestamp
        """
        events = [e for e in self.events if e['timestamp'] < timestamp]
        if event_type:
            events = [e for e in events if e['event_type'] == event_type]
        return sorted(events, key=lambda x: x['timestamp'])
    
    def get_events_in_range(self, start: datetime, end: datetime) -> List[Dict[str, Any]]:
        """Get events within date range.
        
        Args:
            start: Start of range
            end: End of range
            
        Returns:
            List of events in range
        """
        return [e for e in self.events if start <= e['timestamp'] <= end]


class ValidationResult:
    """Result of referential integrity validation."""
    
    def __init__(self):
        self.is_valid = True
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def add_error(self, message: str) -> None:
        """Add validation error."""
        self.errors.append(message)
        self.is_valid = False
    
    def add_warning(self, message: str) -> None:
        """Add validation warning."""
        self.warnings.append(message)


class ContextManager:
    """Central coordination point for maintaining shared state and ensuring referential integrity."""
    
    def __init__(self, config: GenerationConfig):
        """Initialize context manager.
        
        Args:
            config: Generation configuration
        """
        self.config = config
        
        # Entity registries
        self.people: Dict[str, Person] = {}
        self.documents: Dict[str, Document] = {}
        self.topics: Dict[str, Topic] = {}
        self.chat_threads: Dict[str, ChatThread] = {}
        
        # Team and role mappings
        self.teams = config.organization.teams
        self.people_by_team: Dict[str, List[str]] = defaultdict(list)
        self.managers: List[str] = []
        
        # Content and relationship tracking
        self.document_tags: Dict[str, Set[str]] = defaultdict(set)  # tag -> doc_ids
        self.topic_documents: Dict[str, Set[str]] = defaultdict(set)  # topic_id -> doc_ids
        self.cross_references: Dict[str, Set[str]] = defaultdict(set)  # entity_id -> related_entity_ids
        
        # Timeline management
        start_date = datetime.fromisoformat(config.temporal.start_date)
        end_date = datetime.fromisoformat(config.temporal.end_date)
        self.timeline = Timeline(start_date, end_date)
        
        # Content templates and themes
        self.content_themes = self._initialize_content_themes()
        
        # Random instance for consistent generation
        self.random = random.Random()
    
    def register_entity(self, entity_type: str, entity_id: str, entity: Any) -> None:
        """Register entity in appropriate registry.
        
        Args:
            entity_type: Type of entity ('person', 'document', 'topic', 'thread')
            entity_id: Unique identifier for entity
            entity: Entity object to register
        """
        if entity_type == 'person':
            self.people[entity_id] = entity
            self.people_by_team[entity.team].append(entity_id)
            
            # Track managers
            if 'manager' in entity.role_title.lower() or 'director' in entity.role_title.lower():
                self.managers.append(entity_id)
                
        elif entity_type == 'document':
            self.documents[entity_id] = entity
            
            # Index document tags
            for tag in entity.tags:
                self.document_tags[tag].add(entity_id)
                
        elif entity_type == 'topic':
            self.topics[entity_id] = entity
            
        elif entity_type == 'thread':
            self.chat_threads[entity_id] = entity
    
    def get_random_person(self, team: Optional[str] = None, role_filter: Optional[str] = None) -> Optional[Person]:
        """Get random person, optionally filtered by team or role.
        
        Args:
            team: Optional team filter
            role_filter: Optional role filter (e.g., 'manager')
            
        Returns:
            Random person matching criteria
        """
        candidates = list(self.people.values())
        
        if team:
            candidates = [p for p in candidates if p.team == team]
        
        if role_filter:
            if role_filter.lower() == 'manager':
                candidates = [p for p in candidates if p.person_id in self.managers]
            else:
                candidates = [p for p in candidates if role_filter.lower() in p.role_title.lower()]
        
        return self.random.choice(candidates) if candidates else None
    
    def get_people_by_team(self, team: str) -> List[Person]:
        """Get all people in a specific team.
        
        Args:
            team: Team name
            
        Returns:
            List of people in team
        """
        person_ids = self.people_by_team.get(team, [])
        return [self.people[pid] for pid in person_ids if pid in self.people]
    
    def get_related_documents(self, topic: str, team: Optional[str] = None, limit: int = 5) -> List[Document]:
        """Get documents related to a topic, optionally filtered by team.
        
        Args:
            topic: Topic or tag to search for
            team: Optional team filter
            limit: Maximum number of documents to return
            
        Returns:
            List of related documents
        """
        # Find documents with matching tags
        doc_ids = self.document_tags.get(topic, set())
        
        # Also check topic-document mappings
        topic_obj = self._find_topic_by_name(topic)
        if topic_obj:
            doc_ids.update(self.topic_documents.get(topic_obj.topic_id, set()))
        
        documents = [self.documents[doc_id] for doc_id in doc_ids if doc_id in self.documents]
        
        if team:
            documents = [doc for doc in documents if doc.team == team]
        
        return self.random.sample(documents, min(limit, len(documents)))
    
    def add_cross_reference(self, entity_id: str, related_entity_id: str) -> None:
        """Add cross-reference between entities.
        
        Args:
            entity_id: Source entity ID
            related_entity_id: Target entity ID
        """
        self.cross_references[entity_id].add(related_entity_id)
        self.cross_references[related_entity_id].add(entity_id)
    
    def get_cross_references(self, entity_id: str) -> Set[str]:
        """Get entities cross-referenced with given entity.
        
        Args:
            entity_id: Entity ID to look up
            
        Returns:
            Set of related entity IDs
        """
        return self.cross_references.get(entity_id, set())
    
    def ensure_referential_integrity(self) -> ValidationResult:
        """Validate referential integrity across all entities.
        
        Returns:
            Validation result with any errors or warnings
        """
        result = ValidationResult()
        
        # Validate person references
        for person in self.people.values():
            if person.manager_id and person.manager_id not in self.people:
                result.add_error(f"Person {person.person_id} has invalid manager_id: {person.manager_id}")
        
        # Validate document references
        for document in self.documents.values():
            if document.author_person_id not in self.people:
                result.add_error(f"Document {document.doc_id} has invalid author_person_id: {document.author_person_id}")
            
            for co_author in document.co_authors:
                if co_author not in self.people:
                    result.add_error(f"Document {document.doc_id} has invalid co_author: {co_author}")
            
            for related_doc in document.related_doc_ids:
                if related_doc not in self.documents:
                    result.add_warning(f"Document {document.doc_id} references non-existent document: {related_doc}")
        
        return result
    
    def _find_topic_by_name(self, name: str) -> Optional[Topic]:
        """Find topic by name or alias.
        
        Args:
            name: Topic name to search for
            
        Returns:
            Topic object if found
        """
        for topic in self.topics.values():
            if topic.name.lower() == name.lower():
                return topic
            if name.lower() in [alias.lower() for alias in topic.aliases]:
                return topic
        return None
    
    def _initialize_content_themes(self) -> Dict[str, List[str]]:
        """Initialize content themes and keywords by team.
        
        Returns:
            Dictionary mapping teams to their content themes
        """
        return {
            "Marketing": [
                "customer acquisition", "brand awareness", "campaign performance", 
                "conversion rates", "market research", "competitive analysis",
                "customer segmentation", "retention", "churn analysis", "pricing strategy"
            ],
            "Product": [
                "user experience", "feature development", "product roadmap",
                "user research", "A/B testing", "product metrics", "onboarding",
                "user feedback", "feature adoption", "product strategy"
            ],
            "Engineering": [
                "system architecture", "performance optimization", "scalability",
                "technical debt", "code review", "deployment", "monitoring",
                "security", "API design", "infrastructure", "bug fixes"
            ],
            "Finance": [
                "revenue analysis", "cost optimization", "budget planning",
                "financial forecasting", "risk assessment", "compliance",
                "quarterly results", "expense tracking", "ROI analysis"
            ],
            "HR": [
                "employee engagement", "talent acquisition", "performance management",
                "training programs", "company culture", "policy updates",
                "compensation", "benefits", "team building", "onboarding"
            ]
        }
    
    def get_content_themes(self, team: str) -> List[str]:
        """Get content themes for a specific team.
        
        Args:
            team: Team name
            
        Returns:
            List of content themes for the team
        """
        return self.content_themes.get(team, [])
    
    def get_cross_team_themes(self) -> List[str]:
        """Get themes that span multiple teams.
        
        Returns:
            List of cross-team themes
        """
        return [
            "customer churn", "onboarding experience", "pricing strategy",
            "user engagement", "performance metrics", "quarterly planning",
            "hiring freeze", "policy changes", "system performance"
        ]
    
    def get_entity_count(self, entity_type: str) -> int:
        """Get count of registered entities by type.
        
        Args:
            entity_type: Type of entity to count
            
        Returns:
            Number of entities of that type
        """
        if entity_type == 'person':
            return len(self.people)
        elif entity_type == 'document':
            return len(self.documents)
        elif entity_type == 'topic':
            return len(self.topics)
        elif entity_type == 'thread':
            return len(self.chat_threads)
        return 0
    
    def get_all_entity_ids(self, entity_type: str) -> List[str]:
        """Get all entity IDs of a specific type.
        
        Args:
            entity_type: Type of entity
            
        Returns:
            List of entity IDs
        """
        if entity_type == 'person':
            return list(self.people.keys())
        elif entity_type == 'document':
            return list(self.documents.keys())
        elif entity_type == 'topic':
            return list(self.topics.keys())
        elif entity_type == 'thread':
            return list(self.chat_threads.keys())
        return []