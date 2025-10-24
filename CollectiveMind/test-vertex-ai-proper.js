const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

async function testVertexAI() {
  console.log('🧪 Testing Vertex AI with Proper API');
  console.log('====================================');
  console.log('');
  
  const projectId = 'collectivemind-20251024';
  const location = 'us-east1'; // Try different region
  
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
    
    // Test Gemini models (text generation)
    console.log('');
    console.log('🤖 Testing Gemini Models...');
    
    const geminiModels = [
      'gemini-1.5-pro',
      'gemini-1.5-flash', 
      'gemini-pro',
      'gemini-1.0-pro'
    ];
    
    let geminiSuccess = false;
    
    for (const modelName of geminiModels) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const model = vertexAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent('Hello! Please respond with a simple greeting.');
        
        if (result.response && result.response.candidates && result.response.candidates[0]) {
          const text = result.response.candidates[0].content.parts[0].text;
          console.log('✅ Gemini successful!');
          console.log(`Model: ${modelName}`);
          console.log(`Response: ${text}`);
          geminiSuccess = true;
          break;
        }
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message.split('\n')[0]}`);
      }
    }
    
    // Test embedding models
    console.log('');
    console.log('🧠 Testing Embedding Models...');
    
    const embeddingModels = [
      'text-embedding-004',
      'textembedding-gecko@003',
      'textembedding-gecko@001',
      'textembedding-gecko'
    ];
    
    let embeddingSuccess = false;
    
    for (const modelName of embeddingModels) {
      try {
        console.log(`Trying embedding model: ${modelName}`);
        const model = vertexAI.getGenerativeModel({ model: modelName });
        
        const result = await model.embedContent('This is a test sentence for embedding.');
        
        if (result.response && result.response.embeddings) {
          const embedding = result.response.embeddings.values;
          console.log('✅ Embedding successful!');
          console.log(`Model: ${modelName}`);
          console.log(`Dimensions: ${embedding.length}`);
          console.log(`Sample values: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
          embeddingSuccess = true;
          break;
        }
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message.split('\n')[0]}`);
      }
    }
    
    console.log('');
    if (geminiSuccess || embeddingSuccess) {
      console.log('🎉 Vertex AI is working!');
      console.log('✅ Your CollectiveMind can use real Vertex AI models');
      
      if (geminiSuccess) console.log('✅ Text generation available');
      if (embeddingSuccess) console.log('✅ Embeddings available');
    } else {
      console.log('❌ No Vertex AI models are accessible');
      console.log('');
      console.log('🔧 This might be because:');
      console.log('1. Project needs Vertex AI allowlisting');
      console.log('2. Billing account not set up');
      console.log('3. Models not available in us-central1');
      console.log('4. Need to request access to generative models');
    }
    
  } catch (error) {
    console.error('❌ Vertex AI initialization failed:', error.message);
    console.log('');
    console.log('🔧 Check:');
    console.log('1. gcloud auth application-default login');
    console.log('2. Project has Vertex AI API enabled');
    console.log('3. Proper permissions on the project');
  }
}

testVertexAI();