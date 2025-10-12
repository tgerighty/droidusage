const fs = require('fs');
const path = require('path');
const FactoryUsageAnalyzer = require('../src/analyzer');

describe('FactoryUsageAnalyzer - Parsing Logic', () => {
  let analyzer;
  let testSessionsDir;
  let testLogsDir;

  beforeAll(() => {
    // Create test directories
    testSessionsDir = path.join(__dirname, 'test-data', 'sessions');
    testLogsDir = path.join(__dirname, 'test-data', 'logs');
    
    // Ensure test directories exist
    if (!fs.existsSync(path.join(__dirname, 'test-data'))) {
      fs.mkdirSync(path.join(__dirname, 'test-data'));
    }
    if (!fs.existsSync(testSessionsDir)) {
      fs.mkdirSync(testSessionsDir);
    }
    if (!fs.existsSync(testLogsDir)) {
      fs.mkdirSync(testLogsDir);
    }

    analyzer = new FactoryUsageAnalyzer(testSessionsDir);
    analyzer.logsDir = testLogsDir;
  });

  describe('extractTimestampFromLogLine', () => {
    test('should extract timestamp from log line correctly', () => {
      const logLine = '[2025-10-08T12:03:01.753Z] INFO: [Session] Session title updated locally';
      const timestamp = analyzer.extractTimestampFromLogLine(logLine);
      
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe('2025-10-08T12:03:01.753Z');
    });

    test('should return null for invalid timestamp', () => {
      const logLine = '[invalid-timestamp] INFO: Some message';
      const timestamp = analyzer.extractTimestampFromLogLine(logLine);
      
      expect(timestamp).toBeNull();
    });

    test('should return null for line without timestamp', () => {
      const logLine = 'INFO: Some message without timestamp';
      const timestamp = analyzer.extractTimestampFromLogLine(logLine);
      
      expect(timestamp).toBeNull();
    });
  });

  describe('parseLogEntriesForSession', () => {
    beforeEach(() => {
      // Create a sample log file for testing
      const sampleLog = `[2025-10-08T12:03:01.799Z] INFO: [Agent] user message | Context: {"modelId":"gpt-5-codex","reasoningEffort":"none"}
[2025-10-08T12:03:06.901Z] INFO: [Agent] Streaming result | Context: {"count":15231,"cacheReadInputTokens":8704,"outputTokens":110}
[2025-10-08T12:03:15.333Z] INFO: [Agent] Streaming result | Context: {"count":0,"cacheReadInputTokens":0,"outputTokens":106}
[2025-10-08T12:05:31.954Z] INFO: [Agent] user message | Context: {"modelId":"custom:glm-4.6","reasoningEffort":"none"}
[2025-10-08T12:05:49.878Z] INFO: [Agent] Streaming result | Context: {"count":0,"cacheReadInputTokens":0,"outputTokens":117}
`;
      
      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), sampleLog);
    });

    afterEach(() => {
      // Clean up log file
      const logFile = path.join(testLogsDir, 'droid-log-single.log');
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }
    });

    test('should parse log entries for specific session ID', async () => {
      // Mock a session ID that would appear in logs
      const sessionId = 'test-session-id';
      
      // This test would need actual log entries with the session ID
      // For now, test that the method returns an array
      const entries = await analyzer.parseLogEntriesForSession(sessionId);
      
      expect(Array.isArray(entries)).toBe(true);
    });

    test('should handle missing log file gracefully', async () => {
      // Remove log file
      const logFile = path.join(testLogsDir, 'droid-log-single.log');
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }

      const entries = await analyzer.parseLogEntriesForSession('non-existent-session');
      
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(0);
    });
  });

  describe('Model Detection Logic', () => {
    test('should detect GLM models correctly', () => {
      expect(analyzer.normalizeModelName('custom:glm-4.6')).toBe('glm-4.6');
      expect(analyzer.normalizeModelName('GLM-4')).toBe('glm-4');
      expect(analyzer.normalizeModelName('glm-4-custom')).toBe('glm-4-custom');
    });

    test('should detect GPT models correctly', () => {
      expect(analyzer.normalizeModelName('gpt-5-codex')).toBe('gpt-5-codex');
      expect(analyzer.normalizeModelName('GPT-4o')).toBe('gpt-4o');
      expect(analyzer.normalizeModelName('gpt-3.5-turbo')).toBe('gpt-3.5-turbo');
    });

    test('should detect Claude models correctly', () => {
      expect(analyzer.normalizeModelName('claude-3-5-sonnet-20241022')).toBe('claude-3-5-sonnet-20241022');
      expect(analyzer.normalizeModelName('Claude-3-5-Haiku')).toBe('claude-3-5-haiku');
    });
  });

  describe('Token Data Aggregation', () => {
    beforeEach(() => {
      // Create sample session settings file
      const sampleSettings = {
        assistantActiveTimeMs: 15000,
        providerLock: "openai",
        providerLockTimestamp: "2025-10-08T12:03:01.753Z",
        tokenUsage: {
          inputTokens: 5000,
          outputTokens: 1000,
          cacheCreationTokens: 100,
          cacheReadTokens: 500,
          thinkingTokens: 50
        }
      };
      
      fs.writeFileSync(
        path.join(testSessionsDir, 'test-session.settings.json'), 
        JSON.stringify(sampleSettings, null, 2)
      );
    });

    afterEach(() => {
      // Clean up session file
      const sessionFile = path.join(testSessionsDir, 'test-session.settings.json');
      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
      }
    });

    test('should parse session with complete token data', async () => {
      const session = await analyzer.parseSession('test-session');
      
      expect(session).toBeDefined();
      expect(session.inputTokens).toBe(5000);
      expect(session.outputTokens).toBe(1000);
      expect(session.cacheCreationTokens).toBe(100);
      expect(session.cacheReadTokens).toBe(500);
      expect(session.thinkingTokens).toBe(50);
      expect(session.activeTimeMs).toBe(15000);
    });

    test('should handle missing token usage gracefully', async () => {
      // Create session without tokenUsage
      const minimalSettings = {
        assistantActiveTimeMs: 10000,
        providerLock: "anthropic",
        providerLockTimestamp: "2025-10-08T12:03:01.753Z"
      };
      
      fs.writeFileSync(
        path.join(testSessionsDir, 'minimal-session.settings.json'), 
        JSON.stringify(minimalSettings, null, 2)
      );

      const session = await analyzer.parseSession('minimal-session');
      
      expect(session).toBeDefined();
      expect(session.inputTokens).toBe(0);
      expect(session.outputTokens).toBe(0);
      expect(session.cacheCreationTokens).toBe(0);
      expect(session.cacheReadTokens).toBe(0);

      // Clean up
      fs.unlinkSync(path.join(testSessionsDir, 'minimal-session.settings.json'));
    });
  });

  describe('Grouping Logic', () => {
    test('should group sessions by date and model correctly', () => {
      const sessions = [
        {
          date: new Date('2025-10-08T10:00:00Z'),
          model: 'glm-4.6',
          provider: 'zhipuai',
          inputTokens: 1000,
          outputTokens: 2000,
          cacheCreationTokens: 0,
          cacheReadTokens: 100,
          cost: 1.5
        },
        {
          date: new Date('2025-10-08T14:00:00Z'),
          model: 'gpt-5-codex',
          provider: 'openai',
          inputTokens: 500,
          outputTokens: 1000,
          cacheCreationTokens: 50,
          cacheReadTokens: 200,
          cost: 2.0
        },
        {
          date: new Date('2025-10-08T16:00:00Z'),
          model: 'glm-4.6',
          provider: 'zhipuai',
          inputTokens: 800,
          outputTokens: 1600,
          cacheCreationTokens: 0,
          cacheReadTokens: 80,
          cost: 1.2
        }
      ];

      const grouped = analyzer.groupSessionsByDate(sessions);
      
      // Should have 3 separate rows (2 for glm-4.6, 1 for gpt-5-codex)
      expect(grouped).toHaveLength(3);
      
      // Check that glm-4.6 sessions are properly aggregated
      const glmSessions = grouped.filter(g => g.model === 'glm-4.6');
      expect(glmSessions).toHaveLength(2);
      
      const glmTotal = glmSessions.reduce((sum, s) => sum + s.inputTokens, 0);
      expect(glmTotal).toBe(1800); // 1000 + 800
      
      // Check gpt-5-codex session
      const gptSession = grouped.find(g => g.model === 'gpt-5-codex');
      expect(gptSession.inputTokens).toBe(500);
      expect(gptSession.outputTokens).toBe(1000);
    });
  });

  describe('Cost Calculation Edge Cases', () => {
    test('should handle zero tokens correctly', () => {
      const session = {
        provider: 'zhipuai',
        model: 'glm-4.6',
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0
      };

      expect(analyzer.calculateCost(session)).toBe(0);
    });

    test('should handle very large token numbers', () => {
      const session = {
        provider: 'openai',
        model: 'gpt-5-codex',
        inputTokens: 10000000, // 10M tokens
        outputTokens: 5000000,  // 5M tokens
        cacheCreationTokens: 1000000,
        cacheReadTokens: 500000
      };

      const expectedCost = (10000000 / 1000000) * 5.0 +   // $50.00
                          (5000000 / 1000000) * 15.0 +    // $75.00
                          (500000 / 1000000) * 0.25 +     // $0.125
                          (1000000 / 1000000) * 2.5;      // $2.50
                          // Total: $127.625

      expect(analyzer.calculateCost(session)).toBeCloseTo(expectedCost, 3);
    });

    test('should handle fractional pricing correctly', () => {
      const session = {
        provider: 'zhipuai',
        model: 'glm-4.6',
        inputTokens: 1,    // 1 token
        outputTokens: 1,   // 1 token
        cacheCreationTokens: 1,
        cacheReadTokens: 1
      };

      const expectedCost = (1 / 1000000) * 0.5 +    // $0.0000005
                          (1 / 1000000) * 2.5 +     // $0.0000025
                          (1 / 1000000) * 0.05 +    // $0.00000005
                          (1 / 1000000) * 0.25;     // $0.00000025
                          // Total: $0.0000033

      expect(analyzer.calculateCost(session)).toBeCloseTo(expectedCost, 8);
    });
  });

  afterAll(() => {
    // Clean up test directories
    if (fs.existsSync(path.join(__dirname, 'test-data'))) {
      fs.rmSync(path.join(__dirname, 'test-data'), { recursive: true, force: true });
    }
  });
});
