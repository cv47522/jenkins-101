import {
  createHealthCheck,
  log,
  safeJsonParse,
  generateRequestId,
} from './utils.js';

function httpRouter(req, res) {
  const { method, pathname } = req;
  const requestId = generateRequestId();

  // (Optioanl) Add request ID to response headers for tracking
  res.setHeader('X-Request-ID', requestId);

  // Log incoming request
  log('info', `${method} ${pathname}`, { requestId, query: req.query });

  // Health check endpoint
  if (pathname === '/health' && method === 'GET') {
    const healthData = createHealthCheck('built-in-http');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData, null, 2));
    log('info', 'Health check requested', { requestId, status: 'ok' });
    return;
  }

  // API hello endpoint
  if (pathname === '/api/hello' && method === 'GET') {
    const responseData = {
      message: 'Hello from built-in HTTP server!',
      query: req.query,
      requestId,
      timestamp: new Date().toISOString(),
      server: 'built-in-http',
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(responseData, null, 2));
    log('info', 'Hello endpoint accessed', { requestId });
    return;
  }

  // POST echo endpoint with enhanced body parsing
  if (pathname === '/api/echo' && method === 'POST') {
    let body = '';
    let bodySize = 0;
    const maxBodySize = 10 * 1024 * 1024; // 10MB limit

    req.on('data', (chunk) => {
      bodySize += chunk.length;
      // Check body size limit
      if (bodySize > maxBodySize) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Request body too large',
            maxSize: '10MB',
            requestId,
          }),
        );
        log('warn', 'Request body too large', { requestId, bodySize });
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      const parsedData = safeJsonParse(body);

      if (parsedData === null && body.trim() !== '') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Invalid JSON format',
            requestId,
            hint: 'Please send valid JSON in the request body',
          }),
        );
        log('warn', 'Invalid JSON received', {
          requestId,
          bodyPreview: body.slice(0, 100),
        });
        return;
      }

      const responseData = {
        echo: parsedData,
        server: 'built-in-http',
        requestId,
        receivedAt: new Date().toISOString(),
        bodySize: `${bodySize} bytes`,
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responseData, null, 2));
      log('info', 'Echo endpoint processed', { requestId, bodySize });
    });

    req.on('error', (err) => {
      log('error', 'Request error', { requestId, error: err.message });
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Request processing failed',
          requestId,
        }),
      );
    });

    return;
  }

  // Async data endpoint example
  if (pathname === '/api/data' && method === 'GET') {
    // Simulate async operation
    setTimeout(() => {
      const responseData = {
        data: {
          users: 42,
          posts: 128,
          categories: ['tech', 'science', 'arts'],
          lastUpdated: new Date().toISOString(),
        },
        server: 'built-in-http',
        requestId,
        timestamp: new Date().toISOString(),
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responseData, null, 2));
      log('info', 'Data endpoint accessed', { requestId });
    }, 100);
    return;
  }

  // 404 handler
  const notFoundResponse = {
    error: 'Not found',
    server: 'built-in-http',
    requestId,
    availableEndpoints: [
      'GET /health',
      'GET /api/hello',
      'POST /api/echo',
      'GET /api/data',
    ],
    timestamp: new Date().toISOString(),
  };

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(notFoundResponse, null, 2));
  log('warn', '404 - Route not found', { requestId, method, pathname });
}

export { httpRouter };
