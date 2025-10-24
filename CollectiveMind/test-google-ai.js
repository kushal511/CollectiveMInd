require('dotenv').config();

async function testGoogleAI() {
  console.log('🧪 Testing Google AI');
  console.log('====================');
  console.log('');
  
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.log('❌ GOOGLE_AI_API_KEY not found in .env file');
    console.log('');
    console.log('📋 To get an API key:');
    console.log('1. Visit: https://makersuite.google.com/app/apikey');
    console.log('2. Create a new API key');
    console.log('3. Add to .env: GOOGLE_AI_API_KEY="your-key-here"');
    return;
  }
  
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    
    // Test chat with different model names
    console.log('🤖 Testing Chat...');
    
    const modelNames = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro-latest', 
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'models/gemini-pro',
      'models/gemini-1.5-flash'
    ];
    
    let success = false;
    
    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello! Can you respond with a simple greeting?');
        console.log('✅ Chat successful');
        console.log('Response:', result.response.text());
        success = true;
        break;
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message.split('\n')[0]}`);
      }
    }
    
    if (!success) {
      throw new Error('All model names failed');
    }
    
    console.log('');
    console.log('🎉 Google AI is working!');
    console.log('Your CollectiveMind can now use real AI responses.');
    
  } catch (error) {
    console.error('❌ Google AI test failed:', error.message);
    console.log('');
    console.log('🔧 Check:');
    console.log('1. API key is correct');
    console.log('2. API key has proper permissions');
    console.log('3. Internet connection is working');
  }
}

testGoogleAI();
