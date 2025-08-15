import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import { expressRouter } from './lib/express-router.js';
import { loadConfig, gracefulShutdown } from './lib/utils.js';

const config = loadConfig();
const app = express();
const port = config.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Performance middleware
app.use(compression());

// Request logging with morgan
if (config.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  morgan.token('id', (req) => req.requestId);
  const devFormat =
    ':method :url :status :res[content-length] - :response-time ms [:id]';
  app.use(
    morgan(devFormat, {
      stream: {
        write: (message) => {
          const trimmed = message.trim();
          if (trimmed.includes(' 2')) {
            console.log(`\x1b[32m${trimmed}\x1b[0m`);
          } else if (trimmed.includes(' 3')) {
            console.log(`\x1b[33m${trimmed}\x1b[0m`);
          } else if (trimmed.includes(' 4') || trimmed.includes(' 5')) {
            console.log(`\x1b[31m${trimmed}\x1b[0m`);
          } else {
            console.log(trimmed);
          }
        },
      },
    }),
  );
}

// Body parsing middleware - ONLY USE EXPRESS.JSON()
app.use(
  express.json({
    limit: '10mb',
    strict: true,
  }),
);
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', expressRouter);

// JSON parsing error handler - THIS CATCHES INVALID JSON
app.use((err, req, res, next) => {
  // Handle JSON parsing errors specifically
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON format',
      requestId: req.requestId,
      hint: 'Please send valid JSON in the request body',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle body-parser errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON format',
      requestId: req.requestId,
      hint: 'Please send valid JSON in the request body',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle any other 400 status errors as JSON issues
  if (err.status === 400) {
    return res.status(400).json({
      error: 'Invalid JSON format',
      requestId: req.requestId,
      hint: 'Please send valid JSON in the request body',
      timestamp: new Date().toISOString(),
    });
  }

  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId,
    availableEndpoints: [
      'GET /health',
      'GET /api/hello',
      'POST /api/echo',
      'GET /api/data',
      'POST /api/upload',
      'GET /api/error?type=validation',
    ],
    timestamp: new Date().toISOString(),
  });
});

const server = app.listen(port, () => {
  console.log(`🚀 Express Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `📝 Logging: ${config.NODE_ENV === 'production' ? 'combined' : 'dev'} format`,
  );
});

process.on('SIGTERM', () => gracefulShutdown(server));
process.on('SIGINT', () => gracefulShutdown(server));

export { app, server };
