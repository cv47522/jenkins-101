import { Router } from 'express';
import { createHealthCheck, generateRequestId } from './utils.js';

const router = Router();

// Middleware to add request ID (used by morgan)
router.use((req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Health check endpoint
router.get('/health', (req, res) => {
  const healthData = createHealthCheck('express');
  res.json(healthData);
});

// API endpoints
router.get('/api/hello', (req, res) => {
  const responseData = {
    message: 'Hello from Express server!',
    query: req.query,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    server: 'express',
  };

  res.json(responseData);
});

// POST example with automatic body parsing
router.post('/api/echo', (req, res) => {
  const responseData = {
    echo: req.body,
    server: 'express',
    requestId: req.requestId,
    receivedAt: new Date().toISOString(),
    contentType: req.headers['content-type'],
    bodySize: JSON.stringify(req.body).length + ' bytes',
  };

  res.json(responseData);
});

// Async endpoint example - UPDATED to match test data
router.get('/api/data', async (req, res) => {
  try {
    // Simulate async database operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    const responseData = {
      data: {
        users: 42,
        posts: 128,
        categories: ['tech', 'science', 'arts', 'business'], // Added 'business' to match test data
        lastUpdated: new Date().toISOString(),
        stats: {
          activeUsers: 38,
          publishedPosts: 95,
          draftPosts: 33,
        },
      },
      server: 'express',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      processingTime: '100ms',
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      server: 'express',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  }
});

// File upload simulation endpoint (multipart form data)
router.post('/api/upload', (req, res) => {
  // Note: In real apps, use multer middleware for file uploads
  const responseData = {
    message: 'Upload endpoint (simulation)',
    server: 'express',
    requestId: req.requestId,
    received: {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      body: req.body,
    },
    timestamp: new Date().toISOString(),
    note: 'Use multer middleware for real file uploads',
  };

  res.json(responseData);
});

// Error simulation endpoint for testing error handling
router.get('/api/error', (req, res) => {
  const errorType = req.query.type || 'generic';

  switch (errorType) {
    case 'timeout':
      // Simulate timeout (will be caught by any timeout middleware)
      setTimeout(() => {
        res.json({ message: 'This should timeout' });
      }, 30000);
      break;
    case 'validation':
      res.status(400).json({
        error: 'Validation failed',
        details: ['Field "name" is required', 'Field "age" must be a number'],
        requestId: req.requestId,
      });
      break;
    case 'auth':
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token',
        requestId: req.requestId,
      });
      break;
    case 'server':
      throw new Error('Simulated server error');
    default:
      res.status(400).json({
        error: 'Bad Request',
        message: 'Unknown error type',
        availableTypes: ['timeout', 'validation', 'auth', 'server'],
        requestId: req.requestId,
      });
  }
});

export { router as expressRouter };
