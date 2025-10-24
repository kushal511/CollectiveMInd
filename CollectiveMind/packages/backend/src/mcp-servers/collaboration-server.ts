#!/usr/bin/env node

/**
 * Collaboration MCP Server for CollectiveMind
 * Handles team collaboration, meeting scheduling, and workspace management
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import Redis from 'redis';
import { logger } from '../utils/logger';

class CollaborationServer {
  private server: Server;
  private redis: any;

  constructor() {
    this.server = new Server(
      {
        name: 'collaboration-tools',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.initializeRedis();
    this.setupToolHandlers();
  }

  private async initializeRedis() {
    this.redis = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await this.redis.connect();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'schedule_meeting',
            description: 'Schedule a cross-team collaboration meeting',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Meeting title' },
                participants: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of participant IDs or team names'
                },
                duration: { type: 'number', default: 60, description: 'Duration in minutes' },
                topic: { type: 'string', description: 'Meeting topic or agenda' },
                urgency: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
                userContext: { type: 'object' }
              },
              required: ['title', 'participants', 'topic', 'userContext']
            }
          },
          {
            name: 'create_shared_workspace',
            description: 'Create a shared workspace for cross-team collaboration',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Workspace name' },
                description: { type: 'string', description: 'Workspace description' },
                teams: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Teams to include in workspace'
                },
                privacy: { type: 'string', enum: ['public', 'private', 'restricted'], default: 'private' },
                userContext: { type: 'object' }
              },
              required: ['name', 'teams', 'userContext']
            }
          },
          {
            name: 'find_available_experts',
            description: 'Find available experts in specific topics or skills',
            inputSchema: {
              type: 'object',
              properties: {
                topic: { type: 'string', description: 'Topic or skill area' },
                teams: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Teams to search in (optional)'
                },
                availability: { type: 'string', enum: ['now', 'today', 'this_week'], default: 'this_week' },
                maxResults: { type: 'number', default: 5 },
                userContext: { type: 'object' }
              },
              required: ['topic', 'userContext']
            }
          },
          {
            name: 'send_team_notification',
            description: 'Send notifications to team members about collaboration opportunities',
            inputSchema: {
              type: 'object',
              properties: {
                recipients: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Recipient user IDs or team names'
                },
                message: { type: 'string', description: 'Notification message' },
                type: { type: 'string', enum: ['opportunity', 'meeting', 'update', 'urgent'], default: 'opportunity' },
                actionUrl: { type: 'string', description: 'Optional action URL' },
                userContext: { type: 'object' }
              },
              required: ['recipients', 'message', 'userContext']
            }
          },
          {
            name: 'get_team_relationships',
            description: 'Analyze relationships and collaboration patterns between teams',
            inputSchema: {
              type: 'object',
              properties: {
                userTeam: { type: 'string', description: 'User\'s team' },
                analysisDepth: { type: 'string', enum: ['shallow', 'deep'], default: 'shallow' },
                timeWindow: { type: 'string', default: '30d' },
                userContext: { type: 'object' }
              },
              required: ['userTeam', 'userContext']
            }
          },
          {
            name: 'track_collaboration_success',
            description: 'Track and measure collaboration success metrics',
            inputSchema: {
              type: 'object',
              properties: {
                collaborationId: { type: 'string', description: 'Collaboration or workspace ID' },
                metrics: { 
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Metrics to track'
                },
                userContext: { type: 'object' }
              },
              required: ['collaborationId', 'userContext']
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
          case 'schedule_meeting':
            return await this.scheduleMeeting(args);
          case 'create_shared_workspace':
            return await this.createSharedWorkspace(args);
          case 'find_available_experts':
            return await this.findAvailableExperts(args);
          case 'send_team_notification':
            return await this.sendTeamNotification(args);
          case 'get_team_relationships':
            return await this.getTeamRelationships(args);
          case 'track_collaboration_success':
            return await this.trackCollaborationSuccess(args);
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

  private async scheduleMeeting(args: any) {
    const { title, participants, duration, topic, urgency, userContext } = args;
    
    // Generate meeting ID
    const meetingId = `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Find optimal meeting time (simplified algorithm)
    const suggestedTimes = await this.findOptimalMeetingTimes(participants, duration);
    
    // Store meeting proposal
    const meetingData = {
      id: meetingId,
      title,
      participants,
      duration,
      topic,
      urgency,
      organizer: userContext.userId,
      organizerTeam: userContext.team,
      suggestedTimes,
      status: 'proposed',
      createdAt: new Date().toISOString()
    };

    await this.redis.setEx(`meeting:${meetingId}`, 86400, JSON.stringify(meetingData)); // 24h TTL
    
    // Send notifications to participants
    await this.notifyMeetingParticipants(meetingData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            meetingId,
            status: 'scheduled',
            suggestedTimes,
            message: `Meeting "${title}" proposed with ${participants.length} participants`,
            actionUrl: `/meetings/${meetingId}`,
            estimatedResponse: '2-4 hours'
          }, null, 2)
        }
      ]
    };
  }

  private async createSharedWorkspace(args: any) {
    const { name, description, teams, privacy, userContext } = args;
    
    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const workspaceData = {
      id: workspaceId,
      name,
      description,
      teams,
      privacy,
      creator: userContext.userId,
      creatorTeam: userContext.team,
      members: [userContext.userId],
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    await this.redis.setEx(`workspace:${workspaceId}`, 2592000, JSON.stringify(workspaceData)); // 30 days TTL
    
    // Add to team workspaces
    for (const team of teams) {
      await this.redis.sAdd(`team:${team}:workspaces`, workspaceId);
    }

    // Send invitations to teams
    await this.sendWorkspaceInvitations(workspaceData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            workspaceId,
            status: 'created',
            message: `Shared workspace "${name}" created for ${teams.length} teams`,
            actionUrl: `/workspaces/${workspaceId}`,
            invitationsSent: teams.length
          }, null, 2)
        }
      ]
    };
  }

  private async findAvailableExperts(args: any) {
    const { topic, teams, availability, maxResults, userContext } = args;
    
    // Mock expert finding (in real implementation, this would query user profiles and skills)
    const experts = await this.searchExperts(topic, teams, availability);
    
    // Rank experts by relevance and availability
    const rankedExperts = experts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            experts: rankedExperts,
            searchCriteria: { topic, teams, availability },
            totalFound: experts.length,
            message: `Found ${rankedExperts.length} available experts in "${topic}"`
          }, null, 2)
        }
      ]
    };
  }

  private async sendTeamNotification(args: any) {
    const { recipients, message, type, actionUrl, userContext } = args;
    
    const notificationId = `notification_${Date.now()}`;
    
    const notificationData = {
      id: notificationId,
      recipients,
      message,
      type,
      actionUrl,
      sender: userContext.userId,
      senderTeam: userContext.team,
      sentAt: new Date().toISOString()
    };

    // Store notification
    await this.redis.setEx(`notification:${notificationId}`, 604800, JSON.stringify(notificationData)); // 7 days TTL
    
    // Send to each recipient
    for (const recipient of recipients) {
      await this.redis.lPush(`user:${recipient}:notifications`, notificationId);
      await this.redis.lTrim(`user:${recipient}:notifications`, 0, 99); // Keep last 100
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            notificationId,
            status: 'sent',
            recipientCount: recipients.length,
            message: `Notification sent to ${recipients.length} recipients`,
            type
          }, null, 2)
        }
      ]
    };
  }

  private async getTeamRelationships(args: any) {
    const { userTeam, analysisDepth, timeWindow, userContext } = args;
    
    // Analyze team collaboration patterns
    const relationships = await this.analyzeTeamRelationships(userTeam, timeWindow, analysisDepth);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            teamRelationships: relationships,
            analysisMetadata: {
              userTeam,
              analysisDepth,
              timeWindow,
              analyzedAt: new Date().toISOString()
            }
          }, null, 2)
        }
      ]
    };
  }

  private async trackCollaborationSuccess(args: any) {
    const { collaborationId, metrics, userContext } = args;
    
    // Track collaboration metrics
    const successMetrics = await this.calculateCollaborationMetrics(collaborationId, metrics);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            collaborationId,
            successMetrics,
            recommendations: this.generateImprovementRecommendations(successMetrics),
            trackedAt: new Date().toISOString()
          }, null, 2)
        }
      ]
    };
  }

  // Helper methods
  private async findOptimalMeetingTimes(participants: string[], duration: number) {
    // Mock implementation - in reality, this would check calendars
    const now = new Date();
    const suggestedTimes = [];
    
    for (let i = 1; i <= 3; i++) {
      const time = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      time.setHours(10 + i, 0, 0, 0); // 10 AM, 11 AM, 12 PM
      
      suggestedTimes.push({
        datetime: time.toISOString(),
        confidence: 0.8 - (i * 0.1),
        availableParticipants: Math.floor(participants.length * (0.9 - i * 0.1))
      });
    }
    
    return suggestedTimes;
  }

  private async notifyMeetingParticipants(meetingData: any) {
    // Send notifications to all participants
    for (const participant of meetingData.participants) {
      const notification = {
        type: 'meeting_invitation',
        meetingId: meetingData.id,
        title: meetingData.title,
        organizer: meetingData.organizer
      };
      
      await this.redis.lPush(`user:${participant}:notifications`, JSON.stringify(notification));
    }
  }

  private async sendWorkspaceInvitations(workspaceData: any) {
    // Send workspace invitations to teams
    for (const team of workspaceData.teams) {
      const invitation = {
        type: 'workspace_invitation',
        workspaceId: workspaceData.id,
        name: workspaceData.name,
        creator: workspaceData.creator
      };
      
      await this.redis.lPush(`team:${team}:invitations`, JSON.stringify(invitation));
    }
  }

  private async searchExperts(topic: string, teams?: string[], availability?: string) {
    // Mock expert search - in reality, this would query user profiles and skills
    const mockExperts = [
      {
        userId: 'expert_001',
        name: 'Sarah Johnson',
        team: 'Engineering',
        expertise: ['machine learning', 'data analysis', 'python'],
        relevanceScore: 0.95,
        availability: 'this_week',
        responseTime: '2-4 hours'
      },
      {
        userId: 'expert_002',
        name: 'Mike Chen',
        team: 'Product',
        expertise: ['product strategy', 'user research', 'analytics'],
        relevanceScore: 0.87,
        availability: 'today',
        responseTime: '1-2 hours'
      },
      {
        userId: 'expert_003',
        name: 'Lisa Rodriguez',
        team: 'Marketing',
        expertise: ['customer analysis', 'market research', 'campaigns'],
        relevanceScore: 0.82,
        availability: 'this_week',
        responseTime: '4-6 hours'
      }
    ];

    // Filter by teams if specified
    if (teams && teams.length > 0) {
      return mockExperts.filter(expert => teams.includes(expert.team));
    }

    return mockExperts;
  }

  private async analyzeTeamRelationships(userTeam: string, timeWindow: string, depth: string) {
    // Mock team relationship analysis
    return {
      strongRelationships: [
        { team: 'Engineering', strength: 0.85, collaborationCount: 23, lastCollaboration: '2024-10-20' },
        { team: 'Design', strength: 0.72, collaborationCount: 15, lastCollaboration: '2024-10-18' }
      ],
      emergingRelationships: [
        { team: 'Finance', strength: 0.45, collaborationCount: 3, lastCollaboration: '2024-10-15' }
      ],
      recommendedConnections: [
        { team: 'HR', reason: 'Similar project interests', confidence: 0.68 }
      ]
    };
  }

  private async calculateCollaborationMetrics(collaborationId: string, metrics: string[]) {
    // Mock collaboration metrics calculation
    return {
      engagement: 0.78,
      productivity: 0.82,
      satisfaction: 0.85,
      knowledgeSharing: 0.73,
      crossTeamConnections: 12,
      documentsCreated: 8,
      meetingsHeld: 5
    };
  }

  private generateImprovementRecommendations(metrics: any) {
    const recommendations = [];
    
    if (metrics.engagement < 0.7) {
      recommendations.push('Increase engagement through regular check-ins and interactive sessions');
    }
    
    if (metrics.knowledgeSharing < 0.8) {
      recommendations.push('Implement structured knowledge sharing sessions');
    }
    
    if (metrics.crossTeamConnections < 10) {
      recommendations.push('Facilitate more cross-team introductions and networking');
    }
    
    return recommendations;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Collaboration MCP Server running on stdio');
  }
}

// Run the server
const server = new CollaborationServer();
server.run().catch(console.error);