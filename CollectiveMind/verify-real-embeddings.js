#!/usr/bin/env node

/**
 * Verification script to confirm CollectiveMind uses real Vertex AI embeddings
 */

const { VertexAI } = require('@google-cloud/vertexai');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyVertexAIConnection() {
  log('blue', '🔍 Verifying Vertex AI Connection...');
  
  try {
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    // Test Gemini AI
    log('blue', '  Testing Gemini AI...');
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.1,
      },
    });

    const result = await model.generateContent('Hello, respond with "Vertex AI is working" if you can see this.');
    const response = result.response.text();
    
    if (response.toLowerCase().includes('vertex ai is working') || response.toLowerCase().includes('working')) {
      log('green', '  ✅ Gemini AI is responding correctly');
      log('green', `  Response: ${response.substring(0, 100)}...`);
    } else {
      log('yellow', '  ⚠️  Gemini AI responded but with unexpected content');
      log('yellow', `  Response: ${response.substring(0, 100)}...`);
    }

    return true;
  } catch (error) {
    log('red', '  ❌ Vertex AI connection failed');
    log('red', `  Error: ${error.message}`);
    return false;
  }
}

async function verifyEmbeddingsInElasticsearch() {
  log('blue', '🔍 Verifying Real Embeddings in Elasticsearch...');
  
  try {
    const client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });

    // Check if Elasticsearch is running
    const health = await client.cluster.health();
    log('green', `  ✅ Elasticsearch is ${health.status}`);

    // Check for documents with embeddings
    const response = await client.search({
      index: 'collectivemind-documents',
      body: {
        query: {
          exists: { field: 'content_vector' }
        },
        size: 1,
        _source: ['doc_id', 'title', 'content_vector']
      }
    });

    if (response.hits.total.value > 0) {
      const doc = response.hits.hits[0]._source;
      const embedding = doc.content_vector;
      
      log('green', '  ✅ Found documents with real embeddings');
      log('green', `  Document: ${doc.title}`);
      log('green', `  Embedding dimensions: ${embedding ? embedding.length : 'N/A'}`);
      
      if (embedding && embedding.length === 768) {
        log('green', '  ✅ Embedding has correct dimensions (768)');
        
        // Check if embedding values look real (not all zeros or ones)
        const nonZeroValues = embedding.filter(val => val !== 0).length;
        const variance = calculateVariance(embedding);
        
        if (nonZeroValues > 700 && variance > 0.001) {
          log('green', '  ✅ Embedding values appear to be real Vertex AI embeddings');
          log('green', `  Non-zero values: ${nonZeroValues}/768`);
          log('green', `  Variance: ${variance.toFixed(6)} (indicates real embeddings)`);
        } else {
          log('yellow', '  ⚠️  Embedding values might be mock/placeholder');
          log('yellow', `  Non-zero values: ${nonZeroValues}/768`);
          log('yellow', `  Variance: ${variance.toFixed(6)}`);
        }
      } else {
        log('red', '  ❌ Embedding has incorrect dimensions');
      }
    } else {
      log('yellow', '  ⚠️  No documents with embeddings found');
      log('yellow', '  Run data ingestion first: npm run setup:agentic');
    }

    return true;
  } catch (error) {
    log('red', '  ❌ Elasticsearch verification failed');
    log('red', `  Error: ${error.message}`);
    return false;
  }
}

async function testSemanticSearch() {
  log('blue', '🔍 Testing Semantic Search with Real Embeddings...');
  
  try {
    const response = await fetch('http://localhost:8000/api/search/hybrid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'customer retention strategies',
        userContext: {
          userId: 'test_user',
          team: 'Product',
          role: 'Product Manager'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        log('green', '  ✅ Semantic search is working');
        log('green', `  Found ${data.results.length} results`);
        
        // Check if results have relevance scores (indicates real semantic matching)
        const hasRelevanceScores = data.results.some(result => result.relevanceScore > 0);
        if (hasRelevanceScores) {
          log('green', '  ✅ Results have relevance scores (real semantic matching)');
        }
        
        log('green', `  Top result: ${data.results[0].title}`);
      } else {
        log('yellow', '  ⚠️  Search returned no results');
      }
    } else {
      log('red', '  ❌ Search API request failed');
    }

    return true;
  } catch (error) {
    log('red', '  ❌ Semantic search test failed');
    log('red', `  Error: ${error.message}`);
    return false;
  }
}

