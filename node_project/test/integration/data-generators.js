import { getTestData } from './test-helpers.js';

/**
 * Generate large payload for testing size limits
 * @param {number} sizeInMB - Size in megabytes
 * @returns {string} Large string payload
 */
export function generateLargePayload(sizeInMB = 11) {
  const sizeInBytes = sizeInMB * 1024 * 1024;
  return 'x'.repeat(sizeInBytes);
}

/**
 * Generate large file data for upload tests
 * @param {number} sizeInMB - Size in megabytes
 * @returns {Object} Large file object
 */
export function generateLargeFile(sizeInMB = 11) {
  return {
    name: 'large-file.jpg',
    type: 'image/jpeg',
    size: sizeInMB * 1024 * 1024,
    data: generateLargePayload(sizeInMB),
  };
}

/**
 * Get size limits from test data
 */
export function getSizeLimits() {
  const testData = getTestData();
  return testData.sizeLimits;
}

/**
 * Create test payload that exceeds size limit
 */
export function createOversizedPayload() {
  const limits = getSizeLimits();
  const oversizeBytes = limits.testLargeSize; // 11MB

  return {
    message: 'This payload is too large',
    data: 'x'.repeat(oversizeBytes),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate test users based on template
 */
export function generateTestUsers(count = 10) {
  const testData = getTestData();
  const template = testData.performanceTestData.bulkUsers.template;
  const users = [];

  for (let i = 1; i <= count; i++) {
    users.push({
      ...template,
      name: template.name.replace('{index}', i.toString()),
      email: template.email.replace('{index}', i.toString()),
      id: i,
    });
  }

  return users;
}

/**
 * Create request with random test data
 */
export function createRandomRequest() {
  const testData = getTestData();
  const payloads = Object.values(testData.requestPayloads.echo);
  const randomPayload = payloads[Math.floor(Math.random() * payloads.length)];

  return {
    method: 'POST',
    headers: testData.headers.standard,
    body: JSON.stringify(randomPayload),
  };
}

/**
 * Get test data by category
 */
export function getTestDataByCategory(category) {
  const testData = getTestData();
  return testData[category] || null;
}
