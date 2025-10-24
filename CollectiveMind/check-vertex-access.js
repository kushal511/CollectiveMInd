const { PredictionServiceClient } = require('@google-cloud/aiplatform');
require('dotenv').config();

async function checkVertexAccess() {
  console.log('🔍 Comprehensive Vertex AI Access Check');
  console.log('=======================================');
  console.log('');
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const regions = ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-southeast1'];
  
  // Different model patterns to try
  const modelPatterns = [
    // Embedding models
    'textembedding-gecko@003',
    'textembedding-gecko@002', 
    'textembedding-gecko@001',
    'textembedding-gecko',
    'text-embedding-004',
    'text-embedding-preview-0409',
    
    // Generative models (just to check access)
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'text-bison@001',
    'text-bison@002',
    'chat-bison@001'
  ];
  
  const client = new PredictionServiceClient();
  
  for (const region of regions) {
    console.log(`\n🌍 Testing region: ${region}`);
    console.log('='.repeat(30));
    
    for (const model of modelPatterns) {
      try {
        const endpoint = `projects/${projectId}/locations/${region}/publishers/google/models/${model}`;
        
        // Try a simple prediction request to see if the model exists
        const instances = [{ content: 'test' }];
        const request = { endpoint, instances };
        
        // We expect this to fail, but the error message will tell us if the model exists
        await client.predict(request);
        
        console.log(`✅ ${model} - ACCESSIBLE`);
        
      } catch (error) {
        if (error.message.includes('NOT_FOUND')) {
          console.log(`❌ ${model} - NOT FOUND`);
        } else if (error.message.includes('INVALID_ARGUMENT')) {
          console.log(`⚠️  ${model} - EXISTS but invalid request format`);
        } else if (error.message.includes('PERMISSION_DENIED')) {
          console.log(`🔒 ${model} - EXISTS but permission denied`);
        } else {
          console.log(`❓ ${model} - ${error.message.split('\n')[0]}`);
        }
      }
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('If you see "EXISTS but..." messages, the models are available but need proper request format');
  console.log('If you see only "NOT FOUND" messages, this project needs Vertex AI allowlisting');
}

checkVertexAccess();