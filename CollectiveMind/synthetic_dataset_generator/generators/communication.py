"""Communication generator for creating realistic chat threads and messages."""

import random
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta

from .base import BaseGenerator
from .context import ContextManager
from ..models.core import ChatThread, ChatMessage
from ..config.settings import GenerationConfig


class CommunicationGenerator(BaseGenerator):
    """Generates realistic chat threads and messages across teams."""
    
    def __init__(self, config: GenerationConfig, context: ContextManager):
        """Initialize communication generator."""
        super().__init__(config, context)
        
        # Channel types and patterns
        self.channel_types = {
            "team-general": {
                "pattern": "{team}-general",
                "description": "General team discussions",
                "frequency": 0.4
            },
            "project-specific": {
                "pattern": "project-{project}",
                "description": "Project-focused channels",
                "frequency": 0.3
            },
            "cross-team": {
                "pattern": "cross-team-{topic}",
                "description": "Cross-team collaboration",
                "frequency": 0.2
            },
            "random": {
                "pattern": "random",
                "description": "Casual conversations",
                "frequency": 0.1
            }
        }
        
        # Project names for project channels
        self.project_names = [
            "alpha", "beta", "gamma", "delta", "phoenix", "nova", "titan",
            "catalyst", "nexus", "vertex", "prism", "fusion", "quantum"
        ]
        
        # Cross-team topics
        self.cross_team_topics = [
            "sync", "planning", "launch", "review", "strategy", "metrics",
            "onboarding", "security", "compliance", "infrastructure"
        ]
        
        # Message templates by context
        self.message_templates = {
            "standup": [
                "Yesterday I worked on {topic}. Today I'm focusing on {topic}.",
                "Completed {topic} review. Moving on to {topic} implementation.",
                "Had some blockers with {topic}, but resolved them. Continuing with {topic}.",
                "Finished {topic} analysis. Results look good. Next: {topic}."
            ],
            "question": [
                "Has anyone worked on {topic} before? Need some guidance.",
                "Quick question about {topic} - what's the best approach?",
                "Stuck on {topic}. Any suggestions?",
                "Anyone familiar with {topic}? Could use some help."
            ],
            "update": [
                "Update on {topic}: we're making good progress.",
                "FYI - {topic} is now complete and ready for review.",
                "Status update: {topic} is 80% done, should finish by EOD.",
                "Quick update: {topic} deployment went smoothly."
            ],
            "discussion": [
                "What do you all think about the {topic} approach?",
                "I've been analyzing {topic} and have some concerns.",
                "Interesting findings from the {topic} data.",
                "We should discuss the {topic} strategy in our next meeting."
            ],
            "urgent": [
                "URGENT: Issue with {topic} - need immediate attention!",
                "Critical: {topic} is down, investigating now.",
                "Emergency: {topic} failure affecting customers.",
                "High priority: {topic} needs to be fixed ASAP."
            ],
            "frustrated": [
                "This {topic} issue is really frustrating...",
                "Why is {topic} so complicated? This shouldn't be this hard.",
                "Spent all day on {topic} and still no progress 😤",
                "The {topic} documentation is terrible, can't figure this out."
            ],
            "confused": [
                "I'm confused about the {topic} requirements.",
                "Not sure I understand the {topic} approach correctly.",
                "Can someone clarify the {topic} process?",
                "The {topic} specs are unclear to me."
            ],
            "optimistic": [
                "Great progress on {topic} today! 🎉",
                "The {topic} solution is working perfectly!",
                "Excited about the {topic} results we're seeing.",
                "This {topic} approach is going to be amazing!"
            ]
        }
        
        # Emotion weights for different contexts
        self.emotion_weights = {
            "standup": {"calm": 0.8, "optimistic": 0.15, "frustrated": 0.05},
            "urgent": {"urgent": 0.7, "frustrated": 0.2, "calm": 0.1},
            "project": {"calm": 0.6, "optimistic": 0.2, "confused": 0.1, "frustrated": 0.1},
            "cross_team": {"calm": 0.5, "optimistic": 0.2, "confused": 0.2, "frustrated": 0.1},
            "random": {"calm": 0.4, "optimistic": 0.4, "confused": 0.1, "frustrated": 0.1}
        }
        
        self.generated_threads: List[ChatThread] = []
        self.generated_messages: List[ChatMessage] = []
        self.thread_counter = 0
        self.message_counter = 0
        
        # Track duplicate discussions for edge cases
        self.duplicate_topics = []
    
    def generate(self) -> Tuple[List[ChatThread], List[ChatMessage]]:
        """Generate all chat threads and messages."""
        threads = []
        all_messages = []
        
        # Generate different types of channels
        for channel_type, config in self.channel_types.items():
            thread_count = int(self.config.content_volumes.chat_threads * config["frequency"])
            
            for _ in range(thread_count):
                thread, messages = self._generate_thread_with_messages(channel_type)
                threads.append(thread)
                all_messages.extend(messages)
        
        # Generate duplicate discussion scenarios (25 as specified)
        duplicate_threads, duplicate_messages = self._generate_duplicate_discussions()
        threads.extend(duplicate_threads)
        all_messages.extend(duplicate_messages)
        
        # Generate emotionally charged threads (20 as specified)
        emotional_threads, emotional_messages = self._generate_emotional_threads()
        threads.extend(emotional_threads)
        all_messages.extend(emotional_messages)
        
        # Register in context
        for thread in threads:
            self.context.register_entity('thread', thread.thread_id, thread)
        
        self.generated_threads = threads
        self.generated_messages = all_messages
        
        return threads, all_messages
    
    def _generate_thread_with_messages(self, channel_type: str) -> Tuple[ChatThread, List[ChatMessage]]:
        """Generate a single thread with its messages."""
        # Create thread
        thread = self._create_thread(channel_type)
        
        # Generate messages for thread
        message_count = self.random.randint(8, 15)
        messages = []
        
        # Select participants (2-6 people)
        all_people = list(self.context.people.values())
        participant_count = self.random.randint(2, min(6, len(all_people)))
        participants = self.random.sample(all_people, participant_count)
        thread.participants = [p.person_id for p in participants]
        
        # Generate conversation flow
        current_time = self._generate_thread_start_time()
        
        for i in range(message_count):
            # Select sender (weighted toward more active participants)
            sender = self._select_message_sender(participants, i)
            
            # Generate message
            message = self._create_message(thread, sender, current_time, i, channel_type)
            messages.append(message)
            
            # Advance time (1-30 minutes between messages)
            time_gap = timedelta(minutes=self.random.randint(1, 30))
            current_time += time_gap
        
        return thread, messages
    
    def _create_thread(self, channel_type: str) -> ChatThread:
        """Create a chat thread."""
        self.thread_counter += 1
        thread_id = f"T_{self.thread_counter:03d}"
        
        # Generate channel name based on type
        if channel_type == "team-general":
            team = self.random_choice(self.config.organization.teams)
            channel = f"{team.lower()}-general"
            topic_tags = [team.lower(), "general"]
        elif channel_type == "project-specific":
            project = self.random_choice(self.project_names)
            channel = f"project-{project}"
            topic_tags = ["project", project]
        elif channel_type == "cross-team":
            topic = self.random_choice(self.cross_team_topics)
            channel = f"cross-team-{topic}"
            topic_tags = ["cross-team", topic]
        else:  # random
            channel = "random"
            topic_tags = ["random", "casual"]
        
        created_at = self._generate_thread_start_time()
        
        return ChatThread(
            thread_id=thread_id,
            channel=channel,
            topic_tags=topic_tags,
            created_at=created_at,
            participants=[]  # Will be filled when generating messages
        )
    
    def _create_message(self, thread: ChatThread, sender: Any, timestamp: datetime, 
                      message_index: int, channel_type: str) -> ChatMessage:
        """Create a single chat message."""
        self.message_counter += 1
        message_id = f"M_{self.message_counter:04d}"
        
        # Select message context and emotion
        context = self._select_message_context(channel_type, message_index)
        emotion = self._select_emotion(context)
        
        # Generate message text
        text = self._generate_message_text(context, emotion, thread.topic_tags)
        
        # Add mentions (10% chance)
        mentions = []
        if self.random.random() < 0.1 and len(thread.participants) > 1:
            other_participants = [p for p in thread.participants if p != sender.person_id]
            mentions = [self.random_choice(other_participants)]
        
        # Add document references (15% chance)
        doc_refs = []
        if self.random.random() < 0.15:
            related_docs = self.context.get_related_documents(
                self.random_choice(thread.topic_tags), 
                sender.team, 
                limit=1
            )
            if related_docs:
                doc_refs = [related_docs[0].doc_id]
        
        # Add action items (20% chance)
        action_items = []
        if self.random.random() < 0.2:
            action_items = self._generate_action_items(thread.topic_tags)
        
        return ChatMessage(
            message_id=message_id,
            thread_id=thread.thread_id,
            sender_person_id=sender.person_id,
            timestamp=timestamp,
            text=text,
            emotions=emotion,
            mentions=mentions,
            doc_refs=doc_refs,
            action_items=action_items
        )
    
    def _select_message_sender(self, participants: List[Any], message_index: int) -> Any:
        """Select message sender with realistic participation patterns."""
        # First message is random
        if message_index == 0:
            return self.random_choice(participants)
        
        # Subsequent messages favor recent speakers and more senior people
        weights = []
        for participant in participants:
            weight = 1.0
            
            # Boost weight for managers
            if "manager" in participant.role_title.lower() or "director" in participant.role_title.lower():
                weight *= 1.5
            
            # Boost weight for people with longer tenure
            if participant.tenure_months > 24:
                weight *= 1.2
            
            weights.append(weight)
        
        return self.weighted_choice(participants, weights)
    
    def _select_message_context(self, channel_type: str, message_index: int) -> str:
        """Select appropriate message context."""
        if message_index == 0:
            return self.weighted_choice(
                ["question", "update", "discussion"],
                [0.4, 0.3, 0.3]
            )
        else:
            return self.weighted_choice(
                ["discussion", "update", "question", "standup"],
                [0.4, 0.3, 0.2, 0.1]
            )
    
    def _select_emotion(self, context: str) -> str:
        """Select emotion based on context."""
        if context == "urgent":
            weights = self.emotion_weights["urgent"]
        elif context in ["standup", "update"]:
            weights = self.emotion_weights["standup"]
        else:
            weights = self.emotion_weights["project"]
        
        emotions = list(weights.keys())
        emotion_weights = list(weights.values())
        
        return self.weighted_choice(emotions, emotion_weights)
    
    def _generate_message_text(self, context: str, emotion: str, topic_tags: List[str]) -> str:
        """Generate realistic message text."""
        # Select appropriate template
        if emotion in ["urgent", "frustrated", "confused", "optimistic"]:
            templates = self.message_templates.get(emotion, self.message_templates["discussion"])
        else:
            templates = self.message_templates.get(context, self.message_templates["discussion"])
        
        template = self.random_choice(templates)
        
        # Select topic for substitution
        topic = self.random_choice(topic_tags + self.context.get_cross_team_themes())
        
        # Generate message
        message = template.format(topic=topic)
        
        # Add casual elements occasionally
        if self.random.random() < 0.1:
            casual_additions = [
                " 👍", " 🎉", " 😊", " 💪", " 🚀", " ✅", " 🔥",
                " Thanks!", " Great work!", " Nice!", " Awesome!"
            ]
            message += self.random_choice(casual_additions)
        
        # Add typos occasionally (5% chance)
        if self.random.random() < 0.05:
            message = self._add_typos(message)
        
        return message
    
    def _add_typos(self, text: str) -> str:
        """Add realistic typos to text."""
        typo_patterns = [
            ("the", "teh"),
            ("and", "adn"),
            ("you", "u"),
            ("are", "r"),
            ("to", "2"),
            ("for", "4"),
            ("be", "b"),
            ("see", "c")
        ]
        
        for original, typo in typo_patterns:
            if self.random.random() < 0.3 and original in text.lower():
                text = text.replace(original, typo, 1)
                break
        
        return text
    
    def _generate_action_items(self, topic_tags: List[str]) -> List[str]:
        """Generate realistic action items."""
        action_templates = [
            "Follow up on {topic}",
            "Review {topic} documentation",
            "Schedule {topic} meeting",
            "Update {topic} status",
            "Test {topic} implementation",
            "Share {topic} results"
        ]
        
        topic = self.random_choice(topic_tags)
        template = self.random_choice(action_templates)
        
        return [template.format(topic=topic)]
    
    def _generate_duplicate_discussions(self) -> Tuple[List[ChatThread], List[ChatMessage]]:
        """Generate duplicate discussions across teams (edge case)."""
        duplicate_threads = []
        duplicate_messages = []
        
        # Create 25 duplicate discussion scenarios
        duplicate_topics = [
            "customer churn analysis", "onboarding optimization", "pricing review",
            "performance metrics", "security audit", "API integration", "data migration",
            "user feedback analysis", "system monitoring", "cost optimization",
            "feature prioritization", "compliance review", "infrastructure upgrade",
            "market research", "competitive analysis", "user experience study",
            "budget planning", "risk assessment", "process improvement",
            "team restructuring", "training program", "vendor evaluation",
            "product roadmap", "customer support", "quality assurance"
        ]
        
        for topic in duplicate_topics:
            # Create two threads discussing the same topic
            teams = self.random.sample(self.config.organization.teams, 2)
            
            for team in teams:
                thread = ChatThread(
                    thread_id=f"T_DUP_{len(duplicate_threads) + 1:03d}",
                    channel=f"{team.lower()}-{topic.replace(' ', '-')}",
                    topic_tags=[team.lower(), topic.replace(' ', '_')],
                    created_at=self._generate_thread_start_time()
                )
                
                # Generate messages for this duplicate thread
                team_people = self.context.get_people_by_team(team)
                if team_people:
                    participants = self.random.sample(team_people, min(3, len(team_people)))
                    thread.participants = [p.person_id for p in participants]
                    
                    # Generate 3-5 messages
                    messages = []
                    current_time = thread.created_at
                    
                    for i in range(self.random.randint(3, 5)):
                        sender = self.random_choice(participants)
                        
                        message = ChatMessage(
                            message_id=f"M_DUP_{len(duplicate_messages) + len(messages) + 1:04d}",
                            thread_id=thread.thread_id,
                            sender_person_id=sender.person_id,
                            timestamp=current_time,
                            text=f"We need to analyze {topic} for our team. Has anyone started on this?",
                            emotions="confused",
                            mentions=[],
                            doc_refs=[],
                            action_items=[f"Research {topic}", f"Create {topic} plan"]
                        )
                        
                        messages.append(message)
                        current_time += timedelta(minutes=self.random.randint(5, 30))
                    
                    duplicate_threads.append(thread)
                    duplicate_messages.extend(messages)
        
        return duplicate_threads, duplicate_messages
    
    def _generate_emotional_threads(self) -> Tuple[List[ChatThread], List[ChatMessage]]:
        """Generate emotionally charged conversation threads."""
        emotional_threads = []
        emotional_messages = []
        
        emotional_scenarios = [
            {"emotion": "frustrated", "topic": "deployment failure", "intensity": "high"},
            {"emotion": "frustrated", "topic": "system outage", "intensity": "high"},
            {"emotion": "confused", "topic": "unclear requirements", "intensity": "medium"},
            {"emotion": "confused", "topic": "conflicting priorities", "intensity": "medium"},
            {"emotion": "urgent", "topic": "security breach", "intensity": "critical"},
            {"emotion": "urgent", "topic": "customer complaint", "intensity": "high"},
            {"emotion": "frustrated", "topic": "budget cuts", "intensity": "medium"},
            {"emotion": "confused", "topic": "process changes", "intensity": "low"},
        ]
        
        # Generate 20 emotional threads
        for i in range(20):
            scenario = self.random_choice(emotional_scenarios)
            
            thread = ChatThread(
                thread_id=f"T_EMO_{i + 1:03d}",
                channel=f"incident-{scenario['topic'].replace(' ', '-')}",
                topic_tags=["incident", scenario["topic"].replace(' ', '_')],
                created_at=self._generate_thread_start_time()
            )
            
            # Select participants from multiple teams for cross-team issues
            all_people = list(self.context.people.values())
            participants = self.random.sample(all_people, self.random.randint(3, 6))
            thread.participants = [p.person_id for p in participants]
            
            # Generate emotionally charged messages
            messages = []
            current_time = thread.created_at
            
            for j in range(self.random.randint(5, 10)):
                sender = self.random_choice(participants)
                
                # Escalate emotion over time
                if j < 2:
                    emotion = scenario["emotion"]
                elif j < 5:
                    emotion = "frustrated" if scenario["emotion"] != "frustrated" else "urgent"
                else:
                    emotion = "calm"  # Resolution phase
                
                message_text = self._generate_emotional_message_text(
                    scenario["topic"], emotion, scenario["intensity"]
                )
                
                message = ChatMessage(
                    message_id=f"M_EMO_{len(emotional_messages) + len(messages) + 1:04d}",
                    thread_id=thread.thread_id,
                    sender_person_id=sender.person_id,
                    timestamp=current_time,
                    text=message_text,
                    emotions=emotion,
                    mentions=[],
                    doc_refs=[],
                    action_items=[]
                )
                
                messages.append(message)
                current_time += timedelta(minutes=self.random.randint(2, 15))
            
            emotional_threads.append(thread)
            emotional_messages.extend(messages)
        
        return emotional_threads, emotional_messages
    
    def _generate_emotional_message_text(self, topic: str, emotion: str, intensity: str) -> str:
        """Generate emotionally charged message text."""
        templates = {
            "frustrated": {
                "high": [
                    f"This {topic} is completely unacceptable! We need to fix this NOW!",
                    f"I can't believe {topic} happened again. This is the third time this month!",
                    f"The {topic} is causing major issues. Why wasn't this prevented?",
                ],
                "medium": [
                    f"Really frustrated with this {topic} situation.",
                    f"The {topic} is becoming a real problem for our team.",
                    f"We need to address the {topic} issue before it gets worse.",
                ]
            },
            "confused": {
                "medium": [
                    f"I'm really confused about the {topic} process. Can someone explain?",
                    f"The {topic} documentation doesn't make sense to me.",
                    f"Not sure how to handle this {topic} situation. Need guidance.",
                ],
                "low": [
                    f"Quick question about {topic} - what's the standard approach?",
                    f"Clarification needed on {topic} requirements.",
                    f"Can someone help me understand the {topic} workflow?",
                ]
            },
            "urgent": {
                "critical": [
                    f"CRITICAL: {topic} needs immediate attention! All hands on deck!",
                    f"URGENT: {topic} is affecting production systems!",
                    f"EMERGENCY: {topic} - need response team NOW!",
                ],
                "high": [
                    f"High priority: {topic} needs to be resolved today.",
                    f"Urgent: {topic} is blocking other work.",
                    f"Time sensitive: {topic} deadline is approaching fast.",
                ]
            },
            "calm": [
                f"Update on {topic}: situation is under control now.",
                f"Good news - the {topic} issue has been resolved.",
                f"Thanks everyone for helping with the {topic} situation.",
            ]
        }
        
        if emotion == "calm":
            return self.random_choice(templates["calm"])
        else:
            emotion_templates = templates.get(emotion, {})
            intensity_templates = emotion_templates.get(intensity, emotion_templates.get("medium", []))
            if intensity_templates:
                return self.random_choice(intensity_templates)
        
        return f"We need to discuss the {topic} situation."
    
    def _generate_thread_start_time(self) -> datetime:
        """Generate realistic thread start time during business hours."""
        start_date = datetime.fromisoformat(self.config.temporal.start_date)
        end_date = datetime.fromisoformat(self.config.temporal.end_date)
        
        base_time = self.random_date_between(start_date, end_date)
        return self.random_business_datetime(base_time)
    
    def get_generation_progress(self) -> Dict[str, Any]:
        """Get progress information for communication generation."""
        return {
            "generator_type": "CommunicationGenerator",
            "threads_generated": len(self.generated_threads),
            "messages_generated": len(self.generated_messages),
            "target_threads": self.config.content_volumes.chat_threads,
            "target_messages_range": [
                self.config.content_volumes.chat_messages_min,
                self.config.content_volumes.chat_messages_max
            ],
            "duplicate_discussions": len([t for t in self.generated_threads if "DUP" in t.thread_id]),
            "emotional_threads": len([t for t in self.generated_threads if "EMO" in t.thread_id]),
            "status": "completed" if self.generated_threads else "ready"
        }