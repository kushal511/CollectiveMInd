# Requirements Document

## Introduction

The Synthetic Dataset Generator is a system that creates comprehensive, realistic synthetic datasets for CollectiveMind, an organizational memory graph built on Elastic + Vertex AI. The system generates production-like data including organizational structures, documents, communications, metrics, and knowledge graphs to enable demonstration of hybrid search, role-aware retrieval, cross-team insights, and conversational summaries.

## Glossary

- **CollectiveMind**: An organizational memory graph application built on Elastic + Vertex AI/Gemini
- **Synthetic Dataset Generator**: The system that creates realistic fake organizational data
- **TechNova Inc**: The fictional company used as the basis for generated data
- **Knowledge Graph**: A network of interconnected organizational entities (people, documents, topics, teams)
- **JSONL**: JSON Lines format where each line contains a valid JSON object
- **ACL**: Access Control List defining permissions for resources
- **Serendipity Insights**: Cross-team connections and overlaps discovered through data analysis
- **Starter Pack**: Curated onboarding resources for new team members

## Requirements

### Requirement 1

**User Story:** As a CollectiveMind developer, I want to generate a complete organizational dataset, so that I can demonstrate the system's capabilities with realistic data.

#### Acceptance Criteria

1. THE Synthetic Dataset Generator SHALL create a fictional company "TechNova Inc" with exactly 5 departments: Marketing, Product, Engineering, Finance, HR
2. THE Synthetic Dataset Generator SHALL generate exactly 25 synthetic employees with complete profiles including person_id, full_name, email, role_title, team, manager_id, skills, tenure_months, active status, previous_teams, and timezone
3. THE Synthetic Dataset Generator SHALL ensure 3 employees have manager roles and some employees have changed teams within the past 12 months
4. THE Synthetic Dataset Generator SHALL output employee data in people.jsonl format with valid UTF-8 encoding
5. THE Synthetic Dataset Generator SHALL generate no personally identifiable information beyond synthetic names and emails

### Requirement 2

**User Story:** As a CollectiveMind developer, I want to generate diverse document types across teams, so that I can test knowledge retrieval and cross-team insights.

#### Acceptance Criteria

1. THE Synthetic Dataset Generator SHALL create exactly 160 documents distributed across all 5 teams
2. THE Synthetic Dataset Generator SHALL generate documents with fields: doc_id, title, content, team, author_person_id, co_authors, tags, created_at, updated_at, status, visibility, source_type, language, confidentiality, related_doc_ids
3. THE Synthetic Dataset Generator SHALL create 12 temporal document versions with version trails showing content evolution
4. THE Synthetic Dataset Generator SHALL include 5 non-English documents with appropriate language field values
5. THE Synthetic Dataset Generator SHALL output document data in documents.jsonl and document_versions.jsonl formats

### Requirement 3

**User Story:** As a CollectiveMind developer, I want to generate realistic communication data, so that I can test chat analysis and cross-team collaboration insights.

#### Acceptance Criteria

1. THE Synthetic Dataset Generator SHALL create exactly 220 chat threads across team channels and cross-team discussions
2. THE Synthetic Dataset Generator SHALL generate 2200-2800 chat messages with fields: message_id, thread_id, sender_person_id, timestamp, text, emotions, mentions, doc_refs, action_items
3. THE Synthetic Dataset Generator SHALL include 25 cases of team duplication where teams discuss the same topic unaware of each other
4. THE Synthetic Dataset Generator SHALL create 20 emotionally charged message threads with emotions including frustrated, confused, urgent, optimistic, calm
5. THE Synthetic Dataset Generator SHALL output communication data in chat_threads.jsonl and chat_messages.jsonl formats

### Requirement 4

**User Story:** As a CollectiveMind developer, I want to generate analytical metrics data, so that I can test dashboard integration and reporting features.

#### Acceptance Criteria

1. THE Synthetic Dataset Generator SHALL create 5 CSV metric tables: marketing_metrics.csv, product_adoption.csv, customer_churn.csv, finance_kpis.csv, hr_analytics.csv
2. THE Synthetic Dataset Generator SHALL include 18 months of monthly data plus recent weekly data slices in each CSV
3. THE Synthetic Dataset Generator SHALL generate realistic field names and values appropriate for each business function
4. THE Synthetic Dataset Generator SHALL ensure all CSV data uses consistent date formats and realistic value ranges
5. THE Synthetic Dataset Generator SHALL create data that supports cross-team analytical insights

### Requirement 5

**User Story:** As a CollectiveMind developer, I want to generate knowledge graph relationships, so that I can test serendipity insights and organizational connections.

