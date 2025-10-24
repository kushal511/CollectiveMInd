require('dotenv').config();

async function fixGoogleAI() {
  console.log('🔧 Fixing Google AI Integration');
  console.log('===============================');
  console.log('');
  
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.log('❌ GOOGLE_AI_API_KEY not found');
    return;
  }
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    
    console.log('✅ Google AI client initialized');
    console.log('');
    
    // Test different API approaches
    console.log('🧪 Testing Available Model Names...');
    
    // Use the actual available models from the API response
    const modelNames = [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-pro-latest',
      'models/gemini-2.5-flash',
      'models/gemini-2.5-pro',
      'models/gemini-2.0-flash',
      'models/gemini-flash-latest',
      'models/gemini-pro-latest'
    ];
    
    let workingModel = null;
    
    for (const modelName of modelNames) {
      try {
        console.log(`Testing: ${modelName}`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 100,
          }
        });
        
        const result = await model.generateContent('Say hello');
        
        if (result.response && result.response.text) {
          const text = result.response.text();
          console.log(`✅ ${modelName} - SUCCESS`);
          console.log(`Response: ${text}`);
          workingModel = modelName;
          break;
        }
        
      } catch (error) {
        console.log(`❌ ${modelName} - ${error.message.split('\\n')[0]}`);
      }
    }
    
    if (workingModel) {
      console.log('');
      console.log('🎉 Found working Google AI model!');
      console.log(`Working model: ${workingModel}`);
      
      // Update the Google AI service with the working model
      const fs = require('fs');
      
      const updatedService = `import { GoogleGenerativeAI } from '@google/generative-ai';

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
      model: '${workingModel}',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      }
    });
    
    console.log('✅ Google AI service initialized with ${workingModel}');
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
        ? \`Context: \${context}\\n\\nQuestion: \${prompt}\`
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
`;
      
      fs.writeFileSync('packages/backend/src/services/google-ai/googleAiService.ts', updatedService);
      console.log('✅ Updated Google AI service');
      
      // Test the chat functionality
      console.log('');
      console.log('🤖 Testing Chat Functionality...');
      
      const model = genAI.getGenerativeModel({ model: workingModel });
      const chatResult = await model.generateContent('Explain collective intelligence in one sentence.');
      console.log('Chat response:', chatResult.response.text());
      
      console.log('');
      console.log('🎉 Google AI is now working!');
      console.log('Your CollectiveMind will use real AI responses.');
      
    } else {
      console.log('');
      console.log('❌ No working Google AI models found');
      console.log('');
      console.log('🔧 Possible issues:');
      console.log('1. API key might be restricted');
      console.log('2. API key might not have access to Gemini models');
      console.log('3. Try creating a new API key at: https://makersuite.google.com/app/apikey');
      
      // Check if the API key is valid by testing a simple request
      console.log('');
      console.log('🔍 Testing API key validity...');
      
      try {
        // Try to make any request to see if the key works
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GOOGLE_AI_API_KEY);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API key is valid');
          console.log('Available models:', data.models?.map(m => m.name).join(', ') || 'None listed');
        } else {
          console.log('❌ API key validation failed:', response.status, response.statusText);
        }
      } catch (fetchError) {
        console.log('❌ API key test failed:', fetchError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Google AI fix failed:', error.message);
  }
}

fixGoogleAI();