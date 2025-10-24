# CollectiveMind Architecture Documentation

## System Overview

CollectiveMind is a cloud-native AI-powered organizational knowledge platform that combines Elasticsearch hybrid search with Google Cloud AI services to create an intelligent memory system for teams.

## High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend<br/>Next.js 14<br/>Tailwind CSS<br/>Dark Theme]
        B[Mobile App<br/>Future]
    end
    
    subgraph "API Gateway & Load Balancer"
        C[Express.js API Gateway<br/>Rate Limiting<br/>CORS<br/>Authentication]
    end
    
    subgraph "Backend Services Layer"
        D[Search Service<br/>Hybrid Search<br/>Elasticsearch Integration]
        E[AI Chat Service<br/>Google AI Integration<br/>Context Management]
        F[Embedding Service<br/>Vector Generation<br/>Semantic Search]
        G[User Service<br/>Authentication<br/>Authorization]
        H[Analytics Service<br/>Usage Tracking<br/>Performance Metrics]
        I[WebSocket Service<br/>Real-time Updates<br/>Live Collaboration]
    end
    
    subgraph "Data Storage Layer"
        J[Elasticsearch Cluster<br/>Hybrid Search Index<br/>Vector Storage<br/>Full-text Search]
        K[PostgreSQL/SQLite<br/>User Data<br/>Metadata<br/>Relationships]
        L[Redis Cache<br/>Session Storage<br/>Real-time Data<br/>Rate Limiting]
    end
    
    subgraph "AI & ML Services"
        M[Google AI<br/>Gemini 2.5 Flash<br/>Text Generation<br/>Conversational AI]
        N[Vertex AI<br/>Text Embeddings<br/>Semantic Vectors<br/>ML Models]
        O[Mock AI Service<br/>Development Fallback<br/>Demo Mode]
    end
    
    subgraph "External Integrations"
        P[MCP Servers<br/>Collaboration<br/>Analytics<br/>Knowledge Graph]
        Q[File Storage<br/>Document Processing<br/>Asset Management]
    end
    
    subgraph "Infrastructure & Monitoring"
        R[Docker Containers<br/>Microservices<br/>Scalable Deployment]
        S[Monitoring & Logging<br/>Winston Logger<br/>Performance Tracking]
        T[Security Layer<br/>JWT Authentication<br/>RBAC<br/>Data Encryption]
    end

    %% Client Connections
    A --> C
    B --> C
    
    %% API Gateway to Services
    C --> D
    C --> E
    C --> F
    C --> G
    C --> H
    C --> I
    
    %% Service to Data Connections
    D --> J
    D --> L
    E --> K
    E --> L
    F --> J
    G --> K
    H --> L
    I --> L
    
    %% AI Service Connections
    E --> M
    E --> N
    E --> O
    F --> M
    F --> N
    F --> O
    
    %% External Integrations
    E --> P
    D --> Q
    
    %% Infrastructure
    D --> R
    E --> R
    F --> R
    G --> R
    H --> R
    I --> R
    
    %% Monitoring
    C --> S
    D --> S
    E --> S
    F --> S
    G --> S
    H --> S
    I --> S
    
    %% Security
    C --> T
    G --> T
    K --> T
    L --> T

    %% Styling
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef ai fill:#fff3e0
    classDef infra fill:#fce4ec
    
    class A,B frontend
    class C,D,E,F,G,H,I backend
    class J,K,L data
    class M,N,O ai
    class P,Q,R,S,T infra
