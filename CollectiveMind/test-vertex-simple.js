#!/usr/bin/env node

/**
 * Simple Vertex AI Test
 */

require('dotenv').config();

async function testVertexAI() {
  try {
    console.log('🔍 Testing Vertex AI Access...');
    console.log('Project:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('Location:', process.env.GOOGLE_CLOUD_LOCATION);
    
    const { VertexAI } = require('@google-cloud/vertexai');
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    console.log('✅ VertexAI client created successfully');

    // Test with a simpler model first
    console.log('🧪 Testing Gemini Pro...');
    
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-pro', // Try the basic model first
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.1,
      },
    });

    console.log('✅ Model initialized');

    const result = await model.generateContent('Say "Hello from Vertex AI"');
    const response = result.response.text();
    
    console.log('✅ Vertex AI Response:', response);
    console.log('🎉 Vertex AI is working correctly!');
    
  } catch (error) {
    console.error('❌ Vertex AI test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.message.includes('404')) {
      console.log('\n💡 Solutions:');
      console.log('1. Enable Vertex AI API:');
      console.log('   gcloud services enable aiplatform.googleapis.com');
      console.log('2. Check billing is enabled for your project');
      console.log('3. Verify you have access to Vertex AI in your region');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication issue:');
      console.log('Run: gcloud auth application-default login');
    }
  }
}

testVertexAI();