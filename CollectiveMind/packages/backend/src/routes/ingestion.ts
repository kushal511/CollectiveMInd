import { Router } from 'express';
import { DataIngestionService } from '../services/ingestion';
import { embeddingService } from '../services/embeddings';
import { initializeIndices, checkElasticsearchHealth } from '../config/elasticsearch';
import { logger } from '../utils/logger';

const router = Router();
const ingestionService = new DataIngestionService();
// embeddingService is imported as singleton

// Health check for Elasticsearch
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await checkElasticsearchHealth();
    res.json({
      elasticsearch: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Initialize Elasticsearch indices
router.post('/initialize', async (req, res) => {
  try {
    await initializeIndices();
    res.json({
      message: 'Elasticsearch indices initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to initialize indices:', error);
    res.status(500).json({
      error: 'Failed to initialize indices',
      message: error.message
    });
  }
});

// Start data ingestion
router.post('/ingest', async (req, res) => {
  try {
    const { datasetPath } = req.body;
    
    if (!datasetPath) {
      return res.status(400).json({
        error: 'Dataset path is required',
        message: 'Please provide the path to the dataset directory'
      });
    }

    // Start ingestion in background
    ingestionService.ingestDataset(datasetPath)
      .then(() => {
        logger.info('Data ingestion completed');
      })
      .catch(error => {
        logger.error('Data ingestion failed:', error);
      });

    res.json({
      message: 'Data ingestion started',
      datasetPath,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to start ingestion:', error);
    res.status(500).json({
      error: 'Failed to start ingestion',
      message: error.message
    });
  }
});

// Get ingestion progress
router.get('/ingest/progress', (req, res) => {
  try {
    const progress = ingestionService.getProgress();
    res.json(progress);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get ingestion progress',
      message: error.message
    });
  }
});

// Start embedding generation
router.post('/embeddings', async (req, res) => {
  try {
    // Start embedding generation in background
    embeddingService.generateAllEmbeddings()
      .then(() => {
        logger.info('Embedding generation completed');
      })
      .catch(error => {
        logger.error('Embedding generation failed:', error);
      });

    res.json({
      message: 'Embedding generation started',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to start embedding generation:', error);
    res.status(500).json({
      error: 'Failed to start embedding generation',
      message: error.message
    });
  }
});

// Get embedding progress
router.get('/embeddings/progress', (req, res) => {
  try {
    const progress = embeddingService.getProgress();
    res.json(progress);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get embedding progress',
      message: error.message
    });
  }
});

// Validate data integrity
router.get('/validate', async (req, res) => {
  try {
    const validation = await ingestionService.validateDataIntegrity();
    res.json(validation);
  } catch (error) {
    res.status(500).json({
      error: 'Validation failed',
      message: error.message
    });
  }
});

// Complete setup (initialize + ingest + embeddings)
router.post('/setup', async (req, res) => {
  try {
    const { datasetPath } = req.body;
    
    if (!datasetPath) {
      return res.status(400).json({
        error: 'Dataset path is required'
      });
    }

    // Run complete setup in background
    (async () => {
      try {
        logger.info('Starting complete setup process');
        
        // 1. Initialize indices
        await initializeIndices();
        logger.info('✓ Indices initialized');
        
        // 2. Ingest data
        await ingestionService.ingestDataset(datasetPath);
        logger.info('✓ Data ingested');
        
        // 3. Generate embeddings
        await embeddingService.generateAllEmbeddings();
        logger.info('✓ Embeddings generated');
        
        logger.info('Complete setup finished successfully');
        
      } catch (error) {
        logger.error('Complete setup failed:', error);
      }
    })();

    res.json({
      message: 'Complete setup started (initialize + ingest + embeddings)',
      datasetPath,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to start complete setup:', error);
    res.status(500).json({
      error: 'Failed to start complete setup',
      message: error.message
    });
  }
});

export default router;