const { PredictionServiceClient } = require('@google-cloud/aiplatform');
require('dotenv').config();

async function testTextEmbedding004() {
  console.log('🧪 Testing text-embedding-004 with Correct Format');
  console.log('==================================================');
  console.log('');
  
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION;
  
  console.log(`📋 Project: ${projectId}`);
  console.log(`📍 Location: ${location}`);
  console.log('');
  
  try {
    const client = new PredictionServiceClient();
    const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/text-embedding-004`;
    
    // Try different request formats for text-embedding-004
    const requestFormats = [
      // Format 1: Simple text
      {
        name: 'Simple text format',
        instances: [
          {
            content: 'This is a test sentence for embedding generation.'
          }
        ]
      },
      
      // Format 2: With task type
      {
        name: 'With task type',
        instances: [
          {
            content: 'This is a test sentence for embedding generation.',
            task_type: 'RETRIEVAL_DOCUMENT'
          }
        ]
      },
      
      // Format 3: Text field
      {
        name: 'Text field format',
        instances: [
          {
            text: 'This is a test sentence for embedding generation.'
          }
        ]
      },
      
      // Format 4: Input field
      {
        name: 'Input field format',
        instances: [
          {
            input: 'This is a test sentence for embedding generation.'
          }
        ]
      },
      
      // Format 5: Structured format
      {
        name: 'Structured format',
        instances: [
          {
            inputs: {
              text: 'This is a test sentence for embedding generation.'
            }
          }
        ]
      }
    ];
    
    for (const format of requestFormats) {
      try {
        console.log(`🔄 Trying: ${format.name}`);
        
        const request = {
          endpoint,
          instances: format.instances,
        };
        
        const [response] = await client.predict(request);
        
        if (response.predictions && response.predictions[0]) {
          const prediction = response.predictions[0];
          
          // Try to extract embedding from different possible locations
          let embedding;
          if (prediction.embeddings && prediction.embeddings.values) {
            embedding = prediction.embeddings.values;
          } else if (prediction.values) {
            embedding = prediction.values;
          } else if (prediction.embedding) {
            embedding = prediction.embedding;
          } else {
            console.log('Response structure:', JSON.stringify(prediction, null, 2));
            throw new Error('Could not find embedding in response');
          }
          
          console.log(`✅ ${format.name} - SUCCESS!`);
          console.log(`Embedding dimensions: ${embedding.length}`);
          console.log(`First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
          console.log('');
          
          // Save the working format
          console.log('🎉 WORKING FORMAT FOUND!');
          console.log('========================');
          console.log('Request format:', JSON.stringify(format.instances[0], null, 2));
          
          return { success: true, format: format.instances[0] };
          
        } else {
          throw new Error('No predictions in response');
        }
        
      } catch (error) {
        console.log(`❌ ${format.name} failed: ${error.message.split('\n')[0]}`);
      }
    }
    
    throw new Error('All request formats failed');
    
  } catch (error) {
    console.error('❌ All tests failed:', error.message);
    return { success: false };
  }
}

testTextEmbedding004().then(result => {
  if (result.success) {
    console.log('\n🚀 Ready to update CollectiveMind with working Vertex AI!');
  } else {
    console.log('\n😞 Could not get text-embedding-004 working');
  }
});