require('dotenv').config();

async function checkCollectiveMindStatus() {
  console.log('🔍 CollectiveMind AI Status Check');
  console.log('=================================');
  console.log('');
  
  try {
    // Import the embedding service
    const { embeddingService } = require('./packages/backend/src/services/embeddings');
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get detailed status
    const status = embeddingService.getDetailedStatus();
    const serviceStatus = embeddingService.getServiceStatus();
    
    console.log('📋 Configuration:');
    console.log(`Project ID: ${status.projectId}`);
    console.log(`Location: ${status.location}`);
    console.log(`Demo Mode: ${process.env.DEMO_MODE}`);
    console.log(`Use Mock AI: ${process.env.USE_MOCK_AI}`);
    console.log('');
    
    console.log('🤖 AI Service Status:');
    console.log(`Type: ${serviceStatus.type}`);
    console.log(`Ready: ${serviceStatus.ready}`);
    console.log(`Message: ${serviceStatus.message || 'N/A'}`);
    console.log('');
    
    console.log('🔍 Detailed Analysis:');
    console.log(`Vertex AI Available: ${status.vertexAIAvailable}`);
    console.log(`Access Check Done: ${status.accessCheckDone}`);
    console.log(`Using Mock: ${status.usingMock}`);
    console.log(`Recommendation: ${status.recommendation}`);
    console.log('');
    
    // Test embedding generation
    console.log('🧠 Testing Embedding Generation:');
    const testText = 'This is a test sentence for CollectiveMind embedding generation.';
    console.log(`Input: "${testText}"`);
    
    const startTime = Date.now();
    const embedding = await embeddingService.generateEmbedding(testText);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Embedding generated successfully`);
    console.log(`Dimensions: ${embedding.length}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log('');
    
    // Summary
    console.log('📊 Summary:');
    if (status.vertexAIAvailable) {
      console.log('🎉 Vertex AI is working! Your CollectiveMind uses real AI.');
    } else {
      console.log('🎯 Using Mock AI. CollectiveMind is fully functional for demo purposes.');
      console.log('');
      console.log('🔧 To enable real Vertex AI:');
      console.log('1. Contact Google Cloud support');
      console.log('2. Request Vertex AI Generative AI access for project gen-lang-client-0973625306');
      console.log('3. Once approved, restart CollectiveMind - it will automatically use real AI');
    }
    
    console.log('');
    console.log('✅ CollectiveMind is ready to run!');
    
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
    console.log('');
    console.log('🔧 Try:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm run db:push');
    console.log('3. Run: npm run seed:demo');
  }
}

checkCollectiveMindStatus();