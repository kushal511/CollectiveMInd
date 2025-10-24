"""Organization generator for creating people and team structures."""

import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from .base import BaseGenerator
from .context import ContextManager
from ..models.core import Person
from ..config.settings import GenerationConfig


class OrganizationGenerator(BaseGenerator):
    """Generates organizational structure including people and team hierarchies."""
    
    def __init__(self, config: GenerationConfig, context: ContextManager):
        """Initialize organization generator."""
        super().__init__(config, context)
        
        # Name pools for realistic generation
        self.first_names = [
            "Maya", "Rahul", "Priya", "Alex", "Sarah", "David", "Lisa", "Michael",
            "Jennifer", "James", "Maria", "Robert", "Linda", "William", "Patricia",
            "John", "Barbara", "Richard", "Elizabeth", "Joseph", "Jessica", "Thomas",
            "Susan", "Christopher", "Karen", "Daniel", "Nancy", "Matthew", "Betty",
            "Anthony", "Helen", "Mark", "Sandra", "Donald", "Donna", "Steven", "Carol"
        ]
        
        self.last_names = [
            "Chen", "Sharma", "Patel", "Johnson", "Williams", "Brown", "Jones", "Garcia",
            "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
            "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
            "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis",
            "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres"
        ]
        
        # Role templates by team
        self.role_templates = {
            "Marketing": [
                "Marketing Manager", "Marketing Analyst", "Content Strategist", 
                "Digital Marketing Specialist", "Brand Manager", "Marketing Coordinator",
                "Growth Marketing Manager", "Marketing Director"
            ],
            "Product": [
                "Product Manager", "Senior Product Manager", "Product Analyst",
                "Product Owner", "UX Designer", "Product Marketing Manager",
                "Product Director", "Associate Product Manager"
            ],
            "Engineering": [
                "Software Engineer", "Senior Software Engineer", "DevOps Engineer",
                "Frontend Developer", "Backend Developer", "Full Stack Developer",
                "Engineering Manager", "Principal Engineer", "Tech Lead"
            ],
            "Finance": [
                "Financial Analyst", "Senior Financial Analyst", "Finance Manager",
                "Controller", "Finance Director", "Budget Analyst", "Accounting Manager"
            ],
            "HR": [
                "HR Manager", "HR Business Partner", "Talent Acquisition Specialist",
                "HR Coordinator", "People Operations Manager", "HR Director",
                "Recruiter", "HR Analyst"
            ]
        }
        
        # Skills by team
        self.team_skills = {
            "Marketing": [
                "Digital Marketing", "Content Strategy", "SEO/SEM", "Social Media",
                "Analytics", "Campaign Management", "Brand Strategy", "Market Research",
                "Email Marketing", "Growth Hacking", "A/B Testing", "Customer Segmentation"
            ],
            "Product": [
                "Product Strategy", "User Research", "Data Analysis", "A/B Testing",
                "Roadmap Planning", "Agile/Scrum", "User Experience", "Market Analysis",
                "Feature Prioritization", "Stakeholder Management", "Wireframing", "SQL"
            ],
            "Engineering": [
                "Python", "JavaScript", "React", "Node.js", "AWS", "Docker", "Kubernetes",
                "SQL", "NoSQL", "Git", "CI/CD", "System Design", "API Development",
                "Microservices", "DevOps", "Machine Learning", "Data Engineering"
            ],
            "Finance": [
                "Financial Modeling", "Excel", "SQL", "Budgeting", "Forecasting",
                "Financial Analysis", "Accounting", "Risk Management", "Compliance",
                "Business Intelligence", "Data Analysis", "Cost Management"
            ],
            "HR": [
                "Talent Acquisition", "Performance Management", "Employee Relations",
                "Compensation & Benefits", "Training & Development", "HR Analytics",
                "Organizational Development", "Employment Law", "HRIS", "Recruiting"
            ]
        }
        
        # Timezone distribution
        self.timezones = [
            "America/Los_Angeles", "America/New_York", "Europe/London",
            "America/Chicago", "America/Denver"
        ]
        
        self.generated_people: List[Person] = []
    
    def generate(self) -> List[Person]:
        """Generate complete organizational structure."""
        # Generate all people first
        people = self._generate_people()
        
        # Assign managers and create hierarchy
        self._assign_managers(people)
        
        # Create team change history for some people
        self._create_team_history(people)
        
        # Register all people in context
        for person in people:
            self.context.register_entity('person', person.person_id, person)
        
        self.generated_people = people
        return people
    
    def _generate_people(self) -> List[Person]:
        """Generate all people with basic information."""
        people = []
        used_names = set()
        
        # Ensure demo personas are included
        demo_people = self._create_demo_personas()
        people.extend(demo_people)
        used_names.update(person.full_name for person in demo_people)
        
        # Generate remaining people
        remaining_count = self.config.organization.employee_count - len(demo_people)
        
        for i in range(remaining_count):
            person = self._generate_single_person(i + len(demo_people), used_names)
            people.append(person)
            used_names.add(person.full_name)
        
        return people
    
    def _create_demo_personas(self) -> List[Person]:
        """Create the specific demo personas."""
        demo_people = []
        
        for i, persona in enumerate(self.config.demo_personas):
            person_id = f"P_{i+1:03d}"
            
            # Generate email from name
            name_parts = persona["name"].lower().split()
            email = f"{name_parts[0]}.{name_parts[1]}@technova.com"
            
            # Get appropriate skills for team
            skills = self.random.sample(
                self.team_skills.get(persona["team"], []), 
                self.random.randint(3, 6)
            )
            
            # Set tenure based on role
            if "New Hire" in persona["role"]:
                tenure = self.random.randint(1, 3)  # 1-3 months
            else:
                tenure = self.random.randint(12, 48)  # 1-4 years
            
            person = Person(
                person_id=person_id,
                full_name=persona["name"],
                email=email,
                role_title=persona["role"],
                team=persona["team"],
                skills=skills,
                tenure_months=tenure,
                timezone=self.random_choice(self.timezones)
            )
            
            demo_people.append(person)
        
        return demo_people
    
    def _generate_single_person(self, index: int, used_names: set) -> Person:
        """Generate a single person."""
        # Generate unique name
        attempts = 0
        while attempts < 50:  # Prevent infinite loop
            first_name = self.random_choice(self.first_names)
            last_name = self.random_choice(self.last_names)
            full_name = f"{first_name} {last_name}"
            
            if full_name not in used_names:
                break
            attempts += 1
        else:
            # Fallback with number suffix
            full_name = f"{first_name} {last_name} {index}"
        
        # Assign to team (roughly equal distribution)
        team = self.config.organization.teams[index % len(self.config.organization.teams)]
        
        # Select role for team
        role_title = self.random_choice(self.role_templates[team])
        
        # Generate email
        email_name = full_name.lower().replace(" ", ".")
        email = f"{email_name}@technova.com"
        
        # Select skills for team
        available_skills = self.team_skills.get(team, [])
        skill_count = self.random.randint(3, 7)
        skills = self.random.sample(available_skills, min(skill_count, len(available_skills)))
        
        # Generate tenure (weighted toward longer tenure)
        tenure_weights = [1, 2, 3, 4, 3, 2, 1]  # Bell curve
        tenure_ranges = [
            (1, 6), (6, 12), (12, 24), (24, 36), 
            (36, 48), (48, 60), (60, 72)
        ]
        tenure_range = self.weighted_choice(tenure_ranges, tenure_weights)
        tenure = self.random.randint(*tenure_range)
        
        person_id = f"P_{index+1:03d}"
        
        return Person(
            person_id=person_id,
            full_name=full_name,
            email=email,
            role_title=role_title,
            team=team,
            skills=skills,
            tenure_months=tenure,
            timezone=self.random_choice(self.timezones)
        )
    
    def _assign_managers(self, people: List[Person]) -> None:
        """Assign manager relationships ensuring 3 managers total."""
        # Identify potential managers (longer tenure, senior roles)
        potential_managers = []
        
        for person in people:
            is_senior_role = any(keyword in person.role_title.lower() 
                               for keyword in ['manager', 'director', 'lead', 'principal'])
            has_experience = person.tenure_months >= 24
            
            if is_senior_role or has_experience:
                potential_managers.append(person)
        
        # Ensure we have at least 3 managers
        if len(potential_managers) < self.config.organization.manager_count:
            # Promote some people to manager roles
            non_managers = [p for p in people if p not in potential_managers]
            additional_managers = self.random.sample(
                non_managers, 
                self.config.organization.manager_count - len(potential_managers)
            )
            
            for person in additional_managers:
                # Update role to manager
                if "Senior" not in person.role_title:
                    person.role_title = f"Senior {person.role_title}"
                potential_managers.append(person)
        
        # Select exactly 3 managers
        managers = self.random.sample(potential_managers, self.config.organization.manager_count)
        
        # Assign manager relationships
        for person in people:
            if person not in managers:
                # Assign a manager, preferably from same team
                same_team_managers = [m for m in managers if m.team == person.team]
                if same_team_managers:
                    person.manager_id = self.random_choice(same_team_managers).person_id
                else:
                    # Assign any manager
                    person.manager_id = self.random_choice(managers).person_id
    
    def _create_team_history(self, people: List[Person]) -> None:
        """Create team change history for some people."""
        # Select 20-30% of people to have team changes
        change_count = int(len(people) * 0.25)
        people_to_change = self.random.sample(people, change_count)
        
        for person in people_to_change:
            # Only people with sufficient tenure should have team changes
            if person.tenure_months >= 12:
                # Select previous team(s)
                available_teams = [t for t in self.config.organization.teams if t != person.team]
                previous_team = self.random_choice(available_teams)
                person.previous_teams = [previous_team]
    
    def get_generation_progress(self) -> Dict[str, Any]:
        """Get progress information for organization generation."""
        return {
            "generator_type": "OrganizationGenerator",
            "entities_generated": len(self.generated_people),
            "target_count": self.config.organization.employee_count,
            "managers_assigned": len([p for p in self.generated_people if any(
                keyword in p.role_title.lower() for keyword in ['manager', 'director']
            )]),
            "status": "completed" if self.generated_people else "ready"
        }