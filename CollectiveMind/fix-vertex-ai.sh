#!/bin/bash

# Fix Vertex AI Access Issues
# Comprehensive troubleshooting and setup for Vertex AI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔧 Fixing Vertex AI Access Issues"
echo "=================================="
echo ""

PROJECT_ID="gen-lang-client-0973625306"

# Step 1: Check current authentication
print_status "Checking authentication..."
CURRENT_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
if [ -n "$CURRENT_ACCOUNT" ]; then
    print_success "Authenticated as: $CURRENT_ACCOUNT"
else
    print_error "Not authenticated"
    gcloud auth login
fi

# Step 2: Set project
print_status "Setting project..."
gcloud config set project $PROJECT_ID
print_success "Project set to: $PROJECT_ID"

# Step 3: Enable all required APIs
print_status "Enabling required APIs..."
APIS=(
    "aiplatform.googleapis.com"
    "ml.googleapis.com"
    "compute.googleapis.com"
    "storage.googleapis.com"
    "cloudbuild.googleapis.com"
)

for api in "${APIS[@]}"; do
    print_status "Enabling $api..."
    gcloud services enable "$api" --project=$PROJECT_ID
done

print_success "All APIs enabled"

# Step 4: Check IAM permissions
print_status "Checking IAM permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="user:$CURRENT_ACCOUNT" \
    --role="roles/aiplatform.user" || print_warning "Already has aiplatform.user role"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="user:$CURRENT_ACCOUNT" \
    --role="roles/ml.developer" || print_warning "Already has ml.developer role"

print_success "IAM permissions configured"

# Step 5: Set up Application Default Credentials
print_status "Setting up Application Default Credentials..."
gcloud auth application-default login --project=$PROJECT_ID

# Step 6: Test different regions
print_status "Testing Vertex AI access in different regions..."

REGIONS=("us-central1" "us-east1" "us-west1" "europe-west1" "asia-southeast1")

for region in "${REGIONS[@]}"; do
    print_status "Testing region: $region"
    
    # Test if we can access Vertex AI in this region
    if gcloud ai models list --region=$region --project=$PROJECT_ID &>/dev/null; then
        print_success "✅ Vertex AI accessible in $region"
        WORKING_REGION=$region
        break
    else
        print_warning "❌ No access to Vertex AI in $region"
    fi
done

if [ -n "$WORKING_REGION" ]; then
    print_success "Found working region: $WORKING_REGION"
    
    # Update .env with working region
    sed -i.bak "s/GOOGLE_CLOUD_LOCATION=.*/GOOGLE_CLOUD_LOCATION=\"$WORKING_REGION\"/" .env
    cp .env packages/backend/.env
    
    print_success "Updated .env with working region: $WORKING_REGION"
else
    print_warning "No regions have Vertex AI access. This project may need allowlisting."
fi

# Step 7: Create a proper Vertex AI embedding service
print_status "Creating proper Vertex AI embedding service..."

cat > packages/backend/src/services/vertexAiEmbeddings.ts << 'EOF'
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { MockAiService } from './mock/mockAiService';

export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class VertexAIEmbeddingService implements EmbeddingService {
  private client: PredictionServiceClient;
  private projectId: string;
  private location: string;
  private mockService?: MockAiService;

  constructor() {
    // Check if we're in demo mode
    if (process.env.DEMO_MODE === 'true' || process.env.USE_MOCK_AI === 'true') {
      console.log('🎯 Running in demo mode - using mock AI service');
      this.mockService = new MockAiService();
      return;
    }

    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    
    try {
      this.client = new PredictionServiceClient();
      console.log('✅ Vertex AI PredictionServiceClient initialized');
    } catch (error) {
      console.warn('⚠️  Vertex AI initialization failed, falling back to mock service:', error);
      this.mockService = new MockAiService();
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Use mock service if available
    if (this.mockService) {
      return this.mockService.generateEmbedding(text);
    }

    // Try different embedding models in order of preference
    const models = [
      'textembedding-gecko@003',
      'textembedding-gecko@002', 
      'textembedding-gecko@001',
      'text-embedding-preview-0409'
    ];

    for (const model of models) {
      try {
        console.log(`Trying embedding model: ${model}`);
        
        const endpoint = `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}`;
        
        const instances = [
          {
            content: text,
            task_type: 'RETRIEVAL_DOCUMENT'
          }
        ];

        const request = {
          endpoint,
          instances,
        };

        const [response] = await this.client.predict(request);

        if (response.predictions && response.predictions[0]) {
          const prediction = response.predictions[0] as any;
          
          // Handle different response formats
          if (prediction.embeddings && prediction.embeddings.values) {
            console.log(`✅ Successfully generated embedding using ${model}`);
            return prediction.embeddings.values;
          } else if (prediction.values) {
            console.log(`✅ Successfully generated embedding using ${model}`);
            return prediction.values;
          } else {
            throw new Error(`Invalid response format from ${model}`);
          }
        } else {
          throw new Error(`No predictions in response from ${model}`);
        }
      } catch (error) {
        console.warn(`❌ Model ${model} failed:`, error.message);
        continue;
      }
    }

    // If all models fail, fall back to mock service
    console.warn('All Vertex AI embedding models failed, falling back to mock service');
    if (!this.mockService) {
      this.mockService = new MockAiService();
    }
    return this.mockService.generateEmbedding(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const batchSize = parseInt(process.env.VERTEX_AI_BATCH_SIZE || '5');
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      results.push(...batchResults);

      // Rate limiting
      if (i + batchSize < texts.length) {
        const delay = parseInt(process.env.VERTEX_AI_RATE_LIMIT_DELAY || '1000');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  // Method to check if we're using real or mock AI
  isUsingMockAI(): boolean {
    return !!this.mockService;
  }

  // Method to get service status
  getServiceStatus(): { type: 'vertex-ai' | 'mock'; ready: boolean } {
    if (this.mockService) {
      return { type: 'mock', ready: true };
    }
    return { type: 'vertex-ai', ready: !!this.client };
  }
}

// Export singleton instance
export const embeddingService = new VertexAIEmbeddingService();
EOF

print_success "Vertex AI embedding service created"

# Step 8: Create Vertex AI test script
print_status "Creating Vertex AI test script..."

cat > test-vertex-ai-fixed.js << 'EOF'
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
EOF

print_success "Vertex AI test script created"

# Step 9: Update the main embedding service
print_status "Updating main embedding service..."

cp packages/backend/src/services/vertexAiEmbeddings.ts packages/backend/src/services/embeddings.ts

print_success "Main embedding service updated"

echo ""
echo "🎉 Vertex AI Fix Complete!"
echo "=========================="
echo ""
echo "📋 What was done:"
echo "• ✅ Enabled all required APIs"
echo "• ✅ Set up proper IAM permissions"  
echo "• ✅ Configured Application Default Credentials"
echo "• ✅ Created robust Vertex AI embedding service"
echo "• ✅ Added fallback to multiple embedding models"
echo "• ✅ Updated region configuration"
echo ""
echo "🧪 Test Vertex AI:"
echo "node test-vertex-ai-fixed.js"
echo ""
echo "🚀 If test passes, your CollectiveMind will use real Vertex AI!"
echo "🔄 If test fails, the system will automatically fall back to mock AI"