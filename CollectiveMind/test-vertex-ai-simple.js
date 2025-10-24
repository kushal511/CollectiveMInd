const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

async function testVertexAISimple() {
  console.log('🧪 Testing Vertex AI with CollectiveMind Project');
  console.log('================================================');
  console.log('');
  
  try {
    const projectId = 'collectivemind-20251024';
    const location = 'us-central1';
    
    console.log(`📋 Project: ${projectId}`);
    console.log(`📍 Location: ${location}`);
    console.log('');
    
    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
    
    console.log('✅ Vertex AI client initialized');
    
    // Test with the most basic generative model
    console.log('');
    console.log('🤖 Testing Text Generation...');
    
    try {
      const model = vertexAI.getGenerativeModel({
        model: 'gemini-1.0-pro-001',
      });
      
      const result = await model.generateContent('Say hello in a friendly way.');
      console.log('✅ Gemini text generation successful!');
      console.log('Response:', result.response.candidates[0].content.parts[0].text);
      
      // Test embeddings
      console.log('');
      console.log('🧠 Testing Embeddings...');
      
      // Use the PaLM embedding model which is more widely available
      const embeddingModel = vertexAI.getGenerativeModel({
        model: 'textembedding-gecko@001',
      });
      
      const embeddingResult = await embeddingModel.embedContent('This is a test for embeddings.');
      
      if (embeddingResult.response && embeddingResult.response.embeddings) {
        const embedding = embeddingResult.response.embeddings.values;
        console.log('✅ Embedding generation successful!');
        console.log(`Embedding dimensions: ${embedding.length}`);
        console.log(`Sample values: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
      }
      
      console.log('');
      console.log('🎉 SUCCESS! Vertex AI is working with your project!');
      console.log('Your CollectiveMind can now use real AI services.');
      
    } catch (modelError) {
      console.log('⚠️  Gemini model failed, trying alternative approach...');
      console.log('Error:', modelError.message);
      
      // Try direct API approach
      console.log('');
      console.log('🔄 Trying direct Vertex AI API...');
      
      const { PredictionServiceClient } = require('@google-cloud/aiplatform');
      const client = new PredictionServiceClient();
      
      const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/text-bison@001`;
      
      const instances = [
        {
          prompt: 'Say hello in a friendly way.',
        },
      ];
      
      const parameters = {
        temperature: 0.2,
        maxOutputTokens: 256,
        topP: 0.8,
        topK: 40,
      };
      
      const request = {
        endpoint,
        instances,
        parameters,
      };
      
      const [response] = await client.predict(request);
      
      if (response.predictions && response.predictions[0]) {
        console.log('✅ Direct API text generation successful!');
        console.log('Response:', response.predictions[0].content);
        
        console.log('');
        console.log('🎉 SUCCESS! Vertex AI is working via direct API!');
      }
    }
    
  } catch (error) {
    console.error('❌ Vertex AI test failed:', error.message);
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Visit Vertex AI Studio: https://console.cloud.google.com/vertex-ai/studio');
    console.log('2. Try creating a prompt there first');
    console.log('3. Check if billing is enabled for the project');
  }
}

testVertexAISimple();