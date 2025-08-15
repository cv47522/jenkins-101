// test/integration/test-helpers.js (CI-friendly version)
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let serverProcess = null;
const TEST_PORT = process.env.TEST_PORT || 3001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Load test data
let testData = null;
export function getTestData() {
  if (!testData) {
    const testDataPath = join(__dirname, '../fixtures/test-data.json');
    testData = JSON.parse(readFileSync(testDataPath, 'utf8'));
  }
  return testData;
}

/**
 * Start test server with better error handling
 */
export async function startTestServer(serverType = 'express') {
  // Clean up any existing server first
  if (serverProcess) {
    await stopTestServer();
  }

  // Wait a bit to ensure port is free
  await setTimeout(1000);

  return new Promise((resolve, reject) => {
    const serverFile =
      serverType === 'http' ? 'server-http.js' : 'server-express.js';

    serverProcess = spawn('node', [serverFile], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: TEST_PORT,
        LOG_LEVEL: 'error',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
    });

    let output = '';
    let resolved = false;

    const resolveOnce = (value) => {
      if (!resolved) {
        resolved = true;
        resolve(value);
      }
    };

    const rejectOnce = (error) => {
      if (!resolved) {
        resolved = true;
        reject(error);
      }
    };

    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('running on http://localhost:')) {
        resolveOnce(BASE_URL);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const errorMsg = data.toString();
      // Only log actual errors
      if (
        !errorMsg.includes('SyntaxError: Expected property name') &&
        !errorMsg.includes('stream is not readable')
      ) {
        console.error(`Server error: ${errorMsg}`);
      }
    });

    serverProcess.on('error', (error) => {
      rejectOnce(error);
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        rejectOnce(new Error(`Server exited with code ${code}`));
      }
    });

    // Timeout after 15 seconds
    setTimeout(15000).then(() => {
      rejectOnce(new Error('Server start timeout after 15 seconds'));
    });
  });
}

/**
 * Stop test server with better cleanup
 */
export async function stopTestServer() {
  if (serverProcess && !serverProcess.killed) {
    return new Promise((resolve) => {
      const cleanup = () => {
        serverProcess = null;
        resolve();
      };

      serverProcess.on('exit', cleanup);

      // Try graceful shutdown
      try {
        serverProcess.kill('SIGTERM');
      } catch (error) {
        // Process might already be dead
      }

      // Force kill after 3 seconds
      setTimeout(3000).then(() => {
        if (serverProcess && !serverProcess.killed) {
          try {
            serverProcess.kill('SIGKILL');
          } catch (error) {
            // Process might already be dead
          }
        }
        cleanup();
      });
    });
  }

  // Extra cleanup - kill any processes on the test port
  try {
    const { execSync } = await import('node:child_process');
    execSync(`lsof -ti:${TEST_PORT} | xargs -r kill -9`, { stdio: 'ignore' });
  } catch (error) {
    // Ignore errors - port might not be in use
  }
}

export { BASE_URL, TEST_PORT };
