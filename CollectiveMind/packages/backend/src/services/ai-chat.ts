import { VertexAI } from '@google-cloud/vertexai';
import { SearchService } from './search';
import { MCPManager } from './mcp-manager';
import { logger } from '../utils/logger';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  context?: any;
}

export interface Citation {
  id: string;
  title: string;
  type: 'document' | 'message' | 'person';
  author: string;
  team: string;
  url: string;
  relevance: number;
}

export interface ChatContext {
  conversationId: string;
  userId: string;
  userTeam: string;
  userRole: string;
  messages: ChatMessage[];
  searchContext?: any;
}

export interface ChatResponse {
  message: ChatMessage;
  suggestions?: string[];
  relatedQuestions?: string[];
}

export class AIChatService {
  private vertexAI?: VertexAI;
  private googleAI?: any;
  private searchService: SearchService;
  private mcpManager: MCPManager;
  private model: any;
  private activeService: 'vertex-ai' | 'google-ai' | 'mock' = 'mock';

  constructor() {
    this.initializeAIServices();

    this.searchService = new SearchService();
    this.mcpManager = new MCPManager();
    
    // Initialize MCP connections
    this.initializeMCP();
  }

  private initializeAIServices() {
    console.log('🔧 Initializing AI services...');
    console.log('Google AI API Key present:', !!process.env.GOOGLE_AI_API_KEY);
    
    // Try Google AI first (more accessible)
    if (process.env.GOOGLE_AI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        this.googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        this.model = this.googleAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          }
        });
        this.activeService = 'google-ai';
        console.log('✅ Using Google AI service for chat');
        console.log('✅ Model initialized:', !!this.model);
        return;
      } catch (error) {
        console.warn('⚠️  Google AI initialization failed:', error.message);
      }
    } else {
      console.log('❌ No Google AI API key found');
    }

    // Try Vertex AI as fallback
    if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
      try {
        this.vertexAI = new VertexAI({
          project: process.env.GOOGLE_CLOUD_PROJECT_ID,
          location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
        });
        
        this.model = this.vertexAI.getGenerativeModel({
          model: 'gemini-1.5-pro',
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          },
        });
        this.activeService = 'vertex-ai';
        console.log('✅ Using Vertex AI service for chat');
        return;
      } catch (error) {
        console.warn('⚠️  Vertex AI initialization failed:', error.message);
      }
    }

    // Final fallback - mock responses
    this.activeService = 'mock';
    this.model = null; // Explicitly set to null for mock mode
    console.log('🎯 Using mock AI service for chat');
  }

  private async generateAIResponse(prompt: string): Promise<string> {
    try {
      if (this.activeService === 'google-ai' && this.model) {
        const result = await this.model.generateContent(prompt);
        return result.response.text();
      } else if (this.activeService === 'vertex-ai' && this.model) {
        const result = await this.model.generateContent(prompt);
        return result.response.candidates[0].content.parts[0].text;
      } else {
        // Mock response
        return this.generateMockResponse(prompt);
      }
    } catch (error) {
      console.warn(`AI service ${this.activeService} failed, using mock response:`, error.message);
      return this.generateMockResponse(prompt);
    }
  }

  private generateMockResponse(prompt: string): string {
    if (prompt.toLowerCase().includes('search') || prompt.toLowerCase().includes('find')) {
      return "I can help you search through the knowledge base. Based on your query, I found several relevant documents that might be useful. The search functionality combines keyword matching with semantic understanding to provide the most relevant results.";
    }
    
    if (prompt.toLowerCase().includes('summary') || prompt.toLowerCase().includes('summarize')) {
      return "Here's a summary of the key points from the documents: The content covers important aspects of collective intelligence and knowledge management, highlighting how teams can better collaborate and share information effectively.";
    }
    
    return "I understand your question about the organizational knowledge. Based on the available information, I can provide insights and help you find relevant documents. The CollectiveMind system is designed to facilitate knowledge discovery and cross-team collaboration.";
  }

  private async initializeMCP() {
    try {
      await this.mcpManager.connectAllServers();
      logger.info('MCP servers initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MCP servers:', error);
    }
  }

  async processMessage(
    userMessage: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    try {
      logger.info(`Processing chat message for user ${context.userId}: "${userMessage}"`);

      // Step 1: Analyze user intent and extract search queries
      const intent = await this.analyzeIntent(userMessage, context);
      
      // Step 2: Perform contextual search if needed
      let searchResults = [];
      let citations: Citation[] = [];
      
      if (intent.needsSearch) {
        const searchResponse = await this.searchService.hybridSearch({
          query: intent.searchQuery || userMessage,
          userContext: {
            userId: context.userId,
            team: context.userTeam,
            role: context.userRole
          },
          pagination: { page: 1, size: 10 }
        });

        searchResults = searchResponse.results;
        citations = this.convertToCitations(searchResults);
      }

      // Step 3: Generate AI response with context
      const aiResponse = await this.generateResponse(
        userMessage,
        context,
        searchResults,
        intent
      );

      // Step 4: Create response message
      const responseMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        citations: citations.slice(0, 5), // Limit citations
        context: {
          intent: intent.type,
          searchQuery: intent.searchQuery,
          resultsCount: searchResults.length
        }
      };

      // Step 5: Generate follow-up suggestions
      const suggestions = await this.generateSuggestions(userMessage, aiResponse.content, context);
      const relatedQuestions = await this.generateRelatedQuestions(userMessage, context);

      return {
        message: responseMessage,
        suggestions,
        relatedQuestions
      };

    } catch (error) {
      logger.error('AI chat processing failed:', error);
      
      // Fallback response
      return {
        message: {
          id: this.generateMessageId(),
          role: 'assistant',
          content: "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question or try again in a moment.",
          timestamp: new Date()
        }
      };
    }
  }

  private async analyzeIntent(message: string, context: ChatContext) {
    try {
      const prompt = `
Analyze the user's message and determine their intent. Consider the conversation context.

User message: "${message}"
User role: ${context.userRole}
User team: ${context.userTeam}

Recent conversation context:
${context.messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

Determine:
1. Intent type (search, question, analysis, collaboration, help)
2. Whether search is needed (true/false)
3. Best search query if search is needed
4. Key topics or entities mentioned

Respond in JSON format:
{
  "type": "search|question|analysis|collaboration|help",
  "needsSearch": true|false,
  "searchQuery": "optimized search query",
  "topics": ["topic1", "topic2"],
  "entities": ["entity1", "entity2"]
}
`;

      const response = await this.generateAIResponse(prompt);
      
      try {
        return JSON.parse(response);
      } catch {
        // Fallback if JSON parsing fails
        return {
          type: 'question',
          needsSearch: message.length > 10,
          searchQuery: message,
          topics: [],
          entities: []
        };
      }
    } catch (error) {
      logger.error('Intent analysis failed:', error);
      return {
        type: 'question',
        needsSearch: true,
        searchQuery: message,
        topics: [],
        entities: []
      };
    }
  }

  private async generateResponse(
    userMessage: string,
    context: ChatContext,
    searchResults: any[],
    intent: any
  ) {
    try {
      // Get available MCP tools
      const availableTools = this.mcpManager.getAvailableTools();
      const toolDescriptions = availableTools.map(tool => 
        `- ${tool.name}: ${tool.description}`
      ).join('\n');

      const systemPrompt = `
You are CollectiveMind AI, an intelligent assistant for organizational knowledge discovery and collaboration.

Your role:
- Help users find relevant information across their organization
- Identify collaboration opportunities between teams
- Provide insights based on organizational knowledge
- Suggest actionable next steps
- Use available tools to perform actions when needed

Available Tools:
${toolDescriptions}

User context:
- Name: User from ${context.userTeam} team
- Role: ${context.userRole}
- Current conversation: ${context.messages.length} messages

Guidelines:
- Be conversational and helpful
- Cite sources when referencing specific information
- Suggest cross-team collaboration when relevant
- Provide actionable recommendations
- Use tools when they can help answer the user's question
- Keep responses concise but comprehensive
- Use markdown formatting for better readability

Search results context:
${searchResults.length > 0 ? 
  searchResults.slice(0, 5).map((result, i) => 
    `[${i+1}] ${result.title} (${result.team}) - ${result.content.substring(0, 200)}...`
  ).join('\n') 
  : 'No specific search results available'}

If you need to use a tool, indicate it in your response with the format:
TOOL_CALL: tool_name(arguments)
`;

      const conversationHistory = context.messages.slice(-5).map(m => 
        `${m.role}: ${m.content}`
      ).join('\n');

      const prompt = `
${systemPrompt}

Conversation history:
${conversationHistory}

User message: "${userMessage}"

Please provide a helpful response based on the available information and context. If you need to use any tools to better answer the question, include the tool calls in your response.
`;

      let content = await this.generateAIResponse(prompt);

      // Process tool calls if any
      const toolCallResults = await this.processMCPToolCalls(content, context);
      if (toolCallResults.length > 0) {
        // Enhance response with tool results
        content = await this.enhanceResponseWithToolResults(content, toolCallResults);
      }

      return {
        content: content.trim(),
        reasoning: intent.type,
        searchUsed: searchResults.length > 0,
        toolsUsed: toolCallResults.map(r => r.toolName)
      };

    } catch (error) {
      logger.error('Response generation failed:', error);
      return {
        content: "I understand you're looking for information. Let me search through the available knowledge base to help you find what you need.",
        reasoning: 'fallback',
        searchUsed: false
      };
    }
  }

  private async processMCPToolCalls(content: string, context: ChatContext): Promise<any[]> {
    const toolCallRegex = /TOOL_CALL:\s*(\w+)\((.*?)\)/g;
    const toolCalls = [];
    let match;

    while ((match = toolCallRegex.exec(content)) !== null) {
      const toolName = match[1];
      const argsString = match[2];
      
      try {
        // Parse arguments (simple JSON parsing)
        const args = argsString ? JSON.parse(`{${argsString}}`) : {};
        
        // Add user context to tool arguments
        args.userContext = {
          userId: context.userId,
          team: context.userTeam,
          role: context.userRole
        };

        const result = await this.mcpManager.callTool(toolName, args);
        
        toolCalls.push({
          toolName,
          arguments: args,
          result
        });

        logger.info(`Successfully called MCP tool: ${toolName}`);

      } catch (error) {
        logger.error(`Failed to call MCP tool ${toolName}:`, error);
        toolCalls.push({
          toolName,
          arguments: {},
          error: error.message
        });
      }
    }

    return toolCalls;
  }

  private async enhanceResponseWithToolResults(originalContent: string, toolResults: any[]): Promise<string> {
    if (toolResults.length === 0) return originalContent;

    const toolResultsText = toolResults.map(result => {
      if (result.error) {
        return `Tool ${result.toolName} failed: ${result.error}`;
      }
      return `Tool ${result.toolName} result: ${JSON.stringify(result.result, null, 2)}`;
    }).join('\n\n');

    const enhancementPrompt = `
Based on the original response and the tool results below, provide an enhanced response that incorporates the tool data naturally:

Original response:
${originalContent}

Tool results:
${toolResultsText}

Please provide a cohesive response that integrates the tool results seamlessly:
`;

    try {
      const response = await this.generateAIResponse(enhancementPrompt);
      return response.trim();
    } catch (error) {
      logger.error('Failed to enhance response with tool results:', error);
      return originalContent;
    }
  }

  private async generateSuggestions(
    userMessage: string,
    aiResponse: string,
    context: ChatContext
  ): Promise<string[]> {
    try {
      const prompt = `
Based on this conversation, suggest 3 helpful follow-up actions or questions the user might want to explore:

User message: "${userMessage}"
AI response: "${aiResponse}"
User role: ${context.userRole}
User team: ${context.userTeam}

Generate practical, actionable suggestions that would help the user dive deeper or take next steps. Format as a simple array of strings.

Examples:
- "Schedule a meeting with the Marketing team"
- "Search for related documents from last quarter"
- "Find experts in customer retention"

Respond with just the array in JSON format: ["suggestion1", "suggestion2", "suggestion3"]
`;

      const response = await this.generateAIResponse(prompt);
      
      try {
        const suggestions = JSON.parse(response);
        return Array.isArray(suggestions) ? suggestions : [];
      } catch {
        return [
          "Search for related documents",
          "Connect with relevant team members",
          "Explore similar topics"
        ];
      }
    } catch (error) {
      logger.error('Suggestion generation failed:', error);
      return [];
    }
  }

  private async generateRelatedQuestions(
    userMessage: string,
    context: ChatContext
  ): Promise<string[]> {
    const defaultQuestions = [
      "What are the main challenges in this area?",
      "Who else is working on similar projects?",
      "What recent developments should I know about?",
      "How can different teams collaborate on this?"
    ];

    try {
      const prompt = `
Generate 4 related questions that would help the user explore their topic further:

Original question: "${userMessage}"
User context: ${context.userRole} in ${context.userTeam} team

Generate questions that:
- Explore different angles of the topic
- Consider cross-team perspectives
- Focus on actionable insights
- Are relevant to their role

Respond with JSON array: ["question1", "question2", "question3", "question4"]
`;

      const response = await this.generateAIResponse(prompt);
      
      try {
        const questions = JSON.parse(response);
        return Array.isArray(questions) ? questions : defaultQuestions;
      } catch {
        return defaultQuestions;
      }
    } catch (error) {
      logger.error('Related questions generation failed:', error);
      return defaultQuestions;
    }
  }

  private convertToCitations(searchResults: any[]): Citation[] {
    return searchResults.map(result => ({
      id: result.id,
      title: result.title,
      type: result.type,
      author: result.author || 'Unknown',
      team: result.team || 'Unknown',
      url: `/content/${result.type}/${result.id}`,
      relevance: Math.round(result.relevanceScore * 100)
    }));
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Real-time streaming response (for WebSocket)
  async *streamResponse(
    userMessage: string,
    context: ChatContext
  ): AsyncGenerator<{ type: 'token' | 'citation' | 'complete', data: any }> {
    try {
      // First, yield search results if needed
      const intent = await this.analyzeIntent(userMessage, context);
      
      if (intent.needsSearch) {
        yield { type: 'token', data: 'Searching knowledge base...\n\n' };
        
        const searchResponse = await this.searchService.hybridSearch({
          query: intent.searchQuery || userMessage,
          userContext: {
            userId: context.userId,
            team: context.userTeam,
            role: context.userRole
          }
        });

        // Yield citations
        const citations = this.convertToCitations(searchResponse.results.slice(0, 3));
        for (const citation of citations) {
          yield { type: 'citation', data: citation };
        }
      }

      // Generate and stream the main response
      const response = await this.generateResponse(userMessage, context, [], intent);
      
      // Simulate streaming by yielding chunks
      const words = response.content.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        yield { type: 'token', data: chunk };
        
        // Small delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      yield { type: 'complete', data: { messageId: this.generateMessageId() } };

    } catch (error) {
      logger.error('Streaming response failed:', error);
      yield { type: 'token', data: 'I apologize, but I encountered an error processing your request.' };
      yield { type: 'complete', data: { error: true } };
    }
  }
}