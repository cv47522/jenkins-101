import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateRequestId,
  safeJsonParse,
  createHealthCheck,
} from '../../lib/utils.js';
import { getTestData } from '../integration/test-helpers.js';

describe('Utils Unit Tests', () => {
  const testData = getTestData();

  test('safeJsonParse should handle test payloads', () => {
    const payloads = testData.requestPayloads.echo;

    // Test simple payload
    const simpleJson = JSON.stringify(payloads.simple);
    const simpleResult = safeJsonParse(simpleJson);
    assert.deepStrictEqual(simpleResult, payloads.simple);

    // Test complex payload
    const complexJson = JSON.stringify(payloads.complex);
    const complexResult = safeJsonParse(complexJson);
    assert.deepStrictEqual(complexResult, payloads.complex);
    assert.strictEqual(complexResult.user.name, 'Test User');
  });

  test('safeJsonParse should handle invalid JSON from test data', () => {
    const invalidJson = testData.errorScenarios.invalidJson.request;
    const result = safeJsonParse(invalidJson, { error: 'default' });

    assert.deepStrictEqual(result, { error: 'default' });
  });

  test('createHealthCheck should match expected structure', () => {
    const health = createHealthCheck('test-server');
    const expectedHealth = testData.healthChecks.express;

    assert.strictEqual(health.status, expectedHealth.status);
    assert.strictEqual(health.server, 'test-server');
    assert.ok(health.timestamp);
    assert.ok(health.nodeVersion);
    assert.ok(typeof health.uptime === 'number');
  });
});
