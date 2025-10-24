import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { VertexAI } from '@google-cloud/vertexai';
import { MockAiService } from './mock/mockAiService';

export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  generateQueryEmbedding(query: string): Promise<number[]>;
}

export class VertexAIEmbeddingService implements EmbeddingService {
  private client?: PredictionServiceClient;
  private vertexAI?: VertexAI;
  private projectId: string;
  private location: string;
  private mockService?: MockAiService;
  private vertexAIAvailable: boolean = false;
  private accessCheckDone: boolean = false;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    
    // Check if we're in demo mode
    if (process.env.DEMO_MODE === 'true' || process.env.USE_MOCK_AI === 'true') {
      console.log('🎯 Running in demo mode - using mock AI service');
      this.mockService = new MockAiService();
      return;
    }

    this.initializeVertexAI();
  }

  private async initializeVertexAI() {
    try {
      // Initialize both clients
      this.client = new PredictionServiceClient();
      this.vertexAI = new VertexAI({
        project: this.projectId,
        location: this.location,
      });
      
      console.log('✅ Vertex AI clients initialized');
      
      // Test access on first use
      this.checkVertexAIAccess();
      
    } catch (error) {
      console.warn('⚠️  Vertex AI initialization failed:', error.message);
      this.vertexAIAvailable = false;
      this.accessCheckDone = true;
      this.mockService = new MockAiService();
    }
  }

  private async checkVertexAIAccess(): Promise<void> {
    if (this.accessCheckDone) return;
    
    console.log('🔍 Checking Vertex AI access...');
    
    try {
      // Test if we can access text-embedding-004
      const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/text-embedding-004`;
      const instances = [{ content: 'test' }];
      const request = { endpoint, instances };
      
      await this.client!.predict(request);
      
      // If we get here without a NOT_FOUND error, we have access
      this.vertexAIAvailable = true;
      console.log('✅ Vertex AI access confirmed');
      
    } catch (error) {
      if (error.message.includes('NOT_FOUND')) {
        console.warn('❌ Vertex AI Generative models not accessible in this project');
        console.warn('📋 Project gen-lang-client-0973625306 needs Vertex AI allowlisting');
        console.warn('💡 Contact Google Cloud support to enable Vertex AI Generative AI');
        this.vertexAIAvailable = false;
      } else if (error.message.includes('INVALID_ARGUMENT')) {
        console.log('✅ Vertex AI models accessible (invalid request format is expected)');
        this.vertexAIAvailable = true;
      } else {
        console.warn('⚠️  Vertex AI access check failed:', error.message);
        this.vertexAIAvailable = false;
      }
    }
    
    this.accessCheckDone = true;
    
    if (!this.vertexAIAvailable) {
      console.log('🎯 Falling back to mock AI service for demo purposes');
      this.mockService = new MockAiService();
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Ensure access check is done
    if (!this.accessCheckDone) {
      await this.checkVertexAIAccess();
    }

    // Use mock service if Vertex AI is not available
    if (!this.vertexAIAvailable || this.mockService) {
      if (!this.mockService) {
        this.mockService = new MockAiService();
      }
      return this.mockService.generateEmbedding(text);
    }

    // Try Vertex AI embedding generation
    try {
      return await this.generateVertexAIEmbedding(text);
    } catch (error) {
      console.warn('Vertex AI embedding failed, falling back to mock:', error.message);
      
      if (!this.mockService) {
        this.mockService = new MockAiService();
      }
      return this.mockService.generateEmbedding(text);
    }
  }

  private async generateVertexAIEmbedding(text: string): Promise<number[]> {
    // This method will work once you have Vertex AI access
    // For now, it will demonstrate the correct implementation
    
    const models = [
      'text-embedding-004',
      'textembedding-gecko@003',
      'textembedding-gecko@002'
    ];

    for (const model of models) {
      try {
        const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}`;
        
        // Different request formats for different models
        let instances;
        if (model === 'text-embedding-004') {
          instances = [
            {
              content: text,
              task_type: 'RETRIEVAL_DOCUMENT'
            }
          ];
        } else {
          instances = [
            {
              content: text
            }
          ];
        }

        const request = { endpoint, instances };
        const [response] = await this.client!.predict(request);

        if (response.predictions && response.predictions[0]) {
          const prediction = response.predictions[0] as any;
          
          // Handle different response formats
          if (prediction.embeddings && prediction.embeddings.values) {
            console.log(`✅ Generated embedding using Vertex AI ${model}`);
            return prediction.embeddings.values;
          } else if (prediction.values) {
            console.log(`✅ Generated embedding using Vertex AI ${model}`);
            return prediction.values;
          }
        }
        
        throw new Error(`Invalid response format from ${model}`);
        
      } catch (error) {
        console.warn(`❌ Vertex AI model ${model} failed:`, error.message);
        continue;
      }
    }

    throw new Error('All Vertex AI embedding models failed');
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
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
        const delay = parseInt(process.env.VERTEX_AI_RATE_LIMIT_DELAY || '1000');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  async generateQueryEmbedding(query: string): Promise<number[]> {
    // For query embeddings, we can use the same method as regular embeddings
    return this.generateEmbedding(query);
  }

  // Method to check if we're using real or mock AI
  isUsingMockAI(): boolean {
    return !this.vertexAIAvailable || !!this.mockService;
  }

  // Method to get service status
  getServiceStatus(): { type: 'vertex-ai' | 'mock'; ready: boolean; message?: string } {
    if (!this.vertexAIAvailable || this.mockService) {
      return { 
        type: 'mock', 
        ready: true, 
        message: 'Project needs Vertex AI allowlisting. Using mock AI for demo.' 
      };
    }
    return { 
      type: 'vertex-ai', 
      ready: !!this.client,
      message: 'Vertex AI access confirmed and ready'
    };
  }

  // Method to get detailed status for troubleshooting
  getDetailedStatus(): {
    projectId: string;
    location: string;
    vertexAIAvailable: boolean;
    accessCheckDone: boolean;
    usingMock: boolean;
    recommendation: string;
  } {
    return {
      projectId: this.projectId,
      location: this.location,
      vertexAIAvailable: this.vertexAIAvailable,
      accessCheckDone: this.accessCheckDone,
      usingMock: this.isUsingMockAI(),
      recommendation: this.vertexAIAvailable 
        ? 'Vertex AI is ready to use'
        : 'Contact Google Cloud support to enable Vertex AI Generative AI for this project'
    };
  }
}

// Export singleton instance
export const embeddingService = new VertexAIEmbeddingService();
