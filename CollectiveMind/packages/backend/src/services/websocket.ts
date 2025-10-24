import { Server as SocketIOServer, Socket } from 'socket.io';
import { AIChatService, ChatContext } from './ai-chat';
import { SearchService } from './search';
import { logger } from '../utils/logger';

export class WebSocketService {
  private io: SocketIOServer;
  private aiChatService: AIChatService;
  private searchService: SearchService;
  private activeConnections = new Map<string, Socket>();
  private userSessions = new Map<string, any>();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.aiChatService = new AIChatService();
    this.searchService = new SearchService();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);
      this.activeConnections.set(socket.id, socket);

      // Authentication and user context setup
      socket.on('authenticate', (data) => {
        this.handleAuthentication(socket, data);
      });

      // Real-time search
      socket.on('search:start', (data) => {
        this.handleSearchStart(socket, data);
      });

      socket.on('search:refine', (data) => {
        this.handleSearchRefine(socket, data);
      });

      // Real-time AI chat
      socket.on('chat:message', (data) => {
        this.handleChatMessage(socket, data);
      });

      socket.on('chat:typing', (data) => {
        this.handleTypingIndicator(socket, data);
      });

      // Real-time notifications
      socket.on('notifications:subscribe', (data) => {
        this.handleNotificationSubscription(socket, data);
      });

      // Collaboration features
      socket.on('collaboration:join', (data) => {
        this.handleCollaborationJoin(socket, data);
      });

      socket.on('collaboration:activity', (data) => {
        this.handleCollaborationActivity(socket, data);
      });

      // Disconnect handling
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleAuthentication(socket: Socket, data: any) {
    try {
      const { userId, team, role, token } = data;
      
      // In production, validate the JWT token here
      // For now, we'll accept the provided user context
      
      const userSession = {
        userId,
        team,
        role,
        socketId: socket.id,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      this.userSessions.set(socket.id, userSession);
      
      // Join user to their team room for team-specific notifications
      socket.join(`team:${team}`);
      socket.join(`user:${userId}`);

      socket.emit('authenticated', {
        success: true,
        userSession,
        timestamp: new Date().toISOString()
      });

      logger.info(`User authenticated: ${userId} (${team})`);

    } catch (error) {
      logger.error('Authentication failed:', error);
      socket.emit('authentication_error', {
        error: 'Authentication failed',
        message: error.message
      });
    }
  }

  private async handleSearchStart(socket: Socket, data: any) {
    try {
      const userSession = this.userSessions.get(socket.id);
      if (!userSession) {
        socket.emit('search:error', { error: 'Not authenticated' });
        return;
      }

      const { query, filters } = data;
      
      // Emit search started event
      socket.emit('search:started', {
        query,
        timestamp: new Date().toISOString()
      });

      // Perform search
      const searchResponse = await this.searchService.hybridSearch({
        query,
        filters,
        userContext: {
          userId: userSession.userId,
          team: userSession.team,
          role: userSession.role
        }
      });

      // Emit results
      socket.emit('search:results', {
        ...searchResponse,
        timestamp: new Date().toISOString()
      });

      // Update user activity
      userSession.lastActivity = new Date();

      logger.info(`Real-time search completed for ${userSession.userId}: "${query}"`);

    } catch (error) {
      logger.error('Real-time search failed:', error);
      socket.emit('search:error', {
        error: 'Search failed',
        message: error.message
      });
    }
  }

  private async handleSearchRefine(socket: Socket, data: any) {
    try {
      const userSession = this.userSessions.get(socket.id);
      if (!userSession) return;

      const { queryId, refinements } = data;
      
      // Apply refinements and re-search
      // This would typically involve modifying the original query
      // For now, we'll treat it as a new search
      
      socket.emit('search:refining', {
        queryId,
        refinements,
        timestamp: new Date().toISOString()
      });

      // Perform refined search
      const searchResponse = await this.searchService.hybridSearch({
        query: refinements.query || data.originalQuery,
        filters: refinements.filters,
        userContext: {
          userId: userSession.userId,
          team: userSession.team,
          role: userSession.role
        }
      });

      socket.emit('search:refined', {
        queryId,
        ...searchResponse,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Search refinement failed:', error);
      socket.emit('search:error', {
        error: 'Search refinement failed',
        message: error.message
      });
    }
  }

  private async handleChatMessage(socket: Socket, data: any) {
    try {
      const userSession = this.userSessions.get(socket.id);
      if (!userSession) {
        socket.emit('chat:error', { error: 'Not authenticated' });
        return;
      }

      const { message, conversationId } = data;
      
      // Create chat context
      const context: ChatContext = {
        conversationId: conversationId || `conv_${Date.now()}`,
        userId: userSession.userId,
        userTeam: userSession.team,
        userRole: userSession.role,
        messages: data.previousMessages || []
      };

      // Emit typing indicator
      socket.emit('chat:ai_typing', {
        conversationId: context.conversationId,
        typing: true
      });

      // Stream AI response in real-time
      const responseStream = this.aiChatService.streamResponse(message, context);
      
      let fullResponse = '';
      const citations: any[] = [];

      for await (const chunk of responseStream) {
        switch (chunk.type) {
          case 'token':
            fullResponse += chunk.data;
            socket.emit('chat:token', {
              conversationId: context.conversationId,
              token: chunk.data,
              timestamp: new Date().toISOString()
            });
            break;

          case 'citation':
            citations.push(chunk.data);
            socket.emit('chat:citation', {
              conversationId: context.conversationId,
              citation: chunk.data,
              timestamp: new Date().toISOString()
            });
            break;

          case 'complete':
            socket.emit('chat:complete', {
              conversationId: context.conversationId,
              messageId: chunk.data.messageId,
              fullResponse,
              citations,
              timestamp: new Date().toISOString()
            });
            break;
        }
      }

      // Stop typing indicator
      socket.emit('chat:ai_typing', {
        conversationId: context.conversationId,
        typing: false
      });

      userSession.lastActivity = new Date();

    } catch (error) {
      logger.error('Real-time chat failed:', error);
      socket.emit('chat:error', {
        error: 'Chat processing failed',
        message: error.message
      });
    }
  }

  private handleTypingIndicator(socket: Socket, data: any) {
    const userSession = this.userSessions.get(socket.id);
    if (!userSession) return;

    const { conversationId, typing } = data;
    
    // Broadcast typing indicator to other participants (if any)
    socket.broadcast.emit('chat:user_typing', {
      conversationId,
      userId: userSession.userId,
      typing,
      timestamp: new Date().toISOString()
    });
  }

  private handleNotificationSubscription(socket: Socket, data: any) {
    const userSession = this.userSessions.get(socket.id);
    if (!userSession) return;

    const { topics, teams, types } = data;
    
    // Subscribe to specific notification channels
    if (topics) {
      topics.forEach((topic: string) => {
        socket.join(`topic:${topic}`);
      });
    }

    if (teams) {
      teams.forEach((team: string) => {
        socket.join(`team:${team}`);
      });
    }

    socket.emit('notifications:subscribed', {
      topics,
      teams,
      types,
      timestamp: new Date().toISOString()
    });
  }

  private handleCollaborationJoin(socket: Socket, data: any) {
    const userSession = this.userSessions.get(socket.id);
    if (!userSession) return;

    const { workspaceId, documentId } = data;
    
    // Join collaboration room
    const roomId = `collab:${workspaceId}:${documentId}`;
    socket.join(roomId);

    // Notify other participants
    socket.to(roomId).emit('collaboration:user_joined', {
      userId: userSession.userId,
      team: userSession.team,
      timestamp: new Date().toISOString()
    });

    socket.emit('collaboration:joined', {
      workspaceId,
      documentId,
      roomId,
      timestamp: new Date().toISOString()
    });
  }

  private handleCollaborationActivity(socket: Socket, data: any) {
    const userSession = this.userSessions.get(socket.id);
    if (!userSession) return;

    const { workspaceId, documentId, activity } = data;
    const roomId = `collab:${workspaceId}:${documentId}`;

    // Broadcast activity to room participants
    socket.to(roomId).emit('collaboration:activity', {
      userId: userSession.userId,
      activity,
      timestamp: new Date().toISOString()
    });
  }

  private handleDisconnect(socket: Socket) {
    const userSession = this.userSessions.get(socket.id);
    
    if (userSession) {
      logger.info(`User disconnected: ${userSession.userId} (${userSession.team})`);
      
      // Notify team members of disconnection
      socket.to(`team:${userSession.team}`).emit('user:disconnected', {
        userId: userSession.userId,
        timestamp: new Date().toISOString()
      });
    }

    this.activeConnections.delete(socket.id);
    this.userSessions.delete(socket.id);
    
    logger.info(`Client disconnected: ${socket.id}`);
  }

  // Public methods for sending notifications
  public sendNotificationToUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  public sendNotificationToTeam(team: string, notification: any) {
    this.io.to(`team:${team}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastSerendipityOpportunity(opportunity: any) {
    // Send to relevant users based on the opportunity
    const { teams, topics } = opportunity;
    
    teams?.forEach((team: string) => {
      this.io.to(`team:${team}`).emit('serendipity:opportunity', {
        ...opportunity,
        timestamp: new Date().toISOString()
      });
    });
  }

  public getActiveUsers(): any[] {
    return Array.from(this.userSessions.values());
  }

  public getConnectionStats() {
    return {
      totalConnections: this.activeConnections.size,
      authenticatedUsers: this.userSessions.size,
      timestamp: new Date().toISOString()
    };
  }
}