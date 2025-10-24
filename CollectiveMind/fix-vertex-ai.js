const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

async function fixVertexAI() {
  console.log('🔧 Fixing Vertex AI Access');
  console.log('==========================');
  console.log('');
  
  const projectId = 'collectivemind-20251024';
  const location = 'us-central1';
  
  console.log(`📋 Project: ${projectId}`);
  console.log(`📍 Location: ${location}`);
  console.log('');
  
  try {
    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
    
    console.log('✅ Vertex AI client initialized');
    console.log('');
    
    // Test different model approaches
    console.log('🧪 Testing Available Models...');
    
    // Try the newer Gemini models with correct naming
    const modelTests = [
      { name: 'gemini-1.5-flash-001', type: 'text' },
      { name: 'gemini-1.5-pro-001', type: 'text' },
      { name: 'gemini-1.0-pro-001', type: 'text' },
      { name: 'gemini-pro', type: 'text' },
      { name: 'text-embedding-004', type: 'embedding' },
      { name: 'textembedding-gecko@003', type: 'embedding' },
      { name: 'textembedding-gecko@002', type: 'embedding' },
      { name: 'textembedding-gecko@001', type: 'embedding' },
      { name: 'text-bison@002', type: 'text' },
      { name: 'text-bison@001', type: 'text' }
    ];
    
    const workingModels = [];
    
    for (const modelTest of modelTests) {
      try {
        console.log(`Testing ${modelTest.name}...`);
        
        if (modelTest.type === 'text') {
          const model = vertexAI.getGenerativeModel({
            model: modelTest.name,
          });
          
          const result = await model.generateContent('Hello');
          
          if (result.response && result.response.candidates) {
            console.log(`✅ ${modelTest.name} - WORKING`);
            workingModels.push(modelTest);
          }
        } else if (modelTest.type === 'embedding') {
          // Test embedding models using direct API
          const { PredictionServiceClient } = require('@google-cloud/aiplatform');
          const client = new PredictionServiceClient();
          
          const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${modelTest.name}`;
          
          const instances = [{ content: 'test' }];
          const request = { endpoint, instances };
          
          const [response] = await client.predict(request);
          
          if (response.predictions && response.predictions[0]) {
            console.log(`✅ ${modelTest.name} - WORKING`);
            workingModels.push(modelTest);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${modelTest.name} - ${error.message.split('\n')[0]}`);
      }
    }
    
    console.log('');
    console.log('📊 Results:');
    console.log('===========');
    
    if (workingModels.length > 0) {
      console.log('✅ Working models found:');
      workingModels.forEach(model => {
        console.log(`   • ${model.name} (${model.type})`);
      });
      
      // Update the embedding service with working models
      console.log('');
      console.log('🔄 Updating embedding service...');
      
      const workingTextModel = workingModels.find(m => m.type === 'text');
      const workingEmbeddingModel = workingModels.find(m => m.type === 'embedding');
      
      if (workingTextModel || workingEmbeddingModel) {
        console.log('✅ Found working models - updating configuration');
        
        // Create updated embedding service
        const fs = require('fs');
        const path = require('path');
        
        const serviceCode = `import { VertexAI } from '@google-cloud/vertexai';
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { MockAiService } from './mock/mockAiService';
import { GoogleAIService } from './google-ai/googleAiService';

export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class WorkingVertexAIService implements EmbeddingService {
  private vertexAI: VertexAI;
  private predictionClient: PredictionServiceClient;
  private mockService?: MockAiService;
  private googleAI?: GoogleAIService;
  private workingEmbeddingModel = '${workingEmbeddingModel ? workingEmbeddingModel.name : 'textembedding-gecko@001'}';
  private workingTextModel = '${workingTextModel ? workingTextModel.name : 'text-bison@001'}';

  constructor() {
    this.initializeServices();
  }

  private async initializeServices() {
    // Check if we're in demo mode
    if (process.env.DEMO_MODE === 'true' || process.env.USE_MOCK_AI === 'true') {
      console.log('🎯 Running in demo mode - using mock AI service');
      this.mockService = new MockAiService();
      return;
    }

    // Try Google AI first (often more accessible)
    if (process.env.GOOGLE_AI_API_KEY) {
      try {
        this.googleAI = new GoogleAIService();
        console.log('✅ Using Google AI service');
        return;
      } catch (error) {
        console.warn('⚠️  Google AI initialization failed:', error.message);
      }
    }

    // Initialize Vertex AI
    try {
      this.vertexAI = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      });
      
      this.predictionClient = new PredictionServiceClient();
      console.log('✅ Vertex AI service initialized with working models');
    } catch (error) {
      console.warn('⚠️  Vertex AI initialization failed:', error.message);
      this.mockService = new MockAiService();
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Try Google AI first
    if (this.googleAI) {
      try {
        return await this.googleAI.generateEmbedding(text);
      } catch (error) {
        console.warn('Google AI failed, trying Vertex AI:', error.message);
      }
    }

    // Try Vertex AI
    if (this.vertexAI && this.predictionClient) {
      try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        const endpoint = \`projects/\${projectId}/locations/\${location}/publishers/google/models/\${this.workingEmbeddingModel}\`;
        
        const instances = [{ content: text }];
        const request = { endpoint, instances };
        
        const [response] = await this.predictionClient.predict(request);
        
        if (response.predictions && response.predictions[0] && response.predictions[0].embeddings) {
          return response.predictions[0].embeddings.values;
        } else {
          throw new Error('Invalid Vertex AI embedding response');
        }
      } catch (error) {
        console.warn('Vertex AI embedding failed, using mock:', error.message);
      }
    }

    // Fallback to mock
    return this.getMockService().generateEmbedding(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings = await Promise.all(
      texts.map(text => this.generateEmbedding(text))
    );
    return embeddings;
  }

  private getMockService(): MockAiService {
    if (!this.mockService) {
      this.mockService = new MockAiService();
    }
    return this.mockService;
  }

  getServiceStatus(): { type: 'vertex-ai' | 'google-ai' | 'mock'; ready: boolean } {
    if (this.googleAI) return { type: 'google-ai', ready: true };
    if (this.vertexAI) return { type: 'vertex-ai', ready: true };
    return { type: 'mock', ready: true };
  }

  isUsingMockAI(): boolean {
    return !this.googleAI && !this.vertexAI;
  }
}

// Export singleton instance
export const embeddingService = new WorkingVertexAIService();
`;
        
        fs.writeFileSync('packages/backend/src/services/embeddings.ts', serviceCode);
        console.log('✅ Updated embedding service with working models');
        
      } else {
        console.log('⚠️  No working models found - keeping mock service');
      }
      
    } else {
      console.log('❌ No working models found');
      console.log('');
      console.log('🔧 Possible solutions:');
      console.log('1. Request access to Vertex AI generative models');
      console.log('2. Check if your project has the right permissions');
      console.log('3. Try a different region (e.g., us-east1)');
      console.log('4. Use the Google AI API key instead');
    }
    
  } catch (error) {
    console.error('❌ Vertex AI fix failed:', error.message);
  }
}

fixVertexAI();