const BaseAnalyzer = require('./BaseAnalyzer');

/**
 * Cost analysis module - analyzes spending patterns and burn rate
 */
class CostAnalyzer extends BaseAnalyzer {
  /**
   * Analyze cost patterns across sessions
   * @param {Array} sessions 
   * @param {Object} options 
   * @returns {Object}
   */
  analyze(sessions, options = {}) {
    this.validateSessions(sessions);

    const filtered = this.filterByDateRange(sessions, options);

    return {
      byModel: this.groupByModel(filtered),
      byProvider: this.groupByProvider(filtered),
      averages: this.calculateAverages(filtered),
      burnRate: this.calculateBurnRate(filtered, options),
      breakdown: this.generateBreakdown(filtered),
      trends: this.analyzeCostTrends(filtered)
    };
  }

  /**
   * Group sessions by model
   * @param {Array} sessions 
   * @returns {Array}
   */
  groupByModel(sessions) {
    const grouped = {};

    sessions.forEach(session => {
      const model = session.model || 'unknown';
      
      if (!grouped[model]) {
        grouped[model] = {
          model,
          sessions: [],
          totalCost: 0,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0
        };
      }

      const group = grouped[model];
      group.sessions.push(session);
      group.totalCost += session.cost || 0;
      group.totalTokens += session.totalTokens || 0;
      group.inputTokens += session.inputTokens || 0;
      group.outputTokens += session.outputTokens || 0;
      group.cacheReadTokens += session.cacheReadTokens || 0;
      group.cacheCreationTokens += session.cacheCreationTokens || 0;
    });

    return Object.values(grouped).sort((a, b) => b.totalCost - a.totalCost);
  }

  /**
   * Group sessions by provider
   * @param {Array} sessions 
   * @returns {Array}
   */
  groupByProvider(sessions) {
    const grouped = {};

    sessions.forEach(session => {
      const provider = session.provider || 'unknown';
      
      if (!grouped[provider]) {
        grouped[provider] = {
          provider,
          models: new Set(),
          sessions: [],
          totalCost: 0,
          totalTokens: 0
        };
      }

      const group = grouped[provider];
      group.models.add(session.model);
      group.sessions.push(session);
      group.totalCost += session.cost || 0;
      group.totalTokens += session.totalTokens || 0;
    });

    // Convert Set to Array
    const result = Object.values(grouped).map(group => ({
      ...group,
      models: Array.from(group.models).sort()
    }));

    return result.sort((a, b) => b.totalCost - a.totalCost);
  }

  /**
   * Calculate various averages
   * @param {Array} sessions 
   * @returns {Object}
   */
  calculateAverages(sessions) {
    if (sessions.length === 0) {
      return {
        avgCostPerSession: 0,
        avgTokensPerSession: 0,
        avgCostPerToken: 0,
        avgCostPerPrompt: 0,
        avgDuration: 0
      };
    }

    const totalCost = sessions.reduce((sum, s) => sum + (s.cost || 0), 0);
    const totalTokens = sessions.reduce((sum, s) => sum + (s.totalTokens || 0), 0);
    const totalPrompts = sessions.reduce((sum, s) => sum + (s.userInteractions || 0), 0);
    const totalDuration = sessions.reduce((sum, s) => sum + (s.activeTimeMs || 0), 0);

    return {
      avgCostPerSession: totalCost / sessions.length,
      avgTokensPerSession: totalTokens / sessions.length,
      avgCostPerToken: totalTokens > 0 ? (totalCost / totalTokens) * 1000000 : 0, // Per million
      avgCostPerPrompt: totalPrompts > 0 ? totalCost / totalPrompts : 0,
      avgDuration: totalDuration / sessions.length
    };
  }

  /**
   * Calculate burn rate (daily, weekly, monthly projections)
   * @param {Array} sessions 
   * @param {Object} options 
   * @returns {Object}
   */
  calculateBurnRate(sessions, options) {
    if (sessions.length === 0) {
      return {
        dailyAverage: 0,
        weeklyProjection: 0,
        monthlyProjection: 0,
        annualProjection: 0,
        daysAnalyzed: 0
      };
    }

    // Get date range
    const dates = sessions
      .filter(s => s.date)
      .map(s => new Date(s.date));

    if (dates.length === 0) {
      return {
        dailyAverage: 0,
        weeklyProjection: 0,
        monthlyProjection: 0,
        annualProjection: 0,
        daysAnalyzed: 0
      };
    }

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const daysAnalyzed = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

    const totalCost = sessions.reduce((sum, s) => sum + (s.cost || 0), 0);
    const dailyAverage = totalCost / daysAnalyzed;

    return {
      dailyAverage,
      weeklyProjection: dailyAverage * 7,
      monthlyProjection: dailyAverage * 30,
      annualProjection: dailyAverage * 365,
      daysAnalyzed,
      periodStart: minDate.toISOString().split('T')[0],
      periodEnd: maxDate.toISOString().split('T')[0]
    };
  }

