const { PredictionServiceClient } = require('@google-cloud/aiplatform');
require('dotenv').config();

async function testVertexAI() {
  console.log('🧪 Testing Fixed Vertex AI Setup');
  console.log('=================================');
  console.log('');
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION;
  
  console.log(`📋 Project: ${projectId}`);
  console.log(`📍 Location: ${location}`);
  console.log('');
  
  try {
    // Test PredictionServiceClient
    console.log('🔌 Testing PredictionServiceClient...');
    const client = new PredictionServiceClient();
    console.log('✅ PredictionServiceClient initialized');
    
    // Test embedding generation
    console.log('');
    console.log('🧠 Testing Embedding Generation...');
    
    const models = [
      'textembedding-gecko@003',
      'textembedding-gecko@002',
      'textembedding-gecko@001'
    ];
    
    let success = false;
    
    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        
        const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${model}`;
        
        const instances = [
          {
            content: 'This is a test sentence for embedding generation.',
            task_type: 'RETRIEVAL_DOCUMENT'
          }
        ];

        const request = {
          endpoint,
          instances,
        };

        const [response] = await client.predict(request);

        if (response.predictions && response.predictions[0]) {
          const prediction = response.predictions[0];
          
          let embedding;
          if (prediction.embeddings && prediction.embeddings.values) {
            embedding = prediction.embeddings.values;
          } else if (prediction.values) {
            embedding = prediction.values;
          } else {
            throw new Error('Invalid response format');
          }
          
          console.log(`✅ ${model} successful!`);
          console.log(`Embedding dimensions: ${embedding.length}`);
          console.log(`First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
          success = true;
          break;
        } else {
          throw new Error('No predictions in response');
        }
      } catch (error) {
        console.log(`❌ ${model} failed: ${error.message}`);
      }
    }
    
    if (success) {
      console.log('');
      console.log('🎉 Vertex AI is working!');
      console.log('Your CollectiveMind can now use real Vertex AI embeddings.');
    } else {
      throw new Error('All embedding models failed');
    }
    
  } catch (error) {
    console.error('❌ Vertex AI test failed:', error.message);
    console.log('');
    console.log('🔧 This might indicate:');
    console.log('1. Project needs Vertex AI allowlisting');
    console.log('2. Billing account not set up');
    console.log('3. Region not supported');
    console.log('4. API quotas exceeded');
    console.log('');
    console.log('💡 Try:');
    console.log('1. Contact Google Cloud support for Vertex AI access');
    console.log('2. Check billing account is active');
    console.log('3. Try different regions');
  }
}

testVertexAI();
