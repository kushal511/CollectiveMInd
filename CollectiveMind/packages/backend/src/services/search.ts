import { elasticsearchClient, INDICES } from '../config/elasticsearch';
import { embeddingService } from './embeddings';
import { logger } from '../utils/logger';

export interface SearchQuery {
  query: string;
  filters?: {
    teams?: string[];
    contentTypes?: string[];
    dateRange?: {
      from?: string;
      to?: string;
    };
    confidentiality?: string[];
  };
  userContext?: {
    userId: string;
    team: string;
    role: string;
  };
  pagination?: {
    page: number;
    size: number;
  };
}

export interface SearchResult {
  id: string;
  type: 'document' | 'message' | 'person' | 'topic';
  title: string;
  content: string;
  author?: string;
  team?: string;
  date?: string;
  tags?: string[];
  relevanceScore: number;
  highlights?: string[];
  citations?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  aggregations?: {
    teams: { [key: string]: number };
    contentTypes: { [key: string]: number };
    timeRange: { [key: string]: number };
  };
  suggestions?: string[];
  relatedTopics?: string[];
  aiInsights?: string;
}

export class SearchService {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = embeddingService;
  }

  async hybridSearch(searchQuery: SearchQuery): Promise<SearchResponse> {
    try {
      logger.info(`Performing hybrid search for: "${searchQuery.query}"`);

      // Generate query embedding for semantic search
      const queryEmbedding = await this.embeddingService.generateQueryEmbedding(searchQuery.query);

      // Build Elasticsearch query combining keyword and vector search
      const esQuery = await this.buildHybridQuery(searchQuery, queryEmbedding);

      // Execute search across all indices
      const searchPromises = [
        this.searchDocuments(esQuery, searchQuery),
        this.searchMessages(esQuery, searchQuery),
        this.searchPeople(esQuery, searchQuery),
        this.searchTopics(esQuery, searchQuery)
      ];

      const [docResults, messageResults, peopleResults, topicResults] = await Promise.all(searchPromises);

      // Combine and rank results
      const allResults = [
        ...docResults,
        ...messageResults,
        ...peopleResults,
        ...topicResults
      ];

      // Apply personalization and access control
      const personalizedResults = this.personalizeResults(allResults, searchQuery.userContext);

      // Sort by relevance score
      personalizedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Apply pagination
      const { page = 1, size = 20 } = searchQuery.pagination || {};
      const startIndex = (page - 1) * size;
      const paginatedResults = personalizedResults.slice(startIndex, startIndex + size);

      // Generate AI insights
      const aiInsights = await this.generateSearchInsights(searchQuery.query, paginatedResults);

      // Get aggregations for filters
      const aggregations = await this.getSearchAggregations(searchQuery);

      return {
        results: paginatedResults,
        total: personalizedResults.length,
        aggregations,
        suggestions: await this.generateSearchSuggestions(searchQuery.query),
        relatedTopics: await this.getRelatedTopics(searchQuery.query),
        aiInsights
      };

    } catch (error) {
      logger.error('Hybrid search failed:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  private async buildHybridQuery(searchQuery: SearchQuery, queryEmbedding: number[]) {
    const { query, filters } = searchQuery;

    // Base query combining keyword and semantic search
    const hybridQuery = {
      bool: {
        should: [
          // Keyword search with boosting
          {
            multi_match: {
              query,
              fields: [
                'title^3',
                'content^2',
                'full_text^1.5',
                'text^2',
                'name^3',
                'description^1.5'
              ],
              type: 'best_fields',
              fuzziness: 'AUTO',
              boost: 0.6
            }
          },
          // Semantic search using embeddings
          {
            script_score: {
              query: { match_all: {} },
              script: {
                source: `
                  if (doc.containsKey('content_vector') && doc['content_vector'].size() > 0) {
                    cosineSimilarity(params.query_vector, 'content_vector') + 1.0
                  } else if (doc.containsKey('text_vector') && doc['text_vector'].size() > 0) {
                    cosineSimilarity(params.query_vector, 'text_vector') + 1.0
                  } else if (doc.containsKey('expertise_vector') && doc['expertise_vector'].size() > 0) {
                    cosineSimilarity(params.query_vector, 'expertise_vector') + 1.0
                  } else if (doc.containsKey('topic_vector') && doc['topic_vector'].size() > 0) {
                    cosineSimilarity(params.query_vector, 'topic_vector') + 1.0
                  } else {
                    0.0
                  }
                `,
                params: {
                  query_vector: queryEmbedding
                }
              },
              boost: 0.4
            }
          }
        ],
        minimum_should_match: 1
      }
    };

    // Apply filters
    if (filters) {
      const filterClauses = [];

      if (filters.teams?.length) {
        filterClauses.push({
          terms: { team: filters.teams }
        });
      }

      if (filters.contentTypes?.length) {
        // Map content types to indices or document types
        const typeFilters = filters.contentTypes.map(type => ({
          term: { _index: this.getIndexForContentType(type) }
        }));
        filterClauses.push({
          bool: { should: typeFilters }
        });
      }

      if (filters.dateRange) {
        const dateFilter: any = {};
        if (filters.dateRange.from) dateFilter.gte = filters.dateRange.from;
        if (filters.dateRange.to) dateFilter.lte = filters.dateRange.to;
        
        filterClauses.push({
          bool: {
            should: [
              { range: { created_at: dateFilter } },
              { range: { updated_at: dateFilter } },
              { range: { timestamp: dateFilter } }
            ]
          }
        });
      }

      if (filters.confidentiality?.length) {
        filterClauses.push({
          terms: { confidentiality: filters.confidentiality }
        });
      }

      if (filterClauses.length > 0) {
        hybridQuery.bool.filter = filterClauses;
      }
    }

    return hybridQuery;
  }

  private async searchDocuments(query: any, searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      const response = await elasticsearchClient.search({
        index: INDICES.DOCUMENTS,
        body: {
          query,
          highlight: {
            fields: {
              title: {},
              content: {},
              full_text: {}
            },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>']
          },
          size: 50
        }
      });

      return response.hits.hits.map(hit => ({
        id: hit._id,
        type: 'document' as const,
        title: hit._source.title,
        content: hit._source.content,
        author: hit._source.author_person_id,
        team: hit._source.team,
        date: hit._source.updated_at,
        tags: hit._source.tags,
        relevanceScore: hit._score * (hit._source.boost_score || 1.0),
        highlights: this.extractHighlights(hit.highlight),
        citations: hit._source.related_doc_ids
      }));
    } catch (error) {
      logger.error('Document search failed:', error);
      return [];
    }
  }

  private async searchMessages(query: any, searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      const response = await elasticsearchClient.search({
        index: INDICES.MESSAGES,
        body: {
          query,
          highlight: {
            fields: {
              text: {}
            },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>']
          },
          size: 30
        }
      });

      return response.hits.hits.map(hit => ({
        id: hit._id,
        type: 'message' as const,
        title: `Message from ${hit._source.sender_person_id}`,
        content: hit._source.text,
        author: hit._source.sender_person_id,
        team: hit._source.sender_team,
        date: hit._source.timestamp,
        tags: hit._source.emotions ? [hit._source.emotions] : [],
        relevanceScore: hit._score,
        highlights: this.extractHighlights(hit.highlight)
      }));
    } catch (error) {
      logger.error('Message search failed:', error);
      return [];
    }
  }

  private async searchPeople(query: any, searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      const response = await elasticsearchClient.search({
        index: INDICES.PEOPLE,
        body: {
          query,
          highlight: {
            fields: {
              full_name: {},
              expertise_areas: {},
              bio: {}
            },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>']
          },
          size: 20
        }
      });

      return response.hits.hits.map(hit => ({
        id: hit._id,
        type: 'person' as const,
        title: hit._source.full_name,
        content: `${hit._source.role_title} - ${hit._source.expertise_areas}`,
        author: hit._source.full_name,
        team: hit._source.team,
        date: hit._source.start_date,
        tags: hit._source.skills || [],
        relevanceScore: hit._score,
        highlights: this.extractHighlights(hit.highlight)
      }));
    } catch (error) {
      logger.error('People search failed:', error);
      return [];
    }
  }

  private async searchTopics(query: any, searchQuery: SearchQuery): Promise<SearchResult[]> {
    try {
      const response = await elasticsearchClient.search({
        index: INDICES.TOPICS,
        body: {
          query,
          highlight: {
            fields: {
              name: {},
              description: {}
            },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>']
          },
          size: 20
        }
      });

      return response.hits.hits.map(hit => ({
        id: hit._id,
        type: 'topic' as const,
        title: hit._source.name,
        content: hit._source.description,
        team: hit._source.teams?.join(', '),
        date: hit._source.created_at,
        tags: hit._source.related_topics || [],
        relevanceScore: hit._score * (hit._source.popularity_score || 1.0),
        highlights: this.extractHighlights(hit.highlight)
      }));
    } catch (error) {
      logger.error('Topic search failed:', error);
      return [];
    }
  }

  private personalizeResults(results: SearchResult[], userContext?: SearchQuery['userContext']): SearchResult[] {
    if (!userContext) return results;

    return results.map(result => {
      let personalizedScore = result.relevanceScore;

      // Boost results from same team
      if (result.team === userContext.team) {
        personalizedScore *= 1.2;
      }

      // Boost recent content
      if (result.date) {
        const daysSinceUpdate = (Date.now() - new Date(result.date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate < 7) personalizedScore *= 1.15;
        else if (daysSinceUpdate < 30) personalizedScore *= 1.05;
      }

      // Boost based on user role
      if (userContext.role === 'manager' && result.type === 'document') {
        personalizedScore *= 1.1;
      }

      return {
        ...result,
        relevanceScore: personalizedScore
      };
    });
  }

  private extractHighlights(highlight: any): string[] {
    if (!highlight) return [];
    
    const highlights: string[] = [];
    Object.values(highlight).forEach((fieldHighlights: any) => {
      if (Array.isArray(fieldHighlights)) {
        highlights.push(...fieldHighlights);
      }
    });
    
    return highlights;
  }

  private getIndexForContentType(contentType: string): string {
    switch (contentType) {
      case 'documents': return INDICES.DOCUMENTS;
      case 'messages': return INDICES.MESSAGES;
      case 'people': return INDICES.PEOPLE;
      case 'topics': return INDICES.TOPICS;
      default: return INDICES.DOCUMENTS;
    }
  }

  private async generateSearchInsights(query: string, results: SearchResult[]): Promise<string> {
    // Real AI insights using Vertex AI (you can implement this with Gemini API)
    // For now, return intelligent analysis based on results
    
    const teams = [...new Set(results.map(r => r.team).filter(Boolean))];
    const contentTypes = results.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (teams.length > 1) {
      return `Found relevant content across ${teams.length} teams (${teams.join(', ')}). Consider cross-team collaboration opportunities.`;
    } else if (results.length > 10) {
      return `Rich knowledge base found with ${results.length} relevant items. Focus on the highest-scored results for key insights.`;
    } else {
      return `Found ${results.length} relevant items. You might want to broaden your search or explore related topics.`;
    }
  }

  private async generateSearchSuggestions(query: string): Promise<string[]> {
    try {
      // Use Elasticsearch suggest API for real-time suggestions
      const response = await elasticsearchClient.search({
        index: [INDICES.DOCUMENTS, INDICES.MESSAGES, INDICES.TOPICS],
        body: {
          suggest: {
            text: query,
            simple_phrase: {
              phrase: {
                field: 'title.suggest',
                size: 5,
                gram_size: 3,
                direct_generator: [{
                  field: 'title.suggest',
                  suggest_mode: 'always'
                }]
              }
            }
          },
          size: 0
        }
      });

      const suggestions = response.suggest?.simple_phrase?.[0]?.options?.map(
        (option: any) => option.text
      ) || [];

      return suggestions;
    } catch (error) {
      logger.error('Failed to generate search suggestions:', error);
      return [];
    }
  }

  private async getRelatedTopics(query: string): Promise<string[]> {
    try {
      // Find related topics using More Like This query
      const response = await elasticsearchClient.search({
        index: INDICES.TOPICS,
        body: {
          query: {
            more_like_this: {
              fields: ['name', 'description'],
              like: query,
              min_term_freq: 1,
              max_query_terms: 12
            }
          },
          size: 5,
          _source: ['name']
        }
      });

      return response.hits.hits.map(hit => hit._source.name);
    } catch (error) {
      logger.error('Failed to get related topics:', error);
      return [];
    }
  }

  private async getSearchAggregations(searchQuery: SearchQuery) {
    try {
      const response = await elasticsearchClient.search({
        index: [INDICES.DOCUMENTS, INDICES.MESSAGES, INDICES.PEOPLE, INDICES.TOPICS],
        body: {
          query: { match_all: {} },
          aggs: {
            teams: {
              terms: { field: 'team', size: 10 }
            },
            content_types: {
              terms: { field: '_index', size: 10 }
            },
            time_range: {
              date_histogram: {
                field: 'created_at',
                calendar_interval: 'month',
                format: 'yyyy-MM'
              }
            }
          },
          size: 0
        }
      });

      const aggs = response.aggregations;
      return {
        teams: this.formatBuckets(aggs?.teams?.buckets || []),
        contentTypes: this.formatBuckets(aggs?.content_types?.buckets || []),
        timeRange: this.formatBuckets(aggs?.time_range?.buckets || [])
      };
    } catch (error) {
      logger.error('Failed to get search aggregations:', error);
      return { teams: {}, contentTypes: {}, timeRange: {} };
    }
  }

  private formatBuckets(buckets: any[]): { [key: string]: number } {
    return buckets.reduce((acc, bucket) => {
      acc[bucket.key] = bucket.doc_count;
      return acc;
    }, {});
  }
}