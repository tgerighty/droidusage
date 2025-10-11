const fs = require('fs');
const path = require('path');
const FactoryUsageAnalyzer = require('../src/analyzer');

describe('FactoryUsageAnalyzer - Integration Tests', () => {
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

  describe('Full Workflow Tests', () => {
    beforeEach(() => {
      // Create realistic test data
      
      // Sample log entries
      const sampleLog = `[2025-10-08T10:00:00.000Z] INFO: [App] Pre-created new session | Context: {"sessionId":"session-1-glm"}
[2025-10-08T10:01:00.000Z] INFO: [Agent] user message | Context: {"modelId":"custom:glm-4.6","reasoningEffort":"none"}
[2025-10-08T10:02:00.000Z] INFO: [Agent] Streaming result | Context: {"count":1000,"outputTokens":50}
[2025-10-08T10:03:00.000Z] INFO: [Agent] Streaming result | Context: {"count":0,"outputTokens":25}
[2025-10-08T12:00:00.000Z] INFO: [App] Pre-created new session | Context: {"sessionId":"session-2-gpt"}
[2025-10-08T12:01:00.000Z] INFO: [Agent] user message | Context: {"modelId":"gpt-5-codex","reasoningEffort":"none"}
[2025-10-08T12:02:00.000Z] INFO: [Agent] Streaming result | Context: {"count":2000,"cacheReadInputTokens":1000,"outputTokens":100}
[2025-10-08T12:03:00.000Z] INFO: [Agent] Streaming result | Context: {"count":0,"cacheReadInputTokens":0,"outputTokens":50}
[2025-10-08T14:00:00.000Z] INFO: [App] Pre-created new session | Context: {"sessionId":"session-3-glm"}
[2025-10-08T14:01:00.000Z] INFO: [Agent] user message | Context: {"modelId":"custom:glm-4.6","reasoningEffort":"none"}
[2025-10-08T14:02:00.000Z] INFO: [Agent] Streaming result | Context: {"count":1500,"outputTokens":75}
`;

      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), sampleLog);

      // Sample session settings
      const session1Settings = {
        assistantActiveTimeMs: 120000,
        providerLock: "zhipuai",
        providerLockTimestamp: "2025-10-08T10:00:00.000Z",
        tokenUsage: {
          inputTokens: 2000,
          outputTokens: 75,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          thinkingTokens: 0
        }
      };

      const session2Settings = {
        assistantActiveTimeMs: 180000,
        providerLock: "openai",
        providerLockTimestamp: "2025-10-08T12:00:00.000Z",
        tokenUsage: {
          inputTokens: 5000,
          outputTokens: 150,
          cacheCreationTokens: 100,
          cacheReadTokens: 1000,
          thinkingTokens: 50
        }
      };

      const session3Settings = {
        assistantActiveTimeMs: 90000,
        providerLock: "zhipuai",
        providerLockTimestamp: "2025-10-08T14:00:00.000Z",
        tokenUsage: {
          inputTokens: 1500,
          outputTokens: 75,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          thinkingTokens: 0
        }
      };

      fs.writeFileSync(
        path.join(testSessionsDir, 'session-1-glm.settings.json'),
        JSON.stringify(session1Settings, null, 2)
      );
      fs.writeFileSync(
        path.join(testSessionsDir, 'session-2-gpt.settings.json'),
        JSON.stringify(session2Settings, null, 2)
      );
      fs.writeFileSync(
        path.join(testSessionsDir, 'session-3-glm.settings.json'),
        JSON.stringify(session3Settings, null, 2)
      );
    });

    afterEach(() => {
      // Clean up files
      const files = [
        path.join(testLogsDir, 'droid-log-single.log'),
        path.join(testSessionsDir, 'session-1-glm.settings.json'),
        path.join(testSessionsDir, 'session-2-gpt.settings.json'),
        path.join(testSessionsDir, 'session-3-glm.settings.json')
      ];

      files.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
    });

    test('should analyze multiple sessions with different models', async () => {
      const sessionIds = await analyzer.getSessionFiles();
      
      expect(sessionIds).toHaveLength(3);
      expect(sessionIds).toContain('session-1-glm');
      expect(sessionIds).toContain('session-2-gpt');
      expect(sessionIds).toContain('session-3-glm');
    });

    test('should parse sessions with correct model detection', async () => {
      const session1 = await analyzer.parseSession('session-1-glm');
      const session2 = await analyzer.parseSession('session-2-gpt');
      const session3 = await analyzer.parseSession('session-3-glm');

      expect(session1.model).toBe('glm-4.6');
      expect(session1.provider).toBe('zhipuai');
      
      expect(session2.model).toBe('gpt-5-codex');
      expect(session2.provider).toBe('openai');
      
      expect(session3.model).toBe('glm-4.6');
      expect(session3.provider).toBe('zhipuai');
    });

    test('should aggregate tokens correctly across sessions', async () => {
      const dailyData = await analyzer.getDailyUsage();
      
      expect(dailyData.data).toHaveLength(2); // 2 models on same date
      expect(dailyData.data[0].date).toBe('2025-10-08');
      
      // Should have separate entries for each model
      const glmEntries = dailyData.data.filter(d => d.model === 'glm-4.6');
      const gptEntries = dailyData.data.filter(d => d.model === 'gpt-5-codex');
      
      expect(glmEntries).toHaveLength(1); // session-1 and session-3 aggregated
      expect(gptEntries).toHaveLength(1); // session-2
    });

    test('should calculate costs correctly for all models', async () => {
      const sessions = await analyzer.getSessionUsage();
      
      // Find GLM sessions
      const glmSessions = sessions.data.filter(s => s.model === 'glm-4.6');
      const gptSessions = sessions.data.filter(s => s.model === 'gpt-5-codex');
      
      // GLM sessions should have costs
      glmSessions.forEach(session => {
        expect(session.cost).toBeGreaterThan(0);
        expect(typeof session.cost).toBe('number');
      });
      
      // GPT session should have higher cost due to higher pricing
      const gptSession = gptSessions[0];
      expect(gptSession.cost).toBeGreaterThan(0);
      
      // GPT should be more expensive than individual GLM sessions
      glmSessions.forEach(glmSession => {
        expect(gptSession.cost).toBeGreaterThan(glmSession.cost);
      });
    });

    test('should provide accurate summary statistics', async () => {
      const dailyData = await analyzer.getDailyUsage();
      
      expect(dailyData.summary.totalSessions).toBe(3);
      expect(dailyData.summary.totalTokens).toBeGreaterThan(0);
      expect(dailyData.summary.totalCost).toBeGreaterThan(0);
      expect(dailyData.summary.totalActiveTime).toBeGreaterThan(0);
    });
  });

  describe('Real-world Scenario Tests', () => {
    test('should handle mixed provider sessions correctly', async () => {
      // Create a scenario where we have multiple providers on the same day
      
      const mixedLog = `[2025-10-08T09:00:00.000Z] INFO: [Agent] user message | Context: {"modelId":"gpt-5-codex","reasoningEffort":"none"}
[2025-10-08T09:05:00.000Z] INFO: [Agent] Streaming result | Context: {"count":1000,"cacheReadInputTokens":500,"outputTokens":50}
[2025-10-08T10:00:00.000Z] INFO: [Agent] user message | Context: {"modelId":"custom:glm-4.6","reasoningEffort":"none"}
[2025-10-08T10:05:00.000Z] INFO: [Agent] Streaming result | Context: {"count":800,"outputTokens":40}
[2025-10-08T11:00:00.000Z] INFO: [Agent] user message | Context: {"modelId":"claude-3-5-sonnet-20241022","reasoningEffort":"none"}
[2025-10-08T11:05:00.000Z] INFO: [Agent] Streaming result | Context: {"count":1200,"outputTokens":60}
`;

      fs.writeFileSync(path.join(testLogsDir, 'droid-log-single.log'), mixedLog);

      const gptSettings = {
        assistantActiveTimeMs: 60000,
        providerLock: "openai",
        providerLockTimestamp: "2025-10-08T09:00:00.000Z",
        tokenUsage: { inputTokens: 1000, outputTokens: 50, cacheCreationTokens: 0, cacheReadTokens: 500, thinkingTokens: 0 }
      };

      const glmSettings = {
        assistantActiveTimeMs: 45000,
        providerLock: "zhipuai",
        providerLockTimestamp: "2025-10-08T10:00:00.000Z",
        tokenUsage: { inputTokens: 800, outputTokens: 40, cacheCreationTokens: 0, cacheReadTokens: 0, thinkingTokens: 0 }
      };

      const claudeSettings = {
        assistantActiveTimeMs: 75000,
        providerLock: "anthropic",
        providerLockTimestamp: "2025-10-08T11:00:00.000Z",
        tokenUsage: { inputTokens: 1200, outputTokens: 60, cacheCreationTokens: 100, cacheReadTokens: 200, thinkingTokens: 0 }
      };

      fs.writeFileSync(path.join(testSessionsDir, 'gpt-session.settings.json'), JSON.stringify(gptSettings, null, 2));
      fs.writeFileSync(path.join(testSessionsDir, 'glm-session.settings.json'), JSON.stringify(glmSettings, null, 2));
      fs.writeFileSync(path.join(testSessionsDir, 'claude-session.settings.json'), JSON.stringify(claudeSettings, null, 2));

      const dailyData = await analyzer.getDailyUsage();
      
      expect(dailyData.data).toHaveLength(3); // One row per model
      
      const models = dailyData.data.map(d => d.model);
      expect(models).toContain('gpt-5-codex');
      expect(models).toContain('glm-4.6');
      expect(models).toContain('claude-3-5-sonnet-20241022');
      
      // Verify each has different costs due to different pricing
      const costs = dailyData.data.map(d => d.cost);
      expect(new Set(costs).size).toBe(3); // All costs should be different

      // Clean up
      ['gpt-session.settings.json', 'glm-session.settings.json', 'claude-session.settings.json'].forEach(file => {
        fs.unlinkSync(path.join(testSessionsDir, file));
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle corrupted session files gracefully', async () => {
      // Create a corrupted session file
      fs.writeFileSync(path.join(testSessionsDir, 'corrupted.settings.json'), 'invalid json');
      
      const session = await analyzer.parseSession('corrupted');
      expect(session).toBeNull();
      
      // Clean up
      fs.unlinkSync(path.join(testSessionsDir, 'corrupted.settings.json'));
    });

    test('should handle missing session files gracefully', async () => {
      const session = await analyzer.parseSession('non-existent');
      expect(session).toBeNull();
    });

    test('should handle empty sessions directory', async () => {
      // Remove all session files
      const files = fs.readdirSync(testSessionsDir);
      files.forEach(file => {
        if (file.endsWith('.settings.json')) {
          fs.unlinkSync(path.join(testSessionsDir, file));
        }
      });
      
      const sessionIds = await analyzer.getSessionFiles();
      expect(sessionIds).toHaveLength(0);
      
      const dailyData = await analyzer.getDailyUsage();
      expect(dailyData.data).toHaveLength(0);
      expect(dailyData.summary.totalSessions).toBe(0);
    });
  });

  afterAll(() => {
    // Clean up test directories
    if (fs.existsSync(path.join(__dirname, 'test-data'))) {
      fs.rmSync(path.join(__dirname, 'test-data'), { recursive: true, force: true });
    }
  });
});
