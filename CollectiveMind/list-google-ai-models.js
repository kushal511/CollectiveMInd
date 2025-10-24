require('dotenv').config();

async function listModels() {
  console.log('📋 Listing Available Google AI Models');
  console.log('=====================================');
  console.log('');
  
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.log('❌ GOOGLE_AI_API_KEY not found');
    return;
  }
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    
    // List available models
    const models = await genAI.listModels();
    
    console.log('Available models:');
    console.log('================');
    
    for (const model of models) {
      console.log(`📦 ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Failed to list models:', error.message);
  }
}

listModels();