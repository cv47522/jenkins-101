import http from 'node:http';
import { URL } from 'node:url';
import { httpRouter } from './lib/http-router.js';
import { loadConfig, gracefulShutdown } from './lib/utils.js';

const config = loadConfig();
const port = config.PORT || 3000;

const server = http.createServer((req, res) => {
  // 1. Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2. Handle pre-flight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 3. Parse URL and enhance request
  const parseUrl = new URL(req.url, `http://${req.headers.host}`);
  req.pathname = parseUrl.pathname;
  req.query = Object.fromEntries(parseUrl.searchParams);

  // 4. Routes request
  httpRouter(req, res);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => gracefulShutdown(server));
process.on('SIGINT', () => gracefulShutdown(server));

server.listen(port, () => {
  console.log(`🚀 Built-in HTTP Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { server };
