"""Meeting and brief generators for organizational summaries."""

import random
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta

from .base import BaseGenerator
from .context import ContextManager
from ..models.core import Meeting
from ..config.settings import GenerationConfig


class MeetingGenerator(BaseGenerator):
    """Generates meeting summaries and organizational briefs."""
    
    def __init__(self, config: GenerationConfig, context: ContextManager):
        """Initialize meeting generator."""
        super().__init__(config, context)
        
        # Meeting types and templates
        self.meeting_types = {
            "standup": {
                "frequency": 0.3,
                "attendee_count": (3, 6),
                "duration_minutes": (15, 30),
                "title_templates": [
                    "{team} Daily Standup",
                    "{team} Sprint Planning",
                    "{team} Weekly Sync"
                ]
            },
            "project": {
                "frequency": 0.25,
                "attendee_count": (4, 8),
                "duration_minutes": (30, 60),
                "title_templates": [
                    "{project} Project Review",
                    "{project} Planning Session",
                    "{project} Status Update"
                ]
            },
            "cross_team": {
                "frequency": 0.2,
                "attendee_count": (5, 10),
                "duration_minutes": (45, 90),
                "title_templates": [
                    "Cross-Team Sync: {topic}",
                    "{topic} Collaboration Meeting",
                    "Joint Planning: {topic}"
                ]
            },
            "leadership": {
                "frequency": 0.15,
                "attendee_count": (3, 8),
                "duration_minutes": (60, 120),
                "title_templates": [
                    "Leadership Team Meeting",
                    "Quarterly Business Review",
                    "Strategic Planning Session"
                ]
            },
            "all_hands": {
                "frequency": 0.1,
                "attendee_count": (15, 25),
                "duration_minutes": (30, 60),
                "title_templates": [
                    "All Hands Meeting",
                    "Company Update",
                    "Quarterly All Hands"
                ]
            }
        }
        
        # Meeting topics by type
        self.meeting_topics = {
            "standup": [
                "sprint progress", "blockers review", "task assignments",
                "daily updates", "team coordination"
            ],
            "project": [
                "project timeline", "milestone review", "resource allocation",
                "risk assessment", "deliverable planning"
            ],
            "cross_team": [
                "customer churn analysis", "onboarding optimization", "pricing strategy",
                "system integration", "process alignment", "data sharing"
            ],
            "leadership": [
                "quarterly results", "strategic initiatives", "budget planning",
                "organizational changes", "market analysis"
            ],
            "all_hands": [
                "company updates", "new initiatives", "team introductions",
                "policy changes", "achievement recognition"
            ]
        }
        
        # Decision templates
        self.decision_templates = [
            "Approved {topic} implementation timeline",
            "Decided to prioritize {topic} over other initiatives",
            "Agreed on {topic} budget allocation of ${amount}",
            "Resolved to address {topic} by {timeframe}",
            "Committed to {topic} performance targets",
            "Established {topic} working group with cross-team members"
        ]
        
        # Action item templates
        self.action_item_templates = [
            "{person} to complete {topic} analysis by {date}",
            "{person} to coordinate with {team} team on {topic}",
            "{person} to prepare {topic} proposal for next meeting",
            "{person} to schedule follow-up on {topic}",
            "{person} to update {topic} documentation",
            "{person} to present {topic} findings to stakeholders"
        ]
        
        # Weekly brief templates
        self.brief_templates = {
            "organizational": {
                "sections": [
                    "Key Achievements This Week",
                    "New Cross-Team Collaborations", 
                    "Emerging Topics and Trends",
                    "Upcoming Milestones",
                    "Suggested Connections"
                ]
            },
            "team": {
                "sections": [
                    "Team Accomplishments",
                    "Project Updates",
                    "Blockers and Challenges", 
                    "Cross-Team Activities",
                    "Next Week Priorities"
                ]
            }
        }
        
        self.generated_meetings: List[Meeting] = []
        self.generated_briefs: List[Dict[str, Any]] = []
        self.meeting_counter = 0
        self.brief_counter = 0
    
    def generate(self) -> Tuple[List[Meeting], List[Dict[str, Any]]]:
        """Generate meeting summaries and weekly briefs."""
        
        # Generate meeting summaries
        print("   Generating meeting summaries...")
        meetings = self._generate_meetings()
        
        # Generate weekly briefs
        print("   Generating weekly briefs...")
        briefs = self._generate_weekly_briefs()
        
        self.generated_meetings = meetings
        self.generated_briefs = briefs
        
        return meetings, briefs
    
    def _generate_meetings(self) -> List[Meeting]:
        """Generate 30 meeting summaries."""
        meetings = []
        
        target_count = 30
        
        for _ in range(target_count):
            meeting = self._create_meeting()
            meetings.append(meeting)
        
        return meetings
    
    def _create_meeting(self) -> Meeting:
        """Create a single meeting summary."""
        self.meeting_counter += 1
        meeting_id = f"MEET_{self.meeting_counter:03d}"
        
        # Select meeting type
        meeting_types = list(self.meeting_types.keys())
        frequencies = [config["frequency"] for config in self.meeting_types.values()]
        meeting_type = self.weighted_choice(meeting_types, frequencies)
        
        config = self.meeting_types[meeting_type]
        
        # Generate meeting details
        title = self._generate_meeting_title(meeting_type, config)
        attendees = self._select_meeting_attendees(meeting_type, config)
        date = self._generate_meeting_date()
        
        # Generate meeting content
        summary = self._generate_meeting_summary(meeting_type, title, attendees)
        decisions = self._generate_meeting_decisions(meeting_type)
        action_items = self._generate_meeting_action_items(meeting_type, attendees)
        team_dependencies = self._generate_team_dependencies(meeting_type, attendees)
        
        return Meeting(
            meeting_id=meeting_id,
            title=title,
            attendees=[p.person_id for p in attendees],
            date=date,
            summary=summary,
            decisions=decisions,
            action_items=action_items,
            team_dependencies=team_dependencies
        )
    
    def _generate_meeting_title(self, meeting_type: str, config: Dict[str, Any]) -> str:
        """Generate meeting title based on type."""
        templates = config.get("title_templates", ["Meeting"])
        template = self.random_choice(templates)
        
        # Fill in template variables
        if "{team}" in template:
            team = self.random_choice(self.config.organization.teams)
            template = template.replace("{team}", team)
        
        if "{project}" in template:
            projects = ["Alpha", "Beta", "Phoenix", "Catalyst", "Nexus"]
            project = self.random_choice(projects)
            template = template.replace("{project}", project)
        
        if "{topic}" in template:
            topics = self.meeting_topics.get(meeting_type, ["General"])
            topic = self.random_choice(topics)
            template = template.replace("{topic}", topic.title())
        
        return template
    
    def _select_meeting_attendees(self, meeting_type: str, config: Dict[str, Any]) -> List[Any]:
        """Select meeting attendees based on type."""
        min_attendees, max_attendees = config["attendee_count"]
        attendee_count = self.random.randint(min_attendees, max_attendees)
        
        all_people = list(self.context.people.values())
        
        if meeting_type == "standup":
            # Same team members
            team = self.random_choice(self.config.organization.teams)
            team_people = self.context.get_people_by_team(team)
            attendees = self.random.sample(team_people, min(attendee_count, len(team_people)))
        
        elif meeting_type == "project":
            # Mix of teams, but focused
            primary_team = self.random_choice(self.config.organization.teams)
            primary_people = self.context.get_people_by_team(primary_team)
            
            # 70% from primary team, 30% from other teams
            primary_count = int(attendee_count * 0.7)
            other_count = attendee_count - primary_count
            
            attendees = []
            if primary_people:
                attendees.extend(self.random.sample(
                    primary_people, 
                    min(primary_count, len(primary_people))
                ))
            
            other_people = [p for p in all_people if p.team != primary_team]
            if other_people and other_count > 0:
                attendees.extend(self.random.sample(
                    other_people,
                    min(other_count, len(other_people))
                ))
        
        elif meeting_type == "cross_team":
            # Representatives from multiple teams
            teams_involved = self.random.sample(
                self.config.organization.teams, 
                self.random.randint(2, 4)
            )
            
            attendees = []
            people_per_team = max(1, attendee_count // len(teams_involved))
            
            for team in teams_involved:
                team_people = self.context.get_people_by_team(team)
                if team_people:
                    team_attendees = self.random.sample(
                        team_people,
                        min(people_per_team, len(team_people))
                    )
                    attendees.extend(team_attendees)
        
        elif meeting_type == "leadership":
            # Managers and senior people
            managers = [p for p in all_people if p.person_id in self.context.managers]
            senior_people = [p for p in all_people if p.tenure_months > 24]
            
            # Remove duplicates by person_id
            seen_ids = set()
            leadership_pool = []
            for person in managers + senior_people:
                if person.person_id not in seen_ids:
                    leadership_pool.append(person)
                    seen_ids.add(person.person_id)
            attendees = self.random.sample(
                leadership_pool,
                min(attendee_count, len(leadership_pool))
            )
        
        else:  # all_hands
            # Random selection from all people
            attendees = self.random.sample(all_people, min(attendee_count, len(all_people)))
        
        return attendees
    
    def _generate_meeting_date(self) -> datetime:
        """Generate realistic meeting date during business hours."""
        start_date = datetime.fromisoformat(self.config.temporal.start_date)
        end_date = datetime.fromisoformat(self.config.temporal.end_date)
        
        base_date = self.random_date_between(start_date, end_date)
        
        # Meetings typically happen during business hours on weekdays
        # Adjust to weekday if weekend
        while base_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
            base_date += timedelta(days=1)
        
        # Set to business hours (9 AM - 5 PM)
        meeting_hour = self.random.randint(9, 16)
        meeting_minute = self.random.choice([0, 15, 30, 45])  # Common meeting times
        
        return base_date.replace(hour=meeting_hour, minute=meeting_minute, second=0, microsecond=0)
    
    def _generate_meeting_summary(self, meeting_type: str, title: str, attendees: List[Any]) -> str:
        """Generate meeting summary content."""
        topics = self.meeting_topics.get(meeting_type, ["general discussion"])
        primary_topic = self.random_choice(topics)
        
        # Generate 3-5 paragraph summary
        paragraphs = []
        
        # Opening paragraph
        attendee_teams = list({p.team for p in attendees})
        team_str = ", ".join(attendee_teams) if len(attendee_teams) <= 3 else f"{len(attendee_teams)} teams"
        
        opening = f"Meeting focused on {primary_topic} with representatives from {team_str}. "
        opening += f"Key discussions centered around current progress, challenges, and next steps. "
        opening += f"The team reviewed recent developments and aligned on priorities moving forward."
        paragraphs.append(opening)
        
        # Discussion points
        discussion_points = [
            f"Detailed analysis of {primary_topic} performance metrics and current status.",
            f"Review of blockers and challenges related to {primary_topic} implementation.",
            f"Discussion of resource allocation and timeline adjustments for {primary_topic}.",
            f"Evaluation of cross-team dependencies and coordination requirements."
        ]
        
        selected_points = self.random.sample(discussion_points, self.random.randint(2, 3))
        for point in selected_points:
            paragraphs.append(point)
        
        # Closing paragraph
        closing = f"The meeting concluded with clear action items and next steps. "
        closing += f"Team members committed to specific deliverables and follow-up meetings were scheduled. "
        closing += f"Overall progress on {primary_topic} remains on track with identified mitigation strategies for current challenges."
        paragraphs.append(closing)
        
        return " ".join(paragraphs)
    
    def _generate_meeting_decisions(self, meeting_type: str) -> List[str]:
        """Generate meeting decisions."""
        decisions = []
        decision_count = self.random.randint(1, 4)
        
        topics = self.meeting_topics.get(meeting_type, ["general topic"])
        
        for _ in range(decision_count):
            template = self.random_choice(self.decision_templates)
            topic = self.random_choice(topics)
            
            decision = template.format(
                topic=topic,
                amount=f"{self.random.randint(10, 500)}K",
                timeframe=self.random_choice(["end of quarter", "next month", "Q1", "by year-end"])
            )
            decisions.append(decision)
        
        return decisions
    
    def _generate_meeting_action_items(self, meeting_type: str, attendees: List[Any]) -> List[str]:
        """Generate meeting action items."""
        action_items = []
        item_count = self.random.randint(2, 6)
        
        topics = self.meeting_topics.get(meeting_type, ["general topic"])
        
        for _ in range(item_count):
            template = self.random_choice(self.action_item_templates)
            person = self.random_choice(attendees)
            topic = self.random_choice(topics)
            team = self.random_choice(self.config.organization.teams)
            
            # Generate future date (1-14 days)
            future_date = datetime.now() + timedelta(days=self.random.randint(1, 14))
            date_str = future_date.strftime("%B %d")
            
            action_item = template.format(
                person=person.full_name,
                topic=topic,
                team=team,
                date=date_str
            )
            action_items.append(action_item)
        
        return action_items
    
    def _generate_team_dependencies(self, meeting_type: str, attendees: List[Any]) -> List[str]:
        """Generate team dependencies."""
        dependencies = []
        
        if meeting_type in ["cross_team", "project"]:
            attendee_teams = list({p.team for p in attendees})
            
            if len(attendee_teams) > 1:
                dependency_count = self.random.randint(1, 3)
                
                dependency_templates = [
                    "{team1} waiting for {team2} to complete {task}",
                    "{team1} needs input from {team2} on {topic}",
                    "{team1} and {team2} need to coordinate on {topic}",
                    "{team1} blocked by {team2} resource availability"
                ]
                
                for _ in range(dependency_count):
                    if len(attendee_teams) >= 2:
                        team1, team2 = self.random.sample(attendee_teams, 2)
                        template = self.random_choice(dependency_templates)
                        
                        tasks = ["requirements", "design review", "testing", "deployment", "documentation"]
                        topics = ["API integration", "data migration", "user interface", "security review"]
                        
                        dependency = template.format(
                            team1=team1,
                            team2=team2,
                            task=self.random_choice(tasks),
                            topic=self.random_choice(topics)
                        )
                        dependencies.append(dependency)
        
        return dependencies
    
    def _generate_weekly_briefs(self) -> List[Dict[str, Any]]:
        """Generate weekly briefs (12 org-level + 5 team-level)."""
        briefs = []
        
        # Generate 12 organizational weekly briefs
        for week in range(12):
            brief = self._create_organizational_brief(week)
            briefs.append(brief)
        
        # Generate 5 team-specific briefs (one per team)
        for team in self.config.organization.teams:
            brief = self._create_team_brief(team)
            briefs.append(brief)
        
        return briefs
    
    def _create_organizational_brief(self, week_number: int) -> Dict[str, Any]:
        """Create organizational weekly brief."""
        self.brief_counter += 1
        brief_id = f"BRIEF_ORG_{self.brief_counter:03d}"
        
        # Generate week date
        start_date = datetime.fromisoformat(self.config.temporal.start_date)
        week_date = start_date + timedelta(weeks=week_number)
        
        title = f"Weekly Organizational Brief - Week of {week_date.strftime('%B %d, %Y')}"
        
        # Generate content sections
        content_sections = {}
        
        # Key Achievements
        achievements = [
            "Completed customer churn analysis showing 15% improvement in retention",
            "Launched new onboarding flow with 25% faster completion rates", 
            "Finalized Q4 budget planning with all department approvals",
            "Deployed new API integration reducing processing time by 30%",
            "Completed security audit with zero critical findings"
        ]
        content_sections["Key Achievements This Week"] = self.random.sample(achievements, 3)
        
        # New Cross-Team Collaborations
        collaborations = [
            "Marketing and Product teams aligned on customer segmentation strategy",
            "Engineering and Finance coordinating on infrastructure cost optimization",
            "HR and Product collaborating on employee onboarding tool development",
            "Marketing and Engineering working together on analytics dashboard",
            "Product and Finance analyzing pricing impact on user adoption"
        ]
        content_sections["New Cross-Team Collaborations"] = self.random.sample(collaborations, 2)
        
        # Emerging Topics
        emerging_topics = [
            "AI integration opportunities across product suite",
            "Remote work policy optimization based on team feedback",
            "Customer data privacy compliance requirements",
            "Sustainability initiatives for office operations",
            "Digital transformation of internal processes"
        ]
        content_sections["Emerging Topics and Trends"] = self.random.sample(emerging_topics, 2)
        
        # Upcoming Milestones
        milestones = [
            "Q4 All Hands meeting scheduled for next Friday",
            "Product roadmap review with stakeholders next week",
            "Annual performance review cycle begins Monday",
            "New hire orientation program launches next month",
            "Quarterly business review presentations due next week"
        ]
        content_sections["Upcoming Milestones"] = self.random.sample(milestones, 2)
        
        # Suggested Connections
        connections = []
        overlaps = getattr(self, 'generated_overlaps', [])
        if overlaps:
            for overlap in self.random.sample(overlaps, min(2, len(overlaps))):
                if hasattr(overlap, 'topic_name') and hasattr(overlap, 'teams_involved'):
                    connection = f"Connect {' and '.join(overlap.teams_involved)} teams on {overlap.topic_name}"
                    connections.append(connection)
        
        if not connections:
            connections = [
                "Connect Marketing and Product teams on customer feedback analysis",
                "Facilitate Engineering and Finance discussion on cloud cost optimization"
            ]
        
        content_sections["Suggested Connections"] = connections[:2]
        
        return {
            "brief_id": brief_id,
            "type": "organizational",
            "title": title,
            "week_date": week_date.isoformat(),
            "content_sections": content_sections,
            "created_at": week_date.isoformat()
        }
    
    def _create_team_brief(self, team: str) -> Dict[str, Any]:
        """Create team-specific weekly brief."""
        self.brief_counter += 1
        brief_id = f"BRIEF_{team.upper()}_{self.brief_counter:03d}"
        
        # Generate recent date
        end_date = datetime.fromisoformat(self.config.temporal.end_date)
        week_date = end_date - timedelta(days=self.random.randint(1, 30))
        
        title = f"{team} Team Weekly Brief - Week of {week_date.strftime('%B %d, %Y')}"
        
        # Generate team-specific content
        content_sections = {}
        
        # Team accomplishments
        team_accomplishments = {
            "Marketing": [
                "Launched new campaign resulting in 20% increase in leads",
                "Completed competitive analysis for Q4 strategy",
                "Optimized email campaigns with 15% better open rates"
            ],
            "Product": [
                "Released new feature with 85% positive user feedback",
                "Completed user research study with 200+ participants", 
                "Finalized product roadmap for next quarter"
            ],
            "Engineering": [
                "Deployed performance improvements reducing load time by 40%",
                "Completed security vulnerability assessment",
                "Migrated legacy systems to new infrastructure"
            ],
            "Finance": [
                "Completed monthly financial close 2 days early",
                "Implemented new expense tracking system",
                "Finalized budget allocations for all departments"
            ],
            "HR": [
                "Onboarded 3 new team members successfully",
                "Launched employee satisfaction survey",
                "Updated company policies based on legal review"
            ]
        }
        
        accomplishments = team_accomplishments.get(team, ["Completed weekly objectives"])
        content_sections["Team Accomplishments"] = self.random.sample(accomplishments, min(2, len(accomplishments)))
        
        # Cross-team activities
        cross_team_activities = [
            f"Collaborated with Product team on user experience improvements",
            f"Coordinated with Engineering on technical requirements",
            f"Worked with Finance on budget planning and resource allocation",
            f"Partnered with Marketing on customer feedback analysis",
            f"Supported HR on process optimization initiatives"
        ]
        content_sections["Cross-Team Activities"] = [self.random_choice(cross_team_activities)]
        
        # Next week priorities
        priorities = [
            "Complete quarterly planning documentation",
            "Review and approve pending project proposals", 
            "Conduct team retrospective and planning session",
            "Finalize resource allocation for upcoming initiatives",
            "Prepare presentations for stakeholder review"
        ]
        content_sections["Next Week Priorities"] = self.random.sample(priorities, 2)
        
        return {
            "brief_id": brief_id,
            "type": "team",
            "team": team,
            "title": title,
            "week_date": week_date.isoformat(),
            "content_sections": content_sections,
            "created_at": week_date.isoformat()
        }
    
    def get_generation_progress(self) -> Dict[str, Any]:
        """Get progress information for meeting generation."""
        return {
            "generator_type": "MeetingGenerator",
            "meetings_generated": len(self.generated_meetings),
            "briefs_generated": len(self.generated_briefs),
            "target_meetings": 30,
            "target_briefs": 17,
            "organizational_briefs": len([b for b in self.generated_briefs if b.get("type") == "organizational"]),
            "team_briefs": len([b for b in self.generated_briefs if b.get("type") == "team"]),
            "status": "completed" if self.generated_meetings and self.generated_briefs else "ready"
        }