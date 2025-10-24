"""User event generator for creating realistic interaction patterns."""

import random
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta

from .base import BaseGenerator
from .context import ContextManager
from ..models.events import UserEvent
from ..config.settings import GenerationConfig


class UserEventGenerator(BaseGenerator):
    """Generates user interaction events for personalization and recommendations."""
    
    def __init__(self, config: GenerationConfig, context: ContextManager):
        """Initialize user event generator."""
        super().__init__(config, context)
        
        # Demo personas with specific behavior patterns
        self.demo_personas = {
            "Maya Chen": {
                "role": "Product Manager",
                "team": "Product",
                "behavior_profile": {
                    "search_frequency": "high",
                    "document_focus": ["product", "user", "analytics", "churn", "onboarding"],
                    "cross_team_interest": ["Marketing", "Engineering"],
                    "preferred_resources": ["DOC", "TOPIC"],
                    "session_patterns": "focused_deep_dives"
                }
            },
            "Rahul Sharma": {
                "role": "Marketing Analyst", 
                "team": "Marketing",
                "behavior_profile": {
                    "search_frequency": "medium",
                    "document_focus": ["marketing", "campaign", "customer", "churn", "analytics"],
                    "cross_team_interest": ["Product", "Finance"],
                    "preferred_resources": ["DOC", "THREAD"],
                    "session_patterns": "broad_exploration"
                }
            },
            "Priya Patel": {
                "role": "New Hire",
                "team": "Product", 
                "behavior_profile": {
                    "search_frequency": "very_high",
                    "document_focus": ["onboarding", "process", "guide", "training", "product"],
                    "cross_team_interest": ["HR", "Engineering"],
                    "preferred_resources": ["PACK", "DOC"],
                    "session_patterns": "learning_oriented"
                }
            }
        }
        
        # Event type patterns
        self.event_patterns = {
            "VIEWED": {
                "frequency": 0.6,
                "description": "User viewed a resource",
                "session_clustering": True
            },
            "SEARCHED": {
                "frequency": 0.3,
                "description": "User performed a search",
                "requires_query": True
            },
            "CLICKED": {
                "frequency": 0.1,
                "description": "User clicked on a resource link",
                "follows_search": True
            }
        }
        
        # Search query templates by persona
        self.search_queries = {
            "Maya Chen": [
                "customer churn analysis",
                "product metrics dashboard",
                "user onboarding flow",
                "feature adoption rates",
                "product roadmap planning",
                "user experience research",
                "A/B testing results",
                "customer feedback analysis",
                "pricing strategy impact",
                "cross-team collaboration"
            ],
            "Rahul Sharma": [
                "marketing campaign performance",
                "customer segmentation data",
                "lead generation metrics",
                "brand awareness analysis",
                "competitive intelligence",
                "customer acquisition cost",
                "email campaign results",
                "social media analytics",
                "market research findings",
                "customer churn prevention"
            ],
            "Priya Patel": [
                "product onboarding guide",
                "team processes documentation",
                "new hire training materials",
                "company policies handbook",
                "product feature overview",
                "development workflow",
                "team collaboration tools",
                "project management process",
                "code review guidelines",
                "product requirements template"
            ]
        }
        
        # Session patterns for realistic behavior
        self.session_patterns = {
            "focused_deep_dives": {
                "events_per_session": (5, 12),
                "session_duration_minutes": (20, 60),
                "topic_consistency": 0.8  # 80% of events in session relate to same topic
            },
            "broad_exploration": {
                "events_per_session": (3, 8),
                "session_duration_minutes": (10, 30),
                "topic_consistency": 0.4  # 40% topic consistency - more exploratory
            },
            "learning_oriented": {
                "events_per_session": (8, 15),
                "session_duration_minutes": (30, 90),
                "topic_consistency": 0.6  # 60% consistency - learning with some exploration
            }
        }
        
        self.generated_events: List[UserEvent] = []
        self.event_counter = 0
    
    def generate(self) -> List[UserEvent]:
        """Generate approximately 80 user events for demo personas."""
        events = []
        
        # Get demo persona objects
        demo_people = {}
        for person in self.context.people.values():
            if person.full_name in self.demo_personas:
                demo_people[person.full_name] = person
        
        if len(demo_people) != 3:
            print(f"   Warning: Found {len(demo_people)} demo personas, expected 3")
        
        # Generate events for each persona
        target_events_per_persona = 80 // len(demo_people) if demo_people else 0
        
        for persona_name, person in demo_people.items():
            persona_config = self.demo_personas[persona_name]
            persona_events = self._generate_persona_events(person, persona_config, target_events_per_persona)
            events.extend(persona_events)
        
        # Sort events by timestamp for realistic chronological order
        events.sort(key=lambda e: e.timestamp)
        
        self.generated_events = events
        return events
    
    def _generate_persona_events(self, person: Any, persona_config: Dict[str, Any], 
                                target_count: int) -> List[UserEvent]:
        """Generate events for a specific persona."""
        events = []
        behavior = persona_config["behavior_profile"]
        
        # Generate sessions over time
        start_date = datetime.fromisoformat(self.config.temporal.start_date)
        end_date = datetime.fromisoformat(self.config.temporal.end_date)
        
        # Calculate session frequency based on behavior
        frequency_map = {
            "very_high": 0.8,  # 80% of days have activity
            "high": 0.6,       # 60% of days
            "medium": 0.4,     # 40% of days
            "low": 0.2         # 20% of days
        }
        
        activity_frequency = frequency_map.get(behavior["search_frequency"], 0.4)
        
        # Generate sessions across the time period
        current_date = start_date
        events_generated = 0
        
        while current_date < end_date and events_generated < target_count:
            # Decide if there's activity on this day
            if self.random.random() < activity_frequency:
                # Generate a session
                session_events = self._generate_session(person, persona_config, current_date)
                events.extend(session_events)
                events_generated += len(session_events)
            
            # Move to next day
            current_date += timedelta(days=1)
        
        return events[:target_count]  # Ensure we don't exceed target
    
    def _generate_session(self, person: Any, persona_config: Dict[str, Any], 
                         session_date: datetime) -> List[UserEvent]:
        """Generate a single user session with multiple events."""
        events = []
        behavior = persona_config["behavior_profile"]
        
        # Get session pattern
        pattern_name = behavior["session_patterns"]
        pattern = self.session_patterns.get(pattern_name, self.session_patterns["broad_exploration"])
        
        # Determine session parameters
        events_in_session = self.random.randint(*pattern["events_per_session"])
        session_duration = self.random.randint(*pattern["session_duration_minutes"])
        topic_consistency = pattern["topic_consistency"]
        
        # Start session at random business hour
        session_start = self.random_business_datetime(session_date)
        
        # Select primary topic for session (for consistency)
        primary_topic = self.random_choice(behavior["document_focus"])
        
        # Generate events in session
        current_time = session_start
        time_increment = session_duration / events_in_session
        
        for i in range(events_in_session):
            # Decide event type
            event_types = list(self.event_patterns.keys())
            event_weights = [self.event_patterns[et]["frequency"] for et in event_types]
            event_type = self.weighted_choice(event_types, event_weights)
            
            # Generate event
            event = self._create_user_event(
                person, persona_config, event_type, current_time, 
                primary_topic, topic_consistency, i == 0
            )
            
            if event:
                events.append(event)
            
            # Advance time within session
            current_time += timedelta(minutes=self.random.uniform(1, time_increment * 2))
        
        return events
    
    def _create_user_event(self, person: Any, persona_config: Dict[str, Any], 
                          event_type: str, timestamp: datetime, primary_topic: str,
                          topic_consistency: float, is_session_start: bool) -> UserEvent:
        """Create a single user event."""
        self.event_counter += 1
        event_id = f"EVENT_{self.event_counter:04d}"
        
        behavior = persona_config["behavior_profile"]
        
        # Determine if this event should follow the primary topic
        follow_primary_topic = self.random.random() < topic_consistency
        
        if event_type == "SEARCHED":
            # Generate search event
            query = self._generate_search_query(person.full_name, primary_topic, follow_primary_topic)
            
            return UserEvent(
                event_id=event_id,
                person_id=person.person_id,
                event_type="SEARCHED",
                resource_type="QUERY",
                resource_id="SEARCH_QUERY",
                timestamp=timestamp,
                query=query
            )
        
        elif event_type in ["VIEWED", "CLICKED"]:
            # Select resource to view/click
            resource_type, resource_id = self._select_resource(
                person, behavior, primary_topic, follow_primary_topic
            )
            
            if resource_type and resource_id:
                return UserEvent(
                    event_id=event_id,
                    person_id=person.person_id,
                    event_type=event_type,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    timestamp=timestamp,
                    query=None
                )
        
        return None
    
    def _generate_search_query(self, persona_name: str, primary_topic: str, 
                              follow_primary: bool) -> str:
        """Generate realistic search query for persona."""
        persona_queries = self.search_queries.get(persona_name, [])
        
        if follow_primary and primary_topic:
            # Generate query related to primary topic
            topic_related_queries = [q for q in persona_queries if primary_topic.lower() in q.lower()]
            if topic_related_queries:
                return self.random_choice(topic_related_queries)
        
        # Return random query from persona's typical searches
        if persona_queries:
            return self.random_choice(persona_queries)
        
        # Fallback generic queries
        return self.random_choice([
            "project status", "team updates", "documentation", 
            "process guidelines", "meeting notes"
        ])
    
    def _select_resource(self, person: Any, behavior: Dict[str, Any], 
                        primary_topic: str, follow_primary: bool) -> Tuple[str, str]:
        """Select appropriate resource for viewing/clicking."""
        preferred_resources = behavior.get("preferred_resources", ["DOC"])
        resource_type = self.random_choice(preferred_resources)
        
        if resource_type == "DOC":
            # Select document
            documents = list(self.context.documents.values())
            
            if follow_primary and primary_topic:
                # Find documents related to primary topic
                related_docs = [
                    doc for doc in documents 
                    if (primary_topic.lower() in doc.title.lower() or
                        any(primary_topic.lower() in tag.lower() for tag in doc.tags))
                ]
                
                if related_docs:
                    doc = self.random_choice(related_docs)
                    return "DOC", doc.doc_id
            
            # Select from same team or cross-team based on interests
            same_team_docs = [doc for doc in documents if doc.team == person.team]
            cross_team_interests = behavior.get("cross_team_interest", [])
            cross_team_docs = [doc for doc in documents if doc.team in cross_team_interests]
            
            # 70% same team, 30% cross-team
            if self.random.random() < 0.7 and same_team_docs:
                doc = self.random_choice(same_team_docs)
            elif cross_team_docs:
                doc = self.random_choice(cross_team_docs)
            else:
                doc = self.random_choice(documents)
            
            return "DOC", doc.doc_id
        
        elif resource_type == "THREAD":
            # Select chat thread
            threads = list(self.context.chat_threads.values())
            
            if follow_primary and primary_topic:
                # Find threads related to primary topic
                related_threads = [
                    thread for thread in threads
                    if any(primary_topic.lower() in tag.lower() for tag in thread.topic_tags)
                ]
                
                if related_threads:
                    thread = self.random_choice(related_threads)
                    return "THREAD", thread.thread_id
            
            # Select thread person participated in or team-related
            participated_threads = [
                thread for thread in threads 
                if person.person_id in thread.participants
            ]
            
            team_threads = [
                thread for thread in threads
                if person.team.lower() in thread.channel.lower()
            ]
            
            if participated_threads and self.random.random() < 0.6:
                thread = self.random_choice(participated_threads)
            elif team_threads:
                thread = self.random_choice(team_threads)
            else:
                thread = self.random_choice(threads)
            
            return "THREAD", thread.thread_id
        
        elif resource_type == "TOPIC":
            # Select topic
            topics = list(self.context.topics.values()) if hasattr(self.context, 'topics') else []
            
            if topics:
                if follow_primary and primary_topic:
                    # Find topics related to primary topic
                    related_topics = [
                        topic for topic in topics
                        if primary_topic.lower() in topic.name.lower()
                    ]
                    
                    if related_topics:
                        topic = self.random_choice(related_topics)
                        return "TOPIC", topic.topic_id
                
                topic = self.random_choice(topics)
                return "TOPIC", topic.topic_id
        
        elif resource_type == "PACK":
            # Select starter pack (typically team-specific)
            pack_id = f"PACK_{person.team.upper()}_001"
            return "PACK", pack_id
        
        return None, None
    
    def get_persona_analytics(self) -> Dict[str, Any]:
        """Get analytics about persona behavior patterns."""
        analytics = {}
        
        for persona_name in self.demo_personas.keys():
            persona_events = [
                event for event in self.generated_events
                if self._get_person_name(event.person_id) == persona_name
            ]
            
            if persona_events:
                analytics[persona_name] = {
                    "total_events": len(persona_events),
                    "event_types": {
                        event_type: len([e for e in persona_events if e.event_type == event_type])
                        for event_type in ["VIEWED", "SEARCHED", "CLICKED"]
                    },
                    "resource_types": {
                        resource_type: len([e for e in persona_events if e.resource_type == resource_type])
                        for resource_type in ["DOC", "THREAD", "TOPIC", "PACK", "QUERY"]
                    },
                    "unique_searches": len(set(e.query for e in persona_events if e.query)),
                    "date_range": {
                        "first_event": min(e.timestamp for e in persona_events).isoformat(),
                        "last_event": max(e.timestamp for e in persona_events).isoformat()
                    }
                }
        
        return analytics
    
    def _get_person_name(self, person_id: str) -> str:
        """Get person name from person_id."""
        person = self.context.people.get(person_id)
        return person.full_name if person else "Unknown"
    
    def get_generation_progress(self) -> Dict[str, Any]:
        """Get progress information for user event generation."""
        return {
            "generator_type": "UserEventGenerator",
            "events_generated": len(self.generated_events),
            "target_events": 80,
            "persona_analytics": self.get_persona_analytics(),
            "status": "completed" if self.generated_events else "ready"
        }