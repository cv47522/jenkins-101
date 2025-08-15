import { config as dotenvConfig } from 'dotenv';

/**
 * Load configuration from environment variables and .env file using dotenv
 * @returns {Object} Configuration object
 */

function loadConfig() {
  // Load different .env files based on environment
  // 1. Command line environment variables (highest priority)
  // 2. .env.local (local overrides)
  // 3. .env.{environment} (.env.production, .env.development)
  // 4. .env (lowest priority)
  const envFile = process.env.NODE_ENV === 'development' ? '.env.dev' : '.env';
  const result = dotenvConfig({ path: envFile });

  if (result.error) {
    console.log(
      '💡 No .env file found, using environment variables and defaults',
    );
  } else {
    console.log('📄 Loaded configuration from .env file');
  }

  // Default configuration with type conversion
  const config = {
    PORT: parseInt(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    MAX_BODY_SIZE: process.env.MAX_BODY_SIZE || '10mb',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    SHUTDOWN_TIMEOUT: parseInt(process.env.SHUTDOWN_TIMEOUT) || 10000,

    // Additional optional config
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    API_KEY: process.env.API_KEY,
    REDIS_URL: process.env.REDIS_URL,
  };
  // Validate configuration
  validateConfig(config);
  return config;
}

/**
 * Validate configuration values
 * @param {Object} config - Configuration to validate
 */
function validateConfig(config) {
  const errors = [];
  const warnings = [];

  // Port validation
  if (config.PORT < 1 || config.PORT > 65535) {
    errors.push(`Invalid PORT: ${config.PORT}. Must be between 1 and 65535.`);
  }

  // Environment validation
  if (!['development', 'production', 'test'].includes(config.NODE_ENV)) {
    warnings.push(
      `Unknown NODE_ENV: ${config.NODE_ENV}. Expected: development, production, or test.`,
    );
  }

  // Log level validation
  if (!['debug', 'info', 'warn', 'error'].includes(config.LOG_LEVEL)) {
    warnings.push(
      `Unknown LOG_LEVEL: ${config.LOG_LEVEL}. Expected: debug, info, warn, or error.`,
    );
  }

  // Security warnings for production
  if (config.NODE_ENV === 'production') {
    if (!config.JWT_SECRET) {
      warnings.push('JWT_SECRET not set in production environment');
    }
    if (config.CORS_ORIGIN === '*') {
      warnings.push(
        'CORS_ORIGIN is set to "*" in production - consider restricting to specific domains',
      );
    }
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    warnings.forEach((warning) => console.warn(`   ${warning}`));
  }

  // Handle errors
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach((error) => console.error(`   ${error}`));
    process.exit(1);
  }
}

/**
 * Gracefully shutdown the server
 * @param {import('http').Server} server - HTTP server instance
 * @param {number} [timeout] - Shutdown timeout in milliseconds
 */
function gracefulShutdown(server, timeout = 10000) {
  console.log('\n🔄 Received shutdown signal, closing server gracefully...');

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    } else {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    }
  });

  // Force close after timeout
  const forceShutdownTimer = setTimeout(() => {
    console.log('❌ Forced shutdown after timeout');
    process.exit(1);
  }, timeout);

  // Clear the timer if graceful shutdown completes
  forceShutdownTimer.unref();
}

/**
 * Simple logging utility for built-in HTTP server
 * @param {string} level - Log level (debug, info, warn, error)
 * @param {string} message - Log message
 * @param {any} [data] - Optional data to log
 */
function log(level, message, data = null) {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };

  if (levels[level] >= levels[logLevel]) {
    const timestamp = new Date().toISOString();
    const prefix = {
      debug: '🐛',
      info: 'ℹ️ ',
      warn: '⚠️ ',
      error: '❌',
    };

    console.log(
      `${prefix[level]} ${timestamp} [${level.toUpperCase()}] ${message}`,
    );

    if (data !== null) {
      console.log(
        '   Data:',
        typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
      );
    }
  }
}

/**
 * Create a simple request ID for tracking
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse JSON safely with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {any} [defaultValue=null] - Default value if parsing fails
 * @returns {any} Parsed JSON or default value
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (err) {
    log('warn', 'Failed to parse JSON', {
      error: err.message,
      input: jsonString.slice(0, 100),
    });
    return defaultValue;
  }
}

/**
 * Get memory usage in a human-readable format
 * @returns {Object} Memory usage statistics
 */
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`,
    arrayBuffers: `${Math.round(usage.arrayBuffers / 1024 / 1024)} MB`,
  };
}

/**
 * Create a simple health check object
 * @param {string} serverType - Type of server (e.g., 'built-in-http', 'express')
 * @returns {Object} Health check data
 */
function createHealthCheck(serverType = 'unknown') {
  return {
    status: 'ok',
    server: serverType,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    memoryFormatted: getMemoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
    platform: process.platform,
    arch: process.arch,
  };
}

export {
  log,
  loadConfig,
  gracefulShutdown,
  generateRequestId,
  getMemoryUsage,
  createHealthCheck,
  safeJsonParse,
};
