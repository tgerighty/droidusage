const BaseAnalyzer = require('./BaseAnalyzer');

/**
 * Efficiency analysis module - analyzes cost efficiency and value
 */
class EfficiencyAnalyzer extends BaseAnalyzer {
  /**
   * Analyze efficiency metrics
   * @param {Array} sessions 
   * @param {Object} options 
   * @returns {Object}
   */
  analyze(sessions, options = {}) {
    this.validateSessions(sessions);

    const filtered = this.filterByDateRange(sessions, options);

    return {
      costPerToken: this.calculateCostPerToken(filtered),
      costPerPrompt: this.calculateCostPerPrompt(filtered),
      cacheUtilization: this.analyzeCacheUtilization(filtered),
      efficiencyScores: this.calculateEfficiencyScores(filtered),
      valueLeaders: this.identifyValueLeaders(filtered),
      recommendations: this.generateEfficiencyRecommendations(filtered)
    };
  }

  /**
   * Calculate cost per token metrics
   * @param {Array} sessions 
   * @returns {Object}
   */
  calculateCostPerToken(sessions) {
    const byModel = {};

    sessions.forEach(session => {
      const model = session.model || 'unknown';
      const cost = session.cost || 0;
      const tokens = session.totalTokens || 0;

      if (!byModel[model]) {
        byModel[model] = {
          model,
          totalCost: 0,
          totalTokens: 0,
          sessions: 0
        };
      }

      byModel[model].totalCost += cost;
      byModel[model].totalTokens += tokens;
      byModel[model].sessions++;
    });

    // Calculate cost per million tokens
    const results = Object.values(byModel).map(data => ({
      ...data,
      costPerMillionTokens: data.totalTokens > 0 
        ? (data.totalCost / data.totalTokens) * 1000000 
        : 0
    })).sort((a, b) => a.costPerMillionTokens - b.costPerMillionTokens);

    return {
      byModel: results,
      cheapest: results[0],
      mostExpensive: results[results.length - 1],
      average: this.calculateAverage(results.map(r => r.costPerMillionTokens))
    };
  }

  /**
   * Calculate cost per prompt metrics
   * @param {Array} sessions 
   * @returns {Object}
   */
  calculateCostPerPrompt(sessions) {
    const byModel = {};

    sessions.forEach(session => {
      const model = session.model || 'unknown';
      const cost = session.cost || 0;
      const prompts = session.userInteractions || 0;

      if (!byModel[model]) {
        byModel[model] = {
          model,
          totalCost: 0,
          totalPrompts: 0,
          sessions: 0
        };
      }

      byModel[model].totalCost += cost;
      byModel[model].totalPrompts += prompts;
      byModel[model].sessions++;
    });

    const results = Object.values(byModel).map(data => ({
      ...data,
      costPerPrompt: data.totalPrompts > 0 
        ? data.totalCost / data.totalPrompts 
        : 0
    })).sort((a, b) => a.costPerPrompt - b.costPerPrompt);

    return {
      byModel: results,
      cheapest: results[0],
      mostExpensive: results[results.length - 1],
      average: this.calculateAverage(results.map(r => r.costPerPrompt))
    };
  }

  /**
   * Analyze cache utilization
   * @param {Array} sessions 
   * @returns {Object}
   */
  analyzeCacheUtilization(sessions) {
    const byModel = {};

    sessions.forEach(session => {
      const model = session.model || 'unknown';
      const inputTokens = session.inputTokens || 0;
      const cacheReadTokens = session.cacheReadTokens || 0;
      const cacheCreationTokens = session.cacheCreationTokens || 0;

      if (!byModel[model]) {
        byModel[model] = {
          model,
          totalInput: 0,
          totalCacheRead: 0,
          totalCacheCreation: 0,
          sessions: 0
        };
      }

      byModel[model].totalInput += inputTokens;
      byModel[model].totalCacheRead += cacheReadTokens;
      byModel[model].totalCacheCreation += cacheCreationTokens;
      byModel[model].sessions++;
    });

    const results = Object.values(byModel).map(data => {
      const totalPotential = data.totalInput + data.totalCacheRead;
      const cacheHitRate = totalPotential > 0 
        ? (data.totalCacheRead / totalPotential) * 100 
        : 0;

      return {
        ...data,
        cacheHitRate,
        potentialSavings: this.calculatePotentialSavings(data)
      };
    }).sort((a, b) => b.cacheHitRate - a.cacheHitRate);

    // Calculate overall stats
    const totalInput = results.reduce((sum, r) => sum + r.totalInput, 0);
    const totalCacheRead = results.reduce((sum, r) => sum + r.totalCacheRead, 0);
    const overallHitRate = (totalInput + totalCacheRead) > 0 
      ? (totalCacheRead / (totalInput + totalCacheRead)) * 100 
      : 0;

    return {
      byModel: results,
      overall: {
        hitRate: overallHitRate,
        totalCacheRead,
        totalInput
      },
      bestPerformer: results[0],
      worstPerformer: results[results.length - 1]
    };
  }

