const CostAnalyzer = require('./CostAnalyzer');
const PatternAnalyzer = require('./PatternAnalyzer');
const EfficiencyAnalyzer = require('./EfficiencyAnalyzer');

/**
 * Orchestrates parallel execution of multiple analyzers
 */
class AnalysisOrchestrator {
  constructor() {
    this.analyzers = {
      cost: new CostAnalyzer(),
      patterns: new PatternAnalyzer(),
      efficiency: new EfficiencyAnalyzer()
    };
  }

  /**
   * Run all or selected analyzers in parallel
   * @param {Array} sessions 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async runAnalysis(sessions, options = {}) {
    // Determine which analyzers to run
    const analyzersToRun = this.selectAnalyzers(options);

    // Execute selected analyzers in parallel
    const results = await this.executeParallel(sessions, analyzersToRun, options);

    // Synthesize results
    const synthesized = this.synthesizeResults(results);

    // Generate cross-analyzer insights
    const crossInsights = this.generateCrossAnalyzerInsights(results, sessions);

    return {
      timestamp: new Date().toISOString(),
      sessionCount: sessions.length,
      analyzersRun: Object.keys(results),
      results,
      synthesized,
      crossInsights
    };
  }

  /**
   * Select which analyzers to run based on options
   * @param {Object} options 
   * @returns {Array}
   */
  selectAnalyzers(options) {
    // If specific analyzers requested
    if (options.cost || options.patterns || options.efficiency) {
      const selected = [];
      if (options.cost) selected.push('cost');
      if (options.patterns) selected.push('patterns');
      if (options.efficiency) selected.push('efficiency');
      return selected;
    }

    // If 'all' flag or no specific selection, run all
    if (options.all || (!options.cost && !options.patterns && !options.efficiency)) {
      return ['cost', 'patterns', 'efficiency'];
    }

    return [];
  }

  /**
   * Execute analyzers in parallel
   * @param {Array} sessions 
   * @param {Array} analyzerNames 
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async executeParallel(sessions, analyzerNames, options) {
    const promises = analyzerNames.map(async (name) => {
      try {
        const analyzer = this.analyzers[name];
        const result = analyzer.analyze(sessions, options);
        const insights = analyzer.generateInsights(result);
        
        return {
          name,
          success: true,
          result,
          insights
        };
      } catch (error) {
        return {
          name,
          success: false,
          error: error.message
        };
      }
    });

    const resultArray = await Promise.all(promises);

    // Convert array to object keyed by analyzer name
    const results = {};
    resultArray.forEach(({ name, success, result, insights, error }) => {
      results[name] = success 
        ? { result, insights }
        : { error };
    });

    return results;
  }

  /**
   * Synthesize results across analyzers
   * @param {Object} results 
   * @returns {Object}
   */
  synthesizeResults(results) {
    const synthesis = {
      overallHealth: 'unknown',
      keyMetrics: {},
      recommendations: [],
      alerts: []
    };

    // Extract key metrics from each analyzer
    if (results.cost && results.cost.result) {
      synthesis.keyMetrics.burnRate = results.cost.result.burnRate;
      synthesis.keyMetrics.totalCost = results.cost.result.byModel.reduce(
        (sum, m) => sum + m.totalCost, 0
      );
    }

    if (results.patterns && results.patterns.result) {
      synthesis.keyMetrics.peakHour = results.patterns.result.peakHours.peakHour;
      synthesis.keyMetrics.busiestDay = results.patterns.result.busiestDays.busiestDay;
    }

    if (results.efficiency && results.efficiency.result) {
      const avgScore = results.efficiency.result.efficiencyScores.stats.mean;
      synthesis.keyMetrics.avgEfficiencyScore = avgScore;
      synthesis.overallHealth = this.determineOverallHealth(avgScore);
    }

    // Aggregate all recommendations
    Object.values(results).forEach(analyzerResult => {
      if (analyzerResult.result && analyzerResult.result.recommendations) {
        synthesis.recommendations.push(...analyzerResult.result.recommendations);
      }
    });

    // Aggregate all insights as alerts
    Object.values(results).forEach(analyzerResult => {
      if (analyzerResult.insights) {
        synthesis.alerts.push(...analyzerResult.insights);
      }
    });

    return synthesis;
  }

  /**
   * Determine overall health score
   * @param {number} avgEfficiency 
   * @returns {string}
   */
  determineOverallHealth(avgEfficiency) {
    if (avgEfficiency >= 70) return 'excellent';
    if (avgEfficiency >= 50) return 'good';
    if (avgEfficiency >= 30) return 'fair';
    return 'poor';
  }

  /**
   * Generate insights that span multiple analyzers
   * @param {Object} results 
   * @param {Array} sessions 
   * @returns {Array}
   */
  generateCrossAnalyzerInsights(results, sessions) {
    const insights = [];

    // Correlate cost and patterns
    if (results.cost && results.patterns) {
      const costResult = results.cost.result;
      const patternResult = results.patterns.result;

      // Check if peak hours correlate with high costs
      if (costResult.burnRate && patternResult.peakHours) {
        insights.push({
          type: 'correlation',
          category: 'cost_timing',
          message: `Peak usage at ${patternResult.peakHours.peakHourRange} with ${costResult.burnRate.dailyAverage.toFixed(2)} daily burn rate`,
          recommendation: 'Consider load balancing to distribute usage more evenly'
        });
      }
    }

    // Correlate efficiency and cost
    if (results.efficiency && results.cost) {
      const effResult = results.efficiency.result;
      const costResult = results.cost.result;

      const avgEfficiency = effResult.efficiencyScores.stats.mean;
      const monthlyBurn = costResult.burnRate.monthlyProjection;

      if (avgEfficiency < 40 && monthlyBurn > 500) {
        insights.push({
          type: 'warning',
          category: 'efficiency_cost',
          message: `Low efficiency (${avgEfficiency.toFixed(0)}/100) with high monthly costs ($${monthlyBurn.toFixed(2)})`,
          recommendation: 'Prioritize efficiency improvements for significant cost savings'
        });
      }
    }

    // Correlate patterns and efficiency
    if (results.patterns && results.efficiency) {
      const patternResult = results.patterns.result;
      const effResult = results.efficiency.result;

      const longSessions = patternResult.sessionDuration.anomalies.length;
      const lowEfficiencySessions = effResult.efficiencyScores.bottom10.length;

      if (longSessions > 0 && lowEfficiencySessions > 0) {
        insights.push({
          type: 'info',
          category: 'duration_efficiency',
          message: `${longSessions} long-duration sessions detected, ${lowEfficiencySessions} low-efficiency sessions`,
          recommendation: 'Review if long sessions correlate with low efficiency'
        });
      }
    }

    return insights;
  }

  /**
   * Get summary statistics across all analyses
   * @param {Object} orchestratorResult 
   * @returns {Object}
   */
  getSummary(orchestratorResult) {
    return {
      timestamp: orchestratorResult.timestamp,
      sessionCount: orchestratorResult.sessionCount,
      analyzersRun: orchestratorResult.analyzersRun.length,
      overallHealth: orchestratorResult.synthesized.overallHealth,
      totalRecommendations: orchestratorResult.synthesized.recommendations.length,
      totalAlerts: orchestratorResult.synthesized.alerts.length,
      crossInsights: orchestratorResult.crossInsights.length,
      keyMetrics: orchestratorResult.synthesized.keyMetrics
    };
  }
}

module.exports = AnalysisOrchestrator;
