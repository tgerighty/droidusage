const BaseAnalyzer = require('./BaseAnalyzer');

/**
 * Pattern analysis module - analyzes temporal usage patterns and behaviors
 */
class PatternAnalyzer extends BaseAnalyzer {
  /**
   * Analyze usage patterns
   * @param {Array} sessions 
   * @param {Object} options 
   * @returns {Object}
   */
  analyze(sessions, options = {}) {
    this.validateSessions(sessions);

    const filtered = this.filterByDateRange(sessions, options);

    return {
      peakHours: this.findPeakHours(filtered),
      busiestDays: this.findBusiestDays(filtered),
      sessionDuration: this.analyzeSessionDuration(filtered),
      modelPreferences: this.analyzeModelPreferences(filtered),
      usageSpikes: this.detectUsageSpikes(filtered),
      timeOfDayPatterns: this.analyzeTimeOfDayPatterns(filtered)
    };
  }

  /**
   * Find peak usage hours
   * @param {Array} sessions 
   * @returns {Object}
   */
  findPeakHours(sessions) {
    const hourlyUsage = new Array(24).fill(0);
    const hourlyCosts = new Array(24).fill(0);

    sessions.forEach(session => {
      if (session.date) {
        const hour = new Date(session.date).getHours();
        hourlyUsage[hour]++;
        hourlyCosts[hour] += session.cost || 0;
      }
    });

    // Find peak hour
    const peakHour = hourlyUsage.indexOf(Math.max(...hourlyUsage));
    const peakCount = hourlyUsage[peakHour];

    // Find quietest hour
    const quietestHour = hourlyUsage.indexOf(Math.min(...hourlyUsage.filter(c => c > 0)));

    return {
      hourlyDistribution: hourlyUsage.map((count, hour) => ({
        hour,
        sessions: count,
        cost: hourlyCosts[hour]
      })),
      peakHour,
      peakHourRange: `${peakHour}:00-${(peakHour + 1) % 24}:00`,
      peakCount,
      quietestHour,
      totalSessions: sessions.length
    };
  }

  /**
   * Find busiest days of week
   * @param {Array} sessions 
   * @returns {Object}
   */
  findBusiestDays(sessions) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyUsage = new Array(7).fill(0);
    const dailyCosts = new Array(7).fill(0);

    sessions.forEach(session => {
      if (session.date) {
        const day = new Date(session.date).getDay();
        dailyUsage[day]++;
        dailyCosts[day] += session.cost || 0;
      }
    });

    const busiestDayIndex = dailyUsage.indexOf(Math.max(...dailyUsage));
    const quietestDayIndex = dailyUsage.indexOf(Math.min(...dailyUsage.filter(c => c > 0)));

