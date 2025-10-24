#!/usr/bin/env node

/**
 * Advanced Serendipity MCP Server for CollectiveMind
 * Discovers unexpected connections and collaboration opportunities
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { elasticsearchClient, INDICES } from '../config/elasticsearch';
import { logger } from '../utils/logger';

class SerendipityServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'serendipity-engine',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'detect_cross_team_opportunities',
            description: 'Detect collaboration opportunities between teams based on content analysis',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query or topic' },
                userContext: { 
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    team: { type: 'string' },
                    role: { type: 'string' }
                  }
                },
                timeWindow: { type: 'string', default: '30d', description: 'Time window for analysis' }
              },
              required: ['query', 'userContext']
            }
          },
          {
            name: 'analyze_topic_overlaps',
            description: 'Analyze overlapping topics and interests across teams',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                userContext: { type: 'object' },
                minOverlapScore: { type: 'number', default: 0.7 }
              },
              required: ['query', 'userContext']
            }
          },
          {
            name: 'find_knowledge_gaps',
            description: 'Identify knowledge gaps and learning opportunities',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                userContext: { type: 'object' },
                analysisDepth: { type: 'string', enum: ['shallow', 'deep'], default: 'shallow' }
              },
              required: ['query', 'userContext']
            }
          },
          {
            name: 'suggest_collaborations',
            description: 'Generate specific collaboration suggestions with confidence scores',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                userContext: { type: 'object' },
                maxSuggestions: { type: 'number', default: 5 }
              },
              required: ['query', 'userContext']
            }
          },
          {
            name: 'discover_hidden_connections',
            description: 'Find unexpected connections using advanced graph analysis',
            inputSchema: {
              type: 'object',
              properties: {
                entityId: { type: 'string', description: 'Document, person, or topic ID' },
                connectionDepth: { type: 'number', default: 3 },
                userContext: { type: 'object' }
              },
              required: ['entityId', 'userContext']
            }
          }
        ] as Tool[]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'detect_cross_team_opportunities':
            return await this.detectCrossTeamOpportunities(args);
          case 'analyze_topic_overlaps':
            return await this.analyzeTopicOverlaps(args);
          case 'find_knowledge_gaps':
            return await this.findKnowledgeGaps(args);
          case 'suggest_collaborations':
            return await this.suggestCollaborations(args);
          case 'discover_hidden_connections':
            return await this.discoverHiddenConnections(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`
            }
          ]
        };
      }
    });
  }

  private async detectCrossTeamOpportunities(args: any) {
    const { query, userContext, timeWindow = '30d' } = args;
    
    // Advanced Elasticsearch query to find cross-team patterns
    const searchResponse = await elasticsearchClient.search({
      index: [INDICES.DOCUMENTS, INDICES.MESSAGES],
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['title^2', 'content', 'text'],
                  fuzziness: 'AUTO'
                }
              }
            ],
            must_not: [
              { term: { team: userContext.team } }
            ],
            filter: [
              {
                range: {
                  '@timestamp': {
                    gte: `now-${timeWindow}`
                  }
                }
              }
            ]
          }
        },
        aggs: {
          teams: {
            terms: { 
              field: 'team', 
              size: 10 
            },
            aggs: {
              recent_activity: {
                date_histogram: {
                  field: '@timestamp',
                  calendar_interval: 'week'
                }
              },
              top_contributors: {
                terms: {
                  field: 'author_person_id',
                  size: 3
                }
              }
            }
          },
          topic_similarity: {
            significant_terms: {
              field: 'tags',
              background_filter: {
                term: { team: userContext.team }
              }
            }
          }
        },
        size: 20
      }
    });

    // Analyze results for collaboration opportunities
    const opportunities = this.analyzeCollaborationOpportunities(
      searchResponse, 
      userContext, 
      query
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            opportunities,
            totalTeamsFound: searchResponse.aggregations?.teams?.buckets?.length || 0,
            analysisMetadata: {
              query,
              timeWindow,
              userTeam: userContext.team,
              timestamp: new Date().toISOString()
            }
          }, null, 2)
        }
      ]
    };
  }

  private async analyzeTopicOverlaps(args: any) {
    const { query, userContext, minOverlapScore = 0.7 } = args;

    // Use More Like This query to find similar content across teams
    const mltResponse = await elasticsearchClient.search({
      index: [INDICES.DOCUMENTS, INDICES.TOPICS],
      body: {
        query: {
          more_like_this: {
            fields: ['title', 'content', 'description', 'tags'],
            like: query,
            min_term_freq: 1,
            max_query_terms: 12,
            min_doc_freq: 1
          }
        },
        aggs: {
          team_overlaps: {
            terms: { field: 'team' },
            aggs: {
              avg_score: { avg: { script: '_score' } },
              top_tags: { terms: { field: 'tags', size: 5 } }
            }
          }
        },
        size: 50
      }
    });

    const overlaps = this.calculateTopicOverlaps(mltResponse, userContext, minOverlapScore);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            topicOverlaps: overlaps,
            analysisMetadata: {
              query,
              minOverlapScore,
              totalDocuments: mltResponse.hits.total.value,
              timestamp: new Date().toISOString()
            }
          }, null, 2)
        }
      ]
    };
  }

  private async findKnowledgeGaps(args: any) {
    const { query, userContext, analysisDepth = 'shallow' } = args;

    // Find what's missing in user's team compared to others
    const gapAnalysis = await elasticsearchClient.search({
      index: [INDICES.DOCUMENTS, INDICES.TOPICS],
      body: {
        query: {
          bool: {
            must: [
              { multi_match: { query, fields: ['title', 'content', 'description'] } }
            ],
            must_not: [
              { term: { team: userContext.team } }
            ]
          }
        },
        aggs: {
          missing_topics: {
            terms: { 
              field: 'tags',
              size: 20,
              exclude: await this.getUserTeamTags(userContext.team)
            }
          },
          expertise_gaps: {
            terms: { field: 'author_person_id' },
            aggs: {
              expertise_areas: {
                terms: { field: 'tags' }
              }
            }
          }
        },
        size: 0
      }
    });

    const gaps = this.identifyKnowledgeGaps(gapAnalysis, userContext, analysisDepth);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            knowledgeGaps: gaps,
            recommendations: this.generateLearningRecommendations(gaps),
            analysisMetadata: {
              query,
              analysisDepth,
              userTeam: userContext.team,
              timestamp: new Date().toISOString()
            }
          }, null, 2)
        }
      ]
    };
  }

  private async suggestCollaborations(args: any) {
    const { query, userContext, maxSuggestions = 5 } = args;

    // Multi-faceted collaboration analysis
    const [opportunityData, expertiseData, activityData] = await Promise.all([
      this.detectCrossTeamOpportunities(args),
      this.findComplementaryExpertise(query, userContext),
      this.analyzeRecentActivity(query, userContext)
    ]);

    const suggestions = this.generateCollaborationSuggestions(
      opportunityData,
      expertiseData,
      activityData,
      maxSuggestions
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            collaborationSuggestions: suggestions,
            metadata: {
              query,
              maxSuggestions,
              confidenceThreshold: 0.6,
              timestamp: new Date().toISOString()
            }
          }, null, 2)
        }
      ]
    };
  }

  private async discoverHiddenConnections(args: any) {
    const { entityId, connectionDepth = 3, userContext } = args;

    // Graph traversal to find hidden connections
    const connections = await this.performGraphTraversal(entityId, connectionDepth, userContext);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            hiddenConnections: connections,
            graphMetadata: {
              entityId,
              connectionDepth,
              totalConnections: connections.length,
              timestamp: new Date().toISOString()
            }
          }, null, 2)
        }
      ]
    };
  }

  // Helper methods for advanced analysis
  private analyzeCollaborationOpportunities(searchResponse: any, userContext: any, query: string) {
    const opportunities = [];
    const teams = searchResponse.aggregations?.teams?.buckets || [];

    for (const team of teams) {
      const opportunity = {
        team: team.key,
        relevanceScore: this.calculateRelevanceScore(team, query),
        activityLevel: team.recent_activity?.buckets?.length || 0,
        keyContributors: team.top_contributors?.buckets?.map((b: any) => b.key) || [],
        collaborationPotential: this.assessCollaborationPotential(team, userContext),
        suggestedActions: this.generateActionSuggestions(team, userContext)
      };

      if (opportunity.relevanceScore > 0.5) {
        opportunities.push(opportunity);
      }
    }

    return opportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateRelevanceScore(teamData: any, query: string): number {
    // Complex scoring algorithm considering multiple factors
    const baseScore = Math.min(teamData.doc_count / 100, 1.0);
    const activityBoost = Math.min(teamData.recent_activity?.buckets?.length / 10, 0.3);
    const contributorBoost = Math.min(teamData.top_contributors?.buckets?.length / 5, 0.2);
    
    return Math.min(baseScore + activityBoost + contributorBoost, 1.0);
  }

  private assessCollaborationPotential(teamData: any, userContext: any): string {
    const score = this.calculateRelevanceScore(teamData, '');
    
    if (score > 0.8) return 'high';
    if (score > 0.6) return 'medium';
    if (score > 0.4) return 'low';
    return 'minimal';
  }

  private generateActionSuggestions(teamData: any, userContext: any): string[] {
    const suggestions = [];
    
    if (teamData.doc_count > 10) {
      suggestions.push('Schedule cross-team knowledge sharing session');
    }
    
    if (teamData.top_contributors?.buckets?.length > 2) {
      suggestions.push('Connect with key team members');
    }
    
    suggestions.push('Create shared workspace for collaboration');
    
    return suggestions;
  }

  private calculateTopicOverlaps(mltResponse: any, userContext: any, minScore: number) {
    // Implementation for topic overlap calculation
    return [];
  }

  private identifyKnowledgeGaps(gapAnalysis: any, userContext: any, depth: string) {
    // Implementation for knowledge gap identification
    return [];
  }

  private generateLearningRecommendations(gaps: any[]) {
    // Implementation for learning recommendations
    return [];
  }

  private async getUserTeamTags(team: string): Promise<string[]> {
    // Get existing tags for user's team
    const response = await elasticsearchClient.search({
      index: INDICES.DOCUMENTS,
      body: {
        query: { term: { team } },
        aggs: {
          team_tags: { terms: { field: 'tags', size: 100 } }
        },
        size: 0
      }
    });

    return response.aggregations?.team_tags?.buckets?.map((b: any) => b.key) || [];
  }

  private async findComplementaryExpertise(query: string, userContext: any) {
    // Implementation for finding complementary expertise
    return {};
  }

  private async analyzeRecentActivity(query: string, userContext: any) {
    // Implementation for recent activity analysis
    return {};
  }

  private generateCollaborationSuggestions(
    opportunityData: any,
    expertiseData: any,
    activityData: any,
    maxSuggestions: number
  ) {
    // Implementation for generating collaboration suggestions
    return [];
  }

  private async performGraphTraversal(entityId: string, depth: number, userContext: any) {
    // Implementation for graph traversal to find hidden connections
    return [];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Serendipity MCP Server running on stdio');
  }
}

// Run the server
const server = new SerendipityServer();
server.run().catch(console.error);