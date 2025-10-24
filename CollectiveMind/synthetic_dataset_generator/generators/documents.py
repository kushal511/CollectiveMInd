"""Document generator for creating realistic organizational documents."""

import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from .base import BaseGenerator
from .context import ContextManager
from ..models.core import Document
from ..config.settings import GenerationConfig


class DocumentGenerator(BaseGenerator):
    """Generates diverse document types with realistic content across teams."""
    
    def __init__(self, config: GenerationConfig, context: ContextManager):
        """Initialize document generator."""
        super().__init__(config, context)
        
        # Document templates by team
        self.document_templates = {
            "Engineering": {
                "RFC": {
                    "title_patterns": [
                        "RFC: {topic} Implementation",
                        "Technical Proposal: {topic}",
                        "Architecture Decision: {topic}",
                        "Design Document: {topic} System"
                    ],
                    "content_themes": [
                        "system architecture", "API design", "database schema",
                        "performance optimization", "scalability", "security",
                        "microservices", "deployment strategy"
                    ]
                },
                "Architecture": {
                    "title_patterns": [
                        "{topic} Architecture Overview",
                        "System Design: {topic}",
                        "Technical Architecture for {topic}",
                        "{topic} Infrastructure Design"
                    ],
                    "content_themes": [
                        "system components", "data flow", "service interactions",
                        "load balancing", "caching strategy", "monitoring"
                    ]
                },
                "Postmortem": {
                    "title_patterns": [
                        "Incident Postmortem: {topic}",
                        "Outage Analysis: {topic}",
                        "Post-Incident Review: {topic}",
                        "Root Cause Analysis: {topic}"
                    ],
                    "content_themes": [
                        "incident timeline", "root cause", "impact assessment",
                        "remediation steps", "prevention measures", "lessons learned"
                    ]
                }
            },
            "Product": {
                "PRD": {
                    "title_patterns": [
                        "Product Requirements: {topic}",
                        "PRD: {topic} Feature",
                        "{topic} Product Specification",
                        "Feature Brief: {topic}"
                    ],
                    "content_themes": [
                        "user stories", "acceptance criteria", "success metrics",
                        "user experience", "feature prioritization", "market research"
                    ]
                },
                "Decision Log": {
                    "title_patterns": [
                        "Decision Log: {topic}",
                        "Product Decision: {topic}",
                        "{topic} Strategy Decision",
                        "Resolution: {topic}"
                    ],
                    "content_themes": [
                        "decision rationale", "alternatives considered", "stakeholder input",
                        "success criteria", "implementation timeline", "risk assessment"
                    ]
                },
                "User Research": {
                    "title_patterns": [
                        "User Research: {topic}",
                        "{topic} User Study Results",
                        "Customer Insights: {topic}",
                        "Usability Study: {topic}"
                    ],
                    "content_themes": [
                        "user feedback", "behavioral patterns", "pain points",
                        "feature adoption", "user journey", "recommendations"
                    ]
                }
            },
            "Marketing": {
                "Campaign Report": {
                    "title_patterns": [
                        "{topic} Campaign Results",
                        "Marketing Report: {topic}",
                        "{topic} Campaign Analysis",
                        "Performance Review: {topic} Campaign"
                    ],
                    "content_themes": [
                        "campaign performance", "conversion rates", "audience engagement",
                        "ROI analysis", "channel effectiveness", "optimization recommendations"
                    ]
                },
                "Competitive Analysis": {
                    "title_patterns": [
                        "Competitive Analysis: {topic}",
                        "Market Research: {topic}",
                        "{topic} Competitor Review",
                        "Industry Analysis: {topic}"
                    ],
                    "content_themes": [
                        "competitor positioning", "market trends", "feature comparison",
                        "pricing analysis", "market opportunities", "strategic recommendations"
                    ]
                },
                "Customer Insights": {
                    "title_patterns": [
                        "Customer Analysis: {topic}",
                        "{topic} Customer Insights",
                        "Customer Behavior: {topic}",
                        "Segmentation Analysis: {topic}"
                    ],
                    "content_themes": [
                        "customer segmentation", "behavioral analysis", "churn patterns",
                        "retention strategies", "customer satisfaction", "feedback analysis"
                    ]
                }
            },
            "Finance": {
                "Quarterly Report": {
                    "title_patterns": [
                        "Q{quarter} Financial Report",
                        "Quarterly Analysis: {topic}",
                        "Financial Review: {topic}",
                        "Q{quarter} Performance Summary"
                    ],
                    "content_themes": [
                        "revenue analysis", "cost breakdown", "profit margins",
                        "budget variance", "financial forecasting", "key metrics"
                    ]
                },
                "Budget Analysis": {
                    "title_patterns": [
                        "Budget Analysis: {topic}",
                        "{topic} Cost Review",
                        "Financial Planning: {topic}",
                        "Budget Allocation: {topic}"
                    ],
                    "content_themes": [
                        "budget allocation", "cost optimization", "expense tracking",
                        "ROI analysis", "financial planning", "resource allocation"
                    ]
                },
                "Risk Assessment": {
                    "title_patterns": [
                        "Risk Assessment: {topic}",
                        "Financial Risk: {topic}",
                        "{topic} Risk Analysis",
                        "Risk Management: {topic}"
                    ],
                    "content_themes": [
                        "risk identification", "impact assessment", "mitigation strategies",
                        "compliance requirements", "financial exposure", "risk monitoring"
                    ]
                }
            },
            "HR": {
                "Policy": {
                    "title_patterns": [
                        "{topic} Policy Update",
                        "HR Policy: {topic}",
                        "{topic} Guidelines",
                        "Company Policy: {topic}"
                    ],
                    "content_themes": [
                        "policy guidelines", "compliance requirements", "employee rights",
                        "procedures", "implementation timeline", "training requirements"
                    ]
                },
                "Onboarding": {
                    "title_patterns": [
                        "Onboarding Guide: {topic}",
                        "{topic} Team Onboarding",
                        "New Hire Guide: {topic}",
                        "{topic} Orientation Materials"
                    ],
                    "content_themes": [
                        "onboarding process", "team introductions", "role expectations",
                        "training schedule", "resources", "first week activities"
                    ]
                },
                "Performance": {
                    "title_patterns": [
                        "Performance Review: {topic}",
                        "{topic} Team Performance",
                        "Performance Analysis: {topic}",
                        "{topic} Evaluation Framework"
                    ],
                    "content_themes": [
                        "performance metrics", "goal achievement", "skill development",
                        "feedback summary", "improvement areas", "career development"
                    ]
                }
            }
        }
        
        # Common topics that can be used across teams
        self.common_topics = [
            "Customer Churn", "Onboarding Experience", "Pricing Strategy",
            "User Engagement", "Performance Metrics", "Quarterly Planning",
            "System Performance", "Data Analytics", "Mobile App", "API Integration",
            "Security Framework", "Cloud Migration", "Feature Rollout",
            "Market Expansion", "Customer Feedback", "Product Roadmap"
        ]
        
        # Language options for non-English documents
        self.languages = [
            {"code": "es", "name": "Spanish"},
            {"code": "hi", "name": "Hindi"},
            {"code": "fr", "name": "French"},
            {"code": "de", "name": "German"},
            {"code": "pt", "name": "Portuguese"}
        ]
        
        self.generated_documents: List[Document] = []
        self.doc_counter = 0
    
    def generate(self) -> List[Document]:
        """Generate all documents across teams."""
        documents = []
        
        # Calculate documents per team
        docs_per_team = self.config.content_volumes.documents // len(self.config.organization.teams)
        remaining_docs = self.config.content_volumes.documents % len(self.config.organization.teams)
        
        for i, team in enumerate(self.config.organization.teams):
            team_doc_count = docs_per_team
            if i < remaining_docs:
                team_doc_count += 1
            
            team_docs = self._generate_team_documents(team, team_doc_count)
            documents.extend(team_docs)
        
        # Generate non-English documents
        self._add_non_english_documents(documents)
        
        # Add cross-references between related documents
        self._add_document_relationships(documents)
        
        # Register documents in context
        for doc in documents:
            self.context.register_entity('document', doc.doc_id, doc)
        
        self.generated_documents = documents
        return documents
    
    def _generate_team_documents(self, team: str, count: int) -> List[Document]:
        """Generate documents for a specific team."""
        documents = []
        team_people = self.context.get_people_by_team(team)
        
        if not team_people:
            return documents
        
        team_templates = self.document_templates.get(team, {})
        template_names = list(team_templates.keys())
        
        for i in range(count):
            # Select document template
            template_name = self.random_choice(template_names) if template_names else "General"
            template = team_templates.get(template_name, {})
            
            # Generate document
            doc = self._create_single_document(team, template, i, team_people)
            documents.append(doc)
        
        return documents
    
    def _create_single_document(self, team: str, template: Dict[str, Any], 
                              index: int, team_people: List[Any]) -> Document:
        """Create a single document."""
        # Generate document ID using counter
        self.doc_counter += 1
        doc_id = f"DOC_{self.doc_counter:03d}"
        
        # Select topic
        topic = self.random_choice(self.common_topics)
        
        # Generate title
        title_patterns = template.get("title_patterns", ["{topic} Document"])
        title_pattern = self.random_choice(title_patterns)
        title = title_pattern.format(topic=topic, quarter=self.random.randint(1, 4))
        
        # Generate content
        content_themes = template.get("content_themes", ["general analysis"])
        content = self._generate_document_content(topic, content_themes)
        
        # Select author and co-authors
        author = self.random_choice(team_people)
        co_authors = []
        if self.random.random() < 0.3:  # 30% chance of co-authors
            potential_coauthors = [p for p in team_people if p.person_id != author.person_id]
            if potential_coauthors:
                co_author_count = self.random.randint(1, min(2, len(potential_coauthors)))
                co_authors = [p.person_id for p in self.random.sample(potential_coauthors, co_author_count)]
        
        # Generate tags
        tags = self._generate_document_tags(topic, content_themes, team)
        
        # Generate timestamps
        created_at = self._generate_document_timestamp()
        updated_at = created_at + timedelta(days=self.random.randint(0, 30))
        
        # Determine status and visibility
        status = self.weighted_choice(["draft", "final"], [0.2, 0.8])
        visibility = self.weighted_choice(
            ["public", "internal", "restricted"], 
            [0.1, 0.8, 0.1]
        )
        
        # Determine confidentiality
        confidentiality = self.weighted_choice(
            ["low", "medium", "high"],
            [0.3, 0.6, 0.1]
        )
        
        return Document(
            doc_id=doc_id,
            title=title,
            content=content,
            team=team,
            author_person_id=author.person_id,
            co_authors=co_authors,
            tags=tags,
            created_at=created_at,
            updated_at=updated_at,
            status=status,
            visibility=visibility,
            source_type="native_internal",
            language="en",
            confidentiality=confidentiality
        )
    
    def _generate_document_content(self, topic: str, themes: List[str]) -> str:
        """Generate realistic document content."""
        # Create content sections based on themes
        sections = []
        
        # Introduction
        intro_keywords = [topic.lower()] + themes[:2]
        intro = self.generate_realistic_text(20, 40, intro_keywords)
        sections.append(f"## Overview\n\n{intro}")
        
        # Main sections
        for theme in themes[:3]:
            section_keywords = [topic.lower(), theme]
            section_content = self.generate_realistic_text(30, 60, section_keywords)
            section_title = theme.replace("_", " ").title()
            sections.append(f"## {section_title}\n\n{section_content}")
        
        # Conclusion
        conclusion_keywords = [topic.lower(), "recommendations", "next steps"]
        conclusion = self.generate_realistic_text(15, 30, conclusion_keywords)
        sections.append(f"## Conclusion\n\n{conclusion}")
        
        return "\n\n".join(sections)
    
    def _generate_document_tags(self, topic: str, themes: List[str], team: str) -> List[str]:
        """Generate relevant tags for document."""
        tags = []
        
        # Add topic-based tags
        topic_words = topic.lower().split()
        tags.extend(topic_words)
        
        # Add theme-based tags
        for theme in themes[:2]:
            theme_words = theme.replace("_", " ").split()
            tags.extend(theme_words)
        
        # Add team-specific tags
        team_themes = self.context.get_content_themes(team)
        if team_themes:
            tags.append(self.random_choice(team_themes).replace(" ", "_"))
        
        # Remove duplicates and limit count
        unique_tags = list(set(tags))
        return self.random.sample(unique_tags, min(5, len(unique_tags)))
    
    def _generate_document_timestamp(self) -> datetime:
        """Generate realistic document creation timestamp."""
        start_date = datetime.fromisoformat(self.config.temporal.start_date)
        end_date = datetime.fromisoformat(self.config.temporal.end_date)
        
        return self.random_date_between(start_date, end_date)
    
    def _add_non_english_documents(self, documents: List[Document]) -> None:
        """Convert some documents to non-English languages."""
        non_english_count = 5  # As specified in requirements
        
        if len(documents) < non_english_count:
            return
        
        # Select random documents to convert
        docs_to_convert = self.random.sample(documents, non_english_count)
        
        for doc in docs_to_convert:
            language = self.random_choice(self.languages)
            doc.language = language["code"]
            
            # Add language indicator to title
            doc.title = f"[{language['name']}] {doc.title}"
            
            # Modify content to indicate different language
            doc.content = f"[Content in {language['name']}]\n\n" + doc.content[:200] + "..."
    
    def _add_document_relationships(self, documents: List[Document]) -> None:
        """Add cross-references between related documents."""
        # Group documents by tags for relationship detection
        tag_groups = {}
        for doc in documents:
            for tag in doc.tags:
                if tag not in tag_groups:
                    tag_groups[tag] = []
                tag_groups[tag].append(doc)
        
        # Add relationships for documents with common tags
        for tag, docs in tag_groups.items():
            if len(docs) > 1:
                for doc in docs:
                    # Add 1-2 related documents
                    related_docs = [d for d in docs if d.doc_id != doc.doc_id]
                    if related_docs:
                        related_count = min(2, len(related_docs))
                        related = self.random.sample(related_docs, related_count)
                        doc.related_doc_ids = [d.doc_id for d in related]
    
    def get_generation_progress(self) -> Dict[str, Any]:
        """Get progress information for document generation."""
        return {
            "generator_type": "DocumentGenerator",
            "entities_generated": len(self.generated_documents),
            "target_count": self.config.content_volumes.documents,
            "by_team": {
                team: len([d for d in self.generated_documents if d.team == team])
                for team in self.config.organization.teams
            },
            "status": "completed" if self.generated_documents else "ready"
        }