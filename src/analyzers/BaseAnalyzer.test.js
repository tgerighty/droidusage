const BaseAnalyzer = require('./BaseAnalyzer');

describe('BaseAnalyzer', () => {
  describe('instantiation', () => {
    it('throws error when instantiated directly', () => {
      expect(() => new BaseAnalyzer()).toThrow('BaseAnalyzer is abstract and cannot be instantiated directly');
    });

    it('allows subclass instantiation', () => {
      class TestAnalyzer extends BaseAnalyzer {
        analyze() { return {}; }
        generateInsights() { return []; }
      }
      expect(() => new TestAnalyzer()).not.toThrow();
    });
  });

  describe('abstract methods', () => {
    let analyzer;

    beforeEach(() => {
      class TestAnalyzer extends BaseAnalyzer {}
      analyzer = new TestAnalyzer();
    });

    it('throws error when analyze() not implemented', () => {
      expect(() => analyzer.analyze([])).toThrow('analyze() must be implemented by subclass');
    });

    it('throws error when generateInsights() not implemented', () => {
      expect(() => analyzer.generateInsights({})).toThrow('generateInsights() must be implemented by subclass');
    });
  });

  describe('validateSessions', () => {
    let analyzer;

    beforeEach(() => {
      class TestAnalyzer extends BaseAnalyzer {
        analyze() { return {}; }
        generateInsights() { return []; }
      }
      analyzer = new TestAnalyzer();
    });

    it('throws error for non-array input', () => {
      expect(() => analyzer.validateSessions(null)).toThrow('Sessions must be an array');
      expect(() => analyzer.validateSessions({})).toThrow('Sessions must be an array');
      expect(() => analyzer.validateSessions('test')).toThrow('Sessions must be an array');
    });

    it('throws error for empty array', () => {
      expect(() => analyzer.validateSessions([])).toThrow('Sessions array cannot be empty');
    });

    it('returns true for valid sessions array', () => {
      const sessions = [{ id: '1', cost: 10 }];
      expect(analyzer.validateSessions(sessions)).toBe(true);
    });
  });

  describe('filterByDateRange', () => {
    let analyzer;
    let sessions;

    beforeEach(() => {
      class TestAnalyzer extends BaseAnalyzer {
        analyze() { return {}; }
        generateInsights() { return []; }
      }
      analyzer = new TestAnalyzer();

      sessions = [
        { id: '1', date: new Date('2024-01-01') },
        { id: '2', date: new Date('2024-01-15') },
        { id: '3', date: new Date('2024-02-01') },
        { id: '4', date: null }
      ];
    });

    it('returns all sessions when no date filter', () => {
      const filtered = analyzer.filterByDateRange(sessions, {});
      expect(filtered).toHaveLength(4);
    });

    it('filters by since date', () => {
      const filtered = analyzer.filterByDateRange(sessions, { since: '2024-01-15' });
      expect(filtered).toHaveLength(3);
      expect(filtered.map(s => s.id)).toEqual(['2', '3', '4']);
    });

    it('filters by until date', () => {
      const filtered = analyzer.filterByDateRange(sessions, { until: '2024-01-15' });
      expect(filtered).toHaveLength(3);
      expect(filtered.map(s => s.id)).toEqual(['1', '2', '4']);
    });

    it('filters by date range', () => {
      const filtered = analyzer.filterByDateRange(sessions, {
        since: '2024-01-10',
        until: '2024-01-20'
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.map(s => s.id)).toEqual(['2', '4']);
    });

    it('includes sessions with null dates', () => {
      const filtered = analyzer.filterByDateRange(sessions, { since: '2024-01-15' });
      expect(filtered.some(s => s.id === '4')).toBe(true);
    });
  });

  describe('calculateStats', () => {
    let analyzer;

    beforeEach(() => {
      class TestAnalyzer extends BaseAnalyzer {
        analyze() { return {}; }
        generateInsights() { return []; }
      }
      analyzer = new TestAnalyzer();
    });

    it('handles empty array', () => {
      const stats = analyzer.calculateStats([]);
      expect(stats).toEqual({
        count: 0,
        sum: 0,
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0
      });
    });

    it('handles null or undefined', () => {
      const stats = analyzer.calculateStats(null);
      expect(stats.count).toBe(0);
    });

    it('calculates stats for single value', () => {
      const stats = analyzer.calculateStats([10]);
      expect(stats.count).toBe(1);
      expect(stats.sum).toBe(10);
      expect(stats.mean).toBe(10);
      expect(stats.median).toBe(10);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(10);
      expect(stats.stdDev).toBe(0);
    });

    it('calculates stats for multiple values', () => {
      const stats = analyzer.calculateStats([1, 2, 3, 4, 5]);
      expect(stats.count).toBe(5);
      expect(stats.sum).toBe(15);
      expect(stats.mean).toBe(3);
      expect(stats.median).toBe(3);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(5);
      expect(stats.stdDev).toBeCloseTo(1.414, 2);
    });

    it('calculates median for even count', () => {
      const stats = analyzer.calculateStats([1, 2, 3, 4]);
      expect(stats.median).toBe(2.5);
    });
  });

  describe('formatting methods', () => {
    let analyzer;

    beforeEach(() => {
      class TestAnalyzer extends BaseAnalyzer {
        analyze() { return {}; }
        generateInsights() { return []; }
      }
      analyzer = new TestAnalyzer();
    });

    it('formatNumber formats with locale', () => {
      expect(analyzer.formatNumber(1000)).toBe('1,000');
      expect(analyzer.formatNumber(1000000)).toBe('1,000,000');
    });

    it('formatCost formats as currency', () => {
      expect(analyzer.formatCost(10.5)).toBe('$10.50');
      expect(analyzer.formatCost(0.99)).toBe('$0.99');
      expect(analyzer.formatCost(1000.123)).toBe('$1000.12');
    });

    it('formatPercentage formats with one decimal', () => {
      expect(analyzer.formatPercentage(50)).toBe('50.0%');
      expect(analyzer.formatPercentage(33.333)).toBe('33.3%');
      expect(analyzer.formatPercentage(0.1)).toBe('0.1%');
    });
  });
});
