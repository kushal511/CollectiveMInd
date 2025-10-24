import { Router } from 'express';
import { AIChatService, ChatContext } from '../services/ai-chat';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const aiChatService = new AIChatService();

// In-memory conversation storage (in production, use Redis or database)
const conversations = new Map<string, ChatContext>();

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
  userContext: z.object({
    userId: z.string(),
    team: z.string(),
    role: z.string()
  })
});

// Send message and get AI response
router.post('/message', async (req, res) => {
  try {
    const validatedData = chatMessageSchema.parse(req.body);
    const { message, conversationId, userContext } = validatedData;
    
    // Get or create conversation context
    const convId = conversationId || generateConversationId();
    let context = conversations.get(convId);
    
    if (!context) {
      context = {
        conversationId: convId,
        userId: userContext.userId,
        userTeam: userContext.team,
        userRole: userContext.role,
        messages: []
      };
      conversations.set(convId, context);
    }

    // Add user message to context
    const userMessage = {
      id: generateMessageId(),
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    };
    context.messages.push(userMessage);

    logger.info(`Processing chat message for conversation ${convId}: "${message}"`);
    
    const startTime = Date.now();
    const response = await aiChatService.processMessage(message, context);
    const duration = Date.now() - startTime;
    
    // Add AI response to context
    context.messages.push(response.message);
    
    // Keep only last 20 messages to prevent memory issues
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20);
    }
    
    logger.info(`Chat response generated in ${duration}ms`);
    
    res.json({
      ...response,
      conversationId: convId,
      metadata: {
        duration,
        timestamp: new Date().toISOString(),
        messageCount: context.messages.length
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid chat message',
        details: error.errors
      });
    }

    logger.error('Chat message processing failed:', error);
    res.status(500).json({
      error: 'Chat processing failed',
      message: error.message
    });
  }
});

// Get conversation history
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const context = conversations.get(conversationId);
    
    if (!context) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }
    
    res.json({
      conversationId,
      messages: context.messages,
      userContext: {
        userId: context.userId,
        team: context.userTeam,
        role: context.userRole
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get conversation:', error);
    res.status(500).json({
      error: 'Failed to get conversation',
      message: error.message
    });
  }
});

// Delete conversation
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const deleted = conversations.delete(conversationId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }
    
    res.json({
      message: 'Conversation deleted successfully',
      conversationId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to delete conversation:', error);
    res.status(500).json({
      error: 'Failed to delete conversation',
      message: error.message
    });
  }
});

// Get chat suggestions based on context
router.post('/suggestions', async (req, res) => {
  try {
    const { userContext, recentTopics } = req.body;
    
    // Generate contextual chat suggestions
    const suggestions = [
      "What are the latest updates on customer churn?",
      "Show me cross-team collaboration opportunities",
      "Who are the experts in my area of interest?",
      "What documents should I review for my current project?",
      "Find recent discussions about our product roadmap"
    ];
    
    // In a real implementation, you'd use AI to generate personalized suggestions
    // based on user context, recent activity, and trending topics
    
    res.json({
      suggestions,
      userContext,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get chat suggestions:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: error.message
    });
  }
});

// Helper functions
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default router;