  /**
   * Calculate potential savings from better cache usage
   * @param {Object} data 
   * @returns {number}
   */
  calculatePotentialSavings(data) {
    // If all input tokens were cached, assume 90% cost reduction
    const potentialCachedTokens = data.totalInput;
    const currentlyCachedTokens = data.totalCacheRead;
    const uncachedTokens = potentialCachedTokens - currentlyCachedTokens;
    
    // Estimate: cache read is ~10x cheaper than regular input
    // So potential savings = uncached * 0.9 * avg_cost_per_token
    // This is a rough estimate since we don't have exact pricing here
    return uncachedTokens * 0.00001; // Placeholder calculation
  }

  /**
   * Calculate efficiency scores for sessions
   * @param {Array} sessions 
   * @returns {Object}
   */
  calculateEfficiencyScores(sessions) {
    const scored = sessions.map(session => {
      const score = this.calculateSessionEfficiencyScore(session);
      return {
        ...session,
        efficiencyScore: score
      };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

    const scores = scored.map(s => s.efficiencyScore);
    
    return {
      sessions: scored,
      stats: this.calculateStats(scores),
      top10: scored.slice(0, 10),
      bottom10: scored.slice(-10).reverse()
    };
  }

  /**
   * Calculate efficiency score for a single session
   * Formula: (output_tokens / cost) * (1 + cache_bonus), normalized to 0-100
   * @param {Object} session 
   * @returns {number}
   */
  calculateSessionEfficiencyScore(session) {
    const outputTokens = session.outputTokens || 0;
    const cost = session.cost || 0.0001; // Avoid division by zero
    const cacheReadTokens = session.cacheReadTokens || 0;
    const inputTokens = session.inputTokens || 1;

    // Base efficiency: output per dollar
    const baseEfficiency = outputTokens / cost;

    // Cache bonus: 0 to 1 based on cache hit rate
    const cacheHitRate = cacheReadTokens / (inputTokens + cacheReadTokens);
    const cacheBonus = cacheHitRate * 0.5; // Up to 50% bonus

    // Raw score
    const rawScore = baseEfficiency * (1 + cacheBonus);

    // Normalize to 0-100 scale (using logarithm to handle wide range)
    // Typical values: 1k-100k tokens per dollar = raw scores 1k-100k
    // Log10(1000) = 3, Log10(100000) = 5
    // Scale: (log - 2) * 25 gives roughly 0-100 range
    const normalizedScore = Math.max(0, Math.min(100, (Math.log10(rawScore + 1) - 2) * 25));

    return normalizedScore;
  }

  /**
   * Identify value leaders (best performers)
   * @param {Array} sessions 
   * @returns {Object}
   */
  identifyValueLeaders(sessions) {
    // Best cost per token
    const withCostPerToken = sessions.map(s => ({
      ...s,
      costPerToken: s.totalTokens > 0 ? (s.cost / s.totalTokens) * 1000000 : Infinity
    })).sort((a, b) => a.costPerToken - b.costPerToken);

    // Best cache utilization
    const withCacheRate = sessions
      .filter(s => s.inputTokens > 0)
      .map(s => ({
        ...s,
        cacheRate: (s.cacheReadTokens || 0) / (s.inputTokens + (s.cacheReadTokens || 0))
      }))
      .sort((a, b) => b.cacheRate - a.cacheRate);

    // Most efficient (using our efficiency score)
    const withEfficiency = sessions.map(s => ({
      ...s,
      efficiencyScore: this.calculateSessionEfficiencyScore(s)
    })).sort((a, b) => b.efficiencyScore - a.efficiencyScore);

    return {
      bestCostPerToken: withCostPerToken.slice(0, 5),
      bestCacheUtilization: withCacheRate.slice(0, 5),
      mostEfficient: withEfficiency.slice(0, 5)
    };
  }

  /**
   * Generate efficiency recommendations
   * @param {Array} sessions 
   * @returns {Array}
   */
  generateEfficiencyRecommendations(sessions) {
    const recommendations = [];

    // Analyze cache usage
    const totalInput = sessions.reduce((sum, s) => sum + (s.inputTokens || 0), 0);
    const totalCache = sessions.reduce((sum, s) => sum + (s.cacheReadTokens || 0), 0);
    const cacheRate = totalInput > 0 ? (totalCache / totalInput) * 100 : 0;

    if (cacheRate < 10 && totalInput > 1000000) {
      recommendations.push({
        category: 'cache_optimization',
        priority: 'high',
        message: `Low cache utilization: ${cacheRate.toFixed(1)}%`,
        action: 'Enable prompt caching to reduce costs by up to 90%',
        estimatedSavings: 'High'
      });
    }

    // Analyze model selection
    const modelCosts = {};
    sessions.forEach(s => {
      const model = s.model || 'unknown';
      modelCosts[model] = (modelCosts[model] || 0) + (s.cost || 0);
    });

    const expensiveModels = Object.entries(modelCosts)
      .filter(([model, cost]) => model.includes('sonnet') || model.includes('gpt-4'))
      .reduce((sum, [_, cost]) => sum + cost, 0);
    
    const totalCost = Object.values(modelCosts).reduce((sum, cost) => sum + cost, 0);

    if (expensiveModels / totalCost > 0.8) {
      recommendations.push({
        category: 'model_optimization',
        priority: 'medium',
        message: 'Heavy use of premium models',
        action: 'Consider using faster, cheaper models for routine tasks',
        estimatedSavings: 'Medium'
      });
    }

    // Analyze session efficiency
    const efficiencyScores = sessions.map(s => 
      this.calculateSessionEfficiencyScore(s)
    );
    const avgEfficiency = this.calculateAverage(efficiencyScores);

    if (avgEfficiency < 30) {
      recommendations.push({
        category: 'general_efficiency',
        priority: 'medium',
        message: `Low average efficiency score: ${avgEfficiency.toFixed(0)}/100`,
        action: 'Review prompting strategies and optimize token usage',
        estimatedSavings: 'Medium'
      });
    }

    return recommendations;
  }

  /**
   * Helper: calculate average
   * @param {Array} values 
   * @returns {number}
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Generate insights from efficiency analysis
   * @param {Object} results 
   * @returns {Array}
   */
  generateInsights(results) {
    const insights = [];

    // Cache utilization insight
    if (results.cacheUtilization.overall.hitRate < 10) {
      insights.push({
        type: 'opportunity',
        category: 'cache',
        message: `Low cache hit rate: ${results.cacheUtilization.overall.hitRate.toFixed(1)}%`,
        severity: 'high',
        recommendation: 'Significant cost savings available through better cache utilization'
      });
    }

    // Cost efficiency insight
    if (results.costPerToken.average > 50) {
      insights.push({
        type: 'warning',
        category: 'cost_efficiency',
        message: `High average cost per million tokens: ${this.formatCost(results.costPerToken.average)}`,
        severity: 'medium',
        recommendation: 'Consider model mix optimization'
      });
    }

    // Value leaders insight
    if (results.valueLeaders.mostEfficient.length > 0) {
      const topScore = results.valueLeaders.mostEfficient[0].efficiencyScore;
      insights.push({
        type: 'success',
        category: 'value_leaders',
        message: `Top efficiency score: ${topScore.toFixed(0)}/100`,
        severity: 'low',
        recommendation: 'Study top-performing sessions to replicate success patterns'
      });
    }

    return insights;
  }
}

module.exports = EfficiencyAnalyzer;