#### Acceptance Criteria

1. THE Synthetic Dataset Generator SHALL create at least 2500 knowledge graph edges with types: VIEWED, AUTHORED, MENTIONED, CO_OCCURS_WITH, SIMILAR_TOPIC, TEAM_OVERLAP, REPLACES, VERSION_OF, ASKED_ABOUT, WORKED_WITH
2. THE Synthetic Dataset Generator SHALL generate edges connecting entities of types: PERSON, DOC, TOPIC, TEAM, THREAD
3. THE Synthetic Dataset Generator SHALL create approximately 60 topics with topic_id, name, aliases, emerging_score, and related_topic_ids
4. THE Synthetic Dataset Generator SHALL generate 15-25 cross-team overlap insights with supporting evidence
5. THE Synthetic Dataset Generator SHALL output graph data in knowledge_graph_edges.jsonl, topics.jsonl, and overlaps.jsonl formats

### Requirement 6

**User Story:** As a CollectiveMind developer, I want to generate meeting summaries and organizational briefs, so that I can test summary generation and organizational awareness features.

#### Acceptance Criteria

1. THE Synthetic Dataset Generator SHALL create exactly 30 meeting summaries with attendees, decisions, follow-ups, and team dependencies
2. THE Synthetic Dataset Generator SHALL generate 12 weekly organizational briefs and 5 team-specific briefs
3. THE Synthetic Dataset Generator SHALL include "what changed since last week" and "suggested connections" in briefs
4. THE Synthetic Dataset Generator SHALL create 5 onboarding starter packs with curated resources for each team
5. THE Synthetic Dataset Generator SHALL output meeting and brief data in meetings.jsonl, weekly_briefs.jsonl, and starter_packs.jsonl formats

### Requirement 7

**User Story:** As a CollectiveMind developer, I want to generate access control and permission data, so that I can test security and privacy features.

#### Acceptance Criteria

1. THE Synthetic Dataset Generator SHALL create ACL entries for documents, threads, and starter packs with allow/deny permissions
2. THE Synthetic Dataset Generator SHALL generate 10 restricted documents visible only to Finance team
3. THE Synthetic Dataset Generator SHALL create 3 mis-permissioned documents with acl_warning flags for testing
4. THE Synthetic Dataset Generator SHALL include visibility levels: public, internal, restricted across all content
5. THE Synthetic Dataset Generator SHALL output permission data in acls.jsonl format

### Requirement 8

**User Story:** As a CollectiveMind developer, I want to generate user interaction events, so that I can test personalization and recommendation features.

#### Acceptance Criteria

1. THE Synthetic Dataset Generator SHALL create approximately 80 user events focusing on 3 demo personas: Maya (Product), Rahul (Marketing), Priya (New Hire)
2. THE Synthetic Dataset Generator SHALL generate events with types: VIEWED, SEARCHED, CLICKED including timestamps and resource references
3. THE Synthetic Dataset Generator SHALL create interaction patterns that support "continue where you left off" functionality
4. THE Synthetic Dataset Generator SHALL generate search queries and click patterns realistic for each persona's role
5. THE Synthetic Dataset Generator SHALL output interaction data in user_events.jsonl format

### Requirement 9

**User Story:** As a CollectiveMind developer, I want all generated data to follow consistent formatting and quality standards, so that it can be reliably ingested into the system.

#### Acceptance Criteria

1. THE Synthetic Dataset Generator SHALL use ISO-8601 timestamp format with timezone for all temporal data
2. THE Synthetic Dataset Generator SHALL ensure all person_id and doc_id references are valid and exist in their respective files
3. THE Synthetic Dataset Generator SHALL generate only synthetic content with no copied real text or PII
4. THE Synthetic Dataset Generator SHALL create a manifest.json file documenting all generated files, record counts, and data ranges
5. THE Synthetic Dataset Generator SHALL validate that all JSONL files contain valid UTF-8 encoded JSON objects

### Requirement 10

**User Story:** As a CollectiveMind developer, I want the dataset to include realistic edge cases and conflicts, so that I can test system robustness and error handling.

#### Acceptance Criteria

1. THE Synthetic Dataset Generator SHALL create conflicting conclusions across teams about the same metrics
2. THE Synthetic Dataset Generator SHALL generate duplicate efforts where multiple teams analyze the same problems
3. THE Synthetic Dataset Generator SHALL include document version trails showing conclusion reversals over time
4. THE Synthetic Dataset Generator SHALL create near-duplicate documents with slight differences for deduplication testing
5. THE Synthetic Dataset Generator SHALL generate emotionally charged content and outdated documents for realistic organizational dynamics