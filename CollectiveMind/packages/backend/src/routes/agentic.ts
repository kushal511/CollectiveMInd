import { Router } from 'express';
import { AgentOrchestrator } from '../services/agent-orchestrator';
import { AdvancedPredictiveSearch } from '../services/predictive-search';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const agentOrchestrator = new AgentOrchestrator();
const predictiveSearch = new AdvancedPredictiveSearch();

// Validation schemas
const agenticRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  userContext: z.object({
    userId: z.string(),
    team: z.string(),
    role: z.string()
  }),
  intent: z.object({
    type: z.enum(['search', 'analysis', 'collaboration', 'discovery']).optional(),
    complexity: z.enum(['low', 'medium', 'high']).optional(),
    crossTeam: z.boolean().optional()
  }).optional(),
  options: z.object({
    enablePrediction: z.boolean().default(true),
    enableSerendipity: z.boolean().default(true),
    maxAgents: z.number().min(1).max(10).default(5)
  }).optional()
});

// Main agentic processing endpoint
router.post('/process', async (req, res) => {
  try {
    const validatedRequest = agenticRequestSchema.parse(req.body);
    
    logger.info(`Agentic processing request: "${validatedRequest.query}" for user ${validatedRequest.userContext.userId}`);
    
    const startTime = Date.now();
    
    // Process with agent orchestrator
    const agenticResults = await agentOrchestrator.processUserRequest(validatedRequest);
    
    const processingTime = Date.now() - startTime;
    
    logger.info(`Agentic processing completed in ${processingTime}ms`);
    
    res.json({
      ...agenticResults,
      performance: {
        ...agenticResults.performance,
        totalProcessingTime: processingTime,
        agenticProcessing: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid agentic request',
        details: error.errors
      });
    }

    logger.error('Agentic processing failed:', error);
    res.status(500).json({
      error: 'Agentic processing failed',
      message: error.message
    });
  }
});

// Predictive search endpoint
router.post('/predictive-search', async (req, res) => {
  try {
    const { query, userContext } = agenticRequestSchema.parse(req.body);
    
    const startTime = Date.now();
    
    // Get optimized results with prediction
    const results = await predictiveSearch.getOptimizedResults(query, userContext);
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      ...results,
      performance: {
        ...results.metadata,
        processingTime,
        predictiveOptimization: true
      }
    });

  } catch (error) {
    logger.error('Predictive search failed:', error);
    res.status(500).json({
      error: 'Predictive search failed',
      message: error.message
    });
  }
});

// Query prediction endpoint
router.post('/predict-queries', async (req, res) => {
  try {
    const { query, userContext } = req.body;
    
    const predictions = await predictiveSearch.predictNextQueries(query, userContext);
    
    res.json({
      predictions,
      query,
      userContext: {
        userId: userContext.userId,
        team: userContext.team
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Query prediction failed:', error);
    res.status(500).json({
      error: 'Query prediction failed',
      message: error.message
    });
  }
});

// Agent performance metrics
router.get('/performance', async (req, res) => {
  try {
    const [agentMetrics, searchMetrics] = await Promise.all([
      agentOrchestrator.getAgentPerformance(),
      predictiveSearch.getPerformanceMetrics()
    ]);

    res.json({
      agentOrchestration: agentMetrics,
      predictiveSearch: searchMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get performance metrics:', error);
    res.status(500).json({
      error: 'Failed to get performance metrics',
      message: error.message
    });
  }
});

// Serendipity discovery endpoint
router.post('/discover', async (req, res) => {
  try {
    const { userContext, discoveryType = 'opportunities' } = req.body;
    
    // Use agent orchestrator for serendipity discovery
    const discoveryRequest = {
      query: 'discover opportunities',
      userContext,
      intent: {
        type: 'discovery',
        complexity: 'high',
        crossTeam: true
      }
    };

    const discoveries = await agentOrchestrator.processUserRequest(discoveryRequest);
    
    res.json({
      discoveries: discoveries.collaborationOpportunities || [],
      insights: discoveries.insights || [],
      recommendations: discoveries.actionableRecommendations || [],
      discoveryType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Serendipity discovery failed:', error);
    res.status(500).json({
      error: 'Discovery failed',
      message: error.message
    });
  }
});

// MCP server status and tools
router.get('/mcp/status', async (req, res) => {
  try {
    // Get MCP status from orchestrator
    const mcpStatus = {
      connectedServers: agentOrchestrator['mcpManager']?.getConnectedServers() || [],
      availableTools: agentOrchestrator['mcpManager']?.getAvailableTools() || [],
      serverHealth: 'healthy' // This would be a real health check
    };

    res.json({
      ...mcpStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get MCP status:', error);
    res.status(500).json({
      error: 'Failed to get MCP status',
      message: error.message
    });
  }
});

// Execute MCP tool directly
router.post('/mcp/execute', async (req, res) => {
  try {
    const { toolName, arguments: args, userContext } = req.body;
    
    if (!toolName) {
      return res.status(400).json({
        error: 'Tool name is required'
      });
    }

    // Add user context to arguments
    const toolArgs = {
      ...args,
      userContext
    };

    const result = await agentOrchestrator['mcpManager']?.callTool(toolName, toolArgs);
    
    res.json({
      toolName,
      result,
      executedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`MCP tool execution failed for ${req.body.toolName}:`, error);
    res.status(500).json({
      error: 'MCP tool execution failed',
      message: error.message,
      toolName: req.body.toolName
    });
  }
});

export default router;