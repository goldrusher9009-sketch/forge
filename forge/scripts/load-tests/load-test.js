import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginTrend = new Trend('login_duration');
const dashboardTrend = new Trend('dashboard_duration');
const apiCallTrend = new Trend('api_call_duration');
const requestCounter = new Counter('requests_total');
const concurrentUsers = new Gauge('concurrent_users');

// Configuration
export const options = {
  stages: [
    { duration: '2m', target: 50, name: 'Ramp-up phase' },      // Ramp to 50 users
    { duration: '5m', target: 100, name: 'Spike phase' },        // Spike to 100 users
    { duration: '5m', target: 100, name: 'Load test phase' },    // Hold at 100 users
    { duration: '2m', target: 0, name: 'Ramp-down phase' },      // Ramp down to 0
  ],
  thresholds: {
    'errors': ['rate<0.1'],                    // Error rate < 10%
    'login_duration': ['p(95)<2000'],         // 95th percentile < 2s
    'dashboard_duration': ['p(95)<1000'],     // 95th percentile < 1s
    'api_call_duration': ['p(95)<500'],       // 95th percentile < 500ms
    'http_req_duration': ['p(95)<1000'],      // HTTP requests 95th percentile < 1s
    'http_req_failed': ['rate<0.1'],          // Failed requests < 10%
  },
  ext: {
    loadimpact: {
      projectID: 3456789,
      name: 'Forge Platform Load Test',
    },
  },
};

// Test parameters
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = __ENV.API_URL || 'http://localhost:8000/api/v1';
const THINK_TIME = 1000;  // Time between requests in ms

// Helper function to generate unique email
function generateEmail() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000000);
  return `test-user-${timestamp}-${random}@forge.test`;
}

// Helper function for API authentication
function authenticateUser(email, password) {
  const loginRes = http.post(`${API_BASE}/auth/login`, {
    email: email,
    password: password,
  }, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('token') !== null,
  });

  if (loginRes.status === 200) {
    return {
      token: loginRes.json('token'),
      userId: loginRes.json('user.id'),
    };
  }

  return null;
}

// Main test function
export default function (data) {
  const email = generateEmail();
  const password = 'TestPassword123!';

  concurrentUsers.add(1);

  try {
    group('Authentication flow', function () {
      // Simulate login
      const startTime = new Date().getTime();
      const auth = authenticateUser(email, password);
      const duration = new Date().getTime() - startTime;

      loginTrend.add(duration);
      requestCounter.add(1);

      check(auth, {
        'authentication successful': (a) => a !== null,
      });

      if (!auth) {
        errorRate.add(1);
        return;
      }

      // Store token for subsequent requests
      const headers = {
        'Authorization': `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
      };

      sleep(THINK_TIME / 1000);

      // Load dashboard
      group('Dashboard operations', function () {
        const dashStart = new Date().getTime();
        const dashRes = http.get(`${API_BASE}/dashboard`, { headers });
        const dashDuration = new Date().getTime() - dashStart;

        dashboardTrend.add(dashDuration);
        requestCounter.add(1);

        check(dashRes, {
          'dashboard loaded': (r) => r.status === 200,
          'has dashboard data': (r) => r.json('data') !== null,
        });

        if (dashRes.status !== 200) {
          errorRate.add(1);
        }
      });

      sleep(THINK_TIME / 1000);

      // API calls
      group('API operations', function () {
        // GET request
        const getStart = new Date().getTime();
        const getRes = http.get(`${API_BASE}/projects`, { headers });
        const getDuration = new Date().getTime() - getStart;

        apiCallTrend.add(getDuration);
        requestCounter.add(1);

        check(getRes, {
          'get projects success': (r) => r.status === 200,
          'projects array returned': (r) => Array.isArray(r.json('data')),
        });

        if (getRes.status !== 200) {
          errorRate.add(1);
        }

        sleep(THINK_TIME / 1000);

        // POST request
        const payload = JSON.stringify({
          name: `Test Project ${new Date().getTime()}`,
          description: 'Load test project',
          type: 'experimental',
        });

        const postStart = new Date().getTime();
        const postRes = http.post(`${API_BASE}/projects`, payload, { headers });
        const postDuration = new Date().getTime() - postStart;

        apiCallTrend.add(postDuration);
        requestCounter.add(1);

        check(postRes, {
          'create project success': (r) => r.status === 201 || r.status === 200,
          'project id returned': (r) => r.json('data.id') !== null,
        });

        if (postRes.status !== 201 && postRes.status !== 200) {
          errorRate.add(1);
        }

        if (postRes.status === 201 || postRes.status === 200) {
          const projectId = postRes.json('data.id');

          sleep(THINK_TIME / 1000);

          // PUT request
          const updatePayload = JSON.stringify({
            name: `Updated Project ${new Date().getTime()}`,
            description: 'Updated during load test',
          });

          const putStart = new Date().getTime();
          const putRes = http.put(`${API_BASE}/projects/${projectId}`, updatePayload, { headers });
          const putDuration = new Date().getTime() - putStart;

          apiCallTrend.add(putDuration);
          requestCounter.add(1);

          check(putRes, {
            'update project success': (r) => r.status === 200,
          });

          if (putRes.status !== 200) {
            errorRate.add(1);
          }

          sleep(THINK_TIME / 1000);

          // DELETE request
          const delStart = new Date().getTime();
          const delRes = http.del(`${API_BASE}/projects/${projectId}`, null, { headers });
          const delDuration = new Date().getTime() - delStart;

          apiCallTrend.add(delDuration);
          requestCounter.add(1);

          check(delRes, {
            'delete project success': (r) => r.status === 204 || r.status === 200,
          });

          if (delRes.status !== 204 && delRes.status !== 200) {
            errorRate.add(1);
          }
        }
      });

      sleep(THINK_TIME / 1000);

      // Simulated think time
      group('User think time', function () {
        sleep(Math.random() * 3);
      });
    });
  } finally {
    concurrentUsers.add(-1);
  }
}

// Teardown function to cleanup after tests
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Total requests: ${requestCounter.value}`);
  console.log(`Error rate: ${errorRate.value}`);
}
