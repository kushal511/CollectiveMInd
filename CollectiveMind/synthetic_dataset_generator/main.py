"""Main application for generating synthetic datasets."""

import os
import sys
import random
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

from .config.manager import ConfigurationManager
from .generators.context import ContextManager
from .generators.organization import OrganizationGenerator
from .generators.documents import DocumentGenerator
from .generators.communication import CommunicationGenerator
from .generators.metrics import MetricsGenerator
from .generators.knowledge_graph import KnowledgeGraphGenerator
from .generators.meetings import MeetingGenerator
from .generators.permissions import PermissionGenerator
from .generators.user_events import UserEventGenerator
from .output.writers import JSONLWriter


class SyntheticDatasetGenerator:
    """Main orchestrator for synthetic dataset generation."""
    
    def __init__(self, config_path: str = None):
        """Initialize the generator.
        
        Args:
            config_path: Path to configuration file
        """
        self.config_manager = ConfigurationManager(config_path)
        self.config = self.config_manager.load_config()
        self.context = ContextManager(self.config)
        
        # Initialize generators
        self.organization_generator = OrganizationGenerator(self.config, self.context)
        self.document_generator = DocumentGenerator(self.config, self.context)
        self.communication_generator = CommunicationGenerator(self.config, self.context)
        self.metrics_generator = MetricsGenerator(self.config, self.context)
        self.knowledge_graph_generator = KnowledgeGraphGenerator(self.config, self.context)
        self.meeting_generator = MeetingGenerator(self.config, self.context)
        self.permission_generator = PermissionGenerator(self.config, self.context)
        self.user_event_generator = UserEventGenerator(self.config, self.context)
        
        # Ensure output directory exists
        self.output_dir = Path(self.config.output.output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_all(self) -> None:
        """Generate complete synthetic dataset."""
        print("Starting synthetic dataset generation...")
        print(f"Target: {self.config.organization.employee_count} people, {self.config.content_volumes.documents} documents, {self.config.content_volumes.chat_threads} chat threads")
        
        # Generate organizational structure
        print("\n1. Generating organizational structure...")
        people = self.organization_generator.generate()
        print(f"   Generated {len(people)} people across {len(self.config.organization.teams)} teams")
        
        # Write people data
        people_writer = JSONLWriter(self.output_dir / "people.jsonl")
        people_writer.write_items(people)
        print(f"   Saved to {self.output_dir / 'people.jsonl'}")
        
        # Generate documents
        print("\n2. Generating documents...")
        documents = self.document_generator.generate()
        print(f"   Generated {len(documents)} documents")
        
        # Write documents data
        docs_writer = JSONLWriter(self.output_dir / "documents.jsonl")
        docs_writer.write_items(documents)
        print(f"   Saved to {self.output_dir / 'documents.jsonl'}")
        
        # Generate communication data
        print("\n3. Generating chat threads and messages...")
        threads, messages = self.communication_generator.generate()
        print(f"   Generated {len(threads)} threads with {len(messages)} messages")
        
        # Write communication data
        threads_writer = JSONLWriter(self.output_dir / "chat_threads.jsonl")
        threads_writer.write_items(threads)
        print(f"   Saved to {self.output_dir / 'chat_threads.jsonl'}")
        
        messages_writer = JSONLWriter(self.output_dir / "chat_messages.jsonl")
        messages_writer.write_items(messages)
        print(f"   Saved to {self.output_dir / 'chat_messages.jsonl'}")
        
        # Generate metrics data
        print("\n4. Generating business metrics...")
        csv_files = self.metrics_generator.generate()
        print(f"   Generated {len(csv_files)} CSV files with business analytics")
        
        # Generate knowledge graph
        print("\n5. Generating knowledge graph...")
        topics, edges, overlaps = self.knowledge_graph_generator.generate()
        print(f"   Generated {len(topics)} topics, {len(edges)} edges, {len(overlaps)} overlaps")
        
        # Write knowledge graph data
        topics_writer = JSONLWriter(self.output_dir / "topics.jsonl")
        topics_writer.write_items(topics)
        print(f"   Saved to {self.output_dir / 'topics.jsonl'}")
        
        edges_writer = JSONLWriter(self.output_dir / "knowledge_graph_edges.jsonl")
        edges_writer.write_items(edges)
        print(f"   Saved to {self.output_dir / 'knowledge_graph_edges.jsonl'}")
        
        overlaps_writer = JSONLWriter(self.output_dir / "overlaps.jsonl")
        overlaps_writer.write_items(overlaps)
        print(f"   Saved to {self.output_dir / 'overlaps.jsonl'}")
        
        # Generate meetings and briefs
        print("\n6. Generating meetings and weekly briefs...")
        meetings, briefs = self.meeting_generator.generate()
        print(f"   Generated {len(meetings)} meetings and {len(briefs)} weekly briefs")
        
        # Write meeting data
        meetings_writer = JSONLWriter(self.output_dir / "meetings.jsonl")
        meetings_writer.write_items(meetings)
        print(f"   Saved to {self.output_dir / 'meetings.jsonl'}")
        
        briefs_writer = JSONLWriter(self.output_dir / "weekly_briefs.jsonl")
        briefs_writer.write_items(briefs)
        print(f"   Saved to {self.output_dir / 'weekly_briefs.jsonl'}")
        
        # Generate starter packs (placeholder - would be implemented in meeting generator)
        print("   Generating starter packs...")
        starter_packs = self._generate_starter_packs()
        packs_writer = JSONLWriter(self.output_dir / "starter_packs.jsonl")
        packs_writer.write_items(starter_packs)
        print(f"   Saved to {self.output_dir / 'starter_packs.jsonl'}")
        
        # Generate permissions and ACLs
        print("\n7. Generating access control and permissions...")
        acls = self.permission_generator.generate()
        print(f"   Generated {len(acls)} access control entries")
        
        # Write ACL data
        acls_writer = JSONLWriter(self.output_dir / "acls.jsonl")
        acls_writer.write_items(acls)
        print(f"   Saved to {self.output_dir / 'acls.jsonl'}")
        
        # Generate user events
        print("\n8. Generating user interaction events...")
        user_events = self.user_event_generator.generate()
        print(f"   Generated {len(user_events)} user events for demo personas")
        
        # Write user events
        events_writer = JSONLWriter(self.output_dir / "user_events.jsonl")
        events_writer.write_items(user_events)
        print(f"   Saved to {self.output_dir / 'user_events.jsonl'}")
        
        # Validate referential integrity
        print("\n9. Validating data integrity...")
        validation_result = self.context.ensure_referential_integrity()
        
        if validation_result.is_valid:
            print("   ✓ All references are valid")
        else:
            print(f"   ⚠ Found {len(validation_result.errors)} errors:")
            for error in validation_result.errors[:5]:  # Show first 5 errors
                print(f"     - {error}")
        
        if validation_result.warnings:
            print(f"   ⚠ Found {len(validation_result.warnings)} warnings:")
            for warning in validation_result.warnings[:3]:  # Show first 3 warnings
                print(f"     - {warning}")
        
        # Generate manifest
        print("\n10. Creating manifest...")
        self._create_manifest()
        
        print(f"\n✓ Dataset generation complete!")
        print(f"Output directory: {self.output_dir}")
    
    def _create_manifest(self) -> None:
        """Create manifest file with dataset metadata."""
        manifest = {
            "dataset_info": {
                "name": "TechNova Synthetic Dataset",
                "version": "1.0.0",
                "generated_at": datetime.now().isoformat(),
                "company": self.config.organization.company_name
            },
            "files": []
        }
        
        # Add JSONL files
        manifest["files"].extend([
            {
                "name": "people.jsonl",
                "records": len(self.context.people),
                "format": "jsonl",
                "description": "Employee profiles and organizational structure"
            },
            {
                "name": "documents.jsonl", 
                "records": len(self.context.documents),
                "format": "jsonl",
                "description": "Organizational documents across all teams"
            },
            {
                "name": "chat_threads.jsonl",
                "records": len(self.context.chat_threads),
                "format": "jsonl", 
                "description": "Chat threads and conversation channels"
            },
            {
                "name": "chat_messages.jsonl",
                "records": len(self.communication_generator.generated_messages),
                "format": "jsonl",
                "description": "Individual chat messages with emotional context"
            },
            {
                "name": "topics.jsonl",
                "records": len(self.knowledge_graph_generator.generated_topics),
                "format": "jsonl",
                "description": "Topics and themes across the organization"
            },
            {
                "name": "knowledge_graph_edges.jsonl",
                "records": len(self.knowledge_graph_generator.generated_edges),
                "format": "jsonl",
                "description": "Knowledge graph relationships between entities"
            },
            {
                "name": "overlaps.jsonl",
                "records": len(self.knowledge_graph_generator.generated_overlaps),
                "format": "jsonl",
                "description": "Cross-team collaboration opportunities and overlaps"
            },
            {
                "name": "meetings.jsonl",
                "records": len(self.meeting_generator.generated_meetings),
                "format": "jsonl",
                "description": "Meeting summaries with decisions and action items"
            },
            {
                "name": "weekly_briefs.jsonl",
                "records": len(self.meeting_generator.generated_briefs),
                "format": "jsonl",
                "description": "Weekly organizational and team briefs"
            },
            {
                "name": "starter_packs.jsonl",
                "records": len(self.config.organization.teams),
                "format": "jsonl",
                "description": "Onboarding starter packs for each team"
            },
            {
                "name": "acls.jsonl",
                "records": len(self.permission_generator.generated_acls),
                "format": "jsonl",
                "description": "Access control lists and permissions"
            },
            {
                "name": "user_events.jsonl",
                "records": len(self.user_event_generator.generated_events),
                "format": "jsonl",
                "description": "User interaction events for personalization"
            }
        ])
        
        # Add CSV files to manifest
        for csv_file in self.metrics_generator.generated_files:
            manifest["files"].append({
                "name": csv_file,
                "format": "csv",
                "description": f"Business metrics data for {csv_file.split('_')[0]}"
            })
        
        manifest.update({
            "statistics": {
                "teams": len(self.config.organization.teams),
                "people_count": len(self.context.people),
                "documents_count": len(self.context.documents),
                "chat_threads_count": len(self.context.chat_threads),
                "chat_messages_count": len(self.communication_generator.generated_messages),
                "managers_count": len([p for p in self.context.people.values() 
                                     if p.person_id in self.context.managers]),
                "duplicate_discussions": len([t for t in self.communication_generator.generated_threads if "DUP" in t.thread_id]),
                "emotional_threads": len([t for t in self.communication_generator.generated_threads if "EMO" in t.thread_id]),
                "csv_files_count": len(self.metrics_generator.generated_files),
                "topics_count": len(self.knowledge_graph_generator.generated_topics),
                "knowledge_graph_edges_count": len(self.knowledge_graph_generator.generated_edges),
                "cross_team_overlaps_count": len(self.knowledge_graph_generator.generated_overlaps),
                "meetings_count": len(self.meeting_generator.generated_meetings),
                "weekly_briefs_count": len(self.meeting_generator.generated_briefs),
                "starter_packs_count": len(self.config.organization.teams),
                "acls_count": len(self.permission_generator.generated_acls),
                "user_events_count": len(self.user_event_generator.generated_events)
            },
            "data_ranges": {
                "start_date": self.config.temporal.start_date,
                "end_date": self.config.temporal.end_date
            },
            "teams": self.config.organization.teams
        })
        
        import json
        manifest_path = self.output_dir / "manifest.json"
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        print(f"   Saved to {manifest_path}")
    
    def _generate_starter_packs(self) -> List[Dict[str, Any]]:
        """Generate starter packs for each team."""
        starter_packs = []
        
        for i, team in enumerate(self.config.organization.teams):
            pack_id = f"PACK_{team.upper()}_{i+1:03d}"
            
            # Get team documents for starter pack
            team_docs = [doc for doc in self.context.documents.values() if doc.team == team]
            selected_docs = random.sample(team_docs, min(6, len(team_docs)))
            
            # Get team experts (people with longer tenure)
            team_people = self.context.get_people_by_team(team)
            experts = sorted(team_people, key=lambda p: p.tenure_months, reverse=True)[:3]
            
            starter_pack = {
                "pack_id": pack_id,
                "team": team,
                "title": f"{team} Team Starter Pack",
                "summary": f"Essential resources and contacts for new {team} team members",
                "doc_ids": [doc.doc_id for doc in selected_docs],
                "dashboard_links": [
                    f"https://dashboard.technova.com/{team.lower()}/metrics",
                    f"https://analytics.technova.com/{team.lower()}/reports",
                    f"https://tools.technova.com/{team.lower()}/workspace"
                ],
                "experts": [expert.person_id for expert in experts],
                "updated_at": datetime.now().isoformat()
            }
            
            starter_packs.append(starter_pack)
        
        return starter_packs


def main():
    """Main entry point."""
    # Check for config file argument
    config_path = None
    if len(sys.argv) > 1:
        config_path = sys.argv[1]
        if not os.path.exists(config_path):
            print(f"Error: Configuration file '{config_path}' not found")
            sys.exit(1)
    
    try:
        generator = SyntheticDatasetGenerator(config_path)
        generator.generate_all()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()