    return {
      dailyDistribution: dailyUsage.map((count, day) => ({
        day: dayNames[day],
        dayIndex: day,
        sessions: count,
        cost: dailyCosts[day]
      })),
      busiestDay: dayNames[busiestDayIndex],
      busiestDayIndex,
      busiestDayCount: dailyUsage[busiestDayIndex],
      quietestDay: dayNames[quietestDayIndex],
      weekdayVsWeekend: this.calculateWeekdayWeekendSplit(dailyUsage)
    };
  }

  /**
   * Calculate weekday vs weekend usage
   * @param {Array} dailyUsage 
   * @returns {Object}
   */
  calculateWeekdayWeekendSplit(dailyUsage) {
    const weekdayTotal = dailyUsage.slice(1, 6).reduce((sum, count) => sum + count, 0);
    const weekendTotal = dailyUsage[0] + dailyUsage[6];
    const total = weekdayTotal + weekendTotal;

    return {
      weekday: weekdayTotal,
      weekend: weekendTotal,
      weekdayPercentage: total > 0 ? (weekdayTotal / total) * 100 : 0,
      weekendPercentage: total > 0 ? (weekendTotal / total) * 100 : 0
    };
  }

  /**
   * Analyze session duration patterns
   * @param {Array} sessions 
   * @returns {Object}
   */
  analyzeSessionDuration(sessions) {
    const durations = sessions
      .filter(s => s.activeTimeMs)
      .map(s => s.activeTimeMs);

    if (durations.length === 0) {
      return {
        stats: this.calculateStats([]),
        distribution: [],
        anomalies: []
      };
    }

    const stats = this.calculateStats(durations);

    // Categorize into buckets
    const buckets = [
      { label: '< 1 min', max: 60000, count: 0 },
      { label: '1-5 min', max: 300000, count: 0 },
      { label: '5-15 min', max: 900000, count: 0 },
      { label: '15-30 min', max: 1800000, count: 0 },
      { label: '30-60 min', max: 3600000, count: 0 },
      { label: '> 60 min', max: Infinity, count: 0 }
    ];

    let prevMax = 0;
    durations.forEach(duration => {
      for (const bucket of buckets) {
        if (duration <= bucket.max && duration > prevMax) {
          bucket.count++;
          break;
        }
        prevMax = bucket.max;
      }
      prevMax = 0;
    });

    // Find anomalies (sessions > 2 std deviations)
    const threshold = stats.mean + (2 * stats.stdDev);
    const anomalies = sessions
      .filter(s => s.activeTimeMs && s.activeTimeMs > threshold)
      .map(s => ({
        id: s.id,
        duration: s.activeTimeMs,
        deviationMultiple: ((s.activeTimeMs - stats.mean) / stats.stdDev).toFixed(1)
      }));

    return {
      stats,
      distribution: buckets,
      anomalies
    };
  }

  /**
   * Analyze model preferences by time of day
   * @param {Array} sessions 
   * @returns {Object}
   */
  analyzeModelPreferences(sessions) {
    const preferences = {};

    sessions.forEach(session => {
      if (!session.date || !session.model) return;

      const hour = new Date(session.date).getHours();
      const timeOfDay = this.getTimeOfDayCategory(hour);
      const model = session.model;

      if (!preferences[timeOfDay]) {
        preferences[timeOfDay] = {};
      }

      if (!preferences[timeOfDay][model]) {
        preferences[timeOfDay][model] = {
          count: 0,
          totalCost: 0,
          totalTokens: 0
        };
      }

      preferences[timeOfDay][model].count++;
      preferences[timeOfDay][model].totalCost += session.cost || 0;
      preferences[timeOfDay][model].totalTokens += session.totalTokens || 0;
    });

    // Convert to array format and find most popular per time
    const result = {};
    for (const [timeOfDay, models] of Object.entries(preferences)) {
      const modelArray = Object.entries(models).map(([model, data]) => ({
        model,
        ...data
      })).sort((a, b) => b.count - a.count);

      result[timeOfDay] = {
        models: modelArray,
        mostPopular: modelArray[0]?.model,
        totalSessions: modelArray.reduce((sum, m) => sum + m.count, 0)
      };
    }

    return result;
  }

  /**
   * Get time of day category
   * @param {number} hour 
   * @returns {string}
   */
  getTimeOfDayCategory(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Analyze time of day patterns
   * @param {Array} sessions 
   * @returns {Object}
   */
  analyzeTimeOfDayPatterns(sessions) {
    const patterns = {
      morning: { count: 0, cost: 0, tokens: 0 },
      afternoon: { count: 0, cost: 0, tokens: 0 },
      evening: { count: 0, cost: 0, tokens: 0 },
      night: { count: 0, cost: 0, tokens: 0 }
    };

    sessions.forEach(session => {
      if (!session.date) return;

      const hour = new Date(session.date).getHours();
      const timeOfDay = this.getTimeOfDayCategory(hour);

      patterns[timeOfDay].count++;
      patterns[timeOfDay].cost += session.cost || 0;
      patterns[timeOfDay].tokens += session.totalTokens || 0;
    });

    // Find peak time
    const peakTime = Object.entries(patterns)
      .reduce((peak, [time, data]) => 
        data.count > peak.count ? { time, count: data.count } : peak,
        { time: 'morning', count: 0 }
      );

    return {
      patterns,
      peakTime: peakTime.time,
      peakTimeCount: peakTime.count
    };
  }

  /**
   * Detect usage spikes (>2x average)
   * @param {Array} sessions 
   * @returns {Object}
   */
  detectUsageSpikes(sessions) {
    // Group by date
    const dailyCounts = {};
    const dailyCosts = {};

    sessions.forEach(session => {
      if (!session.date) return;

      const date = new Date(session.date).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      dailyCosts[date] = (dailyCosts[date] || 0) + (session.cost || 0);
    });

    const counts = Object.values(dailyCounts);
    const avgCount = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const threshold = avgCount * 2;

    // Find spike days
    const spikes = Object.entries(dailyCounts)
      .filter(([date, count]) => count > threshold)
      .map(([date, count]) => ({
        date,
        sessionCount: count,
        cost: dailyCosts[date],
        multiple: (count / avgCount).toFixed(1)
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount);

    return {
      spikes,
      averageDailyCount: avgCount,
      threshold,
      spikeCount: spikes.length
    };
  }

  /**
   * Generate insights from pattern analysis
   * @param {Object} results 
   * @returns {Array}
   */
  generateInsights(results) {
    const insights = [];

    // Peak hour insight
    if (results.peakHours.peakCount > 0) {
      insights.push({
        type: 'info',
        category: 'peak_hours',
        message: `Peak usage hour: ${results.peakHours.peakHourRange} with ${results.peakHours.peakCount} sessions`,
        severity: 'low',
        recommendation: 'Consider scheduling batch jobs outside peak hours to avoid rate limits'
      });
    }

    // Weekday/weekend pattern
    const weekdayWeekend = results.busiestDays.weekdayVsWeekend;
    if (weekdayWeekend.weekendPercentage > 30) {
      insights.push({
        type: 'info',
        category: 'weekend_usage',
        message: `Significant weekend usage: ${weekdayWeekend.weekendPercentage.toFixed(0)}%`,
        severity: 'low',
        recommendation: 'Weekend patterns suggest personal vs business usage mix'
      });
    }

    // Long session warning
    const longSessions = results.sessionDuration.anomalies.length;
    if (longSessions > 0) {
      insights.push({
        type: 'warning',
        category: 'long_sessions',
        message: `${longSessions} unusually long sessions detected`,
        severity: 'medium',
        recommendation: 'Review long-running sessions for potential inefficiencies or stuck processes'
      });
    }

    // Usage spikes
    if (results.usageSpikes.spikeCount > 0) {
      insights.push({
        type: 'info',
        category: 'usage_spikes',
        message: `${results.usageSpikes.spikeCount} usage spike days detected`,
        severity: 'low',
        recommendation: 'Investigate spike causes to optimize future usage patterns'
      });
    }

    return insights;
  }
}

module.exports = PatternAnalyzer;