```

## Detailed Component Architecture

### Frontend Architecture

```mermaid
graph TB
    subgraph "Frontend Application (Next.js 14)"
        A1[App Router<br/>Pages & Layouts]
        A2[Components Layer]
        A3[Services Layer]
        A4[State Management]
        A5[UI/UX Layer]
    end
    
    subgraph "Component Structure"
        B1[Search Components<br/>SearchBar<br/>SearchResults<br/>FilterPanel]
        B2[Chat Components<br/>ChatInterface<br/>MessageBubble<br/>ConversationHistory]
        B3[Dashboard Components<br/>PersonaDashboard<br/>SerendipityPanel<br/>ActivityFeed]
        B4[Layout Components<br/>Navigation<br/>Sidebar<br/>Header]
    end
    
    subgraph "Services & Hooks"
        C1[API Service<br/>HTTP Client<br/>WebSocket Client]
        C2[Custom Hooks<br/>useSearch<br/>useAI<br/>useAuth]
        C3[State Management<br/>React Query<br/>Context API]
    end
    
    subgraph "Styling & Theme"
        D1[Tailwind CSS<br/>Dark Theme<br/>Responsive Design]
        D2[Component Library<br/>Reusable UI<br/>Design System]
    end

    A1 --> A2
    A2 --> B1
    A2 --> B2
    A2 --> B3
    A2 --> B4
    
    A3 --> C1
    A3 --> C2
    A4 --> C3
    
    A5 --> D1
    A5 --> D2
```

### Backend Services Architecture

```mermaid
graph TB
    subgraph "API Layer"
        A1[Express.js Server<br/>Port 8000]
        A2[Route Handlers<br/>/api/search<br/>/api/chat<br/>/api/ingestion]
        A3[Middleware Stack<br/>Auth<br/>CORS<br/>Rate Limiting]
    end
    
    subgraph "Core Services"
        B1[Search Service<br/>Hybrid Search Logic<br/>Result Ranking<br/>Personalization]
        B2[AI Chat Service<br/>Conversation Management<br/>Context Handling<br/>Response Generation]
        B3[Embedding Service<br/>Vector Generation<br/>Semantic Similarity<br/>Batch Processing]
        B4[User Service<br/>Authentication<br/>Profile Management<br/>Permissions]
    end
    
    subgraph "Data Access Layer"
        C1[Elasticsearch Client<br/>Search Queries<br/>Index Management<br/>Aggregations]
        C2[Database Client<br/>Prisma ORM<br/>Query Builder<br/>Migrations]
        C3[Redis Client<br/>Caching<br/>Session Storage<br/>Pub/Sub]
    end
    
    subgraph "AI Integration Layer"
        D1[Google AI Client<br/>Gemini API<br/>Text Generation]
        D2[Vertex AI Client<br/>Embedding Models<br/>ML Services]
        D3[Hybrid AI Manager<br/>Fallback Logic<br/>Service Selection]
    end

    A1 --> A2
    A2 --> A3
    A2 --> B1
    A2 --> B2
    A2 --> B3
    A2 --> B4
    
    B1 --> C1
    B2 --> C2
    B2 --> C3
    B3 --> C1
    B4 --> C2
    
    B2 --> D1
    B2 --> D2
    B3 --> D1
    B3 --> D2
    D1 --> D3
    D2 --> D3
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as API Gateway
    participant S as Search Service
    participant AI as AI Chat Service
    participant ES as Elasticsearch
    participant DB as Database
    participant G as Google AI
    
    Note over U,G: Search Flow
    U->>F: Enter search query
    F->>API: POST /api/search
    API->>S: Process search request
    S->>ES: Hybrid search query
    ES-->>S: Search results
    S->>DB: Get metadata
    DB-->>S: User context
    S-->>API: Ranked results
    API-->>F: Search response
    F-->>U: Display results
    
    Note over U,G: Chat Flow
    U->>F: Send chat message
    F->>API: POST /api/chat/message
    API->>AI: Process message
    AI->>S: Search for context
    S->>ES: Find relevant docs
    ES-->>S: Context documents
    S-->>AI: Search results
    AI->>G: Generate response
    G-->>AI: AI response
    AI->>DB: Store conversation
    DB-->>AI: Confirmation
    AI-->>API: Chat response
    API-->>F: Response with citations
    F-->>U: Display AI response
