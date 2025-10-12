const CostAnalyzer = require('./CostAnalyzer');

describe('CostAnalyzer', () => {
  let analyzer;
  let mockSessions;

  beforeEach(() => {
    analyzer = new CostAnalyzer();
    
    mockSessions = [
      {
        id: '1',
        date: new Date('2024-01-01'),
        model: 'gpt-4o',
        provider: 'openai',
        cost: 10.50,
        totalTokens: 100000,
        inputTokens: 60000,
        outputTokens: 30000,
        cacheReadTokens: 5000,
        cacheCreationTokens: 5000,
        userInteractions: 5,
        activeTimeMs: 600000
      },
      {
        id: '2',
        date: new Date('2024-01-02'),
        model: 'gpt-4o',
        provider: 'openai',
        cost: 8.25,
        totalTokens: 80000,
        inputTokens: 50000,
        outputTokens: 25000,
        cacheReadTokens: 3000,
        cacheCreationTokens: 2000,
        userInteractions: 3,
        activeTimeMs: 480000
      },
      {
        id: '3',
        date: new Date('2024-01-03'),
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        cost: 15.75,
        totalTokens: 120000,
        inputTokens: 70000,
        outputTokens: 40000,
        cacheReadTokens: 7000,
        cacheCreationTokens: 3000,
        userInteractions: 8,
        activeTimeMs: 720000
      }
    ];
  });

  describe('analyze', () => {
    it('returns complete analysis structure', () => {
      const result = analyzer.analyze(mockSessions);

      expect(result).toHaveProperty('byModel');
      expect(result).toHaveProperty('byProvider');
      expect(result).toHaveProperty('averages');
      expect(result).toHaveProperty('burnRate');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('trends');
    });

    it('throws error for invalid sessions', () => {
      expect(() => analyzer.analyze(null)).toThrow();
      expect(() => analyzer.analyze([])).toThrow();
    });
  });

  describe('groupByModel', () => {
    it('groups sessions correctly', () => {
      const result = analyzer.groupByModel(mockSessions);

      expect(result).toHaveLength(2);
      // gpt-4o has total cost 18.75, claude has 15.75
      expect(result[0].model).toBe('gpt-4o'); // Highest cost
      expect(result[1].model).toBe('claude-3-5-sonnet-20241022');
    });

    it('calculates model totals correctly', () => {
      const result = analyzer.groupByModel(mockSessions);
      const gpt4o = result.find(r => r.model === 'gpt-4o');

      expect(gpt4o.sessions).toHaveLength(2);
      expect(gpt4o.totalCost).toBeCloseTo(18.75, 2);
      expect(gpt4o.totalTokens).toBe(180000);
      expect(gpt4o.inputTokens).toBe(110000);
      expect(gpt4o.outputTokens).toBe(55000);
    });

    it('handles unknown models', () => {
      const sessions = [{ ...mockSessions[0], model: null }];
      const result = analyzer.groupByModel(sessions);

      expect(result[0].model).toBe('unknown');
    });
  });

  describe('groupByProvider', () => {
    it('groups sessions by provider', () => {
      const result = analyzer.groupByProvider(mockSessions);

      expect(result).toHaveLength(2);
      expect(result[0].provider).toBe('openai'); // Highest cost
      expect(result[1].provider).toBe('anthropic');
    });

    it('tracks multiple models per provider', () => {
      const result = analyzer.groupByProvider(mockSessions);
      const openai = result.find(r => r.provider === 'openai');

      expect(openai.models).toEqual(['gpt-4o']);
      expect(openai.sessions).toHaveLength(2);
    });

    it('handles unknown providers', () => {
      const sessions = [{ ...mockSessions[0], provider: null }];
      const result = analyzer.groupByProvider(sessions);

      expect(result[0].provider).toBe('unknown');
    });
  });

  describe('calculateAverages', () => {
    it('calculates all averages correctly', () => {
      const result = analyzer.calculateAverages(mockSessions);

      expect(result.avgCostPerSession).toBeCloseTo(11.50, 2);
      expect(result.avgTokensPerSession).toBeCloseTo(100000, 0);
      expect(result.avgCostPerToken).toBeGreaterThan(0);
      expect(result.avgCostPerPrompt).toBeCloseTo(2.156, 2);
      expect(result.avgDuration).toBeCloseTo(600000, 0);
    });

    it('handles empty sessions', () => {
      const result = analyzer.calculateAverages([]);

      expect(result.avgCostPerSession).toBe(0);
      expect(result.avgTokensPerSession).toBe(0);
      expect(result.avgCostPerToken).toBe(0);
    });

    it('handles zero totals gracefully', () => {
      const sessions = [{ cost: 10, totalTokens: 0, userInteractions: 0 }];
      const result = analyzer.calculateAverages(sessions);

      expect(result.avgCostPerToken).toBe(0);
      expect(result.avgCostPerPrompt).toBe(0);
    });
  });

  describe('calculateBurnRate', () => {
    it('calculates burn rate for multiple days', () => {
      const result = analyzer.calculateBurnRate(mockSessions, {});

      expect(result.daysAnalyzed).toBe(3);
      expect(result.dailyAverage).toBeCloseTo(11.50, 2);
      expect(result.weeklyProjection).toBeCloseTo(80.50, 2);
      expect(result.monthlyProjection).toBeCloseTo(345, 0);
      expect(result.annualProjection).toBeCloseTo(4197.5, 1);
    });

    it('includes period dates', () => {
      const result = analyzer.calculateBurnRate(mockSessions, {});

      expect(result.periodStart).toBe('2024-01-01');
      expect(result.periodEnd).toBe('2024-01-03');
    });

    it('handles single day', () => {
      const sessions = [mockSessions[0]];
      const result = analyzer.calculateBurnRate(sessions, {});

      expect(result.daysAnalyzed).toBe(1);
      expect(result.dailyAverage).toBe(10.50);
    });

    it('handles sessions without dates', () => {
      const sessions = [{ cost: 10 }];
      const result = analyzer.calculateBurnRate(sessions, {});

      expect(result.dailyAverage).toBe(0);
      expect(result.daysAnalyzed).toBe(0);
    });
  });

  describe('generateBreakdown', () => {
    it('generates cost breakdown by token type', () => {
      const result = analyzer.generateBreakdown(mockSessions);

      expect(result).toHaveProperty('inputCost');
      expect(result).toHaveProperty('outputCost');
      expect(result).toHaveProperty('cacheReadCost');
      expect(result).toHaveProperty('cacheWriteCost');
      expect(result).toHaveProperty('total');
    });

    it('total equals sum of parts', () => {
      const result = analyzer.generateBreakdown(mockSessions);

      const sum = result.inputCost + result.outputCost + 
                  result.cacheReadCost + result.cacheWriteCost;
      
      expect(result.total).toBeCloseTo(sum, 2);
    });

    it('total matches session costs', () => {
      const result = analyzer.generateBreakdown(mockSessions);
      const expectedTotal = mockSessions.reduce((sum, s) => sum + s.cost, 0);

      expect(result.total).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('analyzeCostTrends', () => {
    it('creates daily cost timeline', () => {
      const result = analyzer.analyzeCostTrends(mockSessions);

      expect(result.timeline).toHaveLength(3);
      expect(result.timeline[0]).toMatchObject({
        date: '2024-01-01',
        cost: 10.50
      });
    });

    it('calculates statistics', () => {
      const result = analyzer.analyzeCostTrends(mockSessions);

      expect(result.stats.count).toBe(3);
      expect(result.stats.mean).toBeCloseTo(11.50, 2);
    });

    it('handles sessions without dates', () => {
      const sessions = [{ cost: 10 }];
      const result = analyzer.analyzeCostTrends(sessions);

      expect(result.timeline).toHaveLength(0);
    });
  });

  describe('generateInsights', () => {
    it('generates insights array', () => {
      const analysisResult = analyzer.analyze(mockSessions);
      const insights = analyzer.generateInsights(analysisResult);

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThanOrEqual(0);
    });

    it('includes insight structure', () => {
      const analysisResult = analyzer.analyze(mockSessions);
      const insights = analyzer.generateInsights(analysisResult);

      insights.forEach(insight => {
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('category');
        expect(insight).toHaveProperty('message');
        expect(insight).toHaveProperty('severity');
        expect(insight).toHaveProperty('recommendation');
      });
    });

    it('detects high burn rate', () => {
      const highCostSessions = mockSessions.map(s => ({
        ...s,
        cost: s.cost * 100 // Amplify costs
      }));

      const analysisResult = analyzer.analyze(highCostSessions);
      const insights = analyzer.generateInsights(analysisResult);

      const burnRateInsight = insights.find(i => i.category === 'burn_rate');
      expect(burnRateInsight).toBeDefined();
      expect(burnRateInsight.severity).toBe('high');
    });

    it('detects low cache utilization', () => {
      const lowCacheSessions = mockSessions.map(s => ({
        ...s,
        inputTokens: 10000000, // 10M input tokens
        cacheReadTokens: 100000 // 100K cache reads = 1%
      }));

      const analysisResult = analyzer.analyze(lowCacheSessions);
      const insights = analyzer.generateInsights(analysisResult);

      const cacheInsight = insights.find(i => i.category === 'cache_utilization');
      expect(cacheInsight).toBeDefined();
    });
  });
});
