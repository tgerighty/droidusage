const AnalysisOrchestrator = require('./AnalysisOrchestrator');

describe('AnalysisOrchestrator', () => {
  let orchestrator;
  let mockSessions;

  beforeEach(() => {
    orchestrator = new AnalysisOrchestrator();
    
    mockSessions = [
      {
        id: '1',
        date: new Date('2024-01-01T09:00:00'),
        model: 'gpt-4o',
        provider: 'openai',
        cost: 10,
        totalTokens: 100000,
        inputTokens: 60000,
        outputTokens: 30000,
        cacheReadTokens: 5000,
        userInteractions: 5,
        activeTimeMs: 300000
      },
      {
        id: '2',
        date: new Date('2024-01-02T14:00:00'),
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        cost: 15,
        totalTokens: 120000,
        inputTokens: 70000,
        outputTokens: 40000,
        cacheReadTokens: 7000,
        userInteractions: 8,
        activeTimeMs: 450000
      }
    ];
  });

  describe('runAnalysis', () => {
    it('runs all analyzers by default', async () => {
      const result = await orchestrator.runAnalysis(mockSessions);

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('sessionCount');
      expect(result).toHaveProperty('analyzersRun');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('synthesized');
      expect(result).toHaveProperty('crossInsights');

      expect(result.analyzersRun).toContain('cost');
      expect(result.analyzersRun).toContain('patterns');
      expect(result.analyzersRun).toContain('efficiency');
    });

    it('runs only selected analyzers', async () => {
      const result = await orchestrator.runAnalysis(mockSessions, { cost: true });

      expect(result.analyzersRun).toContain('cost');
      expect(result.analyzersRun).not.toContain('patterns');
      expect(result.analyzersRun).not.toContain('efficiency');
    });

    it('includes results from each analyzer', async () => {
      const result = await orchestrator.runAnalysis(mockSessions);

      expect(result.results.cost).toBeDefined();
      expect(result.results.patterns).toBeDefined();
      expect(result.results.efficiency).toBeDefined();

      expect(result.results.cost.result).toBeDefined();
      expect(result.results.cost.insights).toBeDefined();
    });
  });

  describe('selectAnalyzers', () => {
    it('returns all analyzers when no options', () => {
      const selected = orchestrator.selectAnalyzers({});
      expect(selected).toEqual(['cost', 'patterns', 'efficiency']);
    });

    it('returns all analyzers when all flag set', () => {
      const selected = orchestrator.selectAnalyzers({ all: true });
      expect(selected).toEqual(['cost', 'patterns', 'efficiency']);
    });

    it('returns only selected analyzers', () => {
      const selected = orchestrator.selectAnalyzers({ cost: true, patterns: true });
      expect(selected).toEqual(['cost', 'patterns']);
    });
  });

  describe('executeParallel', () => {
    it('executes multiple analyzers in parallel', async () => {
      const results = await orchestrator.executeParallel(
        mockSessions, 
        ['cost', 'patterns'], 
        {}
      );

      expect(results.cost).toBeDefined();
      expect(results.patterns).toBeDefined();
      expect(results.cost.result).toBeDefined();
      expect(results.patterns.result).toBeDefined();
    });

    it('handles analyzer errors gracefully', async () => {
      // Pass invalid data to cause errors
      const results = await orchestrator.executeParallel(
        null, 
        ['cost'], 
        {}
      );

      expect(results.cost).toBeDefined();
      expect(results.cost.error).toBeDefined();
    });
  });

  describe('synthesizeResults', () => {
    it('creates synthesis object', async () => {
      const result = await orchestrator.runAnalysis(mockSessions);
      const synthesis = result.synthesized;

      expect(synthesis).toHaveProperty('overallHealth');
      expect(synthesis).toHaveProperty('keyMetrics');
      expect(synthesis).toHaveProperty('recommendations');
      expect(synthesis).toHaveProperty('alerts');
    });

    it('extracts key metrics from analyzers', async () => {
      const result = await orchestrator.runAnalysis(mockSessions);
      const metrics = result.synthesized.keyMetrics;

      expect(metrics).toHaveProperty('burnRate');
      expect(metrics).toHaveProperty('totalCost');
      expect(metrics).toHaveProperty('peakHour');
      expect(metrics).toHaveProperty('avgEfficiencyScore');
    });

    it('aggregates recommendations', async () => {
      const result = await orchestrator.runAnalysis(mockSessions);
      
      expect(Array.isArray(result.synthesized.recommendations)).toBe(true);
    });
  });

  describe('determineOverallHealth', () => {
    it('categorizes health correctly', () => {
      expect(orchestrator.determineOverallHealth(80)).toBe('excellent');
      expect(orchestrator.determineOverallHealth(60)).toBe('good');
      expect(orchestrator.determineOverallHealth(40)).toBe('fair');
      expect(orchestrator.determineOverallHealth(20)).toBe('poor');
    });
  });

  describe('generateCrossAnalyzerInsights', () => {
    it('generates cross-analyzer insights', async () => {
      const result = await orchestrator.runAnalysis(mockSessions);

      expect(Array.isArray(result.crossInsights)).toBe(true);
    });

    it('correlates data from multiple analyzers', async () => {
      const result = await orchestrator.runAnalysis(mockSessions);

      // Should have at least one correlation insight
      const hasCorrelation = result.crossInsights.some(
        insight => insight.type === 'correlation' || insight.type === 'info'
      );
      expect(hasCorrelation).toBe(true);
    });
  });

  describe('getSummary', () => {
    it('creates summary from orchestrator result', async () => {
      const result = await orchestrator.runAnalysis(mockSessions);
      const summary = orchestrator.getSummary(result);

      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('sessionCount');
      expect(summary).toHaveProperty('analyzersRun');
      expect(summary).toHaveProperty('overallHealth');
      expect(summary).toHaveProperty('totalRecommendations');
      expect(summary).toHaveProperty('totalAlerts');
      expect(summary).toHaveProperty('crossInsights');
      expect(summary).toHaveProperty('keyMetrics');
    });
  });
});
