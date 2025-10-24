const { PrismaClient } = require('@prisma/client');
const { Client } = require('@elastic/elasticsearch');

const prisma = new PrismaClient();
const esClient = new Client({ node: 'http://localhost:9200' });

async function indexDemoData() {
  console.log('📊 Indexing Demo Data to Elasticsearch');
  console.log('======================================');
  
  try {
    // Get all knowledge items from database
    const knowledgeItems = await prisma.knowledgeItem.findMany();
    console.log(`Found ${knowledgeItems.length} knowledge items to index`);
    
    // Create index if it doesn't exist
    const indexName = 'knowledge_items';
    
    try {
      await esClient.indices.create({
        index: indexName,
        body: {
          mappings: {
            properties: {
              title: { type: 'text', analyzer: 'standard' },
              content: { type: 'text', analyzer: 'standard' },
              summary: { type: 'text' },
              tags: { type: 'keyword' },
              category: { type: 'keyword' },
              author: { type: 'keyword' },
              embedding: { type: 'dense_vector', dims: 768 },
              created_at: { type: 'date' },
              updated_at: { type: 'date' }
            }
          }
        }
      });
      console.log(`✅ Created index: ${indexName}`);
    } catch (error) {
      if (error.meta?.body?.error?.type === 'resource_already_exists_exception') {
        console.log(`ℹ️  Index ${indexName} already exists`);
      } else {
        throw error;
      }
    }
    
    // Index each document
    for (const item of knowledgeItems) {
      try {
        // Parse the embedding from JSON string
        let embedding = [];
        if (item.embedding) {
          try {
            embedding = JSON.parse(item.embedding);
          } catch (e) {
            console.warn(`Failed to parse embedding for ${item.title}`);
            embedding = new Array(768).fill(0); // Default embedding
          }
        } else {
          embedding = new Array(768).fill(0); // Default embedding
        }
        
        // Parse tags from JSON string
        let tags = [];
        if (item.tags) {
          try {
            tags = JSON.parse(item.tags);
          } catch (e) {
            tags = [item.tags]; // Treat as single tag if not JSON
          }
        }
        
        const doc = {
          title: item.title,
          content: item.content,
          summary: item.summary,
          tags: tags,
          category: item.category,
          author: item.author,
          embedding: embedding,
          created_at: item.createdAt,
          updated_at: item.updatedAt
        };
        
        await esClient.index({
          index: indexName,
          id: item.id,
          body: doc
        });
        
        console.log(`✅ Indexed: ${item.title}`);
      } catch (error) {
        console.error(`❌ Failed to index ${item.title}:`, error.message);
      }
    }
    
    // Refresh index
    await esClient.indices.refresh({ index: indexName });
    console.log('🔄 Index refreshed');
    
    // Verify indexing
    const count = await esClient.count({ index: indexName });
    console.log(`📊 Total documents in index: ${count.body.count}`);
    
    console.log('');
    console.log('🎉 Demo data successfully indexed to Elasticsearch!');
    console.log('Now the chat feature can search through the knowledge base.');
    
  } catch (error) {
    console.error('❌ Indexing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

indexDemoData();