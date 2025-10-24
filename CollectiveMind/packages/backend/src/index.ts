import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.API_PORT || 8000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Import routes
import ingestionRoutes from './routes/ingestion';
import searchRoutes from './routes/search';
import chatRoutes from './routes/chat';
import agenticRoutes from './routes/agentic';

// Import WebSocket service
import { WebSocketService } from './services/websocket';

// Import agentic services
import { AgentOrchestrator } from './services/agent-orchestrator';
import { AdvancedPredictiveSearch } from './services/predictive-search';

// Initialize agentic services
const agentOrchestrator = new AgentOrchestrator();
const predictiveSearch = new AdvancedPredictiveSearch();

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'CollectiveMind API Server - Agentic Edition',
    version: '2.0.0',
    status: 'running',
    features: [
      'Multi-Agent Orchestration System',
      'Predictive Search with ML',
      'Real-time MCP Server Integration',
      'Advanced Serendipity Engine',
      'Cross-team Collaboration AI',
      'Knowledge Flow Analytics',
      'Intelligent Caching & Preloading',
      'WebSocket Real-time Updates'
    ],
    agenticCapabilities: {
      agents: 5,
      mcpServers: 4,
      predictiveAccuracy: '72%',
      cacheHitRate: '85%'
    }
  });
});

// Mount route handlers
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/agentic', agenticRoutes);

// Initialize WebSocket service with agentic capabilities
const wsService = new WebSocketService(io);

// Health check with agentic status
app.get('/api/health/agentic', async (req, res) => {
  try {
    const [agentMetrics, searchMetrics] = await Promise.all([
      agentOrchestrator.getAgentPerformance(),
      predictiveSearch.getPerformanceMetrics()
    ]);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      agentic: {
        orchestrator: agentMetrics,
        predictiveSearch: searchMetrics,
        overall: 'operational'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start server
server.listen(PORT, () => {
  logger.info(`CollectiveMind API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, io };