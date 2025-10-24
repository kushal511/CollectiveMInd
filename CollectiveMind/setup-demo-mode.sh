#!/bin/bash

# Setup CollectiveMind in Demo Mode
# This creates a working demo even if Vertex AI has access issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🎯 Setting up CollectiveMind Demo Mode"
echo "======================================"
echo ""

# Create demo .env file
create_demo_env() {
    print_status "Creating demo .env configuration..."
    
    if [ -f .env ]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it with demo configuration? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Keeping existing .env file"
            return
        fi
    fi
    
    # Update .env for demo mode
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://collectivemind:password@localhost:5432/collectivemind"

# Redis
REDIS_URL="redis://localhost:6379"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# JWT
JWT_SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'demo-secret-key-for-hackathon')"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Google Cloud Configuration (for when it works)
GOOGLE_CLOUD_PROJECT_ID="gen-lang-client-0973625306"
GOOGLE_CLOUD_LOCATION="us-central1"

# Demo Mode Configuration
DEMO_MODE="true"
USE_MOCK_AI="true"

# Vertex AI Configuration (will fallback to mock if not working)
VERTEX_AI_MODEL="gemini-pro"
EMBEDDING_MODEL="text-embedding-004"
EMBEDDING_DIMENSIONS=768

# API Configuration
API_PORT=8000
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"
LOG_FORMAT="json"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXT_PUBLIC_WS_URL="ws://localhost:8000"

# Demo Data
DEMO_SAMPLE_DATA="true"
EOF

    print_success "Demo .env file created"
}

# Create mock AI service for demo
create_mock_ai_service() {
    print_status "Creating mock AI service for demo..."
    
    mkdir -p packages/backend/src/services/mock
    
    cat > packages/backend/src/services/mock/mockAiService.ts << 'EOF'
import { EmbeddingService } from '../embeddings';

export class MockAiService implements EmbeddingService {
  private mockEmbeddings: Map<string, number[]> = new Map();
  
  constructor() {
    // Pre-populate with some demo embeddings
    this.initializeDemoEmbeddings();
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return cached embedding if exists
    if (this.mockEmbeddings.has(text)) {
      return this.mockEmbeddings.get(text)!;
    }
    
    // Generate deterministic "embedding" based on text
    const embedding = this.generateDeterministicEmbedding(text);
    this.mockEmbeddings.set(text, embedding);
    
    return embedding;
  }
  
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }
  
  private generateDeterministicEmbedding(text: string): number[] {
    // Create a 768-dimensional embedding based on text content
    const dimensions = 768;
    const embedding = new Array(dimensions);
    
    // Use text hash to generate consistent values
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Generate embedding values
    for (let i = 0; i < dimensions; i++) {
      const seed = hash + i;
      embedding[i] = (Math.sin(seed) + Math.cos(seed * 0.7)) * 0.5;
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
  
  private initializeDemoEmbeddings() {
    // Add some demo embeddings for common terms
    const demoTexts = [
      "artificial intelligence",
      "machine learning",
      "natural language processing",
      "deep learning",
      "neural networks",
      "data science",
      "hackathon project",
      "collective intelligence",
      "knowledge management",
      "semantic search"
    ];
    
    demoTexts.forEach(text => {
      this.mockEmbeddings.set(text, this.generateDeterministicEmbedding(text));
    });
  }
}

export class MockChatService {
  async generateResponse(prompt: string, context?: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Generate contextual responses based on prompt content
    if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi')) {
      return "Hello! I'm the CollectiveMind AI assistant. I'm currently running in demo mode. How can I help you explore our collective intelligence platform?";
    }
    
    if (prompt.toLowerCase().includes('search') || prompt.toLowerCase().includes('find')) {
      return "I can help you search through our knowledge base using semantic similarity. In demo mode, I'm using mock embeddings that still demonstrate the core functionality of finding related content.";
    }
    
    if (prompt.toLowerCase().includes('demo') || prompt.toLowerCase().includes('hackathon')) {
      return "This is CollectiveMind running in demo mode for the AI Accelerate Hackathon! The system showcases collective intelligence through semantic search, knowledge aggregation, and AI-powered insights. All AI features are working with mock services to ensure a smooth demo experience.";
    }
    
    if (context) {
      return `Based on the context provided, here's my analysis: The information suggests ${this.generateContextualInsight(context)}. In demo mode, I'm providing simulated but relevant responses to showcase the platform's capabilities.`;
    }
    
    return `I understand you're asking about: "${prompt}". In demo mode, I'm providing simulated responses that demonstrate how CollectiveMind processes and responds to queries using collective intelligence principles. The full system would use real Vertex AI for more sophisticated responses.`;
  }
  
  private generateContextualInsight(context: string): string {
    const insights = [
      "there are interesting patterns in the collective knowledge",
      "multiple perspectives are contributing to a richer understanding",
      "the community has valuable insights on this topic",
      "there's potential for deeper exploration of these concepts",
      "the collective intelligence is revealing new connections"
    ];
    
    // Select insight based on context length
    const index = context.length % insights.length;
    return insights[index];
  }
}
EOF

    print_success "Mock AI service created"
}

