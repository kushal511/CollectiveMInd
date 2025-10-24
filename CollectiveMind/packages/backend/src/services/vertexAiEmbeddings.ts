import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { MockAiService } from './mock/mockAiService';

export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class VertexAIEmbeddingService implements EmbeddingService {
  private client: PredictionServiceClient;
  private projectId: string;
  private location: string;
  private mockService?: MockAiService;

  constructor() {
    // Check if we're in demo mode
    if (process.env.DEMO_MODE === 'true' || process.env.USE_MOCK_AI === 'true') {
      console.log('🎯 Running in demo mode - using mock AI service');
      this.mockService = new MockAiService();
      return;
    }

    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    
    try {
      this.client = new PredictionServiceClient();
      console.log('✅ Vertex AI PredictionServiceClient initialized');
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

    // Try different embedding models in order of preference
    const models = [
      'textembedding-gecko@003',
      'textembedding-gecko@002', 
      'textembedding-gecko@001',
      'text-embedding-preview-0409'
    ];

    for (const model of models) {
      try {
        console.log(`Trying embedding model: ${model}`);
        
        const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}`;
        
        const instances = [
          {
            content: text,
            task_type: 'RETRIEVAL_DOCUMENT'
          }
        ];

        const request = {
          endpoint,
          instances,
        };

        const [response] = await this.client.predict(request);

        if (response.predictions && response.predictions[0]) {
          const prediction = response.predictions[0] as any;
          
          // Handle different response formats
          if (prediction.embeddings && prediction.embeddings.values) {
            console.log(`✅ Successfully generated embedding using ${model}`);
            return prediction.embeddings.values;
          } else if (prediction.values) {
            console.log(`✅ Successfully generated embedding using ${model}`);
            return prediction.values;
          } else {
            throw new Error(`Invalid response format from ${model}`);
          }
        } else {
          throw new Error(`No predictions in response from ${model}`);
        }
      } catch (error) {
        console.warn(`❌ Model ${model} failed:`, error.message);
        continue;
      }
    }

    // If all models fail, fall back to mock service
    console.warn('All Vertex AI embedding models failed, falling back to mock service');
    if (!this.mockService) {
      this.mockService = new MockAiService();
    }
    return this.mockService.generateEmbedding(text);
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

  // Method to check if we're using real or mock AI
  isUsingMockAI(): boolean {
    return !!this.mockService;
  }

  // Method to get service status
  getServiceStatus(): { type: 'vertex-ai' | 'mock'; ready: boolean } {
    if (this.mockService) {
      return { type: 'mock', ready: true };
    }
    return { type: 'vertex-ai', ready: !!this.client };
  }
}

// Export singleton instance
export const embeddingService = new VertexAIEmbeddingService();
