"""Base generator class providing common functionality."""

from abc import ABC, abstractmethod
from typing import Any, List, Dict, Optional
import random
import string
from datetime import datetime, timedelta
import uuid

from ..config.settings import GenerationConfig
from .context import ContextManager


class BaseGenerator(ABC):
    """Abstract base class for all data generators."""
    
    def __init__(self, config: GenerationConfig, context: ContextManager):
        """Initialize generator with configuration and context.
        
        Args:
            config: Generation configuration settings
            context: Shared context manager for cross-references
        """
        self.config = config
        self.context = context
        self.random = random.Random()  # Use seeded random for reproducibility
    
    @abstractmethod
    def generate(self) -> List[Any]:
        """Generate data items. Must be implemented by subclasses."""
        pass
    
    def generate_id(self, prefix: str) -> str:
        """Generate a unique ID with given prefix.
        
        Args:
            prefix: Prefix for the ID (e.g., 'P_', 'DOC_', 'T_')
            
        Returns:
            Unique ID string
        """
        # Use a combination of timestamp and random for uniqueness
        timestamp = int(datetime.now().timestamp() * 1000) % 100000
        random_part = self.random.randint(1000, 9999)
        return f"{prefix}{timestamp}_{random_part}"
    
    def generate_simple_id(self, prefix: str, counter: int) -> str:
        """Generate a simple sequential ID.
        
        Args:
            prefix: Prefix for the ID
            counter: Sequential counter
            
        Returns:
            Simple ID string
        """
        return f"{prefix}{counter:03d}"
    
    def random_choice(self, items: List[Any]) -> Any:
        """Select random item from list.
        
        Args:
            items: List of items to choose from
            
        Returns:
            Randomly selected item
        """
        return self.random.choice(items) if items else None
    
    def random_choices(self, items: List[Any], k: int) -> List[Any]:
        """Select multiple random items from list.
        
        Args:
            items: List of items to choose from
            k: Number of items to select
            
        Returns:
            List of randomly selected items
        """
        if not items:
            return []
        k = min(k, len(items))
        return self.random.choices(items, k=k)
    
    def random_sample(self, items: List[Any], k: int) -> List[Any]:
        """Select unique random items from list.
        
        Args:
            items: List of items to choose from
            k: Number of unique items to select
            
        Returns:
            List of unique randomly selected items
        """
        if not items:
            return []
        k = min(k, len(items))
        return self.random.sample(items, k)
    
    def random_date_between(self, start_date: datetime, end_date: datetime) -> datetime:
        """Generate random datetime between two dates.
        
        Args:
            start_date: Start of date range
            end_date: End of date range
            
        Returns:
            Random datetime within range
        """
        time_between = end_date - start_date
        days_between = time_between.days
        random_days = self.random.randrange(days_between)
        random_seconds = self.random.randrange(24 * 60 * 60)
        
        return start_date + timedelta(days=random_days, seconds=random_seconds)
    
    def random_business_datetime(self, date: datetime, timezone: str = "America/Los_Angeles") -> datetime:
        """Generate random datetime during business hours.
        
        Args:
            date: Base date
            timezone: Timezone for business hours
            
        Returns:
            Random datetime during business hours
        """
        # Business hours: 9 AM to 5 PM
        start_hour = 9
        end_hour = 17
        
        random_hour = self.random.randint(start_hour, end_hour - 1)
        random_minute = self.random.randint(0, 59)
        
        return date.replace(hour=random_hour, minute=random_minute, second=0, microsecond=0)
    
    def weighted_choice(self, items: List[Any], weights: List[float]) -> Any:
        """Select item based on weights.
        
        Args:
            items: List of items to choose from
            weights: Corresponding weights for each item
            
        Returns:
            Weighted random selection
        """
        if not items or not weights or len(items) != len(weights):
            return self.random_choice(items) if items else None
        
        return self.random.choices(items, weights=weights, k=1)[0]
    
    def generate_realistic_text(self, min_words: int = 10, max_words: int = 50, 
                              topic_keywords: Optional[List[str]] = None) -> str:
        """Generate realistic text content.
        
        Args:
            min_words: Minimum number of words
            max_words: Maximum number of words
            topic_keywords: Keywords to include in the text
            
        Returns:
            Generated text string
        """
        # Basic business vocabulary
        business_words = [
            "analysis", "strategy", "implementation", "optimization", "performance",
            "metrics", "insights", "collaboration", "efficiency", "innovation",
            "customer", "market", "revenue", "growth", "engagement", "conversion",
            "platform", "solution", "framework", "methodology", "approach",
            "requirements", "objectives", "deliverables", "timeline", "resources"
        ]
        
        # Add topic keywords if provided
        if topic_keywords:
            business_words.extend(topic_keywords)
        
        word_count = self.random.randint(min_words, max_words)
        words = []
        
        for i in range(word_count):
            if i == 0:
                # Start with a capital letter
                word = self.random_choice(business_words).capitalize()
            else:
                word = self.random_choice(business_words)
            words.append(word)
        
        # Join words and add some basic sentence structure
        text = " ".join(words)
        
        # Add periods to make it look more like sentences
        sentences = []
        current_sentence = []
        
        for word in words:
            current_sentence.append(word)
            if len(current_sentence) >= self.random.randint(5, 12):
                sentences.append(" ".join(current_sentence) + ".")
                current_sentence = []
        
        if current_sentence:
            sentences.append(" ".join(current_sentence) + ".")
        
        return " ".join(sentences)
    
    def set_seed(self, seed: int) -> None:
        """Set random seed for reproducible generation.
        
        Args:
            seed: Random seed value
        """
        self.random.seed(seed)
        random.seed(seed)  # Also set global random seed
    
    def validate_generated_data(self, data: List[Any]) -> bool:
        """Validate generated data meets basic requirements.
        
        Args:
            data: Generated data to validate
            
        Returns:
            True if data is valid
        """
        if not data:
            return False
        
        # Check that all items have required methods/attributes
        for item in data:
            if hasattr(item, 'to_dict'):
                try:
                    item.to_dict()
                except Exception:
                    return False
        
        return True
    
    def get_generation_progress(self) -> Dict[str, Any]:
        """Get progress information for this generator.
        
        Returns:
            Dictionary with progress information
        """
        return {
            "generator_type": self.__class__.__name__,
            "entities_generated": 0,  # Override in subclasses
            "status": "ready"
        }