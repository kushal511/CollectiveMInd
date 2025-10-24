#!/bin/bash

# Setup Google AI (Gemini) as alternative to Vertex AI
# This uses API keys instead of service accounts

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

echo "🤖 Setting up Google AI (Gemini) Alternative"
echo "============================================="
echo ""

print_status "Google AI uses API keys instead of service accounts"
print_status "This is often easier to set up than Vertex AI"
echo ""

# Install Google AI SDK
print_status "Installing Google AI SDK..."
npm install @google/generative-ai

# Create Google AI service
print_status "Creating Google AI service..."

mkdir -p packages/backend/src/services/google-ai

cat > packages/backend/src/services/google-ai/googleAiService.ts << 'EOF'
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GoogleAIService {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: any;
  private chatModel: any;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Initialize models
    this.chatModel = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'embedding-001' });
    
    console.log('✅ Google AI service initialized');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Google AI embedding failed:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    try {
      const fullPrompt = context 
        ? `Context: ${context}\n\nQuestion: ${prompt}`
        : prompt;
        
      const result = await this.chatModel.generateContent(fullPrompt);
      return result.response.text();
    } catch (error) {
      console.error('Google AI chat failed:', error);
      throw error;
    }
  }

  getServiceStatus(): { type: 'google-ai'; ready: boolean } {
    return { type: 'google-ai', ready: !!this.genAI };
  }
}
EOF

print_success "Google AI service created"

# Update the main embedding service to include Google AI option
print_status "Updating embedding service to support Google AI..."

cat > packages/backend/src/services/embeddings.ts << 'EOF'
import { VertexAI } from '@google-cloud/vertexai';
import { MockAiService } from './mock/mockAiService';
import { GoogleAIService } from './google-ai/googleAiService';

export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class HybridEmbeddingService implements EmbeddingService {
  private vertexAI?: VertexAI;
  private googleAI?: GoogleAIService;
  private mockService?: MockAiService;
  private activeService: 'vertex-ai' | 'google-ai' | 'mock' = 'mock';

  constructor() {
    this.initializeServices();
  }

  private async initializeServices() {
    // Check if we're in demo mode
    if (process.env.DEMO_MODE === 'true' || process.env.USE_MOCK_AI === 'true') {
      console.log('🎯 Running in demo mode - using mock AI service');
      this.mockService = new MockAiService();
      this.activeService = 'mock';
      return;
    }

    // Try Google AI first (often more accessible)
    if (process.env.GOOGLE_AI_API_KEY) {
      try {
        this.googleAI = new GoogleAIService();
        this.activeService = 'google-ai';
        console.log('✅ Using Google AI service');
        return;
      } catch (error) {
        console.warn('⚠️  Google AI initialization failed:', error.message);
      }
    }

    // Try Vertex AI as fallback
    try {
      this.vertexAI = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      });
      this.activeService = 'vertex-ai';
      console.log('✅ Using Vertex AI service');
      return;
    } catch (error) {
      console.warn('⚠️  Vertex AI initialization failed:', error.message);
    }

    // Final fallback to mock service
    console.log('🎯 Falling back to mock AI service');
    this.mockService = new MockAiService();
    this.activeService = 'mock';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    switch (this.activeService) {
      case 'google-ai':
        if (this.googleAI) {
          try {
            return await this.googleAI.generateEmbedding(text);
          } catch (error) {
            console.warn('Google AI failed, falling back to mock:', error);
            return this.getMockService().generateEmbedding(text);
          }
        }
        break;
        
      case 'vertex-ai':
        if (this.vertexAI) {
          try {
            return await this.generateVertexAIEmbedding(text);
          } catch (error) {
            console.warn('Vertex AI failed, falling back to mock:', error);
            return this.getMockService().generateEmbedding(text);
          }
        }
        break;
        
      case 'mock':
      default:
        return this.getMockService().generateEmbedding(text);
    }
    
    return this.getMockService().generateEmbedding(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }

  private async generateVertexAIEmbedding(text: string): Promise<number[]> {
    // Vertex AI embedding implementation
    const { PredictionServiceClient } = require('@google-cloud/aiplatform');
    const client = new PredictionServiceClient();
    
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/textembedding-gecko@003`;
    
    const instances = [{ content: text }];
    const request = { endpoint, instances };
    
    const [response] = await client.predict(request);
    
    if (response.predictions && response.predictions[0] && response.predictions[0].embeddings) {
      return response.predictions[0].embeddings.values;
    } else {
      throw new Error('Invalid Vertex AI embedding response');
    }
  }

  private getMockService(): MockAiService {
    if (!this.mockService) {
      this.mockService = new MockAiService();
    }
    return this.mockService;
  }

  // Method to check which service is active
  getServiceStatus(): { type: 'vertex-ai' | 'google-ai' | 'mock'; ready: boolean } {
    return { type: this.activeService, ready: true };
  }

  isUsingMockAI(): boolean {
    return this.activeService === 'mock';
  }
}

// Export singleton instance
export const embeddingService = new HybridEmbeddingService();
EOF

print_success "Hybrid embedding service created"

# Update .env file
print_status "Updating .env configuration..."

if ! grep -q "GOOGLE_AI_API_KEY" .env; then
    echo "" >> .env
    echo "# Google AI Configuration (alternative to Vertex AI)" >> .env
    echo "# Get your API key from: https://makersuite.google.com/app/apikey" >> .env
    echo "GOOGLE_AI_API_KEY=\"\"" >> .env
fi

cp .env packages/backend/.env

print_success ".env updated"

echo ""
echo "🎉 Google AI Setup Complete!"
echo "============================"
echo ""
echo "📋 Next Steps:"
echo "1. Get a Google AI API key from: https://makersuite.google.com/app/apikey"
echo "2. Add it to your .env file: GOOGLE_AI_API_KEY=\"your-key-here\""
echo "3. Test with: node test-google-ai.js"
echo ""
echo "🔄 Service Priority:"
echo "1. Google AI (if API key provided)"
echo "2. Vertex AI (if available)"
echo "3. Mock AI (always available)"
echo ""
echo "This gives you real AI responses even if Vertex AI isn't accessible!"

# Create test script for Google AI
cat > test-google-ai.js << 'EOF'
require('dotenv').config();

async function testGoogleAI() {
  console.log('🧪 Testing Google AI');
  console.log('====================');
  console.log('');
  
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.log('❌ GOOGLE_AI_API_KEY not found in .env file');
    console.log('');
    console.log('📋 To get an API key:');
    console.log('1. Visit: https://makersuite.google.com/app/apikey');
    console.log('2. Create a new API key');
    console.log('3. Add to .env: GOOGLE_AI_API_KEY="your-key-here"');
    return;
  }
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    
    // Test chat
    console.log('🤖 Testing Chat...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello! Can you respond with a simple greeting?');
    console.log('✅ Chat successful');
    console.log('Response:', result.response.text());
    
    console.log('');
    console.log('🎉 Google AI is working!');
    console.log('Your CollectiveMind can now use real AI responses.');
    
  } catch (error) {
    console.error('❌ Google AI test failed:', error.message);
    console.log('');
    console.log('🔧 Check:');
    console.log('1. API key is correct');
    console.log('2. API key has proper permissions');
    console.log('3. Internet connection is working');
  }
}

testGoogleAI();
EOF

print_success "Google AI test script created"
echo ""
echo "🚀 Run 'node test-google-ai.js' after adding your API key!"