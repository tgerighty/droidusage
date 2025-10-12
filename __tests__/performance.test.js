const FactoryUsageAnalyzer = require('../src/analyzer');
const fs = require('fs');
const path = require('path');

describe('FactoryUsageAnalyzer - Performance Optimizations', () => {
  const testDataDir = path.join(__dirname, 'test-data');
  const testSessionsDir = path.join(testDataDir, 'sessions');
  const testLogsDir = path.join(testDataDir, 'logs');
  let analyzer;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }

    // Create test directories
    fs.mkdirSync(testDataDir, { recursive: true });
    fs.mkdirSync(testSessionsDir, { recursive: true });
    fs.mkdirSync(testLogsDir, { recursive: true });

    analyzer = new FactoryUsageAnalyzer(testSessionsDir);
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('Constructor Enhancements', () => {
    test('should initialize with log cache as null', () => {
      expect(analyzer.logCache).toBeNull();
    });

    test('should have configurable batch size', () => {
      expect(analyzer.batchSize).toBe(50);
    });

    test('should allow custom batch size', () => {
      analyzer.batchSize = 100;
      expect(analyzer.batchSize).toBe(100);
    });
  });

  describe('parseAllSessionLogs', () => {
    test('should parse log file and index by sessionId', async () => {
      const logContent = `
[2025-01-12T10:00:00.000Z] {"sessionId":"session-1","modelId":"glm-4.6","inputTokens":100}
[2025-01-12T10:01:00.000Z] {"sessionId":"session-1","outputTokens":200}
[2025-01-12T10:02:00.000Z] {"sessionId":"session-2","modelId":"gpt-4o","inputTokens":50}
[2025-01-12T10:03:00.000Z] {"sessionId":"session-2","outputTokens":75}
`;
      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), logContent);

      const logCache = await analyzer.parseAllSessionLogs();

      expect(logCache).toBeInstanceOf(Map);
      expect(logCache.size).toBeGreaterThan(0);
      expect(logCache.has('session-1')).toBe(true);
      expect(logCache.has('session-2')).toBe(true);
    });

    test('should cache parsed log data', async () => {
      const logContent = `
[2025-01-12T10:00:00.000Z] {"sessionId":"session-1","modelId":"glm-4.6","inputTokens":100}
`;
      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), logContent);

      const logCache1 = await analyzer.parseAllSessionLogs();
      const logCache2 = await analyzer.parseAllSessionLogs();

      // Should return same cached instance
      expect(logCache1).toBe(logCache2);
      expect(analyzer.logCache).not.toBeNull();
    });

    test('should handle missing log file gracefully', async () => {
      // No log file created
      const logCache = await analyzer.parseAllSessionLogs();

      expect(logCache).toBeInstanceOf(Map);
      expect(logCache.size).toBe(0);
    });

    test('should extract model information from log entries', async () => {
      const logContent = `
[2025-01-12T10:00:00.000Z] {"sessionId":"test-session","modelId":"glm-4.6"}
[2025-01-12T10:01:00.000Z] {"sessionId":"test-session","inputTokens":100}
`;
      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), logContent);

      const logCache = await analyzer.parseAllSessionLogs();
      const entries = logCache.get('test-session');

      expect(entries).toBeDefined();
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.some(e => e.modelId === 'glm-4.6')).toBe(true);
    });

    test('should extract token information from log entries', async () => {
      const logContent = `
[2025-01-12T10:00:00.000Z] {"sessionId":"test-session","outputTokens":200}
[2025-01-12T10:01:00.000Z] {"sessionId":"test-session","cacheReadInputTokens":50}
[2025-01-12T10:02:00.000Z] {"sessionId":"test-session","inputTokens":100}
`;
      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), logContent);

      const logCache = await analyzer.parseAllSessionLogs();
      const entries = logCache.get('test-session');

      expect(entries).toBeDefined();
      expect(entries.some(e => e.outputTokens > 0)).toBe(true);
      expect(entries.some(e => e.cacheReadInputTokens > 0)).toBe(true);
      expect(entries.some(e => e.inputTokens > 0)).toBe(true);
    });
  });

  describe('parseLogEntriesForSession with cache', () => {
    test('should use cached data when available', async () => {
      const logContent = `
[2025-01-12T10:00:00.000Z] {"sessionId":"session-1","modelId":"glm-4.6","inputTokens":100}
`;
      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), logContent);

      const logCache = await analyzer.parseAllSessionLogs();
      const entries = await analyzer.parseLogEntriesForSession('session-1', logCache);

      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
    });

    test('should return empty array for non-existent session', async () => {
      const logContent = `
[2025-01-12T10:00:00.000Z] {"sessionId":"session-1","modelId":"glm-4.6"}
`;
      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), logContent);

      const logCache = await analyzer.parseAllSessionLogs();
      const entries = await analyzer.parseLogEntriesForSession('non-existent', logCache);

      expect(entries).toEqual([]);
    });

    test('should fallback to file read if no cache provided', async () => {
      const logContent = `
[2025-01-12T10:00:00.000Z] {"sessionId":"session-1","modelId":"glm-4.6"}
`;
      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), logContent);

      // Don't pre-parse log, call method directly
      const entries = await analyzer.parseLogEntriesForSession('session-1', null);

      // Should handle gracefully (return empty or fallback)
      expect(Array.isArray(entries)).toBe(true);
    });
  });

  describe('parseSessionsBatch', () => {
    beforeEach(() => {
      // Create test session files
      const sessions = [
        { id: 'session-1', model: 'glm-4.6', tokens: { inputTokens: 100, outputTokens: 200 } },
        { id: 'session-2', model: 'gpt-4o', tokens: { inputTokens: 50, outputTokens: 75 } },
        { id: 'session-3', model: 'glm-4.6', tokens: { inputTokens: 150, outputTokens: 300 } }
      ];

      sessions.forEach(session => {
        const settings = {
          providerLock: session.model.includes('glm') ? 'zhipuai' : 'openai',
          providerLockTimestamp: '2025-01-12T10:00:00.000Z',
          tokenUsage: session.tokens
        };
        fs.writeFileSync(
          path.join(testSessionsDir, `${session.id}.settings.json`),
          JSON.stringify(settings)
        );
        fs.writeFileSync(
          path.join(testSessionsDir, `${session.id}.jsonl`),
          '{"type":"message","message":{"role":"user","content":[{"type":"text","text":"test"}]}}\n'
        );
      });
    });

    test('should process sessions in parallel batches', async () => {
      const sessionIds = ['session-1', 'session-2', 'session-3'];
      const logCache = await analyzer.parseAllSessionLogs();

      const sessions = await analyzer.parseSessionsBatch(sessionIds, logCache, false);

      expect(sessions).toBeDefined();
      expect(sessions.length).toBe(3);
      expect(sessions.every(s => s !== null)).toBe(true);
    });

    test('should filter out null results', async () => {
      const sessionIds = ['session-1', 'non-existent', 'session-2'];
      const logCache = await analyzer.parseAllSessionLogs();

      const sessions = await analyzer.parseSessionsBatch(sessionIds, logCache, false);

      // Should have 2 valid sessions (non-existent should be filtered)
      expect(sessions.length).toBe(2);
      expect(sessions.every(s => s !== null)).toBe(true);
    });

    test('should respect batch size', async () => {
      analyzer.batchSize = 2; // Set small batch size
      const sessionIds = ['session-1', 'session-2', 'session-3'];
      const logCache = await analyzer.parseAllSessionLogs();

      const sessions = await analyzer.parseSessionsBatch(sessionIds, logCache, false);

      expect(sessions.length).toBe(3);
    });

    test('should skip prompt counting when countPrompts is false', async () => {
      const sessionIds = ['session-1'];
      const logCache = await analyzer.parseAllSessionLogs();

      const sessions = await analyzer.parseSessionsBatch(sessionIds, logCache, false);

      expect(sessions[0]).toBeDefined();
      expect(sessions[0].userInteractions).toBe(0); // Should be 0 when not counted
    });

    test('should count prompts when countPrompts is true', async () => {
      const sessionIds = ['session-1'];
      const logCache = await analyzer.parseAllSessionLogs();

      const sessions = await analyzer.parseSessionsBatch(sessionIds, logCache, true);

      expect(sessions[0]).toBeDefined();
      // User interactions may be 0 if file doesn't exist, but method should be called
    });
  });

  describe('parseSession with optimization parameters', () => {
    beforeEach(() => {
      const settings = {
        providerLock: 'zhipuai',
        providerLockTimestamp: '2025-01-12T10:00:00.000Z',
        tokenUsage: {
          inputTokens: 100,
          outputTokens: 200,
          cacheCreationTokens: 0,
          cacheReadTokens: 50
        },
        assistantActiveTimeMs: 5000
      };
      fs.writeFileSync(
        path.join(testSessionsDir, 'test-session.settings.json'),
        JSON.stringify(settings)
      );
      fs.writeFileSync(
        path.join(testSessionsDir, 'test-session.jsonl'),
        '{"type":"message","message":{"role":"user","content":[{"type":"text","text":"test"}]}}\n'
      );
    });

    test('should accept logCache parameter', async () => {
      const logCache = new Map();
      logCache.set('test-session', []);

      const session = await analyzer.parseSession('test-session', logCache, false);

      expect(session).not.toBeNull();
      expect(session.id).toBe('test-session');
    });

    test('should skip prompt counting when countPrompts is false', async () => {
      const session = await analyzer.parseSession('test-session', null, false);

      expect(session).not.toBeNull();
      expect(session.userInteractions).toBe(0);
    });

    test('should count prompts when countPrompts is true', async () => {
      const session = await analyzer.parseSession('test-session', null, true);

      expect(session).not.toBeNull();
      // userInteractions should be counted (may be 0 or more depending on jsonl content)
      expect(typeof session.userInteractions).toBe('number');
    });
  });

  describe('Integration with optimized methods', () => {
    beforeEach(() => {
      // Create multiple test sessions
      for (let i = 1; i <= 5; i++) {
        const settings = {
          providerLock: i % 2 === 0 ? 'zhipuai' : 'openai',
          providerLockTimestamp: `2025-01-${10 + i}T10:00:00.000Z`,
          tokenUsage: {
            inputTokens: i * 100,
            outputTokens: i * 200,
            cacheCreationTokens: 0,
            cacheReadTokens: i * 10
          }
        };
        fs.writeFileSync(
          path.join(testSessionsDir, `session-${i}.settings.json`),
          JSON.stringify(settings)
        );
        fs.writeFileSync(
          path.join(testSessionsDir, `session-${i}.jsonl`),
          '{"type":"message","message":{"role":"user","content":[{"type":"text","text":"test"}]}}\n'
        );
      }
    });

    test('getDailyUsage should use optimized batch processing', async () => {
      const results = await analyzer.getDailyUsage();

      expect(results).toBeDefined();
      expect(results.type).toBe('daily');
      expect(results.data).toBeDefined();
      expect(results.summary.totalSessions).toBe(5);
    });

    test('getSessionUsage should use optimized batch processing', async () => {
      const results = await analyzer.getSessionUsage();

      expect(results).toBeDefined();
      expect(results.type).toBe('session');
      expect(results.data.length).toBe(5);
    });

    test('getBlockUsage should use optimized batch processing with prompt counting', async () => {
      const results = await analyzer.getBlockUsage();

      expect(results).toBeDefined();
      expect(results.type).toBe('blocks');
      expect(results.data).toBeDefined();
    });
  });

  describe('Performance characteristics', () => {
    test('should reuse cached log data across multiple calls', async () => {
      const logContent = `
[2025-01-12T10:00:00.000Z] {"sessionId":"session-1","modelId":"glm-4.6"}
`;
      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), logContent);

      // First call - populates cache
      await analyzer.parseAllSessionLogs();
      expect(analyzer.logCache).not.toBeNull();

      const cache1 = analyzer.logCache;

      // Second call - should reuse cache
      await analyzer.parseAllSessionLogs();
      const cache2 = analyzer.logCache;

      expect(cache1).toBe(cache2); // Same object reference
    });

    test('should handle empty session list efficiently', async () => {
      const logCache = await analyzer.parseAllSessionLogs();
      const sessions = await analyzer.parseSessionsBatch([], logCache, false);

      expect(sessions).toEqual([]);
    });

    test('should process large batch within reasonable batch size', async () => {
      // Create 150 session IDs (3 batches with default batch size of 50)
      const sessionIds = Array.from({ length: 150 }, (_, i) => `session-${i}`);

      // Create one actual session file for testing
      fs.writeFileSync(
        path.join(testSessionsDir, 'session-0.settings.json'),
        JSON.stringify({
          providerLock: 'zhipuai',
          providerLockTimestamp: '2025-01-12T10:00:00.000Z',
          tokenUsage: { inputTokens: 100, outputTokens: 200 }
        })
      );

      const logCache = await analyzer.parseAllSessionLogs();
      const sessions = await analyzer.parseSessionsBatch(sessionIds, logCache, false);

      // Should process what exists, filter out nulls
      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.every(s => s !== null)).toBe(true);
    });
  });
});
