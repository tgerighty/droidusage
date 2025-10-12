const { subDays, startOfDay, endOfDay } = require('date-fns');

/**
 * Analyzes trends by comparing current period with previous period
 */
class TrendAnalyzer {
  /**
   * Compare two periods and calculate changes
   * @param {Object} current - Current period data
   * @param {Object} previous - Previous period data
   * @returns {Object} Trend analysis with indicators
   */
  comparePeriods(current, previous) {
    if (!previous || previous.totalSessions === 0) {
      return this.createEmptyTrend(current);
    }

    return {
      cost: this.calculateChange(current.totalCost, previous.totalCost),
      tokens: this.calculateChange(current.totalTokens, previous.totalTokens),
      sessions: this.calculateChange(current.totalSessions, previous.totalSessions),
      prompts: this.calculateChange(current.totalPrompts, previous.totalPrompts),
      avgCostPerSession: this.calculateChange(
        current.totalCost / current.totalSessions,
        previous.totalCost / previous.totalSessions
      ),
      avgTokensPerSession: this.calculateChange(
        current.totalTokens / current.totalSessions,
        previous.totalTokens / previous.totalSessions
      ),
      avgCostPerPrompt: this.calculateChange(
        current.totalCost / (current.totalPrompts || 1),
        previous.totalCost / (previous.totalPrompts || 1)
      )
    };
  }

  /**
   * Calculate percentage change and determine trend
   * @param {number} current 
   * @param {number} previous 
   * @returns {Object}
   */
  calculateChange(current, previous) {
    if (!previous || previous === 0) {
      return {
        value: current,
        previous: previous,
        change: 0,
        percentage: 0,
        direction: 'stable',
        indicator: '→'
      };
    }

    const change = current - previous;
    const percentage = ((change / previous) * 100);
    const direction = this.getDirection(percentage);
    const indicator = this.getIndicator(direction);

    return {
      value: current,
      previous: previous,
      change: change,
      percentage: percentage,
      direction: direction,
      indicator: indicator
    };
  }

  /**
   * Get trend direction based on percentage change
   * @param {number} percentage 
   * @returns {string}
   */
  getDirection(percentage) {
    if (percentage > 5) return 'up';
    if (percentage < -5) return 'down';
    return 'stable';
  }

  /**
   * Get visual indicator for trend
   * @param {string} direction 
   * @returns {string}
   */
  getIndicator(direction) {
    switch (direction) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  }

  /**
   * Create empty trend when no comparison data available
   * @param {Object} current 
   * @returns {Object}
   */
  createEmptyTrend(current) {
    return {
      cost: { value: current.totalCost, indicator: '→', direction: 'stable', percentage: 0 },
      tokens: { value: current.totalTokens, indicator: '→', direction: 'stable', percentage: 0 },
      sessions: { value: current.totalSessions, indicator: '→', direction: 'stable', percentage: 0 },
      prompts: { value: current.totalPrompts, indicator: '→', direction: 'stable', percentage: 0 },
      avgCostPerSession: { value: current.totalCost / current.totalSessions, indicator: '→', direction: 'stable', percentage: 0 },
      avgTokensPerSession: { value: current.totalTokens / current.totalSessions, indicator: '→', direction: 'stable', percentage: 0 },
      avgCostPerPrompt: { value: current.totalCost / (current.totalPrompts || 1), indicator: '→', direction: 'stable', percentage: 0 }
    };
  }

  /**
   * Format trend for display
   * @param {Object} trend 
   * @returns {string}
   */
  formatTrend(trend) {
    const sign = trend.percentage >= 0 ? '+' : '';
    return `${trend.indicator} ${sign}${trend.percentage.toFixed(1)}%`;
  }

  /**
   * Format trend with color
   * @param {Object} trend
   * @param {Function} chalk
   * @param {boolean} inverseColor - True if down is good (like for costs)
   * @returns {string}
   */
  formatTrendColored(trend, chalk, inverseColor = false) {
    const formatted = this.formatTrend(trend);
    
    if (trend.direction === 'stable') {
      return chalk.gray(formatted);
    }
    
    const isGood = inverseColor ? trend.direction === 'down' : trend.direction === 'up';
    return isGood ? chalk.green(formatted) : chalk.red(formatted);
  }

  /**
   * Get date range for previous period
   * @param {string} since 
   * @param {string} until 
   * @returns {Object}
   */
  getPreviousPeriod(since, until) {
    const sinceDate = since ? new Date(since) : subDays(new Date(), 7);
    const untilDate = until ? new Date(until) : new Date();
    
    const days = Math.ceil((untilDate - sinceDate) / (1000 * 60 * 60 * 24));
    
    const previousSince = subDays(sinceDate, days);
    const previousUntil = subDays(untilDate, days);
    
    return {
      since: startOfDay(previousSince).toISOString().split('T')[0],
      until: endOfDay(previousUntil).toISOString().split('T')[0]
    };
  }

  /**
   * Analyze sparkline data (last N days)
   * @param {Array} dailyData - Array of daily summaries
   * @param {number} days - Number of days to analyze
   * @returns {Array} Sparkline data points
   */
  generateSparklineData(dailyData, days = 7) {
    // Get last N days
    const sorted = dailyData
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-days);
    
    return sorted.map(day => day.cost || 0);
  }

  /**
   * Detect patterns in usage
   * @param {Array} sessions 
   * @returns {Object}
   */
  detectPatterns(sessions) {
    const hourlyUsage = new Array(24).fill(0);
    const dailyUsage = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // Sunday = 0
    
    sessions.forEach(session => {
      if (session.date) {
        const hour = session.date.getHours();
        const day = session.date.getDay();
        
        hourlyUsage[hour]++;
        dailyUsage[day]++;
      }
    });
    
    // Find peak hours
    const peakHour = hourlyUsage.indexOf(Math.max(...hourlyUsage));
    const peakDay = Object.keys(dailyUsage).reduce((a, b) => 
      dailyUsage[a] > dailyUsage[b] ? a : b
    );
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      peakHour,
      peakHourRange: `${peakHour}:00-${peakHour + 1}:00`,
      peakDay: dayNames[peakDay],
      hourlyDistribution: hourlyUsage,
      dailyDistribution: dailyUsage
    };
  }
}

module.exports = TrendAnalyzer;
