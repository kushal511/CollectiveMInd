#!/usr/bin/env node

/**
 * Check Available Vertex AI Models and Regions
 */

require('dotenv').config();

async function checkAvailableModels() {
  try {
    console.log('🔍 Checking Available Vertex AI Models...');
    console.log('Project:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    
    const { VertexAI } = require('@google-cloud/vertexai');
    
    // Test different regions and models
    const regions = ['us-central1', 'us-east1', 'us-west1', 'europe-west1'];
    const models = ['gemini-pro', 'gemini-1.0-pro', 'text-bison', 'chat-bison'];
    
    for (const region of regions) {
      console.log(`\n📍 Testing region: ${region}`);
      
      for (const modelName of models) {
        try {
          const vertexAI = new VertexAI({
            project: process.env.GOOGLE_CLOUD_PROJECT_ID,
            location: region,
          });

          const model = vertexAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              maxOutputTokens: 10,
              temperature: 0.1,
            },
          });

          // Try a simple request
          const result = await model.generateContent('Hi');
          const response = result.response.text();
          
          console.log(`  ✅ ${modelName}: Working`);
          console.log(`     Response: ${response.substring(0, 50)}...`);
          
          // If we found a working model, update .env and exit
          if (response) {
            console.log(`\n🎉 Found working configuration!`);
            console.log(`Region: ${region}`);
            console.log(`Model: ${modelName}`);
            
            // Update .env file
            const fs = require('fs');
            let envContent = fs.readFileSync('.env', 'utf8');
            envContent = envContent.replace(/GOOGLE_CLOUD_LOCATION=".*"/, `GOOGLE_CLOUD_LOCATION="${region}"`);
            envContent = envContent.replace(/VERTEX_AI_MODEL=".*"/, `VERTEX_AI_MODEL="${modelName}"`);
            fs.writeFileSync('.env', envContent);
            
            console.log('✅ Updated .env file with working configuration');
            return;
          }
          
        } catch (error) {
          console.log(`  ❌ ${modelName}: ${error.message.split('.')[0]}`);
        }
      }
    }
    
    console.log('\n❌ No working models found. This might indicate:');
    console.log('1. Vertex AI API is not fully enabled');
    console.log('2. Your account needs additional permissions');
    console.log('3. There might be a regional restriction');
    
  } catch (error) {
    console.error('❌ Error checking models:', error.message);
  }
}

checkAvailableModels();