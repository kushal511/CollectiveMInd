"""Permission and access control generator for security simulation."""

import random
from typing import List, Dict, Any, Set
from datetime import datetime

from .base import BaseGenerator
from .context import ContextManager
from ..models.permissions import ACL
from ..config.settings import GenerationConfig


class PermissionGenerator(BaseGenerator):
    """Generates access control lists and permission scenarios."""
    
    def __init__(self, config: GenerationConfig, context: ContextManager):
        """Initialize permission generator."""
        super().__init__(config, context)
        
        # Permission scenarios for testing
        self.permission_scenarios = {
            "finance_restricted": {
                "count": 10,
                "description": "Documents visible only to Finance team",
                "resource_types": ["DOC"],
                "allow_teams": ["Finance"],
                "confidentiality_levels": ["high"]
            },
            "mis_permissioned": {
                "count": 3,
                "description": "Documents with permission warnings",
                "resource_types": ["DOC"],
                "warning": True
            },
            "cross_team_restricted": {
                "count": 5,
                "description": "Documents restricted to specific cross-team groups",
                "resource_types": ["DOC"],
                "allow_teams": ["Marketing", "Product"]  # Example cross-team restriction
            },
            "thread_permissions": {
                "count": 8,
                "description": "Chat threads with access restrictions",
                "resource_types": ["THREAD"],
                "team_based": True
            },
            "starter_pack_permissions": {
                "count": 5,
                "description": "Starter packs with team-specific access",
                "resource_types": ["PACK"],
                "team_based": True
            }
        }
        
        # Common permission patterns
        self.permission_patterns = {
            "public": {
                "allow_teams": ["Marketing", "Product", "Engineering", "Finance", "HR"],
                "description": "Accessible to all teams"
            },
            "internal": {
                "allow_teams": None,  # Will be set based on document team
                "description": "Accessible to document owner team and managers"
            },
            "restricted": {
                "allow_teams": [],  # Will be set based on specific restrictions
                "description": "Restricted access based on confidentiality"
            },
            "manager_only": {
                "allow_person_ids": [],  # Will be populated with manager IDs
                "description": "Accessible only to managers"
            }
        }
        
        self.generated_acls: List[ACL] = []
        self.acl_counter = 0
    
    def generate(self) -> List[ACL]:
        """Generate access control lists for all resources."""
        acls = []
        
        print("   Generating document permissions...")
        doc_acls = self._generate_document_permissions()
        acls.extend(doc_acls)
        
        print("   Generating chat thread permissions...")
        thread_acls = self._generate_thread_permissions()
        acls.extend(thread_acls)
        
        print("   Generating starter pack permissions...")
        pack_acls = self._generate_starter_pack_permissions()
        acls.extend(pack_acls)
        
        print("   Generating edge case scenarios...")
        edge_case_acls = self._generate_edge_case_permissions()
        acls.extend(edge_case_acls)
        
        self.generated_acls = acls
        return acls
    
    def _generate_document_permissions(self) -> List[ACL]:
        """Generate ACL entries for documents."""
        acls = []
        
        # Get all documents
        documents = list(self.context.documents.values())
        
        # Generate Finance-restricted documents (10 as specified)
        finance_docs = [doc for doc in documents if doc.team == "Finance"]
        if len(finance_docs) >= 10:
            restricted_docs = self.random.sample(finance_docs, 10)
        else:
            # If not enough Finance docs, select high confidentiality docs
            high_conf_docs = [doc for doc in documents if doc.confidentiality == "high"]
            restricted_docs = self.random.sample(
                finance_docs + high_conf_docs, 
                min(10, len(finance_docs + high_conf_docs))
            )
        
        for doc in restricted_docs:
            acl = ACL(
                resource_type="DOC",
                resource_id=doc.doc_id,
                allow_teams=["Finance"],
                allow_person_ids=[],
                deny_person_ids=[],
                acl_warning=False
            )
            acls.append(acl)
        
        # Generate permissions for other documents based on visibility
        remaining_docs = [doc for doc in documents if doc not in restricted_docs]
        
        for doc in remaining_docs:
            acl = self._create_document_acl(doc)
            if acl:
                acls.append(acl)
        
        return acls
    
    def _create_document_acl(self, document: Any) -> ACL:
        """Create ACL for a specific document."""
        if document.visibility == "public":
            # Public documents - accessible to all
            return ACL(
                resource_type="DOC",
                resource_id=document.doc_id,
                allow_teams=self.config.organization.teams,
                allow_person_ids=[],
                deny_person_ids=[]
            )
        
        elif document.visibility == "internal":
            # Internal documents - accessible to same team + managers
            managers = list(self.context.managers)
            team_people = [p.person_id for p in self.context.get_people_by_team(document.team)]
            
            return ACL(
                resource_type="DOC",
                resource_id=document.doc_id,
                allow_teams=[document.team],
                allow_person_ids=managers,  # Managers can access all internal docs
                deny_person_ids=[]
            )
        
        elif document.visibility == "restricted":
            # Restricted documents - team only, no cross-access
            return ACL(
                resource_type="DOC",
                resource_id=document.doc_id,
                allow_teams=[document.team],
                allow_person_ids=[],
                deny_person_ids=[]
            )
        
        return None
    
    def _generate_thread_permissions(self) -> List[ACL]:
        """Generate ACL entries for chat threads."""
        acls = []
        
        threads = list(self.context.chat_threads.values())
        
        for thread in threads:
            # Determine access based on channel type
            if "general" in thread.channel:
                # Team general channels - accessible to team members
                team = thread.channel.split("-")[0].title()
                if team in self.config.organization.teams:
                    acl = ACL(
                        resource_type="THREAD",
                        resource_id=thread.thread_id,
                        allow_teams=[team],
                        allow_person_ids=[],
                        deny_person_ids=[]
                    )
                    acls.append(acl)
            
            elif "cross-team" in thread.channel:
                # Cross-team channels - accessible to multiple teams
                acl = ACL(
                    resource_type="THREAD",
                    resource_id=thread.thread_id,
                    allow_teams=self.config.organization.teams,  # All teams for cross-team channels
                    allow_person_ids=[],
                    deny_person_ids=[]
                )
                acls.append(acl)
            
            elif "project" in thread.channel:
                # Project channels - accessible to project participants
                acl = ACL(
                    resource_type="THREAD",
                    resource_id=thread.thread_id,
                    allow_teams=[],
                    allow_person_ids=thread.participants,  # Only participants
                    deny_person_ids=[]
                )
                acls.append(acl)
            
            elif thread.channel == "random":
                # Random channel - accessible to all
                acl = ACL(
                    resource_type="THREAD",
                    resource_id=thread.thread_id,
                    allow_teams=self.config.organization.teams,
                    allow_person_ids=[],
                    deny_person_ids=[]
                )
                acls.append(acl)
        
        return acls
    
    def _generate_starter_pack_permissions(self) -> List[ACL]:
        """Generate ACL entries for starter packs."""
        acls = []
        
        # Starter packs are team-specific by design
        for team in self.config.organization.teams:
            pack_id = f"PACK_{team.upper()}_001"  # Assuming this naming convention
            
            # Team starter packs accessible to team members + HR + managers
            allow_teams = [team, "HR"]  # HR can access all starter packs
            allow_person_ids = list(self.context.managers)  # Managers can access all
            
            acl = ACL(
                resource_type="PACK",
                resource_id=pack_id,
                allow_teams=allow_teams,
                allow_person_ids=allow_person_ids,
                deny_person_ids=[]
            )
            acls.append(acl)
        
        return acls
    
    def _generate_edge_case_permissions(self) -> List[ACL]:
        """Generate edge case permission scenarios for testing."""
        acls = []
        
        # Generate 3 mis-permissioned documents (as specified in requirements)
        documents = list(self.context.documents.values())
        
        # Select documents that should be restricted but are marked as internal
        internal_docs = [doc for doc in documents if doc.visibility == "internal"]
        
        if len(internal_docs) >= 3:
            mis_permissioned = self.random.sample(internal_docs, 3)
            
            for doc in mis_permissioned:
                # These should be restricted but are marked internal - create warning ACL
                acl = ACL(
                    resource_type="DOC",
                    resource_id=doc.doc_id,
                    allow_teams=[doc.team],  # Should be more restrictive
                    allow_person_ids=[],
                    deny_person_ids=[],
                    acl_warning=True  # Flag for mis-permissioned resource
                )
                acls.append(acl)
        
        # Generate documents referenced in public chats but marked restricted
        restricted_docs = [doc for doc in documents if doc.visibility == "restricted"]
        
        if restricted_docs:
            # Select 1-2 restricted docs that might be referenced in chats
            chat_referenced = self.random.sample(restricted_docs, min(2, len(restricted_docs)))
            
            for doc in chat_referenced:
                # Create ACL that shows the conflict
                acl = ACL(
                    resource_type="DOC",
                    resource_id=doc.doc_id,
                    allow_teams=[doc.team],
                    allow_person_ids=[],
                    deny_person_ids=[],
                    acl_warning=True  # Warning: referenced in public but restricted
                )
                acls.append(acl)
        
        # Generate some deny scenarios
        sensitive_docs = [doc for doc in documents if doc.confidentiality == "high"]
        
        if sensitive_docs:
            # Create scenarios where certain people are explicitly denied access
            sensitive_doc = self.random_choice(sensitive_docs)
            
            # Deny access to interns or new hires
            all_people = list(self.context.people.values())
            new_hires = [p for p in all_people if p.tenure_months < 6]
            
            if new_hires:
                acl = ACL(
                    resource_type="DOC",
                    resource_id=sensitive_doc.doc_id,
                    allow_teams=[sensitive_doc.team],
                    allow_person_ids=[],
                    deny_person_ids=[p.person_id for p in new_hires[:2]]  # Deny 2 new hires
                )
                acls.append(acl)
        
        return acls
    
    def get_permission_summary(self) -> Dict[str, Any]:
        """Get summary of permission scenarios generated."""
        summary = {
            "total_acls": len(self.generated_acls),
            "by_resource_type": {},
            "warning_count": 0,
            "scenarios": {}
        }
        
        # Count by resource type
        for acl in self.generated_acls:
            resource_type = acl.resource_type
            summary["by_resource_type"][resource_type] = summary["by_resource_type"].get(resource_type, 0) + 1
            
            if acl.acl_warning:
                summary["warning_count"] += 1
        
        # Count scenarios
        finance_restricted = len([acl for acl in self.generated_acls 
                                if acl.resource_type == "DOC" and acl.allow_teams == ["Finance"]])
        summary["scenarios"]["finance_restricted"] = finance_restricted
        
        mis_permissioned = len([acl for acl in self.generated_acls if acl.acl_warning])
        summary["scenarios"]["mis_permissioned"] = mis_permissioned
        
        return summary
    
    def get_generation_progress(self) -> Dict[str, Any]:
        """Get progress information for permission generation."""
        return {
            "generator_type": "PermissionGenerator",
            "acls_generated": len(self.generated_acls),
            "permission_summary": self.get_permission_summary(),
            "status": "completed" if self.generated_acls else "ready"
        }