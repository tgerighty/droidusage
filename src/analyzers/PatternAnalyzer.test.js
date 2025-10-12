const PatternAnalyzer = require('./PatternAnalyzer');

describe('PatternAnalyzer', () => {
  let analyzer;
  let mockSessions;

  beforeEach(() => {
    analyzer = new PatternAnalyzer();
    
    mockSessions = [
      {
        id: '1',
        date: new Date('2024-01-01T09:00:00'),
        model: 'gpt-4o',
        provider: 'openai',
        cost: 10,
        totalTokens: 100000,
        activeTimeMs: 300000 // 5 min
      },
      {
        id: '2',
        date: new Date('2024-01-01T14:00:00'),
        model: 'gpt-4o',
        provider: 'openai',
        cost: 8,
        totalTokens: 80000,
        activeTimeMs: 600000 // 10 min
      },
      {
        id: '3',
        date: new Date('2024-01-02T09:00:00'),
        model: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        cost: 15,
        totalTokens: 120000,
        activeTimeMs: 900000 // 15 min
      },
      {
        id: '4',
        date: new Date('2024-01-02T09:30:00'),
        model: 'gpt-4o',
        provider: 'openai',
        cost: 12,
        totalTokens: 110000,
        activeTimeMs: 450000 // 7.5 min
      },
      {
        id: '5',
        date: new Date('2024-01-03T09:00:00'),
        model: 'gpt-4o',
        provider: 'openai',
        cost: 11,
        totalTokens: 105000,
        activeTimeMs: 7200000 // 120 min (anomaly)
      }
    ];
  });

  describe('analyze', () => {
    it('returns complete analysis structure', () => {
      const result = analyzer.analyze(mockSessions);

      expect(result).toHaveProperty('peakHours');
      expect(result).toHaveProperty('busiestDays');
      expect(result).toHaveProperty('sessionDuration');
      expect(result).toHaveProperty('modelPreferences');
      expect(result).toHaveProperty('usageSpikes');
      expect(result).toHaveProperty('timeOfDayPatterns');
    });

    it('throws error for invalid sessions', () => {
      expect(() => analyzer.analyze(null)).toThrow();
      expect(() => analyzer.analyze([])).toThrow();
    });
  });

  describe('findPeakHours', () => {
    it('identifies peak hour correctly', () => {
      const result = analyzer.findPeakHours(mockSessions);

      expect(result.peakHour).toBe(9); // 4 sessions at 9am
      expect(result.peakCount).toBe(4);
      expect(result.peakHourRange).toBe('9:00-10:00');
    });

    it('includes hourly distribution', () => {
      const result = analyzer.findPeakHours(mockSessions);

      expect(result.hourlyDistribution).toHaveLength(24);
      expect(result.hourlyDistribution[9].sessions).toBe(4);
      expect(result.hourlyDistribution[14].sessions).toBe(1);
    });

    it('handles sessions without dates', () => {
      const sessions = [{ id: '1', cost: 10 }];
      const result = analyzer.findPeakHours(sessions);

      expect(result.peakCount).toBe(0);
    });
  });

  describe('findBusiestDays', () => {
    it('identifies busiest day', () => {
      const result = analyzer.findBusiestDays(mockSessions);

      // Sessions spread across Mon(1), Tue(2), Wed(3)
      expect(result.busiestDay).toBeTruthy();
      expect(result.busiestDayCount).toBeGreaterThan(0);
    });

    it('includes daily distribution', () => {
      const result = analyzer.findBusiestDays(mockSessions);

      expect(result.dailyDistribution).toHaveLength(7);
      expect(result.dailyDistribution[0].day).toBe('Sunday');
    });

    it('calculates weekday vs weekend split', () => {
      const result = analyzer.findBusiestDays(mockSessions);

      expect(result.weekdayVsWeekend).toHaveProperty('weekday');
      expect(result.weekdayVsWeekend).toHaveProperty('weekend');
      expect(result.weekdayVsWeekend).toHaveProperty('weekdayPercentage');
    });
  });

  describe('analyzeSessionDuration', () => {
    it('calculates duration statistics', () => {
      const result = analyzer.analyzeSessionDuration(mockSessions);

      expect(result.stats.count).toBe(5);
      expect(result.stats.mean).toBeGreaterThan(0);
      expect(result.stats.max).toBe(7200000); // 120 min anomaly
    });

    it('categorizes durations into buckets', () => {
      const result = analyzer.analyzeSessionDuration(mockSessions);

      expect(result.distribution).toHaveLength(6);
      expect(result.distribution[0].label).toBe('< 1 min');
    });

    it('detects duration anomalies', () => {
      // Create sessions where one is clearly beyond 2 std devs
      const sessionsWithAnomaly = [
        { id: '1', activeTimeMs: 100000 }, // 1.7 min
        { id: '2', activeTimeMs: 120000 }, // 2 min
        { id: '3', activeTimeMs: 110000 }, // 1.8 min
        { id: '4', activeTimeMs: 115000 }, // 1.9 min
        { id: '5', activeTimeMs: 105000 }, // 1.75 min
        { id: '6', activeTimeMs: 125000 }, // 2.1 min
        { id: '7', activeTimeMs: 500000 }  // 8.3 min - anomaly
      ];
      const result = analyzer.analyzeSessionDuration(sessionsWithAnomaly);

      // With this distribution, mean ~140k, stddev ~140k, threshold ~420k
      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.anomalies[0].id).toBe('7');
    });

    it('handles sessions without duration', () => {
      const sessions = [{ id: '1', cost: 10 }];
      const result = analyzer.analyzeSessionDuration(sessions);

      expect(result.stats.count).toBe(0);
      expect(result.anomalies).toHaveLength(0);
    });
  });

  describe('analyzeModelPreferences', () => {
    it('groups preferences by time of day', () => {
      const result = analyzer.analyzeModelPreferences(mockSessions);

      expect(result.morning).toBeDefined();
      expect(result.afternoon).toBeDefined();
    });

    it('identifies most popular model per time', () => {
      const result = analyzer.analyzeModelPreferences(mockSessions);

      expect(result.morning.mostPopular).toBe('gpt-4o');
    });

    it('includes model statistics', () => {
      const result = analyzer.analyzeModelPreferences(mockSessions);

      expect(result.morning.models.length).toBeGreaterThan(0);
      expect(result.morning.models[0]).toHaveProperty('model');
      expect(result.morning.models[0]).toHaveProperty('count');
      expect(result.morning.models[0]).toHaveProperty('totalCost');
    });
  });

  describe('getTimeOfDayCategory', () => {
    it('categorizes hours correctly', () => {
      expect(analyzer.getTimeOfDayCategory(8)).toBe('morning');
      expect(analyzer.getTimeOfDayCategory(14)).toBe('afternoon');
      expect(analyzer.getTimeOfDayCategory(19)).toBe('evening');
      expect(analyzer.getTimeOfDayCategory(23)).toBe('night');
      expect(analyzer.getTimeOfDayCategory(2)).toBe('night');
    });
  });

  describe('analyzeTimeOfDayPatterns', () => {
    it('analyzes patterns for all time periods', () => {
      const result = analyzer.analyzeTimeOfDayPatterns(mockSessions);

      expect(result.patterns.morning).toBeDefined();
      expect(result.patterns.afternoon).toBeDefined();
      expect(result.patterns.evening).toBeDefined();
      expect(result.patterns.night).toBeDefined();
    });

    it('identifies peak time', () => {
      const result = analyzer.analyzeTimeOfDayPatterns(mockSessions);

      expect(result.peakTime).toBe('morning');
      expect(result.peakTimeCount).toBe(4);
    });

    it('includes counts, costs, and tokens', () => {
      const result = analyzer.analyzeTimeOfDayPatterns(mockSessions);

      expect(result.patterns.morning.count).toBe(4);
      expect(result.patterns.morning.cost).toBeGreaterThan(0);
      expect(result.patterns.morning.tokens).toBeGreaterThan(0);
    });
  });

  describe('detectUsageSpikes', () => {
    it('detects usage spikes', () => {
      // Add more sessions on one day to create a spike
      const spikeSessions = [
        ...mockSessions,
        { id: '6', date: new Date('2024-01-01T10:00:00'), cost: 5 },
        { id: '7', date: new Date('2024-01-01T11:00:00'), cost: 6 },
        { id: '8', date: new Date('2024-01-01T12:00:00'), cost: 7 },
        { id: '9', date: new Date('2024-01-01T13:00:00'), cost: 8 }
      ];

      const result = analyzer.detectUsageSpikes(spikeSessions);

      expect(result).toHaveProperty('spikes');
      expect(result).toHaveProperty('averageDailyCount');
      expect(result).toHaveProperty('threshold');
    });

    it('calculates average daily count', () => {
      const result = analyzer.detectUsageSpikes(mockSessions);

      expect(result.averageDailyCount).toBeGreaterThan(0);
      expect(result.threshold).toBe(result.averageDailyCount * 2);
    });

    it('handles sessions without dates', () => {
      const sessions = [{ id: '1', cost: 10 }];
      const result = analyzer.detectUsageSpikes(sessions);

      expect(result.spikes).toHaveLength(0);
    });
  });

  describe('generateInsights', () => {
    it('generates insights array', () => {
      const analysisResult = analyzer.analyze(mockSessions);
      const insights = analyzer.generateInsights(analysisResult);

      expect(Array.isArray(insights)).toBe(true);
    });

    it('includes insight structure', () => {
      const analysisResult = analyzer.analyze(mockSessions);
      const insights = analyzer.generateInsights(analysisResult);

      if (insights.length > 0) {
        insights.forEach(insight => {
          expect(insight).toHaveProperty('type');
          expect(insight).toHaveProperty('category');
          expect(insight).toHaveProperty('message');
          expect(insight).toHaveProperty('severity');
          expect(insight).toHaveProperty('recommendation');
        });
      }
    });

    it('detects long sessions', () => {
      const sessionsWithLongDuration = [
        { id: '1', activeTimeMs: 100000, date: new Date('2024-01-01T09:00:00') },
        { id: '2', activeTimeMs: 120000, date: new Date('2024-01-01T10:00:00') },
        { id: '3', activeTimeMs: 110000, date: new Date('2024-01-02T09:00:00') },
        { id: '4', activeTimeMs: 115000, date: new Date('2024-01-02T10:00:00') },
        { id: '5', activeTimeMs: 105000, date: new Date('2024-01-03T09:00:00') },
        { id: '6', activeTimeMs: 125000, date: new Date('2024-01-03T10:00:00') },
        { id: '7', activeTimeMs: 500000, date: new Date('2024-01-03T11:00:00') }
      ];
      const analysisResult = analyzer.analyze(sessionsWithLongDuration);
      const insights = analyzer.generateInsights(analysisResult);

      const longSessionInsight = insights.find(i => i.category === 'long_sessions');
      expect(longSessionInsight).toBeDefined();
    });
  });
});
