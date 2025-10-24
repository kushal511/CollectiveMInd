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

  async generateQueryEmbedding(query: string): Promise<number[]> {
    return this.generateEmbedding(query);
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
