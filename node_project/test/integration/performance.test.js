import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import {
  startTestServer,
  stopTestServer,
  BASE_URL,
  getTestData,
} from './test-helpers.js';

describe('Performance Tests', () => {
  let testData;

  before(async () => {
    await startTestServer('express');
    testData = getTestData();
  });

  after(async () => {
    await stopTestServer();
  });

  test('should handle concurrent requests', async () => {
    const perfData = testData.performanceTestData.concurrentRequests;
    const promises = [];

    // Create multiple concurrent requests
    for (let i = 0; i < perfData.count; i++) {
      promises.push(fetch(`${BASE_URL}${perfData.endpoint}`));
    }

    const responses = await Promise.all(promises);
    const successCount = responses.filter((r) => r.ok).length;
    const successRate = successCount / responses.length;

    assert.ok(
      successRate >= perfData.expectedSuccessRate,
      `Success rate ${successRate} below expected ${perfData.expectedSuccessRate}`,
    );
  });

  test('should respond quickly to health checks', async () => {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/health`);
    const endTime = Date.now();

    const responseTime = endTime - startTime;

    assert.ok(response.ok);
    assert.ok(responseTime < 100, `Response time ${responseTime}ms too slow`);
  });
});
