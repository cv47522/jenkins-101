import { test, describe } from 'node:test';
import assert from 'node:assert';
import { httpRouter } from '../../lib/http-router.js';
import { EventEmitter } from 'node:events';

describe('HTTP Router Unit Tests', () => {
  test('should handle health check request', (t, done) => {
    const req = {
      method: 'GET',
      pathname: '/health',
      query: {},
    };

    let responseData = '';
    const res = {
      writeHead: (status, headers) => {
        assert.strictEqual(status, 200);
        assert.strictEqual(headers['Content-Type'], 'application/json');
      },
      setHeader: () => {},
      end: (data) => {
        const health = JSON.parse(data);
        assert.strictEqual(health.status, 'ok');
        assert.strictEqual(health.server, 'built-in-http');
        done();
      },
    };

    httpRouter(req, res);
  });

  test('should handle 404 for unknown routes', (t, done) => {
    const req = {
      method: 'GET',
      pathname: '/unknown',
      query: {},
    };

    const res = {
      writeHead: (status) => {
        assert.strictEqual(status, 404);
      },
      setHeader: () => {},
      end: (data) => {
        const response = JSON.parse(data);
        assert.ok(response.error);
        assert.strictEqual(response.server, 'built-in-http');
        done();
      },
    };

    httpRouter(req, res);
  });
});