# Update embedding service to use mock in demo mode
update_embedding_service() {
    print_status "Updating embedding service for demo mode..."
    
    # Check if the file exists and backup
    if [ -f packages/backend/src/services/embeddings.ts ]; then
        cp packages/backend/src/services/embeddings.ts packages/backend/src/services/embeddings.ts.backup
        print_status "Backed up existing embeddings.ts"
    fi
    
    cat > packages/backend/src/services/embeddings.ts << 'EOF'
import { VertexAI } from '@google-cloud/vertexai';
import { MockAiService } from './mock/mockAiService';

export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class VertexAIEmbeddingService implements EmbeddingService {
  private vertexAI: VertexAI;
  private model: any;
  private mockService?: MockAiService;

  constructor() {
    // Check if we're in demo mode
    if (process.env.DEMO_MODE === 'true' || process.env.USE_MOCK_AI === 'true') {
      console.log('🎯 Running in demo mode - using mock AI service');
      this.mockService = new MockAiService();
      return;
    }

    try {
      this.vertexAI = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      });

      this.model = this.vertexAI.getGenerativeModel({
        model: process.env.EMBEDDING_MODEL || 'text-embedding-004',
      });

      console.log('✅ Vertex AI embedding service initialized');
    } catch (error) {
      console.warn('⚠️  Vertex AI initialization failed, falling back to mock service:', error);
      this.mockService = new MockAiService();
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Use mock service if available
    if (this.mockService) {
      return this.mockService.generateEmbedding(text);
    }

    try {
      const result = await this.model.embedContent({
        content: [{ role: 'user', parts: [{ text }] }],
      });

      return result.response.predictions[0].embeddings.values;
    } catch (error) {
      console.warn('Vertex AI embedding failed, using mock service:', error);
      
      // Fallback to mock service
      if (!this.mockService) {
        this.mockService = new MockAiService();
      }
      return this.mockService.generateEmbedding(text);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Use mock service if available
    if (this.mockService) {
      return this.mockService.generateEmbeddings(texts);
    }

    try {
      const batchSize = parseInt(process.env.VERTEX_AI_BATCH_SIZE || '5');
      const results: number[][] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(text => this.generateEmbedding(text))
        );
        results.push(...batchResults);

        // Rate limiting
        if (i + batchSize < texts.length) {
          const delay = parseInt(process.env.VERTEX_AI_RATE_LIMIT_DELAY || '600');
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      return results;
    } catch (error) {
      console.warn('Vertex AI batch embedding failed, using mock service:', error);
      
      // Fallback to mock service
      if (!this.mockService) {
        this.mockService = new MockAiService();
      }
      return this.mockService.generateEmbeddings(texts);
    }
  }

  // Method to check if we're using real or mock AI
  isUsingMockAI(): boolean {
    return !!this.mockService;
  }

  // Method to get service status
  getServiceStatus(): { type: 'vertex-ai' | 'mock'; ready: boolean } {
    if (this.mockService) {
      return { type: 'mock', ready: true };
    }
    return { type: 'vertex-ai', ready: !!this.model };
  }
}

// Export singleton instance
export const embeddingService = new VertexAIEmbeddingService();
EOF

    print_success "Embedding service updated for demo mode"
}