```

### Elasticsearch Index Architecture

```mermaid
graph TB
    subgraph "Elasticsearch Cluster"
        A[knowledge_items Index<br/>Primary Content]
        B[collectivemind-messages Index<br/>Chat History]
        C[collectivemind-people Index<br/>User Profiles]
        D[collectivemind-topics Index<br/>Topic Taxonomy]
    end
    
    subgraph "knowledge_items Schema"
        A1[Document Fields<br/>• title (text)<br/>• content (text)<br/>• summary (text)<br/>• tags (keyword)<br/>• category (keyword)<br/>• author (keyword)]
        A2[Vector Fields<br/>• embedding (dense_vector)<br/>• dimensions: 768<br/>• similarity: cosine]
        A3[Metadata Fields<br/>• created_at (date)<br/>• updated_at (date)<br/>• views (integer)<br/>• relevance_score (float)]
    end
    
    subgraph "Search Capabilities"
        B1[Hybrid Search<br/>• Keyword matching (BM25)<br/>• Semantic similarity<br/>• Result fusion (RRF)]
        B2[Aggregations<br/>• Team facets<br/>• Category filters<br/>• Time ranges<br/>• Content types]
        B3[Suggestions<br/>• Auto-complete<br/>• Query suggestions<br/>• Related topics]
    end

    A --> A1
    A --> A2
    A --> A3
    
    A --> B1
    A --> B2
    A --> B3
```

### AI Service Architecture

```mermaid
graph TB
    subgraph "AI Service Layer"
        A[Hybrid AI Manager<br/>Service Selection<br/>Fallback Logic]
    end
    
    subgraph "Google AI Integration"
        B1[Google Generative AI<br/>Gemini 2.5 Flash]
        B2[Text Generation<br/>Conversational AI<br/>Context Understanding]
        B3[API Key Authentication<br/>Rate Limiting<br/>Error Handling]
    end
    
    subgraph "Vertex AI Integration"
        C1[Vertex AI Client<br/>Google Cloud Project]
        C2[Embedding Models<br/>text-embedding-004<br/>Vector Generation]
        C3[Service Account Auth<br/>Project Permissions<br/>Regional Deployment]
    end
    
    subgraph "Mock AI Service"
        D1[Development Fallback<br/>Demo Mode<br/>Deterministic Responses]
        D2[Mock Embeddings<br/>Consistent Vectors<br/>Similarity Simulation]
        D3[Response Templates<br/>Context-aware Replies<br/>Error Simulation]
    end
    
    subgraph "AI Capabilities"
        E1[Intent Analysis<br/>Query Understanding<br/>Context Extraction]
        E2[Response Generation<br/>Citation Integration<br/>Contextual Answers]
        E3[Embedding Generation<br/>Semantic Vectors<br/>Similarity Search]
        E4[Conversation Management<br/>Context Preservation<br/>Multi-turn Dialogue]
    end

    A --> B1
    A --> C1
    A --> D1
    
    B1 --> B2
    B1 --> B3
    
    C1 --> C2
    C1 --> C3
    
    D1 --> D2
    D1 --> D3
    
    A --> E1
    A --> E2
    A --> E3
    A --> E4
```

### Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        A1[JWT Tokens<br/>Access & Refresh<br/>15min / 7day expiry]
        A2[User Sessions<br/>Redis Storage<br/>Session Management]
        A3[Role-Based Access<br/>User/Moderator/Admin<br/>Permission Matrix]
    end
    
    subgraph "API Security"
        B1[Rate Limiting<br/>100 req/15min<br/>IP-based throttling]
        B2[CORS Policy<br/>Origin validation<br/>Credential handling]
        B3[Input Validation<br/>Zod schemas<br/>Sanitization]
        B4[Security Headers<br/>Helmet.js<br/>CSP/HSTS]
    end
    
    subgraph "Data Security"
        C1[Database Encryption<br/>At-rest encryption<br/>Connection security]
        C2[API Key Management<br/>Environment variables<br/>Secret rotation]
        C3[PII Protection<br/>Data anonymization<br/>GDPR compliance]
    end
    
    subgraph "Infrastructure Security"
        D1[Container Security<br/>Docker best practices<br/>Minimal attack surface]
        D2[Network Security<br/>VPC isolation<br/>Firewall rules]
        D3[Monitoring & Auditing<br/>Access logs<br/>Security events]
    end

    A1 --> A2
    A2 --> A3
    
    B1 --> B2
    B2 --> B3
    B3 --> B4
    
    C1 --> C2
    C2 --> C3
    
    D1 --> D2
    D2 --> D3
```

### Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        A1[Local Development<br/>Docker Compose<br/>Hot Reload]
        A2[SQLite Database<br/>Local Redis<br/>Local Elasticsearch]
        A3[Mock AI Services<br/>Development APIs<br/>Test Data]
    end
    
    subgraph "Production Environment"
        B1[Container Orchestration<br/>Kubernetes/Docker Swarm<br/>Auto-scaling]
        B2[Load Balancer<br/>NGINX/HAProxy<br/>SSL Termination]
        B3[Microservices<br/>Service Mesh<br/>Health Checks]
    end
    
    subgraph "Data Layer - Production"
        C1[PostgreSQL Cluster<br/>High Availability<br/>Read Replicas]
        C2[Elasticsearch Cluster<br/>Multi-node setup<br/>Index sharding]
        C3[Redis Cluster<br/>Persistence<br/>Failover]
    end
    
    subgraph "Cloud Services"
        D1[Google Cloud Platform<br/>Vertex AI<br/>Cloud Storage]
        D2[Monitoring Stack<br/>Prometheus/Grafana<br/>Log Aggregation]
        D3[CI/CD Pipeline<br/>GitHub Actions<br/>Automated Testing]
    end

    A1 --> A2
    A2 --> A3
    
    B1 --> B2
    B2 --> B3
    
    B3 --> C1
    B3 --> C2
    B3 --> C3
    
    B1 --> D1
    B2 --> D2
    B3 --> D3
```

## Technology Stack Summary

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Dark Theme
- **State Management**: React Query + Context API
- **Real-time**: Socket.io Client
- **Build Tool**: Webpack (Next.js built-in)

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Authentication**: JWT
- **Logging**: Winston
- **Process Management**: PM2/Docker

### Data Stack
- **Search Engine**: Elasticsearch 8.x
- **Primary Database**: PostgreSQL (SQLite for demo)
- **Cache/Sessions**: Redis
- **Vector Storage**: Elasticsearch dense_vector
- **File Storage**: Local/Cloud Storage

### AI/ML Stack
- **Primary AI**: Google AI (Gemini 2.5 Flash)
- **Embeddings**: Vertex AI (text-embedding-004)
- **Fallback**: Mock AI Service
- **Vector Similarity**: Cosine similarity
- **Context Management**: Custom conversation handling

### Infrastructure Stack
- **Containerization**: Docker
- **Orchestration**: Kubernetes (production)
- **Monitoring**: Winston + Custom metrics
- **Security**: Helmet.js, CORS, Rate limiting
- **CI/CD**: GitHub Actions
- **Cloud**: Google Cloud Platform

## Key Architectural Decisions

### 1. Hybrid Search Architecture
- **Decision**: Combine keyword (BM25) and semantic (vector) search
- **Rationale**: Provides both precise matches and contextual understanding
- **Implementation**: Elasticsearch with dense_vector fields + RRF fusion

### 2. AI Service Abstraction
- **Decision**: Create hybrid AI service with multiple providers
- **Rationale**: Ensures reliability and allows graceful fallbacks
- **Implementation**: Google AI → Vertex AI → Mock AI fallback chain

### 3. Microservices with Shared Database
- **Decision**: Separate services but shared data layer
- **Rationale**: Balance between modularity and data consistency
- **Implementation**: Service-oriented architecture with Prisma ORM

### 4. Real-time Capabilities
- **Decision**: WebSocket integration for live updates
- **Rationale**: Enable collaborative features and real-time search
- **Implementation**: Socket.io with Redis pub/sub

### 5. Dark Theme First
- **Decision**: Default to dark theme with light theme support
- **Rationale**: Modern UX preference and reduced eye strain
- **Implementation**: Tailwind CSS with class-based theme switching

This architecture provides a scalable, maintainable, and feature-rich platform for organizational knowledge management with AI-powered search and collaboration capabilities.