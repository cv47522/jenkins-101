import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { startTestServer, stopTestServer, BASE_URL } from './test-helpers.js';

describe('Built-in HTTP Server Integration Tests', () => {
  before(async () => {
    console.log('🚀 Starting HTTP test server...');
    await startTestServer('http');
    console.log('✅ HTTP test server ready');
  });

  after(async () => {
    console.log('🛑 Stopping HTTP test server...');
    await stopTestServer();
    console.log('✅ HTTP test server stopped');
  });

  test('Health endpoint should return server status', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.server, 'built-in-http');
    assert.ok(data.timestamp);
    assert.ok(data.nodeVersion);
    assert.ok(typeof data.uptime === 'number');
  });

  test('Hello API should return greeting', async () => {
    const response = await fetch(`${BASE_URL}/api/hello?name=test`);
    const data = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.message, 'Hello from built-in HTTP server!');
    assert.strictEqual(data.query.name, 'test');
    assert.strictEqual(data.server, 'built-in-http');
  });

  test('Echo API should return posted data', async () => {
    const testData = { message: 'test', number: 42 };

    const response = await fetch(`${BASE_URL}/api/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    const data = await response.json();

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(data.echo, testData);
    assert.strictEqual(data.server, 'built-in-http');
  });

  test('Invalid JSON should return 400', async () => {
    const response = await fetch(`${BASE_URL}/api/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const data = await response.json();

    assert.strictEqual(response.status, 400);
    assert.ok(data.error);
  });

  test('Non-existent route should return 404', async () => {
    const response = await fetch(`${BASE_URL}/nonexistent`);
    const data = await response.json();

    assert.strictEqual(response.status, 404);
    assert.ok(data.error);
    assert.strictEqual(data.server, 'built-in-http');
  });
});