# Create demo data seeder
create_demo_data() {
    print_status "Creating demo data seeder..."
    
    mkdir -p packages/backend/src/scripts
    
    cat > packages/backend/src/scripts/seedDemoData.ts << 'EOF'
import { PrismaClient } from '@prisma/client';
import { embeddingService } from '../services/embeddings';

const prisma = new PrismaClient();

const demoKnowledgeItems = [
  {
    title: "Introduction to Collective Intelligence",
    content: "Collective intelligence refers to the enhanced capacity that results from collaboration, collective efforts, and competition among many individuals. It represents the ability of a group to solve problems that individual members cannot solve alone.",
    tags: ["collective-intelligence", "collaboration", "problem-solving"],
    author: "Demo User"
  },
  {
    title: "AI and Machine Learning Fundamentals",
    content: "Artificial Intelligence (AI) is the simulation of human intelligence in machines. Machine Learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed.",
    tags: ["ai", "machine-learning", "technology"],
    author: "Demo User"
  },
  {
    title: "Semantic Search Technologies",
    content: "Semantic search uses natural language processing and machine learning to understand the intent and contextual meaning of search queries, providing more relevant results than traditional keyword-based search.",
    tags: ["semantic-search", "nlp", "search-technology"],
    author: "Demo User"
  },
  {
    title: "Knowledge Management Systems",
    content: "Knowledge management systems help organizations capture, store, share, and effectively use knowledge. They facilitate the creation of organizational memory and enable better decision-making through collective wisdom.",
    tags: ["knowledge-management", "organizational-learning", "systems"],
    author: "Demo User"
  },
  {
    title: "Hackathon Best Practices",
    content: "Successful hackathons require clear problem definition, diverse team collaboration, rapid prototyping, and effective presentation of solutions. Focus on solving real problems with innovative approaches.",
    tags: ["hackathon", "innovation", "collaboration", "prototyping"],
    author: "Demo User"
  }
];

async function seedDemoData() {
  console.log('🌱 Seeding demo data...');
  
  try {
    // Clear existing demo data
    await prisma.knowledgeItem.deleteMany({
      where: { author: 'Demo User' }
    });
    
    // Create demo knowledge items with embeddings
    for (const item of demoKnowledgeItems) {
      console.log(`Creating: ${item.title}`);
      
      // Generate embedding for the content
      const embedding = await embeddingService.generateEmbedding(
        `${item.title} ${item.content}`
      );
      
      await prisma.knowledgeItem.create({
        data: {
          title: item.title,
          content: item.content,
          tags: item.tags,
          author: item.author,
          embedding: embedding,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    console.log('✅ Demo data seeded successfully');
    
    // Show service status
    const status = embeddingService.getServiceStatus();
    console.log(`🤖 AI Service: ${status.type} (${status.ready ? 'ready' : 'not ready'})`);
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData();
}

export { seedDemoData };
EOF

    print_success "Demo data seeder created"
}

# Create verification script
create_verification_script() {
    print_status "Creating demo verification script..."
    
    cat > verify-demo-setup.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

async function verifyDemoSetup() {
  console.log('🔍 Verifying CollectiveMind Demo Setup');
  console.log('=====================================');
  
  const prisma = new PrismaClient();
  
  try {
    // Check database connection
    console.log('\n📊 Database Connection:');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check demo data
    console.log('\n📚 Demo Data:');
    const knowledgeCount = await prisma.knowledgeItem.count({
      where: { author: 'Demo User' }
    });
    console.log(`✅ Found ${knowledgeCount} demo knowledge items`);
    
    // Check AI service
    console.log('\n🤖 AI Service:');
    const { embeddingService } = require('./packages/backend/src/services/embeddings');
    const status = embeddingService.getServiceStatus();
    console.log(`✅ AI Service: ${status.type} (${status.ready ? 'ready' : 'not ready'})`);
    
    // Test embedding generation
    console.log('\n🧠 Testing Embedding Generation:');
    const testEmbedding = await embeddingService.generateEmbedding('test query for demo');
    console.log(`✅ Generated embedding with ${testEmbedding.length} dimensions`);
    
    console.log('\n🎉 Demo Setup Verification Complete!');
    console.log('\nNext Steps:');
    console.log('1. Run: npm run dev (in packages/backend)');
    console.log('2. Run: npm run dev (in packages/frontend)');
    console.log('3. Visit: http://localhost:3000');
    console.log('\n🚀 Your CollectiveMind demo is ready!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure PostgreSQL is running');
    console.log('2. Run: npm run db:migrate');
    console.log('3. Run: npm run seed:demo');
  } finally {
    await prisma.$disconnect();
  }
}

verifyDemoSetup();
EOF

    print_success "Demo verification script created"
}

# Update package.json scripts
update_package_scripts() {
    print_status "Adding demo scripts to package.json..."
    
    # Check if package.json exists in backend
    if [ -f packages/backend/package.json ]; then
        # Add demo scripts using node
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('packages/backend/package.json', 'utf8'));
        
        if (!pkg.scripts) pkg.scripts = {};
        
        pkg.scripts['seed:demo'] = 'ts-node src/scripts/seedDemoData.ts';
        pkg.scripts['demo:verify'] = 'node ../../verify-demo-setup.js';
        pkg.scripts['demo:start'] = 'npm run db:migrate && npm run seed:demo && npm run dev';
        
        fs.writeFileSync('packages/backend/package.json', JSON.stringify(pkg, null, 2));
        console.log('✅ Demo scripts added to backend package.json');
        "
    fi
}

# Main execution
main() {
    create_demo_env
    create_mock_ai_service
    update_embedding_service
    create_demo_data
    create_verification_script
    update_package_scripts
    
    echo ""
    echo "🎉 Demo Mode Setup Complete!"
    echo "============================"
    echo ""
    echo "Configuration Summary:"
    echo "• Demo Mode: Enabled"
    echo "• Mock AI: Active"
    echo "• Fallback: Automatic"
    echo "• Demo Data: Ready"
    echo ""
    echo "Quick Start Commands:"
    echo "1. npm install (if not done)"
    echo "2. npm run db:migrate"
    echo "3. npm run seed:demo"
    echo "4. npm run dev"
    echo ""
    echo "Verification:"
    echo "• Run: node verify-demo-setup.js"
    echo ""
    echo "🚀 Your CollectiveMind demo is ready for the hackathon!"
    echo "   Even if Vertex AI has issues, everything will work with mock services."
}

# Run main function
main "$@"