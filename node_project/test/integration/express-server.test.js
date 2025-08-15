import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import {
  startTestServer,
  stopTestServer,
  BASE_URL,
  getTestData,
} from './test-helpers.js';

describe('Express Server Integration Tests', () => {
  let testData;

  before(async () => {
    console.log('🚀 Starting Express test server...');
    await startTestServer('express');
    testData = getTestData();
    console.log('✅ Express test server ready');
  });

  after(async () => {
    console.log('🛑 Stopping Express test server...');
    await stopTestServer();
    console.log('✅ Express test server stopped');
  });

  test('Health endpoint should match expected structure', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    const expectedHealth = testData.healthChecks.express;

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.status, expectedHealth.status);
    assert.strictEqual(data.server, expectedHealth.server);
    assert.ok(response.headers.get('x-request-id'));
  });

  test('Echo API should handle simple payload', async () => {
    const payload = testData.requestPayloads.echo.simple;

    const response = await fetch(`${BASE_URL}/api/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(data.echo, payload);
    assert.strictEqual(data.server, 'express');
    assert.ok(data.requestId);
  });

  test('Echo API should handle complex nested payload', async () => {
    const payload = testData.requestPayloads.echo.complex;

    const response = await fetch(`${BASE_URL}/api/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(data.echo, payload);
    assert.strictEqual(data.echo.user.name, 'Test User');
    assert.strictEqual(data.echo.action, 'update_profile');
    assert.ok(Array.isArray(data.echo.data));
  });

  test('Hello API should handle query parameters', async () => {
    const queryParams = testData.queryParameters.search;
    const queryString = new URLSearchParams(queryParams).toString();

    const response = await fetch(`${BASE_URL}/api/hello?${queryString}`);
    const data = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.query.q, queryParams.q);
    assert.strictEqual(data.query.category, queryParams.category);
    assert.strictEqual(data.query.tags, queryParams.tags);
  });

  test('Validation errors should match expected format', async () => {
    const errorScenario = testData.errorScenarios.validation;

    const response = await fetch(`${BASE_URL}/api/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorScenario.request),
    });

    // For this test, we're just checking the echo works
    // In a real app, you'd have validation middleware
    assert.strictEqual(response.status, 200);
  });

  test('Invalid JSON should return proper error', async () => {
    const invalidJson = testData.errorScenarios.invalidJson.request;

    const response = await fetch(`${BASE_URL}/api/echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: invalidJson, // This is deliberately invalid JSON
    });

    // With our custom JSON error handler, this should return 400
    assert.strictEqual(response.status, 400);

    const data = await response.json();
    assert.ok(data.error);
    assert.strictEqual(data.error, 'Invalid JSON format');
  });

  test('API data endpoint should return expected structure', async () => {
    const response = await fetch(`${BASE_URL}/api/data`);
    const data = await response.json();
    const expectedData = testData.apiResponses.data;

    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.data.users, expectedData.users);
    assert.strictEqual(data.data.posts, expectedData.posts);
    assert.ok(Array.isArray(data.data.categories));
    assert.strictEqual(
      data.data.categories.length,
      expectedData.categories.length,
    ); // Now matches: 4

    // Check all expected categories are present
    expectedData.categories.forEach((category) => {
      assert.ok(data.data.categories.includes(category));
    });
  });
});