  /**
   * Generate cost breakdown by token type
   * @param {Array} sessions 
   * @returns {Object}
   */
  generateBreakdown(sessions) {
    const breakdown = {
      inputCost: 0,
      outputCost: 0,
      cacheReadCost: 0,
      cacheWriteCost: 0,
      total: 0
    };

    sessions.forEach(session => {
      // Approximate breakdown based on token counts
      // This is an estimation since we don't store per-token-type costs
      const cost = session.cost || 0;
      const totalTokens = session.totalTokens || 1;
      
      const inputRatio = (session.inputTokens || 0) / totalTokens;
      const outputRatio = (session.outputTokens || 0) / totalTokens;
      const cacheReadRatio = (session.cacheReadTokens || 0) / totalTokens;
      const cacheWriteRatio = (session.cacheCreationTokens || 0) / totalTokens;

      breakdown.inputCost += cost * inputRatio;
      breakdown.outputCost += cost * outputRatio;
      breakdown.cacheReadCost += cost * cacheReadRatio;
      breakdown.cacheWriteCost += cost * cacheWriteRatio;
    });

    breakdown.total = breakdown.inputCost + breakdown.outputCost + 
                     breakdown.cacheReadCost + breakdown.cacheWriteCost;

    return breakdown;
  }

  /**
   * Analyze cost trends over time
   * @param {Array} sessions 
   * @returns {Object}
   */
  analyzeCostTrends(sessions) {
    const dailyCosts = {};

    sessions.forEach(session => {
      if (!session.date) return;

      const date = new Date(session.date).toISOString().split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + (session.cost || 0);
    });

    const dates = Object.keys(dailyCosts).sort();
    const costs = dates.map(date => dailyCosts[date]);

    return {
      dailyCosts,
      timeline: dates.map((date, i) => ({ date, cost: costs[i] })),
      stats: this.calculateStats(costs)
    };
  }

  /**
   * Generate insights from cost analysis
   * @param {Object} results 
   * @returns {Array}
   */
  generateInsights(results) {
    const insights = [];

    // High burn rate warning
    if (results.burnRate.monthlyProjection > 1000) {
      insights.push({
        type: 'warning',
        category: 'burn_rate',
        message: `High monthly burn rate: ${this.formatCost(results.burnRate.monthlyProjection)}`,
        severity: 'high',
        recommendation: 'Consider optimizing model usage or switching to cheaper models for routine tasks'
      });
    }

    // Model cost efficiency
    if (results.byModel.length > 0) {
      const mostExpensive = results.byModel[0];
      const avgCostPerSession = mostExpensive.totalCost / mostExpensive.sessions.length;
      
      if (avgCostPerSession > 10) {
        insights.push({
          type: 'info',
          category: 'model_efficiency',
          message: `${mostExpensive.model} has high average cost per session: ${this.formatCost(avgCostPerSession)}`,
          severity: 'medium',
          recommendation: 'Review if all sessions require this model or if cheaper alternatives could be used'
        });
      }
    }

    // Cache utilization
    const totalCache = results.byModel.reduce((sum, m) => sum + m.cacheReadTokens, 0);
    const totalInput = results.byModel.reduce((sum, m) => sum + m.inputTokens, 0);
    const cacheRate = totalInput > 0 ? (totalCache / totalInput) * 100 : 0;

    if (cacheRate < 10 && totalInput > 1000000) {
      insights.push({
        type: 'opportunity',
        category: 'cache_utilization',
        message: `Low cache utilization: ${cacheRate.toFixed(1)}%`,
        severity: 'medium',
        recommendation: 'Enable prompt caching to reduce costs by up to 90% on repeated inputs'
      });
    }

    // Cost distribution
    if (results.byProvider.length > 1) {
      const totalCost = results.byProvider.reduce((sum, p) => sum + p.totalCost, 0);
      const topProvider = results.byProvider[0];
      const concentration = (topProvider.totalCost / totalCost) * 100;

      if (concentration > 80) {
        insights.push({
          type: 'info',
          category: 'provider_concentration',
          message: `${concentration.toFixed(0)}% of costs from ${topProvider.provider}`,
          severity: 'low',
          recommendation: 'Consider diversifying providers for cost optimization and resilience'
        });
      }
    }

    return insights;
  }
}

module.exports = CostAnalyzer;
