import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import {
  startTestServer,
  stopTestServer,
  BASE_URL,
  getTestData,
} from './test-helpers.js';
import {
  generateLargePayload,
  createOversizedPayload,
  getSizeLimits,
} from './data-generators.js';

describe('Size Limit Tests', () => {
  before(async () => {
    await startTestServer('express');
  });

  after(async () => {
    await stopTestServer();
  });

  test('should reject oversized payload', async () => {
    const testData = getTestData();
    const errorScenario = testData.errorScenarios.tooLarge;

    // Generate actual large payload
    const largePayload = createOversizedPayload();

    const response = await fetch(`${BASE_URL}/api/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(largePayload),
    });

    assert.strictEqual(response.status, 413); // Payload Too Large

    const data = await response.json();
    assert.strictEqual(data.error, errorScenario.expectedResponse.error);
  });

  test('should accept payload within size limit', async () => {
    const limits = getSizeLimits();
    const normalPayload = {
      message: 'Normal sized payload',
      data: 'x'.repeat(1024), // 1KB - well within limit
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`${BASE_URL}/api/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalPayload),
    });

    assert.strictEqual(response.status, 200);

    const data = await response.json();
    assert.deepStrictEqual(data.echo, normalPayload);
  });

  test('should handle edge case near size limit', async () => {
    const limits = getSizeLimits();
    // Create payload just under the limit (10MB - 1KB)
    const edgeCaseSize = limits.maxBodySize - 1024;
    const edgePayload = {
      message: 'Edge case payload',
      data: 'x'.repeat(edgeCaseSize - 100), // Leave room for JSON overhead
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`${BASE_URL}/api/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edgePayload),
    });

    assert.strictEqual(response.status, 200);
  });
});
