import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  requestTimeout: 30000,
  pingTimeout: 3000,
  sniffOnStart: false,
});

// Index configurations
export const INDICES = {
  DOCUMENTS: 'knowledge_items',
  MESSAGES: 'collectivemind-messages',
  PEOPLE: 'collectivemind-people',
  TOPICS: 'collectivemind-topics',
} as const;

// Document index mapping
export const DOCUMENT_INDEX_MAPPING = {
  mappings: {
    properties: {
      doc_id: { type: 'keyword' },
      title: { 
        type: 'text', 
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword' },
          suggest: { type: 'completion' }
        }
      },
      content: { 
        type: 'text', 
        analyzer: 'standard',
        term_vector: 'with_positions_offsets'
      },
      content_vector: { 
        type: 'dense_vector', 
        dims: 768,
        index: true,
        similarity: 'cosine'
      },
      team: { type: 'keyword' },
      author_person_id: { type: 'keyword' },
      co_authors: { type: 'keyword' },
      tags: { type: 'keyword' },
      created_at: { type: 'date' },
      updated_at: { type: 'date' },
      status: { type: 'keyword' },
      visibility: { type: 'keyword' },
      source_type: { type: 'keyword' },
      language: { type: 'keyword' },
      confidentiality: { type: 'keyword' },
      related_doc_ids: { type: 'keyword' },
      // Computed fields for search
      full_text: { 
        type: 'text', 
        analyzer: 'standard',
        store: false
      },
      boost_score: { type: 'float' }
    }
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        content_analyzer: {
          type: 'standard',
          stopwords: '_english_'
        }
      }
    }
  }
};

// Messages index mapping
export const MESSAGE_INDEX_MAPPING = {
  mappings: {
    properties: {
      message_id: { type: 'keyword' },
      thread_id: { type: 'keyword' },
      sender_person_id: { type: 'keyword' },
      timestamp: { type: 'date' },
      text: { 
        type: 'text', 
        analyzer: 'standard',
        fields: {
          suggest: { type: 'completion' }
        }
      },
      text_vector: { 
        type: 'dense_vector', 
        dims: 768,
        index: true,
        similarity: 'cosine'
      },
      emotions: { type: 'keyword' },
      mentions: { type: 'keyword' },
      doc_refs: { type: 'keyword' },
      action_items: { type: 'text' },
      // Computed fields
      sender_team: { type: 'keyword' },
      thread_participants: { type: 'keyword' }
    }
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0
  }
};

// People index mapping
export const PEOPLE_INDEX_MAPPING = {
  mappings: {
    properties: {
      person_id: { type: 'keyword' },
      full_name: { 
        type: 'text',
        fields: {
          keyword: { type: 'keyword' },
          suggest: { type: 'completion' }
        }
      },
      email: { type: 'keyword' },
      team: { type: 'keyword' },
      role_title: { type: 'text' },
      manager_id: { type: 'keyword' },
      skills: { type: 'keyword' },
      interests: { type: 'keyword' },
      expertise_areas: { type: 'text' },
      bio: { type: 'text' },
      location: { type: 'keyword' },
      timezone: { type: 'keyword' },
      start_date: { type: 'date' },
      // Computed fields
      expertise_vector: { 
        type: 'dense_vector', 
        dims: 768,
        index: true,
        similarity: 'cosine'
      }
    }
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0
  }
};

// Topics index mapping
export const TOPICS_INDEX_MAPPING = {
  mappings: {
    properties: {
      topic_id: { type: 'keyword' },
      name: { 
        type: 'text',
        fields: {
          keyword: { type: 'keyword' },
          suggest: { type: 'completion' }
        }
      },
      description: { type: 'text' },
      category: { type: 'keyword' },
      teams: { type: 'keyword' },
      related_topics: { type: 'keyword' },
      popularity_score: { type: 'float' },
      created_at: { type: 'date' },
      // Computed fields
      topic_vector: { 
        type: 'dense_vector', 
        dims: 768,
        index: true,
        similarity: 'cosine'
      }
    }
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0
  }
};

// Health check function
export async function checkElasticsearchHealth(): Promise<boolean> {
  try {
    const health = await client.cluster.health();
    logger.info('Elasticsearch cluster health:', health);
    return health.status === 'green' || health.status === 'yellow';
  } catch (error) {
    logger.error('Elasticsearch health check failed:', error);
    return false;
  }
}

// Initialize indices
export async function initializeIndices(): Promise<void> {
  try {
    const indices = [
      { name: INDICES.DOCUMENTS, mapping: DOCUMENT_INDEX_MAPPING },
      { name: INDICES.MESSAGES, mapping: MESSAGE_INDEX_MAPPING },
      { name: INDICES.PEOPLE, mapping: PEOPLE_INDEX_MAPPING },
      { name: INDICES.TOPICS, mapping: TOPICS_INDEX_MAPPING },
    ];

    for (const index of indices) {
      const exists = await client.indices.exists({ index: index.name });
      
      if (!exists) {
        await client.indices.create({
          index: index.name,
          body: index.mapping,
        });
        logger.info(`Created index: ${index.name}`);
      } else {
        logger.info(`Index already exists: ${index.name}`);
      }
    }

    logger.info('All Elasticsearch indices initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Elasticsearch indices:', error);
    throw error;
  }
}

export { client as elasticsearchClient };