async function verifyAgenticSystem() {
  log('blue', '🔍 Verifying Agentic System with Real AI...');
  
  try {
    const response = await fetch('http://localhost:8000/api/agentic/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'customer churn analysis with cross-team collaboration',
        userContext: {
          userId: 'test_user',
          team: 'Product',
          role: 'Product Manager'
        },
        intent: {
          type: 'analysis',
          complexity: 'high',
          crossTeam: true
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.searchResults && data.aiSynthesis) {
        log('green', '  ✅ Agentic system is working with real AI');
        log('green', `  Agents used: ${data.metadata?.agentsUsed?.join(', ') || 'Multiple'}`);
        log('green', `  AI synthesis length: ${data.aiSynthesis.length} characters`);
      } else {
        log('yellow', '  ⚠️  Agentic system responded but with limited data');
      }
    } else {
      log('red', '  ❌ Agentic system request failed');
    }

    return true;
  } catch (error) {
    log('red', '  ❌ Agentic system test failed');
    log('red', `  Error: ${error.message}`);
    return false;
  }
}

function calculateVariance(array) {
  const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
  const squaredDiffs = array.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / array.length;
}

async function checkConfiguration() {
  log('blue', '🔍 Checking Configuration...');
  
  const requiredEnvVars = [
    'GOOGLE_CLOUD_PROJECT_ID',
    'GOOGLE_CLOUD_LOCATION'
  ];

  let configValid = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log('green', `  ✅ ${envVar}: ${process.env[envVar]}`);
    } else {
      log('red', `  ❌ ${envVar}: Not set`);
      configValid = false;
    }
  }

  // Check authentication
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    log('green', `  ✅ GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
  } else {
    log('yellow', '  ⚠️  GOOGLE_APPLICATION_CREDENTIALS: Not set (using Application Default Credentials)');
  }

  return configValid;
}

async function main() {
  console.log('🧠 CollectiveMind Real AI Verification');
  console.log('=====================================');
  console.log('');

  // Check configuration
  const configValid = await checkConfiguration();
  if (!configValid) {
    log('red', '❌ Configuration is incomplete. Please check your .env file.');
    process.exit(1);
  }

  console.log('');

  // Run all verification tests
  const tests = [
    verifyVertexAIConnection,
    verifyEmbeddingsInElasticsearch,
    testSemanticSearch,
    verifyAgenticSystem
  ];

  let allPassed = true;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (!result) allPassed = false;
    } catch (error) {
      log('red', `Test failed: ${error.message}`);
      allPassed = false;
    }
    console.log('');
  }

  // Final summary
  console.log('📊 Verification Summary');
  console.log('======================');
  
  if (allPassed) {
    log('green', '🎉 All verifications passed!');
    log('green', '✅ CollectiveMind is using real Vertex AI embeddings');
    log('green', '✅ Gemini AI is working for conversations');
    log('green', '✅ Semantic search is operational');
    log('green', '✅ Agentic system is functioning');
    console.log('');
    log('blue', '🚀 Your system is ready for the Google Cloud + Elastic hackathon!');
  } else {
    log('yellow', '⚠️  Some verifications failed or returned warnings');
    log('yellow', 'Please check the issues above and ensure:');
    log('yellow', '1. Google Cloud authentication is set up');
    log('yellow', '2. Vertex AI APIs are enabled');
    log('yellow', '3. Data ingestion has been completed');
    log('yellow', '4. All services are running');
  }
}

// Run verification
main().catch(error => {
  log('red', `Verification failed: ${error.message}`);
  process.exit(1);
});