const fs = require('fs');
const path = require('path');
const FactoryUsageAnalyzer = require('../src/analyzer');

describe('FactoryUsageAnalyzer', () => {
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

  describe('Constructor', () => {
    test('should initialize with sessions directory', () => {
      expect(analyzer.sessionsDir).toBe(testSessionsDir);
      expect(analyzer.logsDir).toBe(testLogsDir);
    });

    test('should have pricing configuration for all providers', () => {
      expect(analyzer.pricing.anthropic).toBeDefined();
      expect(analyzer.pricing.openai).toBeDefined();
      expect(analyzer.pricing.zhipuai).toBeDefined();
      expect(analyzer.pricing.zai).toBeDefined();
    });
  });

  describe('Pricing Configuration', () => {
    test('should have correct pricing for GLM models', () => {
      const glmPricing = analyzer.pricing.zhipuai['glm-4.6'];
      expect(glmPricing.input).toBe(0.5);
      expect(glmPricing.output).toBe(2.5);
      expect(glmPricing.cacheRead).toBe(0.05);
      expect(glmPricing.cacheWrite).toBe(0.25);
    });

    test('should have correct pricing for GPT-5 models', () => {
      const gpt5Pricing = analyzer.pricing.openai['gpt-5-codex'];
      expect(gpt5Pricing.input).toBe(5.0);
      expect(gpt5Pricing.output).toBe(15.0);
      expect(gpt5Pricing.cacheRead).toBe(0.25);
      expect(gpt5Pricing.cacheWrite).toBe(2.5);
    });

    test('should have identical pricing for both zhipuai and zai providers', () => {
      expect(analyzer.pricing.zhipuai).toEqual(analyzer.pricing.zai);
    });
  });

  describe('normalizeModelName', () => {
    test('should normalize custom model prefixes', () => {
      expect(analyzer.normalizeModelName('custom:glm-4.6')).toBe('glm-4.6');
      expect(analyzer.normalizeModelName('custom:gpt-4o')).toBe('gpt-4o');
    });

    test('should handle various model name formats', () => {
      expect(analyzer.normalizeModelName('GLM-4.6')).toBe('glm-4.6');
      expect(analyzer.normalizeModelName('GPT-4o')).toBe('gpt-4o');
      expect(analyzer.normalizeModelName('Claude-3-5-Sonnet')).toBe('claude-3-5-sonnet');
    });

    test('should clean up model name variations', () => {
      expect(analyzer.normalizeModelName('custom:glm-4')).toBe('glm-4');
      expect(analyzer.normalizeModelName('sonnet')).toBe('sonnet');
    });
  });

  describe('calculateCost', () => {
    test('should calculate cost correctly for GLM-4.6', () => {
      const session = {
        provider: 'zhipuai',
        model: 'glm-4.6',
        inputTokens: 1000000,
        outputTokens: 500000,
        cacheReadTokens: 100000,
        cacheCreationTokens: 50000
      };

      const expectedCost = (1000000 / 1000000) * 0.5 +  // Input: $0.50
                          (500000 / 1000000) * 2.5 +     // Output: $1.25
                          (100000 / 1000000) * 0.05 +    // Cache Read: $0.005
                          (50000 / 1000000) * 0.25;      // Cache Write: $0.0125
                          // Total: $1.7675

      expect(analyzer.calculateCost(session)).toBeCloseTo(expectedCost, 4);
    });

    test('should calculate cost correctly for GPT-5-Codex', () => {
      const session = {
        provider: 'openai',
        model: 'gpt-5-codex',
        inputTokens: 2000000,
        outputTokens: 1000000,
        cacheReadTokens: 200000,
        cacheCreationTokens: 100000
      };

      const expectedCost = (2000000 / 1000000) * 5.0 +   // Input: $10.00
                          (1000000 / 1000000) * 15.0 +  // Output: $15.00
                          (200000 / 1000000) * 0.25 +   // Cache Read: $0.05
                          (100000 / 1000000) * 2.5;     // Cache Write: $0.25
                          // Total: $25.30

      expect(analyzer.calculateCost(session)).toBeCloseTo(expectedCost, 4);
    });

    test('should return 0 for unknown provider', () => {
      const session = {
        provider: 'unknown',
        model: 'unknown-model',
        inputTokens: 1000000,
        outputTokens: 1000000,
        cacheReadTokens: 100000,
        cacheCreationTokens: 50000
      };

      expect(analyzer.calculateCost(session)).toBe(0);
    });

    test('should return 0 for unknown model', () => {
      const session = {
        provider: 'openai',
        model: 'unknown-model',
        inputTokens: 1000000,
        outputTokens: 1000000,
        cacheReadTokens: 100000,
        cacheCreationTokens: 50000
      };

      expect(analyzer.calculateCost(session)).toBe(0);
    });
  });

  describe('formatNumber', () => {
    test('should format numbers with locale formatting', () => {
      expect(analyzer.formatNumber(1234567)).toBe('1,234,567');
      expect(analyzer.formatNumber(0)).toBe('0');
      expect(analyzer.formatNumber(1000)).toBe('1,000');
    });
  });

  describe('formatCost', () => {
    test('should format costs with 2 decimal places and dollar sign', () => {
      expect(analyzer.formatCost(0)).toBe('$0.00');
      expect(analyzer.formatCost(1.5)).toBe('$1.50');
      expect(analyzer.formatCost(1.567)).toBe('$1.57');
      expect(analyzer.formatCost(10.1234)).toBe('$10.12');
    });
  });

  describe('formatTime', () => {
    test('should format milliseconds appropriately', () => {
      expect(analyzer.formatTime(500)).toBe('500ms');
      expect(analyzer.formatTime(1500)).toBe('2s');
      expect(analyzer.formatTime(90000)).toBe('2m');
      expect(analyzer.formatTime(4000000)).toBe('1h');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty token counts', () => {
      const session = {
        provider: 'zhipuai',
        model: 'glm-4.6',
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0
      };

      expect(analyzer.calculateCost(session)).toBe(0);
    });

    test('should handle negative token counts gracefully', () => {
      const session = {
        provider: 'zhipuai',
        model: 'glm-4.6',
        inputTokens: -1000,
        outputTokens: 1000,
        cacheReadTokens: 0,
        cacheCreationTokens: 0
      };

      // Should calculate cost based on the numbers provided (even if negative)
      const expectedCost = (-1000 / 1000000) * 0.5 + (1000 / 1000000) * 2.5;
      expect(analyzer.calculateCost(session)).toBeCloseTo(expectedCost, 6);
    });
  });

  afterAll(() => {
    // Clean up test directories
    if (fs.existsSync(path.join(__dirname, 'test-data'))) {
      fs.rmSync(path.join(__dirname, 'test-data'), { recursive: true, force: true });
    }
  });
});
