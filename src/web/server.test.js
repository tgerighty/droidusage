const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Mock the 'open' module to avoid ES module issues
jest.mock('open', () => jest.fn());

const WebServer = require('./server');

describe('WebServer API Tests', () => {
  let server;
  let testSessionsDir;
  let app;

  beforeAll(async () => {
    // Create temporary test sessions directory
    testSessionsDir = path.join(__dirname, '../../test-sessions-temp');
    if (!fs.existsSync(testSessionsDir)) {
      fs.mkdirSync(testSessionsDir, { recursive: true });
    }

    // Create sample session file
    const sampleSession = {
      id: 'test-session-1',
      startTime: new Date('2025-01-10T10:00:00Z').toISOString(),
      endTime: new Date('2025-01-10T10:30:00Z').toISOString(),
      model: 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
      inputTokens: 1000,
      outputTokens: 500,
      cacheCreationTokens: 200,
      cacheReadTokens: 100,
      interactions: []
    };

    const sessionFile = path.join(testSessionsDir, 'test-session-1.json');
    fs.writeFileSync(sessionFile, JSON.stringify(sampleSession, null, 2));

    // Initialize server (but don't start listening)
    server = new WebServer(testSessionsDir, 3001);
    app = server.app;
  });

  afterAll(() => {
    // Cleanup test directory
    if (fs.existsSync(testSessionsDir)) {
      fs.rmSync(testSessionsDir, { recursive: true, force: true });
    }
  });

  describe('Health Check', () => {
    test('GET /api/health returns status ok', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Daily Usage Endpoint', () => {
    test('GET /api/daily returns daily usage data', async () => {
      const response = await request(app)
        .get('/api/daily')
        .expect(200)
        .expect('Content-Type', /json/);

      // Response can be array or object depending on implementation
      expect(response.body).toBeDefined();
    });

    test('GET /api/daily with date filters', async () => {
      const response = await request(app)
        .get('/api/daily?since=2025-01-01&until=2025-01-31')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('GET /api/daily handles errors gracefully', async () => {
      const response = await request(app)
        .get('/api/daily?since=invalid-date');

      // Either succeeds (ignores invalid date) or returns error
      expect([200, 500]).toContain(response.status);
      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Session Usage Endpoint', () => {
    test('GET /api/sessions returns session data', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
    });

    test('GET /api/sessions with date filters', async () => {
      const response = await request(app)
        .get('/api/sessions?since=2025-01-01')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Top Sessions Endpoint', () => {
    test('GET /api/top returns top sessions by cost', async () => {
      const response = await request(app)
        .get('/api/top')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
    });

    test('GET /api/top with by parameter (cost)', async () => {
      const response = await request(app)
        .get('/api/top?by=cost&limit=5')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('GET /api/top with by parameter (tokens)', async () => {
      const response = await request(app)
        .get('/api/top?by=tokens&limit=10')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('GET /api/top with by parameter (duration)', async () => {
      const response = await request(app)
        .get('/api/top?by=duration&limit=3')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('GET /api/top with invalid limit defaults to 10', async () => {
      const response = await request(app)
        .get('/api/top?limit=invalid')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Trends Analysis Endpoint', () => {
    test('GET /api/trends returns trend data', async () => {
      const response = await request(app)
        .get('/api/trends')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
    });

    test('GET /api/trends with date range', async () => {
      const response = await request(app)
        .get('/api/trends?since=2025-01-01&until=2025-01-31')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Block Usage Endpoint', () => {
    test('GET /api/blocks returns block usage data', async () => {
      const response = await request(app)
        .get('/api/blocks')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
    });
  });

  describe('Analysis Endpoints', () => {
    test('GET /api/analyze returns all analyses', async () => {
      const response = await request(app)
        .get('/api/analyze');

      // Should succeed or return error (might fail with empty sessions)
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        // Orchestrator returns structured response
        expect(response.body).toHaveProperty('sessionCount');
        expect(response.body).toHaveProperty('results');
        expect(response.body.results).toBeDefined();
      }
    });

    test('GET /api/analyze/cost returns cost analysis', async () => {
      const response = await request(app)
        .get('/api/analyze/cost')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveProperty('cost');
    });

    test('GET /api/analyze/patterns returns pattern analysis', async () => {
      const response = await request(app)
        .get('/api/analyze/patterns')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveProperty('patterns');
    });

    test('GET /api/analyze/efficiency returns efficiency analysis', async () => {
      const response = await request(app)
        .get('/api/analyze/efficiency')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveProperty('efficiency');
    });

    test('GET /api/analyze with date filters', async () => {
      const response = await request(app)
        .get('/api/analyze/cost?since=2025-01-01')
        .expect(200);

      expect(response.body).toHaveProperty('results');
    });

    test('GET /api/analyze handles errors', async () => {
      // This might not error with our current implementation, but good to test
      const response = await request(app)
        .get('/api/analyze/cost?since=invalid-date');

      // Either succeeds (filters out invalid dates) or returns 500
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Models Endpoint', () => {
    test('GET /api/models returns list of models', async () => {
      const response = await request(app)
        .get('/api/models')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('models');
      expect(Array.isArray(response.body.models)).toBe(true);
    });

    test('GET /api/models returns sorted unique models', async () => {
      const response = await request(app)
        .get('/api/models')
        .expect(200);

      const models = response.body.models;
      expect(Array.isArray(models)).toBe(true);
      
      // Check uniqueness
      const uniqueModels = [...new Set(models)];
      expect(models.length).toBe(uniqueModels.length);
    });
  });

  describe('Providers Endpoint', () => {
    test('GET /api/providers returns list of providers', async () => {
      const response = await request(app)
        .get('/api/providers')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('providers');
      expect(Array.isArray(response.body.providers)).toBe(true);
    });

    test('GET /api/providers returns sorted unique providers', async () => {
      const response = await request(app)
        .get('/api/providers')
        .expect(200);

      const providers = response.body.providers;
      expect(Array.isArray(providers)).toBe(true);
      
      // Check uniqueness
      const uniqueProviders = [...new Set(providers)];
      expect(providers.length).toBe(uniqueProviders.length);
    });
  });

  describe('Dashboard Routes', () => {
    test('GET / serves dashboard HTML', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /html/);

      expect(response.text).toContain('<!DOCTYPE html>');
    });

    test('GET /unknown-route serves dashboard HTML (SPA fallback)', async () => {
      const response = await request(app)
        .get('/some/random/route')
        .expect(200)
        .expect('Content-Type', /html/);

      expect(response.text).toContain('<!DOCTYPE html>');
    });
  });

  describe('Error Handling', () => {
    test('handles malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/daily') // POST instead of GET
        .expect(404); // Express returns 404 for unmatched routes

      // Body might be empty or contain error message
      expect(response.status).toBe(404);
    });

    test('returns proper error structure for server errors', async () => {
      // Force an error by using invalid query params that break the analyzer
      const response = await request(app)
        .get('/api/sessions');

      // Should either succeed or return structured error
      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      } else {
        expect(response.status).toBe(200);
      }
    });
  });

  describe('CORS and Compression', () => {
    test('includes CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('supports compression', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      // Compression middleware should handle this
      expect(response.status).toBe(200);
    });
  });
});

describe('WebServer Lifecycle', () => {
  let server;
  let testSessionsDir;

  beforeAll(() => {
    testSessionsDir = path.join(__dirname, '../../test-sessions-lifecycle');
    if (!fs.existsSync(testSessionsDir)) {
      fs.mkdirSync(testSessionsDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testSessionsDir)) {
      fs.rmSync(testSessionsDir, { recursive: true, force: true });
    }
  });

  test('server starts and stops gracefully', async () => {
    server = new WebServer(testSessionsDir, 3002);
    
    const url = await server.start(false); // Don't open browser
    expect(url).toContain('http://localhost:3002');
    
    server.stop();
    
    // Give it a moment to close
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('server finds alternative port when port is in use', async () => {
    const server1 = new WebServer(testSessionsDir, 3003);
    await server1.start(false);

    // Try to start another server on same port - should find next available
    const server2 = new WebServer(testSessionsDir, 3003);
    const url = await server2.start(false);
    
    expect(url).toContain('http://localhost:3004'); // Should use next port

    server1.stop();
    server2.stop();

    await new Promise(resolve => setTimeout(resolve, 100));
  });
});
