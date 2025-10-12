/**
 * Analyzes and ranks sessions by various criteria
 */
class TopSessionsAnalyzer {
  /**
   * Get top N sessions by cost
   * @param {Array} sessions 
   * @param {number} limit 
   * @returns {Array}
   */
  getTopByCost(sessions, limit = 10) {
    return sessions
      .filter(s => s.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, limit)
      .map(session => this.enrichSession(session, 'cost'));
  }

  /**
   * Get top N sessions by token count
   * @param {Array} sessions 
   * @param {number} limit 
   * @returns {Array}
   */
  getTopByTokens(sessions, limit = 10) {
    return sessions
      .filter(s => s.totalTokens > 0)
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, limit)
      .map(session => this.enrichSession(session, 'tokens'));
  }

  /**
   * Get top N sessions by duration
   * @param {Array} sessions 
   * @param {number} limit 
   * @returns {Array}
   */
  getTopByDuration(sessions, limit = 10) {
    return sessions
      .filter(s => s.activeTimeMs > 0)
      .sort((a, b) => b.activeTimeMs - a.activeTimeMs)
      .slice(0, limit)
      .map(session => this.enrichSession(session, 'duration'));
  }

  /**
   * Get sessions with poor efficiency (high cost per token)
   * @param {Array} sessions 
   * @param {number} limit 
   * @returns {Array}
   */
  getInefficient(sessions, limit = 10) {
    return sessions
      .filter(s => s.totalTokens > 0 && s.cost > 0)
      .map(session => ({
        ...session,
        costPerMillionTokens: (session.cost / session.totalTokens) * 1000000,
        efficiency: this.calculateEfficiency(session)
      }))
      .sort((a, b) => b.costPerMillionTokens - a.costPerMillionTokens)
      .slice(0, limit)
      .map(session => this.enrichSession(session, 'efficiency'));
  }

  /**
   * Get outlier sessions (statistical anomalies)
   * @param {Array} sessions 
   * @returns {Array}
   */
  getOutliers(sessions) {
    const costs = sessions.map(s => s.cost).filter(c => c > 0);
    const stats = this.calculateStats(costs);
    
    // Sessions beyond 2 standard deviations
    const threshold = stats.mean + (2 * stats.stdDev);
    
    return sessions
      .filter(s => s.cost > threshold)
      .map(session => ({
        ...session,
        deviationMultiple: ((session.cost - stats.mean) / stats.stdDev).toFixed(1),
        outlierType: 'cost'
      }))
      .map(session => this.enrichSession(session, 'outlier'));
  }

  /**
   * Calculate statistics for a dataset
   * @param {Array} values 
   * @returns {Object}
   */
  calculateStats(values) {
    if (values.length === 0) {
      return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    return {
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }

  /**
   * Calculate efficiency score for a session
   * @param {Object} session 
   * @returns {Object}
   */
  calculateEfficiency(session) {
    const costPerMillionTokens = (session.cost / session.totalTokens) * 1000000;
    const cacheHitRate = session.cacheReadTokens / (session.inputTokens + session.cacheReadTokens) || 0;
    
    // Lower cost per token = better
    // Higher cache hit rate = better
    let score = 100;
    let issues = [];
    let status = 'good';
    
    // Cost efficiency (expected ranges by model)
    const expectedCosts = {
      'claude-3-5-sonnet-20241022': { min: 3, max: 15 },
      'glm-4': { min: 0.5, max: 2.5 },
      'gpt-4o': { min: 2.5, max: 10 }
    };
    
    const expected = expectedCosts[session.model] || { min: 0, max: 20 };
    
    if (costPerMillionTokens > expected.max * 1.5) {
      score -= 30;
      issues.push('Very high cost per token');
      status = 'poor';
    } else if (costPerMillionTokens > expected.max) {
      score -= 15;
      issues.push('High cost per token');
      status = 'fair';
    }
    
    // Cache efficiency
    if (session.inputTokens > 10000 && cacheHitRate < 0.1) {
      score -= 20;
      issues.push('Low cache utilization');
      if (status === 'good') status = 'fair';
    }
    
    // Very large sessions (might be inefficient)
    if (session.totalTokens > 50000000) {
      score -= 15;
      issues.push('Very large session (consider splitting)');
      if (status === 'good') status = 'fair';
    }
    
    return {
      score: Math.max(0, score),
      status,
      issues,
      costPerMillionTokens,
      cacheHitRate: (cacheHitRate * 100).toFixed(1)
    };
  }

  /**
   * Enrich session with additional analysis
   * @param {Object} session 
   * @param {string} type 
   * @returns {Object}
   */
  enrichSession(session, type) {
    const enriched = {
      ...session,
      analysisType: type
    };
    
    // Add efficiency analysis
    if (!enriched.efficiency) {
      enriched.efficiency = this.calculateEfficiency(session);
    }
    
    // Add warnings/recommendations
    enriched.warnings = this.generateWarnings(session);
    enriched.recommendations = this.generateRecommendations(session);
    
    return enriched;
  }

  /**
   * Generate warnings for a session
   * @param {Object} session 
   * @returns {Array}
   */
  generateWarnings(session) {
    const warnings = [];
    
    if (session.cost > 50) {
      warnings.push('⚠️  Very expensive session');
    }
    
    if (session.totalTokens > 50000000) {
      warnings.push('⚠️  Very high token usage');
    }
    
    if (session.activeTimeMs > 3600000) { // > 1 hour
      warnings.push('⚠️  Very long duration (possibly stuck)');
    }
    
    if (session.efficiency && session.efficiency.status === 'poor') {
      warnings.push('⚠️  Poor efficiency');
    }
    
    return warnings;
  }

  /**
   * Generate recommendations for a session
   * @param {Object} session 
   * @returns {Array}
   */
  generateRecommendations(session) {
    const recommendations = [];
    
    if (session.cost > 50) {
      recommendations.push('Consider breaking this into smaller sessions');
    }
    
    if (session.efficiency && session.efficiency.cacheHitRate < 10 && session.inputTokens > 10000) {
      recommendations.push('Enable prompt caching to reduce costs');
    }
    
    if (session.model === 'claude-3-5-sonnet-20241022' && session.outputTokens < 1000) {
      recommendations.push('Consider using Haiku for simple tasks (5x cheaper)');
    }
    
    if (session.totalTokens > 50000000) {
      recommendations.push('Review prompting strategy to reduce token usage');
    }
    
    return recommendations;
  }

  /**
   * Get summary statistics across top sessions
   * @param {Array} sessions 
   * @returns {Object}
   */
  getSummaryStats(sessions) {
    if (sessions.length === 0) {
      return { totalCost: 0, totalTokens: 0, avgEfficiency: 0 };
    }

    const costs = sessions.map(s => s.cost);
    const tokens = sessions.map(s => s.totalTokens);
    const efficiencyScores = sessions
      .filter(s => s.efficiency)
      .map(s => s.efficiency.score);
    
    return {
      totalCost: costs.reduce((sum, c) => sum + c, 0),
      totalTokens: tokens.reduce((sum, t) => sum + t, 0),
      avgCost: costs.reduce((sum, c) => sum + c, 0) / costs.length,
      avgTokens: tokens.reduce((sum, t) => sum + t, 0) / tokens.length,
      avgEfficiency: efficiencyScores.length > 0
        ? efficiencyScores.reduce((sum, e) => sum + e, 0) / efficiencyScores.length
        : 0,
      costStats: this.calculateStats(costs),
      tokenStats: this.calculateStats(tokens)
    };
  }
}

module.exports = TopSessionsAnalyzer;
