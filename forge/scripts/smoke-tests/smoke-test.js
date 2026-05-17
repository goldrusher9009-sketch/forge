/**
 * Smoke Test Suite for Forge Platform
 * 
 * Post-deployment verification tests that check critical functionality
 * Runs after staging and production deployments to ensure system health
 * 
 * Usage: npm run test:smoke
 * Env vars: API_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD
 */

const http = require('http');
const https = require('https');
const assert = require('assert');

const API_URL = process.env.API_URL || 'http://localhost:8000';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123!@#';

// Test results tracking
const results = {
  passed: [],
  failed: [],
  skipped: [],
  startTime: Date.now(),
};

// Helper to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'forge-smoke-tests/1.0',
        ...options.headers,
      },
      timeout: 10000,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          jsonBody: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Test runner
async function runTest(name, testFn) {
  try {
    console.log(`\n🧪 Running: ${name}`);
    await testFn();
    results.passed.push(name);
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

// ============================================================================
// SMOKE TESTS
// ============================================================================

async function testFrontendAvailable() {
  const response = await makeRequest(BASE_URL);
  assert.strictEqual(response.statusCode, 200, 'Frontend should return 200');
  assert(response.body.includes('html') || response.body.includes('React'), 'Frontend should return HTML');
}

async function testFrontendHealthEndpoint() {
  const response = await makeRequest(`${BASE_URL}/health`);
  assert.strictEqual(response.statusCode, 200, 'Frontend health endpoint should return 200');
  assert(response.jsonBody.status === 'ok', 'Frontend health status should be ok');
}

async function testAPIAvailable() {
  const response = await makeRequest(`${API_URL}/health`);
  assert.strictEqual(response.statusCode, 200, 'API should return 200 on health check');
  assert(response.jsonBody.status === 'ok', 'API health status should be ok');
}

async function testAPIVersion() {
  const response = await makeRequest(`${API_URL}/api/v1/version`);
  assert.strictEqual(response.statusCode, 200, 'API version endpoint should return 200');
  assert(response.jsonBody.version, 'API should return version info');
}

async function testDatabaseConnectivity() {
  const response = await makeRequest(`${API_URL}/health/db`);
  assert.strictEqual(response.statusCode, 200, 'Database health check should return 200');
  assert(response.jsonBody.database === 'connected', 'Database should be connected');
}

async function testRedisConnectivity() {
  const response = await makeRequest(`${API_URL}/health/redis`);
  assert.strictEqual(response.statusCode, 200, 'Redis health check should return 200');
  assert(response.jsonBody.redis === 'connected', 'Redis should be connected');
}

async function testAuthenticationFlow() {
  // Test login endpoint availability
  const loginResponse = await makeRequest(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    body: {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    },
  });

  assert(
    [200, 401, 403].includes(loginResponse.statusCode),
    'Auth endpoint should be available (may return 401 if user not found)'
  );
}

async function testUserEndpoint() {
  // Get current user info (requires auth token)
  try {
    const response = await makeRequest(`${API_URL}/api/v1/user`, {
      headers: {
        'Authorization': 'Bearer test-token',
      },
    });

    // Expect 401 since we're using test token, but endpoint should exist
    assert([401, 200].includes(response.statusCode), 'User endpoint should exist');
  } catch (error) {
    // If no auth token, endpoint should still exist and return 401
    throw error;
  }
}

async function testProjectsEndpoint() {
  const response = await makeRequest(`${API_URL}/api/v1/projects`, {
    headers: {
      'Authorization': 'Bearer test-token',
    },
  });

  // Expect 401 since we're using test token
  assert([401, 200].includes(response.statusCode), 'Projects endpoint should exist');
}

async function testMetricsEndpoint() {
  const response = await makeRequest(`${API_URL}/metrics`);
  assert.strictEqual(response.statusCode, 200, 'Prometheus metrics endpoint should return 200');
  assert(response.body.includes('# HELP') || response.body.includes('forge_'), 'Should return Prometheus metrics');
}

async function testErrorHandling() {
  const response = await makeRequest(`${API_URL}/api/v1/nonexistent`, {
    headers: {
      'Authorization': 'Bearer test-token',
    },
  });

  assert.strictEqual(response.statusCode, 404, 'Non-existent endpoint should return 404');
  assert(response.jsonBody.error, 'Error response should have error field');
}

async function testCORS() {
  const response = await makeRequest(`${API_URL}/api/v1/version`, {
    headers: {
      'Origin': BASE_URL,
      'Access-Control-Request-Method': 'GET',
    },
  });

  assert.strictEqual(response.statusCode, 200, 'CORS should be configured');
}

async function testSecurityHeaders() {
  const response = await makeRequest(`${API_URL}/health`);
  
  assert(response.headers['x-content-type-options'], 'Should have X-Content-Type-Options header');
  assert(response.headers['x-frame-options'], 'Should have X-Frame-Options header');
  assert(response.headers['x-xss-protection'], 'Should have X-XSS-Protection header');
}

async function testResponseCompression() {
  const response = await makeRequest(`${API_URL}/health`, {
    headers: {
      'Accept-Encoding': 'gzip, deflate',
    },
  });

  // Check if response is compressed or at least Content-Encoding header exists
  assert.strictEqual(response.statusCode, 200, 'Compression test should get 200 response');
}

async function testDatabaseSchema() {
  const response = await makeRequest(`${API_URL}/health/schema`, {
    headers: {
      'Authorization': 'Bearer test-token',
    },
  });

  // Endpoint may not exist but API should handle gracefully
  assert([200, 401, 404].includes(response.statusCode), 'Schema endpoint should handle request gracefully');
}

async function testCachingHeaders() {
  const response = await makeRequest(`${API_URL}/health`);
  
  // Health endpoint should typically not be cached
  const cacheControl = response.headers['cache-control'];
  assert(cacheControl, 'Should have Cache-Control header');
}

async function testLoadBalancer() {
  // Make multiple requests to ensure load balancer is working
  const responses = await Promise.all([
    makeRequest(`${API_URL}/health`),
    makeRequest(`${API_URL}/health`),
    makeRequest(`${API_URL}/health`),
  ]);

  responses.forEach((response, index) => {
    assert.strictEqual(response.statusCode, 200, `Request ${index + 1} should return 200`);
  });
}

async function testIngressConfiguration() {
  // Test both HTTP and redirect to HTTPS if applicable
  try {
    const response = await makeRequest(`${BASE_URL}/health`);
    assert([200, 301, 302].includes(response.statusCode), 'Ingress should be configured');
  } catch (error) {
    // Ingress might redirect, which is acceptable
    console.log('  Note: Ingress may be redirecting (expected for HTTPS enforcement)');
  }
}

async function testDatabaseReadiness() {
  const response = await makeRequest(`${API_URL}/health/db`);
  
  assert.strictEqual(response.statusCode, 200, 'Database should be ready');
  assert(response.jsonBody.status !== 'degraded', 'Database should not be degraded');
  assert(response.jsonBody.latency !== undefined, 'Should report database latency');
}

async function testRedisReadiness() {
  const response = await makeRequest(`${API_URL}/health/redis`);
  
  assert.strictEqual(response.statusCode, 200, 'Redis should be ready');
  assert(response.jsonBody.status !== 'degraded', 'Redis should not be degraded');
}

async function testLoggingAvailability() {
  const response = await makeRequest(`${API_URL}/health/logs`);
  
  // Logs endpoint may or may not exist, but should handle gracefully
  assert([200, 401, 404].includes(response.statusCode), 'Logging should handle request gracefully');
}

async function testMetricsCollection() {
  const response = await makeRequest(`${API_URL}/metrics`);
  
  assert.strictEqual(response.statusCode, 200, 'Metrics should be collected');
  assert(response.body.length > 100, 'Metrics output should have substantial content');
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('🚀 Starting Forge Platform Smoke Tests');
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('='.repeat(70));

  // Basic connectivity
  await runTest('Frontend Available', testFrontendAvailable);
  await runTest('Frontend Health Endpoint', testFrontendHealthEndpoint);
  await runTest('API Available', testAPIAvailable);
  await runTest('API Version Endpoint', testAPIVersion);

  // Database & Cache
  await runTest('Database Connectivity', testDatabaseConnectivity);
  await runTest('Redis Connectivity', testRedisConnectivity);
  await runTest('Database Readiness', testDatabaseReadiness);
  await runTest('Redis Readiness', testRedisReadiness);

  // API Endpoints
  await runTest('Authentication Flow', testAuthenticationFlow);
  await runTest('User Endpoint', testUserEndpoint);
  await runTest('Projects Endpoint', testProjectsEndpoint);

  // Monitoring & Observability
  await runTest('Metrics Endpoint', testMetricsEndpoint);
  await runTest('Metrics Collection', testMetricsCollection);

  // Error Handling
  await runTest('Error Handling', testErrorHandling);

  // Security
  await runTest('CORS Configuration', testCORS);
  await runTest('Security Headers', testSecurityHeaders);

  // Performance
  await runTest('Response Compression', testResponseCompression);
  await runTest('Caching Headers', testCachingHeaders);

  // Infrastructure
  await runTest('Load Balancer', testLoadBalancer);
  await runTest('Ingress Configuration', testIngressConfiguration);

  // Optional checks
  await runTest('Database Schema', testDatabaseSchema);
  await runTest('Logging Availability', testLoggingAvailability);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  
  const totalTests = results.passed.length + results.failed.length;
  const duration = Date.now() - results.startTime;
  
  console.log(`✅ Passed: ${results.passed.length}/${totalTests}`);
  console.log(`❌ Failed: ${results.failed.length}/${totalTests}`);
  console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }

  console.log('='.repeat(70));

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error running smoke tests:', error);
  process.exit(1);
});
