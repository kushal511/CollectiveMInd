# CollectiveMind - Organizational Memory Platform

A comprehensive organizational memory platform that demonstrates Elastic hybrid search capabilities combined with Vertex AI/Gemini intelligence. This application serves as a complete demo platform showcasing intelligent search, AI-powered insights, and cross-team collaboration discovery.

## 🏗️ Architecture

- **Frontend**: Next.js 14 with React 18, TypeScript, and Tailwind CSS
- **Backend**: Node.js with Express.js, TypeScript, and Socket.io
- **Search**: Elasticsearch 8.x with hybrid search (keyword + semantic)
- **AI**: Google Cloud Vertex AI and Gemini for embeddings and conversational AI
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and caching
- **Infrastructure**: Docker containers with Docker Compose for local development

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Google Cloud account with Vertex AI enabled

### Installation

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd collectivemind-app
   npm install
   ```

2. **Environment configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development environment:**
   ```bash
   # Start all services with Docker Compose
   docker-compose up -d
   
   # Or run frontend and backend separately
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Elasticsearch: http://localhost:9200
   - PostgreSQL: localhost:5432

## 📁 Project Structure

```
collectivemind-app/
├── packages/
│   ├── frontend/          # Next.js React application
│   │   ├── src/
│   │   │   ├── app/       # App Router pages
│   │   │   ├── components/ # React components
│   │   │   ├── hooks/     # Custom React hooks
│   │   │   ├── services/  # API services
│   │   │   └── types/     # TypeScript types
│   │   └── Dockerfile
│   └── backend/           # Express.js API server
│       ├── src/
│       │   ├── routes/    # API routes
│       │   ├── services/  # Business logic
│       │   ├── models/    # Data models
│       │   ├── middleware/ # Express middleware
│       │   └── utils/     # Utilities
│       └── Dockerfile
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml     # Local development setup
└── README.md
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend

# Building
npm run build           # Build all packages
npm run type-check      # TypeScript type checking

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm test               # Run tests
```

### Code Quality

The project includes comprehensive code quality tools:

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Husky**: Git hooks for pre-commit checks
- **GitHub Actions**: Automated CI/CD pipeline

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose up --build
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Database
DATABASE_URL="postgresql://collectivemind:password@localhost:5432/collectivemind"

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
VERTEX_AI_ENDPOINT="your-vertex-ai-endpoint"

# API Configuration
JWT_SECRET="your-super-secret-jwt-key"
CORS_ORIGIN="http://localhost:3000"
```

### Google Cloud Setup

#### Prerequisites
1. **Google Cloud Account**: Create an account at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud CLI**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)

#### Quick Setup
Run the automated setup script:
```bash
cd packages/backend
./scripts/setup-gcloud.sh
```

#### Manual Setup
1. **Create/Select Project**:
   ```bash
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   ```

2. **Enable Required APIs**:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable vertexai.googleapis.com
   ```

3. **Authentication** (choose one):
   
   **For Development** (recommended):
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```
   
   **For Production**:
   ```bash
   # Create service account
   gcloud iam service-accounts create collectivemind-sa
   
   # Grant necessary permissions
   gcloud projects add-iam-policy-binding your-project-id \
     --member="serviceAccount:collectivemind-sa@your-project-id.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   
   # Create and download key
   gcloud iam service-accounts keys create key.json \
     --iam-account=collectivemind-sa@your-project-id.iam.gserviceaccount.com
   ```

4. **Update Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your project details
   ```

#### Embedding Model Information
- **Model**: `text-embedding-004`
- **Dimensions**: 768
- **Rate Limits**: 100 requests/minute
- **Batch Size**: 5 texts per batch
- **Cost**: ~$0.00025 per 1K tokens

#### Troubleshooting
- **Authentication Issues**: Run `gcloud auth list` to check active accounts
- **API Not Enabled**: Verify APIs are enabled with `gcloud services list --enabled`
- **Quota Exceeded**: Check quotas in Google Cloud Console
- **Invalid Project**: Verify project ID with `gcloud config get-value project`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Production Build

```bash
# Build for production
npm run build

# Build Docker images
docker build -f packages/frontend/Dockerfile -t collectivemind-frontend .
docker build -f packages/backend/Dockerfile -t collectivemind-backend .
```

### CI/CD Pipeline

The project includes a comprehensive GitHub Actions pipeline:

- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Testing**: Unit tests, integration tests
- **Security**: Dependency scanning, vulnerability checks
- **Build**: Docker image creation
- **Deploy**: Automated deployment (configure as needed)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api/docs` when running locally

---

Built with ❤️ for the Google Cloud + Elastic hackathon