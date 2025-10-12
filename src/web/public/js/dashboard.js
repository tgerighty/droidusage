// Dashboard Application
class Dashboard {
  constructor() {
    this.currentPage = 'overview';
    this.data = {};
    this.charts = {};
    this.init();
  }

  init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupRefresh();
    this.loadPage(this.currentPage);
  }

  setupTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    document.getElementById('themeToggle').addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const newTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
    });
  }

  setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.loadPage(page);

        // Update active state
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  setupRefresh() {
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.refresh();
    });

    // Auto-refresh every 60 seconds
    setInterval(() => this.refresh(), 60000);
  }

  async refresh() {
    const icon = document.getElementById('refreshIcon');
    icon.classList.add('spinning');
    await this.loadPage(this.currentPage);
    icon.classList.remove('spinning');
  }

  async loadPage(pageName) {
    this.currentPage = pageName;

    const titles = {
      overview: { title: 'Overview', subtitle: 'Real-time usage analytics' },
      cost: { title: 'Cost Analysis', subtitle: 'Burn rate and spending patterns' },
      patterns: { title: 'Usage Patterns', subtitle: 'Temporal usage insights' },
      efficiency: { title: 'Efficiency Analysis', subtitle: 'Performance and optimization' },
      'top-sessions': { title: 'Top Sessions', subtitle: 'Highest cost and token sessions' }
    };

    const { title, subtitle } = titles[pageName] || titles.overview;
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = subtitle;

    // Load page content
    const content = document.getElementById('content');
    content.innerHTML = '<div class="text-center py-12"><div class="spinner"></div><p class="mt-4 text-gray-600">Loading...</p></div>';

    try {
      switch (pageName) {
        case 'overview':
          await this.loadOverview();
          break;
        case 'cost':
          await this.loadCostAnalysis();
          break;
        case 'patterns':
          await this.loadPatternsAnalysis();
          break;
        case 'efficiency':
          await this.loadEfficiencyAnalysis();
          break;
        case 'top-sessions':
          await this.loadTopSessions();
          break;
      }

      document.getElementById('lastUpdated').textContent = 
        `Last updated: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
      content.innerHTML = `
        <div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <h3 class="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Data</h3>
          <p class="text-red-600 dark:text-red-300 mt-2">${error.message}</p>
        </div>
      `;
    }
  }

  async loadOverview() {
    const [dailyData, trendsData, topData] = await Promise.all([
      fetch('/api/daily').then(r => r.json()),
      fetch('/api/trends').then(r => r.json()),
      fetch('/api/top?limit=5').then(r => r.json())
    ]);

    this.data.daily = dailyData;
    this.data.trends = trendsData;
    this.data.top = topData;

    this.renderOverview();
  }

  renderOverview() {
    const { daily, trends, top } = this.data;
    const summary = daily.summary;
    const trendData = trends.trends;

    const content = document.getElementById('content');
    content.innerHTML = `
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        ${this.renderSummaryCard('Total Cost', this.formatCost(summary.totalCost), trendData.cost, true)}
        ${this.renderSummaryCard('Total Tokens', this.formatNumber(summary.totalTokens), trendData.tokens)}
        ${this.renderSummaryCard('Sessions', this.formatNumber(summary.totalSessions), trendData.sessions)}
        ${this.renderSummaryCard('Avg Cost/Session', this.formatCost(summary.totalCost / summary.totalSessions), trendData.avgCostPerSession, true)}
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Daily Cost Trend</h3>
          <canvas id="costChart"></canvas>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Model Distribution</h3>
          <canvas id="modelChart"></canvas>
        </div>
      </div>

      <!-- Top Sessions -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Top 5 Sessions by Cost</h3>
        <div class="overflow-x-auto">
          ${this.renderTopSessionsTable(top.data)}
        </div>
      </div>
    `;

    this.renderCostTrendChart(daily.data);
    this.renderModelDistributionChart(daily.data);
  }

  async loadCostAnalysis() {
    const data = await fetch('/api/analyze/cost').then(r => r.json());
    this.data.costAnalysis = data;
    this.renderCostAnalysis();
  }

  renderCostAnalysis() {
    const { results } = this.data.costAnalysis;
    const costData = results.cost.result;

    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="card">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Daily Burn Rate</h4>
          <p class="text-3xl font-bold text-blue-600">${this.formatCost(costData.burnRate.dailyAverage)}</p>
          <p class="text-sm text-gray-600 mt-2">Monthly: ${this.formatCost(costData.burnRate.monthlyProjection)}</p>
        </div>
        <div class="card">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Most Expensive Model</h4>
          <p class="text-xl font-bold">${costData.byModel[costData.byModel.length - 1].model}</p>
          <p class="text-sm text-gray-600 mt-2">${this.formatCost(costData.byModel[costData.byModel.length - 1].totalCost)} total</p>
        </div>
        <div class="card">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Cheapest Model</h4>
          <p class="text-xl font-bold">${costData.byModel[0].model}</p>
          <p class="text-sm text-gray-600 mt-2">${this.formatCost(costData.byModel[0].totalCost)} total</p>
        </div>
      </div>

      <div class="card mb-8">
        <h3 class="text-lg font-semibold mb-4">Cost by Model</h3>
        <canvas id="costByModelChart"></canvas>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Recommendations</h3>
        ${this.renderRecommendations(results.cost.insights)}
      </div>
    `;

    this.renderCostByModelChart(costData.byModel);
  }

  async loadPatternsAnalysis() {
    const data = await fetch('/api/analyze/patterns').then(r => r.json());
    this.data.patternsAnalysis = data;
    this.renderPatternsAnalysis();
  }

  renderPatternsAnalysis() {
    const { results } = this.data.patternsAnalysis;
    const patterns = results.patterns.result;

    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Peak Hour</h4>
          <p class="text-3xl font-bold text-purple-600">${patterns.peakHours.peakHourRange}</p>
          <p class="text-sm text-gray-600 mt-2">${patterns.peakHours.peakCount} sessions</p>
        </div>
        <div class="card">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Busiest Day</h4>
          <p class="text-2xl font-bold text-purple-600">${patterns.busiestDays.busiestDay}</p>
          <p class="text-sm text-gray-600 mt-2">${patterns.busiestDays.busiestDayCount} sessions</p>
        </div>
        <div class="card">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Usage Spikes</h4>
          <p class="text-3xl font-bold text-purple-600">${patterns.usageSpikes.spikeCount}</p>
          <p class="text-sm text-gray-600 mt-2">Days with >2× avg</p>
        </div>
      </div>

      <div class="card mb-8">
        <h3 class="text-lg font-semibold mb-4">Hourly Distribution</h3>
        <canvas id="hourlyChart"></canvas>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Daily Distribution</h3>
        <canvas id="dailyChart"></canvas>
      </div>
    `;

    this.renderHourlyChart(patterns.peakHours.hourlyDistribution);
    this.renderDailyChart(patterns.busiestDays.dailyDistribution);
  }

  async loadEfficiencyAnalysis() {
    const data = await fetch('/api/analyze/efficiency').then(r => r.json());
    this.data.efficiencyAnalysis = data;
    this.renderEfficiencyAnalysis();
  }

  renderEfficiencyAnalysis() {
    const { results } = this.data.efficiencyAnalysis;
    const efficiency = results.efficiency.result;

    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Avg Efficiency Score</h4>
          <p class="text-3xl font-bold text-green-600">${efficiency.efficiencyScores.stats.mean.toFixed(0)}/100</p>
          <p class="text-sm text-gray-600 mt-2">Overall performance</p>
        </div>
        <div class="card">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Cache Hit Rate</h4>
          <p class="text-3xl font-bold text-green-600">${efficiency.cacheUtilization.overall.hitRate.toFixed(1)}%</p>
          <p class="text-sm text-gray-600 mt-2">Prompt cache usage</p>
        </div>
        <div class="card">
          <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Best Model</h4>
          <p class="text-xl font-bold">${efficiency.costPerToken.cheapest.model}</p>
          <p class="text-sm text-gray-600 mt-2">${this.formatCost(efficiency.costPerToken.cheapest.costPerMillionTokens)}/1M tokens</p>
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Recommendations</h3>
        ${this.renderRecommendations(efficiency.recommendations)}
      </div>
    `;
  }

  async loadTopSessions() {
    const data = await fetch('/api/top?limit=20').then(r => r.json());
    this.data.topSessions = data;
    this.renderTopSessions();
  }

  renderTopSessions() {
    const { data } = this.data.topSessions;

    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Top 20 Sessions by Cost</h3>
        <div class="overflow-x-auto">
          ${this.renderTopSessionsTable(data)}
        </div>
      </div>
    `;
  }

  // Rendering helpers
  renderSummaryCard(title, value, trend, isCost = false) {
    const trendIcon = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→';
    const trendColor = isCost 
      ? (trend.direction === 'up' ? 'text-red-600' : trend.direction === 'down' ? 'text-green-600' : 'text-gray-600')
      : (trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-600');

    return `
      <div class="card">
        <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">${title}</h4>
        <p class="text-3xl font-bold text-gray-900 dark:text-white">${value}</p>
        <p class="text-sm ${trendColor} mt-2">
          ${trendIcon} ${trend.percentage.toFixed(1)}% vs previous period
        </p>
      </div>
    `;
  }

  renderTopSessionsTable(sessions) {
    if (!sessions || sessions.length === 0) {
      return '<p class="text-gray-600 text-center py-8">No sessions found</p>';
    }

    return `
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Session ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tokens</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          ${sessions.map(s => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${s.id.substring(0, 12)}...</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${s.model}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">${this.formatCost(s.cost)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${this.formatNumber(s.totalTokens)}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${this.formatTime(s.activeTimeMs)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderRecommendations(items) {
    if (!items || items.length === 0) {
      return '<p class="text-gray-600">No recommendations at this time</p>';
    }

    return `
      <div class="space-y-4">
        ${items.map(item => `
          <div class="border-l-4 border-blue-500 pl-4 py-2">
            <h4 class="font-semibold text-gray-900 dark:text-white">${item.message}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${item.recommendation || item.action}</p>
            ${item.priority ? `<span class="inline-block mt-2 px-2 py-1 text-xs rounded ${
              item.priority === 'high' ? 'bg-red-100 text-red-800' : 
              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }">${item.priority.toUpperCase()}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Chart rendering
  renderCostTrendChart(dailyData) {
    const ctx = document.getElementById('costChart');
    if (!ctx) return;

    const last7Days = dailyData.slice(-7);
    const labels = last7Days.map(d => d.date);
    const data = last7Days.map(d => d.cost);

    if (this.charts.costChart) this.charts.costChart.destroy();

    this.charts.costChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Cost ($)',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  renderModelDistributionChart(dailyData) {
    const ctx = document.getElementById('modelChart');
    if (!ctx) return;

    // Aggregate by model
    const modelTotals = {};
    dailyData.forEach(d => {
      modelTotals[d.model] = (modelTotals[d.model] || 0) + d.cost;
    });

    const labels = Object.keys(modelTotals);
    const data = Object.values(modelTotals);

    if (this.charts.modelChart) this.charts.modelChart.destroy();

    this.charts.modelChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            'rgb(59, 130, 246)',
            'rgb(147, 51, 234)',
            'rgb(236, 72, 153)',
            'rgb(34, 197, 94)',
            'rgb(251, 146, 60)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true
      }
    });
  }

  renderCostByModelChart(byModel) {
    const ctx = document.getElementById('costByModelChart');
    if (!ctx) return;

    const labels = byModel.map(m => m.model);
    const data = byModel.map(m => m.totalCost);

    if (this.charts.costByModelChart) this.charts.costByModelChart.destroy();

    this.charts.costByModelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Cost ($)',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true
      }
    });
  }

  renderHourlyChart(hourlyDist) {
    const ctx = document.getElementById('hourlyChart');
    if (!ctx) return;

    const labels = hourlyDist.map(h => `${h.hour}:00`);
    const data = hourlyDist.map(h => h.sessions);

    if (this.charts.hourlyChart) this.charts.hourlyChart.destroy();

    this.charts.hourlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Sessions',
          data,
          backgroundColor: 'rgba(147, 51, 234, 0.5)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true
      }
    });
  }

  renderDailyChart(dailyDist) {
    const ctx = document.getElementById('dailyChart');
    if (!ctx) return;

    const labels = dailyDist.map(d => d.day);
    const data = dailyDist.map(d => d.sessions);

    if (this.charts.dailyChart) this.charts.dailyChart.destroy();

    this.charts.dailyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Sessions',
          data,
          backgroundColor: 'rgba(147, 51, 234, 0.5)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true
      }
    });
  }

  // Utility methods
  formatNumber(num) {
    return num.toLocaleString();
  }

  formatCost(cost) {
    return `$${cost.toFixed(2)}`;
  }

  formatTime(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});
