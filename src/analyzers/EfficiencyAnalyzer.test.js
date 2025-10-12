const EfficiencyAnalyzer = require('./EfficiencyAnalyzer');

describe('EfficiencyAnalyzer', () => {
  let analyzer;
  let mockSessions;

  beforeEach(() => {
    analyzer = new EfficiencyAnalyzer();
    
    mockSessions = [
      {
        id: '1',
        model: 'gpt-4o',
        cost: 10,
        totalTokens: 100000,
        inputTokens: 60000,
        outputTokens: 30000,
        cacheReadTokens: 5000,
        userInteractions: 5
      },
      {
        id: '2',
        model: 'gpt-4o',
        cost: 8,
        totalTokens: 80000,
        inputTokens: 50000,
        outputTokens: 25000,
        cacheReadTokens: 3000,
        userInteractions: 3
      },
      {
        id: '3',
        model: 'claude-3-5-sonnet-20241022',
        cost: 15,
        totalTokens: 120000,
        inputTokens: 70000,
        outputTokens: 40000,
        cacheReadTokens: 7000,
        userInteractions: 8
      }
    ];
  });

  describe('analyze', () => {
    it('returns complete analysis structure', () => {
      const result = analyzer.analyze(mockSessions);

      expect(result).toHaveProperty('costPerToken');
      expect(result).toHaveProperty('costPerPrompt');
      expect(result).toHaveProperty('cacheUtilization');
      expect(result).toHaveProperty('efficiencyScores');
      expect(result).toHaveProperty('valueLeaders');
      expect(result).toHaveProperty('recommendations');
    });
  });

  describe('calculateCostPerToken', () => {
    it('calculates cost per million tokens by model', () => {
      const result = analyzer.calculateCostPerToken(mockSessions);

      expect(result.byModel).toHaveLength(2);
      expect(result.byModel[0]).toHaveProperty('costPerMillionTokens');
    });

    it('identifies cheapest and most expensive', () => {
      const result = analyzer.calculateCostPerToken(mockSessions);

      expect(result.cheapest).toBeDefined();
      expect(result.mostExpensive).toBeDefined();
      expect(result.cheapest.costPerMillionTokens).toBeLessThanOrEqual(
        result.mostExpensive.costPerMillionTokens
      );
    });
  });

  describe('calculateCostPerPrompt', () => {
    it('calculates cost per prompt by model', () => {
      const result = analyzer.calculateCostPerPrompt(mockSessions);

      expect(result.byModel).toHaveLength(2);
      expect(result.byModel[0]).toHaveProperty('costPerPrompt');
    });
  });

  describe('analyzeCacheUtilization', () => {
    it('calculates cache hit rates by model', () => {
      const result = analyzer.analyzeCacheUtilization(mockSessions);

      expect(result.byModel).toHaveLength(2);
      expect(result.byModel[0]).toHaveProperty('cacheHitRate');
    });

    it('calculates overall cache stats', () => {
      const result = analyzer.analyzeCacheUtilization(mockSessions);

      expect(result.overall).toHaveProperty('hitRate');
      expect(result.overall).toHaveProperty('totalCacheRead');
      expect(result.overall).toHaveProperty('totalInput');
    });

    it('identifies best and worst performers', () => {
      const result = analyzer.analyzeCacheUtilization(mockSessions);

      expect(result.bestPerformer).toBeDefined();
      expect(result.worstPerformer).toBeDefined();
    });
  });

  describe('calculateEfficiencyScores', () => {
    it('calculates scores for all sessions', () => {
      const result = analyzer.calculateEfficiencyScores(mockSessions);

      expect(result.sessions).toHaveLength(3);
      result.sessions.forEach(s => {
        expect(s).toHaveProperty('efficiencyScore');
        expect(s.efficiencyScore).toBeGreaterThanOrEqual(0);
        expect(s.efficiencyScore).toBeLessThanOrEqual(100);
      });
    });

    it('includes statistics', () => {
      const result = analyzer.calculateEfficiencyScores(mockSessions);

      expect(result.stats).toHaveProperty('mean');
      expect(result.stats).toHaveProperty('median');
    });

    it('identifies top and bottom performers', () => {
      const result = analyzer.calculateEfficiencyScores(mockSessions);

      expect(result.top10).toBeDefined();
      expect(result.bottom10).toBeDefined();
    });
  });

  describe('calculateSessionEfficiencyScore', () => {
    it('returns score between 0 and 100', () => {
      mockSessions.forEach(session => {
        const score = analyzer.calculateSessionEfficiencyScore(session);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    it('gives higher scores to better cache utilization', () => {
      const lowCache = { 
        outputTokens: 10000, 
        cost: 1, 
        inputTokens: 10000, 
        cacheReadTokens: 100 
      };
      const highCache = { 
        outputTokens: 10000, 
        cost: 1, 
        inputTokens: 10000, 
        cacheReadTokens: 5000 
      };

      const lowScore = analyzer.calculateSessionEfficiencyScore(lowCache);
      const highScore = analyzer.calculateSessionEfficiencyScore(highCache);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('identifyValueLeaders', () => {
    it('identifies multiple categories of leaders', () => {
      const result = analyzer.identifyValueLeaders(mockSessions);

      expect(result).toHaveProperty('bestCostPerToken');
      expect(result).toHaveProperty('bestCacheUtilization');
      expect(result).toHaveProperty('mostEfficient');
    });

    it('returns top 5 in each category', () => {
      const result = analyzer.identifyValueLeaders(mockSessions);

      expect(result.bestCostPerToken.length).toBeLessThanOrEqual(5);
      expect(result.bestCacheUtilization.length).toBeLessThanOrEqual(5);
      expect(result.mostEfficient.length).toBeLessThanOrEqual(5);
    });
  });

  describe('generateEfficiencyRecommendations', () => {
    it('generates recommendations array', () => {
      const result = analyzer.generateEfficiencyRecommendations(mockSessions);

      expect(Array.isArray(result)).toBe(true);
    });

    it('includes recommendation structure', () => {
      const sessionsWithLowCache = mockSessions.map(s => ({
        ...s,
        inputTokens: 1000000,
        cacheReadTokens: 10000
      }));

      const result = analyzer.generateEfficiencyRecommendations(sessionsWithLowCache);

      if (result.length > 0) {
        result.forEach(rec => {
          expect(rec).toHaveProperty('category');
          expect(rec).toHaveProperty('priority');
          expect(rec).toHaveProperty('message');
          expect(rec).toHaveProperty('action');
        });
      }
    });
  });

  describe('generateInsights', () => {
    it('generates insights array', () => {
      const analysisResult = analyzer.analyze(mockSessions);
      const insights = analyzer.generateInsights(analysisResult);

      expect(Array.isArray(insights)).toBe(true);
    });
  });
});
