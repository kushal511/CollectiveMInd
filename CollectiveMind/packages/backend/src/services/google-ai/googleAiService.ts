import { GoogleGenerativeAI } from '@google/generative-ai';

export class GoogleAIService {
  private genAI: GoogleGenerativeAI;
  private chatModel: any;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Use the working model
    this.chatModel = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      }
    });
    
    console.log('✅ Google AI service initialized with gemini-2.5-flash');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Google AI doesn't have embedding models in the free tier
    // This will fall back to Vertex AI or mock
    throw new Error('Google AI embeddings not available - will fallback to other services');
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    throw new Error('Google AI embeddings not available - will fallback to other services');
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
