/**
 * Abstract base class for all analyzers
 * Defines the contract that all analysis modules must follow
 */
class BaseAnalyzer {
  constructor() {
    if (new.target === BaseAnalyzer) {
      throw new Error('BaseAnalyzer is abstract and cannot be instantiated directly');
    }
  }

  /**
   * Main analysis method - must be implemented by subclasses
   * @param {Array} sessions - Array of session objects
   * @param {Object} options - Analysis options
   * @returns {Object} Analysis results
   */
  analyze(sessions, options = {}) {
    throw new Error('analyze() must be implemented by subclass');
  }

  /**
   * Generate insights from analysis results
   * @param {Object} results - Analysis results
   * @returns {Array} Array of insight objects
   */
  generateInsights(results) {
    throw new Error('generateInsights() must be implemented by subclass');
  }

  /**
   * Validate session data
   * @param {Array} sessions 
   * @returns {boolean}
   */
  validateSessions(sessions) {
    if (!Array.isArray(sessions)) {
      throw new Error('Sessions must be an array');
    }

    if (sessions.length === 0) {
      throw new Error('Sessions array cannot be empty');
    }

    return true;
  }

  /**
   * Filter sessions by date range
   * @param {Array} sessions 
   * @param {Object} options 
   * @returns {Array}
   */
  filterByDateRange(sessions, options) {
    if (!options.since && !options.until) {
      return sessions;
    }

    return sessions.filter(session => {
      if (!session.date) return true;

      const sessionDate = new Date(session.date);
      
      if (options.since) {
        const sinceDate = new Date(options.since);
        if (sessionDate < sinceDate) return false;
      }

      if (options.until) {
        const untilDate = new Date(options.until);
        if (sessionDate > untilDate) return false;
      }

      return true;
    });
  }

  /**
   * Calculate basic statistics for a numeric array
   * @param {Array} values 
   * @returns {Object}
   */
  calculateStats(values) {
    if (!values || values.length === 0) {
      return {
        count: 0,
        sum: 0,
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;

    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: values.length,
      sum,
      mean,
      median,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      stdDev
    };
  }

  /**
   * Format number for display
   * @param {number} num 
   * @returns {string}
   */
  formatNumber(num) {
    return num.toLocaleString();
  }

  /**
   * Format cost for display
   * @param {number} cost 
   * @returns {string}
   */
  formatCost(cost) {
    return `$${cost.toFixed(2)}`;
  }

  /**
   * Format percentage for display
   * @param {number} value 
   * @returns {string}
   */
  formatPercentage(value) {
    return `${value.toFixed(1)}%`;
  }
}

module.exports = BaseAnalyzer;
