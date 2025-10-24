const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

async function testVertexSDK() {
  console.log('🧪 Testing Vertex AI SDK Approach');
  console.log('==================================');
  console.log('');
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION;
  
  console.log(`📋 Project: ${projectId}`);
  console.log(`📍 Location: ${location}`);
  console.log('');
  
  try {
    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
    });
    
    console.log('✅ Vertex AI SDK initialized');
    
    // Test different embedding approaches
    const approaches = [
      {
        name: 'text-embedding-004 with embedContent',
        test: async () => {
          const model = vertexAI.getGenerativeModel({
            model: 'text-embedding-004',
          });
          
          const result = await model.embedContent('This is a test sentence for embedding generation.');
          return result;
        }
      },
      
      {
        name: 'text-embedding-004 with batchEmbedContents',
        test: async () => {
          const model = vertexAI.getGenerativeModel({
            model: 'text-embedding-004',
          });
          
          const result = await model.batchEmbedContents({
            requests: [
              {
                content: {
                  role: 'user',
                  parts: [{ text: 'This is a test sentence for embedding generation.' }]
                }
              }
            ]
          });
          return result;
        }
      },
      
      {
        name: 'textembedding-gecko with embedContent',
        test: async () => {
          const model = vertexAI.getGenerativeModel({
            model: 'textembedding-gecko@003',
          });
          
          const result = await model.embedContent('This is a test sentence for embedding generation.');
          return result;
        }
      }
    ];
    
    for (const approach of approaches) {
      try {
        console.log(`🔄 Trying: ${approach.name}`);
        
        const result = await approach.test();
        
        console.log('Raw result structure:');
        console.log(JSON.stringify(result, null, 2));
        
        // Try to extract embedding
        let embedding;
        if (result.response && result.response.embeddings) {
          embedding = result.response.embeddings.values;
        } else if (result.embeddings && result.embeddings[0]) {
          embedding = result.embeddings[0].values;
        } else if (result.embedding) {
          embedding = result.embedding.values;
        }
        
        if (embedding && Array.isArray(embedding)) {
          console.log(`✅ ${approach.name} - SUCCESS!`);
          console.log(`Embedding dimensions: ${embedding.length}`);
          console.log(`First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
          console.log('');
          
          return { success: true, approach: approach.name, embedding };
        } else {
          throw new Error('Could not extract embedding from result');
        }
        
      } catch (error) {
        console.log(`❌ ${approach.name} failed: ${error.message.split('\n')[0]}`);
      }
    }
    
    throw new Error('All approaches failed');
    
  } catch (error) {
    console.error('❌ Vertex AI SDK test failed:', error.message);
    return { success: false };
  }
}

testVertexSDK().then(result => {
  if (result.success) {
    console.log('\n🎉 Found working Vertex AI approach!');
    console.log(`Method: ${result.approach}`);
    console.log('\n🚀 Ready to implement in CollectiveMind!');
  } else {
    console.log('\n😞 Vertex AI SDK approaches failed');
    console.log('\n💡 This project likely needs Vertex AI Generative AI allowlisting');
    console.log('Contact Google Cloud support or use the Google AI API key approach instead');
  }
});