import { Router } from 'express';
import { SearchService } from '../services/search';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const searchService = new SearchService();

// Validation schemas
const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.object({
    teams: z.array(z.string()).optional(),
    contentTypes: z.array(z.string()).optional(),
    dateRange: z.object({
      from: z.string().optional(),
      to: z.string().optional()
    }).optional(),
    confidentiality: z.array(z.string()).optional()
  }).optional(),
  userContext: z.object({
    userId: z.string(),
    team: z.string(),
    role: z.string()
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).default(1),
    size: z.number().min(1).max(100).default(20)
  }).optional()
});

// Real-time hybrid search
router.post('/hybrid', async (req, res) => {
  try {
    const validatedQuery = searchQuerySchema.parse(req.body);
    
    logger.info(`Hybrid search request: "${validatedQuery.query}"`);
    
    const startTime = Date.now();
    const searchResponse = await searchService.hybridSearch(validatedQuery);
    const duration = Date.now() - startTime;
    
    logger.info(`Search completed in ${duration}ms, found ${searchResponse.total} results`);
    
    res.json({
      ...searchResponse,
      metadata: {
        duration,
        timestamp: new Date().toISOString(),
        query: validatedQuery.query
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid search query',
        details: error.errors
      });
    }

    logger.error('Search request failed:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// Search suggestions (real-time autocomplete)
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    if (query.length < 2) {
      return res.json({ suggestions: [] });
    }

    // Get real-time suggestions from Elasticsearch
    const suggestions = await searchService.generateSearchSuggestions(query);
    
    res.json({
      suggestions,
      query,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Suggestions request failed:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: error.message
    });
  }
});

// Related topics
router.get('/related-topics', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    const relatedTopics = await searchService.getRelatedTopics(query);
    
    res.json({
      relatedTopics,
      query,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Related topics request failed:', error);
    res.status(500).json({
      error: 'Failed to get related topics',
      message: error.message
    });
  }
});

// Search analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Get search aggregations for analytics
    const aggregations = await searchService.getSearchAggregations({
      query: '*',
      filters: {
        dateRange: {
          from: getDateFromTimeframe(timeframe as string)
        }
      }
    });
    
    res.json({
      aggregations,
      timeframe,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Search analytics request failed:', error);
    res.status(500).json({
      error: 'Failed to get search analytics',
      message: error.message
    });
  }
});

// Helper function to convert timeframe to date
function getDateFromTimeframe(timeframe: string): string {
  const now = new Date();
  const days = parseInt(timeframe.replace('d', '')) || 7;
  const fromDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  return fromDate.toISOString();
}

export default router;