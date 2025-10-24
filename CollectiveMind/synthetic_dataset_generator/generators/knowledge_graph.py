"""Knowledge graph generator for creating relationships and serendipity insights."""

import random
from typing import List, Dict, Any, Tuple, Set
from datetime import datetime, timedelta
from collections import defaultdict

from .base import BaseGenerator
from .context import ContextManager
from ..models.core import Topic
from ..models.knowledge_graph import KnowledgeGraphEdge, Overlap
from ..config.settings import GenerationConfig


class KnowledgeGraphGenerator(BaseGenerator):
    """Generates knowledge graph edges and serendipity insights."""
    
    def __init__(self, config: GenerationConfig, context: ContextManager):
        """Initialize knowledge graph generator."""
        super().__init__(config, context)
        
        # Edge type weights for different relationships
        self.edge_type_weights = {
            "AUTHORED": 0.25,      # Person authored document
            "VIEWED": 0.20,        # Person viewed document
            "MENTIONED": 0.15,     # Document/person mentioned in chat
            "CO_OCCURS_WITH": 0.10, # Topics co-occur in documents
            "SIMILAR_TOPIC": 0.08,  # Topics are similar
            "TEAM_OVERLAP": 0.07,   # Teams work on same topics
            "WORKED_WITH": 0.06,    # People worked together
            "VERSION_OF": 0.04,     # Document versions
            "REPLACES": 0.03,       # Document replaces another
            "ASKED_ABOUT": 0.02     # Person asked about topic in chat
        }
        
        # Mandatory cross-team overlaps as specified in requirements
        self.mandatory_overlaps = [
            {
                "topic": "customer churn",
                "teams": ["Marketing", "Product"],
                "description": "Both teams analyzing customer retention and churn patterns"
            },
            {
                "topic": "onboarding performance", 
                "teams": ["Product", "Engineering"],
                "description": "Collaboration on user onboarding experience and technical implementation"
            },
            {
                "topic": "pricing impact",
                "teams": ["Finance", "Product"], 
                "description": "Joint analysis of pricing strategy effects on revenue and adoption"
            },
            {
                "topic": "hiring freeze",
                "teams": ["HR", "Marketing", "Product", "Engineering", "Finance"],
                "description": "Organization-wide policy change affecting all departments"
            },
            {
                "topic": "policy update",
                "teams": ["HR", "Finance"],
                "description": "HR policy changes with financial implications"
            }
        ]
        
        self.generated_topics: List[Topic] = []
        self.generated_edges: List[KnowledgeGraphEdge] = []
        self.generated_overlaps: List[Overlap] = []
        self.edge_counter = 0
        self.topic_counter = 0
        self.overlap_counter = 0
    
    def generate(self) -> Tuple[List[Topic], List[KnowledgeGraphEdge], List[Overlap]]:
        """Generate complete knowledge graph with topics, edges, and overlaps."""
        
        # Generate topics first
        print("   Generating topics...")
        topics = self._generate_topics()
        
        # Generate knowledge graph edges
        print("   Generating knowledge graph edges...")
        edges = self._generate_edges()
        
        # Generate cross-team overlaps
        print("   Generating cross-team overlaps...")
        overlaps = self._generate_overlaps()
        
        # Register topics in context
        for topic in topics:
            self.context.register_entity('topic', topic.topic_id, topic)
        
        self.generated_topics = topics
        self.generated_edges = edges
        self.generated_overlaps = overlaps
        
        return topics, edges, overlaps
    
    def _generate_topics(self) -> List[Topic]:
        """Generate approximately 60 topics with hierarchies."""
        topics = []
        
        # Core business topics
        core_topics = [
            "customer churn", "onboarding experience", "pricing strategy", "user engagement",
            "performance metrics", "quarterly planning", "system performance", "data analytics",
            "mobile app", "API integration", "security framework", "cloud migration",
            "feature rollout", "market expansion", "customer feedback", "product roadmap",
            "revenue growth", "cost optimization", "team collaboration", "process improvement"
        ]
        
        # Team-specific topics
        team_topics = {
            "Marketing": [
                "campaign optimization", "brand awareness", "lead generation", "conversion rates",
                "customer acquisition", "market research", "competitive analysis", "content strategy"
            ],
            "Product": [
                "user experience", "feature prioritization", "product analytics", "user research",
                "A/B testing", "product metrics", "feature adoption", "user journey"
            ],
            "Engineering": [
                "system architecture", "code quality", "deployment automation", "monitoring",
                "scalability", "technical debt", "performance optimization", "infrastructure"
            ],
            "Finance": [
                "budget planning", "financial forecasting", "cost analysis", "ROI measurement",
                "revenue tracking", "expense management", "financial reporting", "risk assessment"
            ],
            "HR": [
                "employee engagement", "talent acquisition", "performance management", "training",
                "company culture", "team building", "compensation", "employee retention"
            ]
        }
        
        # Generate core topics
        for i, topic_name in enumerate(core_topics):
            topic = self._create_topic(topic_name, is_core=True)
            topics.append(topic)
        
        # Generate team-specific topics
        for team, team_topic_list in team_topics.items():
            for topic_name in team_topic_list:
                topic = self._create_topic(f"{team.lower()}_{topic_name.replace(' ', '_')}", 
                                         display_name=topic_name, team=team)
                topics.append(topic)
        
        # Generate emerging topics (trends)
        emerging_topics = [
            "AI integration", "remote work optimization", "sustainability initiatives",
            "digital transformation", "customer experience automation", "data privacy compliance"
        ]
        
        for topic_name in emerging_topics:
            topic = self._create_topic(topic_name, is_emerging=True)
            topics.append(topic)
        
        # Add topic relationships
        self._add_topic_relationships(topics)
        
        return topics
    
    def _create_topic(self, topic_name: str, display_name: str = None, 
                     team: str = None, is_core: bool = False, is_emerging: bool = False) -> Topic:
        """Create a single topic with metadata."""
        self.topic_counter += 1
        topic_id = f"TOPIC_{self.topic_counter:03d}"
        
        # Generate aliases
        aliases = []
        clean_name = display_name or topic_name
        if "_" in topic_name:
            aliases.append(topic_name.replace("_", " "))
        if " " in clean_name:
            aliases.append(clean_name.replace(" ", "_"))
        
        # Add common abbreviations
        if "user experience" in clean_name.lower():
            aliases.extend(["UX", "user_experience"])
        elif "application programming interface" in clean_name.lower() or "api" in clean_name.lower():
            aliases.extend(["API", "application_programming_interface"])
        elif "return on investment" in clean_name.lower() or "roi" in clean_name.lower():
            aliases.extend(["ROI", "return_on_investment"])
        
        # Calculate emerging score
        emerging_score = 0.0
        if is_emerging:
            emerging_score = self.random.uniform(0.7, 0.9)
        elif is_core:
            emerging_score = self.random.uniform(0.3, 0.6)
        else:
            emerging_score = self.random.uniform(0.1, 0.4)
        
        return Topic(
            topic_id=topic_id,
            name=clean_name,
            aliases=aliases,
            emerging_score=emerging_score,
            related_topic_ids=[]  # Will be filled in _add_topic_relationships
        )
    
    def _add_topic_relationships(self, topics: List[Topic]) -> None:
        """Add relationships between topics."""
        for topic in topics:
            # Find related topics based on name similarity and business logic
            related_topics = []
            
            for other_topic in topics:
                if other_topic.topic_id == topic.topic_id:
                    continue
                
                # Check for semantic relationships
                if self._are_topics_related(topic.name, other_topic.name):
                    related_topics.append(other_topic.topic_id)
            
            # Limit to 3-5 related topics
            if related_topics:
                topic.related_topic_ids = self.random.sample(
                    related_topics, 
                    min(self.random.randint(2, 4), len(related_topics))
                )
    
    def _are_topics_related(self, topic1: str, topic2: str) -> bool:
        """Determine if two topics are semantically related."""
        # Define relationship patterns
        related_patterns = [
            # Customer-related topics
            (["customer", "churn", "retention"], ["customer", "engagement", "satisfaction", "feedback"]),
            # Performance topics
            (["performance", "metrics"], ["analytics", "monitoring", "optimization"]),
            # Product topics
            (["product", "feature"], ["user", "experience", "adoption", "roadmap"]),
            # Financial topics
            (["revenue", "cost", "budget"], ["pricing", "ROI", "financial"]),
            # Technical topics
            (["system", "architecture"], ["performance", "scalability", "infrastructure"]),
            # Process topics
            (["process", "workflow"], ["automation", "optimization", "efficiency"])
        ]
        
        topic1_words = set(topic1.lower().split())
        topic2_words = set(topic2.lower().split())
        
        for pattern1, pattern2 in related_patterns:
            if (any(word in topic1_words for word in pattern1) and 
                any(word in topic2_words for word in pattern2)):
                return True
            if (any(word in topic1_words for word in pattern2) and 
                any(word in topic2_words for word in pattern1)):
                return True
        
        # Check for direct word overlap
        common_words = topic1_words.intersection(topic2_words)
        if len(common_words) > 0:
            return True
        
        return False
    
    def _generate_edges(self) -> List[KnowledgeGraphEdge]:
        """Generate knowledge graph edges between entities."""
        edges = []
        
        # Generate AUTHORED edges (person -> document)
        edges.extend(self._generate_authored_edges())
        
        # Generate VIEWED edges (person -> document)
        edges.extend(self._generate_viewed_edges())
        
        # Generate MENTIONED edges (document/person mentioned in chat)
        edges.extend(self._generate_mentioned_edges())
        
        # Generate CO_OCCURS_WITH edges (topics in same documents)
        edges.extend(self._generate_co_occurrence_edges())
        
        # Generate SIMILAR_TOPIC edges
        edges.extend(self._generate_similar_topic_edges())
        
        # Generate TEAM_OVERLAP edges
        edges.extend(self._generate_team_overlap_edges())
        
        # Generate WORKED_WITH edges (people collaboration)
        edges.extend(self._generate_worked_with_edges())
        
        # Generate VERSION_OF edges (document versions)
        edges.extend(self._generate_version_edges())
        
        # Generate additional edges to reach target count
        while len(edges) < self.config.content_volumes.knowledge_graph_edges:
            edge = self._generate_random_edge()
            if edge:
                edges.append(edge)
        
        return edges[:self.config.content_volumes.knowledge_graph_edges]
    
    def _generate_authored_edges(self) -> List[KnowledgeGraphEdge]:
        """Generate AUTHORED edges between people and documents."""
        edges = []
        
        for doc in self.context.documents.values():
            # Author edge
            edge = self._create_edge(
                "AUTHORED",
                "PERSON", doc.author_person_id,
                "DOC", doc.doc_id,
                weight=1.0,
                evidence=f"Authored document: {doc.title}"
            )
            edges.append(edge)
            
            # Co-author edges
            for co_author in doc.co_authors:
                edge = self._create_edge(
                    "AUTHORED",
                    "PERSON", co_author,
                    "DOC", doc.doc_id,
                    weight=0.8,
                    evidence=f"Co-authored document: {doc.title}"
                )
                edges.append(edge)
        
        return edges
    
    def _generate_viewed_edges(self) -> List[KnowledgeGraphEdge]:
        """Generate VIEWED edges (people viewing documents)."""
        edges = []
        
        # Generate realistic viewing patterns
        for person in self.context.people.values():
            # People view 5-15 documents
            view_count = self.random.randint(5, 15)
            
            # Prefer documents from same team, but also cross-team
            same_team_docs = [d for d in self.context.documents.values() if d.team == person.team]
            other_team_docs = [d for d in self.context.documents.values() if d.team != person.team]
            
            # 70% same team, 30% cross-team
            same_team_views = int(view_count * 0.7)
            cross_team_views = view_count - same_team_views
            
            viewed_docs = []
            if same_team_docs:
                viewed_docs.extend(self.random.sample(
                    same_team_docs, 
                    min(same_team_views, len(same_team_docs))
                ))
            if other_team_docs:
                viewed_docs.extend(self.random.sample(
                    other_team_docs,
                    min(cross_team_views, len(other_team_docs))
                ))
            
            for doc in viewed_docs:
                weight = 0.9 if doc.team == person.team else 0.6
                edge = self._create_edge(
                    "VIEWED",
                    "PERSON", person.person_id,
                    "DOC", doc.doc_id,
                    weight=weight,
                    evidence=f"Viewed document: {doc.title}"
                )
                edges.append(edge)
        
        return edges
    
    def _generate_mentioned_edges(self) -> List[KnowledgeGraphEdge]:
        """Generate MENTIONED edges from chat messages."""
        edges = []
        
        for message in self.context.chat_threads.values():
            # Documents mentioned in chats
            for doc_ref in getattr(message, 'doc_refs', []):
                if doc_ref in self.context.documents:
                    edge = self._create_edge(
                        "MENTIONED",
                        "DOC", doc_ref,
                        "THREAD", message.thread_id,
                        weight=0.7,
                        evidence=f"Document referenced in chat thread"
                    )
                    edges.append(edge)
        
        return edges
    
    def _generate_co_occurrence_edges(self) -> List[KnowledgeGraphEdge]:
        """Generate CO_OCCURS_WITH edges for topics appearing together."""
        edges = []
        
        # Track topic co-occurrences in documents
        topic_cooccurrence = defaultdict(lambda: defaultdict(int))
        
        for doc in self.context.documents.values():
            doc_topics = []
            
            # Extract topics from document tags and content
            for tag in doc.tags:
                # Find matching topics
                for topic in self.generated_topics:
                    if (tag.lower() in topic.name.lower() or 
                        topic.name.lower() in tag.lower() or
                        any(alias.lower() == tag.lower() for alias in topic.aliases)):
                        doc_topics.append(topic.topic_id)
            
            # Create co-occurrence edges
            for i, topic1 in enumerate(doc_topics):
                for topic2 in doc_topics[i+1:]:
                    topic_cooccurrence[topic1][topic2] += 1
                    topic_cooccurrence[topic2][topic1] += 1
        
        # Generate edges for significant co-occurrences
        for topic1, cooccurrences in topic_cooccurrence.items():
            for topic2, count in cooccurrences.items():
                if count >= 2:  # Minimum 2 co-occurrences
                    weight = min(1.0, count / 5.0)  # Scale weight
                    edge = self._create_edge(
                        "CO_OCCURS_WITH",
                        "TOPIC", topic1,
                        "TOPIC", topic2,
                        weight=weight,
                        evidence=f"Co-occurred in {count} documents"
                    )
                    edges.append(edge)
        
        return edges
    
    def _generate_similar_topic_edges(self) -> List[KnowledgeGraphEdge]:
        """Generate SIMILAR_TOPIC edges."""
        edges = []
        
        for topic in self.generated_topics:
            for related_topic_id in topic.related_topic_ids:
                edge = self._create_edge(
                    "SIMILAR_TOPIC",
                    "TOPIC", topic.topic_id,
                    "TOPIC", related_topic_id,
                    weight=0.8,
                    evidence="Semantically related topics"
                )
                edges.append(edge)
        
        return edges
    
    def _generate_team_overlap_edges(self) -> List[KnowledgeGraphEdge]:
        """Generate TEAM_OVERLAP edges."""
        edges = []
        
        # Create edges between teams that work on similar topics
        for team1 in self.config.organization.teams:
            for team2 in self.config.organization.teams:
                if team1 >= team2:  # Avoid duplicates
                    continue
                
                # Find shared topics between teams
                team1_topics = set()
                team2_topics = set()
                
                for doc in self.context.documents.values():
                    if doc.team == team1:
                        team1_topics.update(doc.tags)
                    elif doc.team == team2:
                        team2_topics.update(doc.tags)
                
                shared_topics = team1_topics.intersection(team2_topics)
                
                if shared_topics:
                    weight = min(1.0, len(shared_topics) / 5.0)
                    edge = self._create_edge(
                        "TEAM_OVERLAP",
                        "TEAM", team1,
                        "TEAM", team2,
                        weight=weight,
                        evidence=f"Shared topics: {', '.join(list(shared_topics)[:3])}"
                    )
                    edges.append(edge)
        
        return edges
    
    def _generate_worked_with_edges(self) -> List[KnowledgeGraphEdge]:
        """Generate WORKED_WITH edges between people."""
        edges = []
        
        # People who co-authored documents
        for doc in self.context.documents.values():
            if doc.co_authors:
                for co_author in doc.co_authors:
                    edge = self._create_edge(
                        "WORKED_WITH",
                        "PERSON", doc.author_person_id,
                        "PERSON", co_author,
                        weight=0.9,
                        evidence=f"Co-authored: {doc.title}"
                    )
                    edges.append(edge)
        
        # People in same chat threads
        for thread in self.context.chat_threads.values():
            if len(thread.participants) > 1:
                for i, person1 in enumerate(thread.participants):
                    for person2 in thread.participants[i+1:]:
                        edge = self._create_edge(
                            "WORKED_WITH",
                            "PERSON", person1,
                            "PERSON", person2,
                            weight=0.6,
                            evidence=f"Collaborated in chat: {thread.channel}"
                        )
                        edges.append(edge)
        
        return edges
    
    def _generate_version_edges(self) -> List[KnowledgeGraphEdge]:
        """Generate VERSION_OF edges for document versions."""
        edges = []
        
        # For now, create some sample version relationships
        # In a full implementation, this would use the document versioning system
        docs = list(self.context.documents.values())
        
        # Create 5-10 version relationships
        for _ in range(self.random.randint(5, 10)):
            if len(docs) >= 2:
                doc1, doc2 = self.random.sample(docs, 2)
                
                # Only create version edge if documents are from same team and similar topic
                if (doc1.team == doc2.team and 
                    any(tag in doc2.tags for tag in doc1.tags)):
                    
                    edge = self._create_edge(
                        "VERSION_OF",
                        "DOC", doc2.doc_id,
                        "DOC", doc1.doc_id,
                        weight=1.0,
                        evidence=f"Updated version of document"
                    )
                    edges.append(edge)
        
        return edges
    
    def _generate_random_edge(self) -> KnowledgeGraphEdge:
        """Generate a random edge to fill remaining quota."""
        edge_types = list(self.edge_type_weights.keys())
        edge_type = self.weighted_choice(edge_types, list(self.edge_type_weights.values()))
        
        # Generate appropriate source and destination based on edge type
        if edge_type in ["AUTHORED", "VIEWED"]:
            person_ids = list(self.context.people.keys())
            doc_ids = list(self.context.documents.keys())
            
            if person_ids and doc_ids:
                return self._create_edge(
                    edge_type,
                    "PERSON", self.random_choice(person_ids),
                    "DOC", self.random_choice(doc_ids),
                    weight=self.random.uniform(0.3, 0.8),
                    evidence="Random relationship"
                )
        
        return None
    
    def _create_edge(self, edge_type: str, src_type: str, src_id: str,
                    dst_type: str, dst_id: str, weight: float, evidence: str) -> KnowledgeGraphEdge:
        """Create a knowledge graph edge."""
        self.edge_counter += 1
        edge_id = f"E_{self.edge_counter:04d}"
        
        # Generate realistic timestamps
        first_seen = self.random_date_between(
            datetime.fromisoformat(self.config.temporal.start_date),
            datetime.fromisoformat(self.config.temporal.end_date)
        )
        last_seen = first_seen + timedelta(days=self.random.randint(0, 90))
        
        return KnowledgeGraphEdge(
            edge_id=edge_id,
            edge_type=edge_type,
            src_type=src_type,
            src_id=src_id,
            dst_type=dst_type,
            dst_id=dst_id,
            weight=weight,
            first_seen_at=first_seen,
            last_seen_at=last_seen,
            evidence=evidence
        )
    
    def _generate_overlaps(self) -> List[Overlap]:
        """Generate cross-team overlap insights."""
        overlaps = []
        
        # Generate mandatory overlaps
        for overlap_config in self.mandatory_overlaps:
            overlap = self._create_overlap(
                overlap_config["topic"],
                overlap_config["teams"],
                overlap_config["description"]
            )
            overlaps.append(overlap)
        
        # Generate additional organic overlaps
        additional_overlaps = [
            {
                "topic": "user engagement metrics",
                "teams": ["Product", "Marketing"],
                "description": "Joint analysis of user behavior and engagement patterns"
            },
            {
                "topic": "system performance monitoring",
                "teams": ["Engineering", "Product"],
                "description": "Collaboration on application performance and user experience"
            },
            {
                "topic": "cost optimization initiatives",
                "teams": ["Finance", "Engineering"],
                "description": "Infrastructure cost reduction and resource optimization"
            },
            {
                "topic": "employee satisfaction surveys",
                "teams": ["HR", "Product"],
                "description": "Internal tool development for HR processes"
            },
            {
                "topic": "data privacy compliance",
                "teams": ["Engineering", "Finance", "HR"],
                "description": "Cross-functional compliance and security initiatives"
            }
        ]
        
        for overlap_config in additional_overlaps:
            overlap = self._create_overlap(
                overlap_config["topic"],
                overlap_config["teams"],
                overlap_config["description"]
            )
            overlaps.append(overlap)
        
        return overlaps
    
    def _create_overlap(self, topic_name: str, teams: List[str], description: str) -> Overlap:
        """Create a cross-team overlap insight."""
        self.overlap_counter += 1
        overlap_id = f"OVERLAP_{self.overlap_counter:03d}"
        
        # Find supporting documents
        supporting_docs = []
        for doc in self.context.documents.values():
            if (doc.team in teams and 
                any(keyword in doc.title.lower() or keyword in ' '.join(doc.tags).lower() 
                    for keyword in topic_name.lower().split())):
                supporting_docs.append(doc.doc_id)
        
        # Find supporting threads
        supporting_threads = []
        for thread in self.context.chat_threads.values():
            if any(keyword in ' '.join(thread.topic_tags).lower() 
                   for keyword in topic_name.lower().split()):
                supporting_threads.append(thread.thread_id)
        
        # Find people to suggest for collaboration
        people_suggested = []
        for team in teams:
            team_people = self.context.get_people_by_team(team)
            if team_people:
                # Suggest 1-2 people per team
                suggested = self.random.sample(team_people, min(2, len(team_people)))
                people_suggested.extend([p.person_id for p in suggested])
        
        # Generate action suggestion
        action_suggestions = [
            "Create shared workspace for collaboration",
            "Schedule cross-team sync meeting",
            "Establish shared documentation repository",
            "Set up regular progress reviews",
            "Create joint task force",
            "Implement shared metrics dashboard"
        ]
        
        action_suggestion = self.random_choice(action_suggestions)
        
        # Calculate confidence based on evidence strength
        confidence = 0.5
        if supporting_docs:
            confidence += min(0.3, len(supporting_docs) * 0.1)
        if supporting_threads:
            confidence += min(0.2, len(supporting_threads) * 0.05)
        
        confidence = min(1.0, confidence)
        
        return Overlap(
            overlap_id=overlap_id,
            topic_name=topic_name,
            teams_involved=teams,
            people_suggested=people_suggested[:6],  # Limit to 6 people
            supporting_docs=supporting_docs[:5],    # Limit to 5 docs
            supporting_threads=supporting_threads[:3], # Limit to 3 threads
            summary=description,
            action_suggestion=action_suggestion,
            confidence=confidence
        )
    
    def get_generation_progress(self) -> Dict[str, Any]:
        """Get progress information for knowledge graph generation."""
        return {
            "generator_type": "KnowledgeGraphGenerator",
            "topics_generated": len(self.generated_topics),
            "edges_generated": len(self.generated_edges),
            "overlaps_generated": len(self.generated_overlaps),
            "target_topics": self.config.content_volumes.topics,
            "target_edges": self.config.content_volumes.knowledge_graph_edges,
            "target_overlaps_range": [
                self.config.content_volumes.overlaps_min,
                self.config.content_volumes.overlaps_max
            ],
            "mandatory_overlaps": len(self.mandatory_overlaps),
            "status": "completed" if self.generated_topics else "ready"
        }