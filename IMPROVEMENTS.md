# Droidusage Improvement Plan

## 🎯 Master Orchestrator Pattern

This improvement plan applies the **Master Orchestrator** pattern to enhance speed, visibility, and analysis capabilities.

### Core Principle
Break down complex analysis into specialized sub-analyzers that run in parallel, each providing unique insights, then synthesize results into actionable recommendations.

---

## 🚀 Phase 1: Foundation Enhancements (High Impact, Low-Medium Effort)

### 1.1 Trend Analysis & Comparisons
**Goal**: Show how usage is changing over time

**Features**:
- **Period Comparison**: Compare current period vs previous (day-over-day, week-over-week)
- **Trend Indicators**: Show ↑↓ arrows with percentage changes
- **Growth Metrics**: Track token growth, cost growth, session count changes

**Example Output**:
```
Summary:
  Total Cost: $3,813.53 ↑ 127% vs previous period
  Total Tokens: 7.25B ↑ 89% vs last week
  Average Cost/Session: $8.40 ↓ 5% (improving!)
  
Trends:
  • Cost trending UP significantly - review usage patterns
  • GLM-4 usage increased 300% - consider if this is optimal
  • Cache hit rate: 23% (could be better)
```

**Implementation**:
```javascript
class TrendAnalyzer {
  async comparePeriods(currentData, previousData) {
    // Calculate deltas, percentages, trends
  }
  
  generateTrendIndicators(current, previous) {
    // Return ↑↓→ with percentage
  }
}
```

---

### 1.2 ASCII Visualizations
**Goal**: Quick visual trends without leaving the terminal

**Features**:
- **Sparklines**: Tiny inline charts showing 7-day trends
- **Bar Charts**: Compare model costs side-by-side
- **Heatmaps**: Show usage intensity by hour/day

**Example Output**:
```
Daily Cost Trend (Last 7 Days):
$3,800 ┤       ╭─╮
$2,000 ┤     ╭─╯ ╰╮
$1,000 ┤   ╭─╯    ╰─╮
$0     ┼───╯        ╰─  ▁▂▃▄▅▆▇█

Model Cost Distribution:
Claude Sonnet ████████████████████ $2,100 (55%)
GLM-4        ██████████████ $1,500 (39%)
GPT-4o       ██ $200 (5%)

Peak Usage Hours (Last 24h):
00-06: ░░░░░ (low)
06-12: ████░ (high)
12-18: ███░░ (medium)
18-24: ██░░░ (medium)
```

**Implementation**:
- Use `asciichart` library for sparklines
- Use `cli-chart` for bar/pie charts
- Custom rendering for heatmaps

---

### 1.3 Top Sessions Analysis
**Goal**: Quickly identify expensive or unusual sessions

**Features**:
- **Top 10 Most Expensive**: Show sessions by cost
- **Top 10 Highest Token Count**: Identify heavy usage
- **Longest Sessions**: Find time-intensive tasks
- **Efficiency Outliers**: Sessions with poor cost/output ratio

**Example Output**:
```
Top 5 Most Expensive Sessions:
┌───────────┬──────────────────┬─────────┬─────────┬────────┬───────────────────────┐
│ Session   │ Date             │ Model   │ Tokens  │ Cost   │ Efficiency            │
├───────────┼──────────────────┼─────────┼─────────┼────────┼───────────────────────┤
│ 04b9e137  │ 2025-10-09 14:30 │ Sonnet  │ 76.8M   │ $64.88 │ ⚠️  Very expensive     │
│ 09e2cdd1  │ 2025-10-09 09:15 │ GLM-4   │ 14.0M   │ $35.12 │ ✓ Normal              │
│ abc123de  │ 2025-10-09 16:45 │ GLM-4   │ 42.3M   │ $28.45 │ ⚠️  High token usage  │
└───────────┴──────────────────┴─────────┴─────────┴────────┴───────────────────────┘

💡 Recommendation: Session 04b9e137 used 76M tokens. Consider:
   - Breaking large tasks into smaller sessions
   - Using more efficient prompting techniques
   - Switching to Haiku for simpler sub-tasks
```

**Command**:
```bash
droidusage top --by cost --limit 10
droidusage top --by tokens --since 2025-10-01
droidusage top --by duration --outliers
```

---

## 🔥 Phase 2: Advanced Analysis (High Impact, Medium Effort)

### 2.1 Specialized Analysis Modules
**Goal**: Parallel analysis from multiple perspectives

**Architecture**:
```javascript
class AnalysisOrchestrator {
  async runComprehensiveAnalysis(sessions) {
    // Run analyzers in parallel
    const [costs, patterns, efficiency, anomalies] = await Promise.all([
      new CostAnalyzer().analyze(sessions),
      new PatternAnalyzer().analyze(sessions),
      new EfficiencyAnalyzer().analyze(sessions),
      new AnomalyDetector().analyze(sessions)
    ]);
    
    return this.synthesizeInsights(costs, patterns, efficiency, anomalies);
  }
}
```

#### 2.1.1 Cost Analyzer
**Analyzes**: Spending patterns and optimization opportunities

**Metrics**:
- Cost per model
- Cost by time of day
- Cost trajectory (trending up/down)
- Budget burn rate
- Cost per user prompt
- Most/least expensive models for your usage

**Output**:
```
💰 Cost Analysis:
   Total Spend: $3,813.53
   Daily Average: $190.68
   Cost per Prompt: $16.50
   
   By Model:
   • Claude Sonnet: $2,100 (55%) - Heavy usage
   • GLM-4: $1,500 (39%) - Growing fast ↑
   • GPT-4o: $200 (5%) - Minimal usage
   
   Budget Status:
   • Current rate: $190/day
   • Projected monthly: $5,720
   • If budget is $5,000: ⚠️  On track to exceed by $720
```

#### 2.1.2 Pattern Analyzer
**Analyzes**: When, how, and what you use

**Metrics**:
- Peak usage hours
- Most active days
- Session duration patterns
- Model switching patterns
- Cache utilization patterns

**Output**:
```
📊 Usage Patterns:
   Peak Hours: 9-11am, 2-4pm
   Busiest Days: Tuesday, Thursday
   Avg Session Duration: 18 minutes
   
   Model Preferences:
   • Morning (6-12): 80% Claude Sonnet, 20% GLM-4
   • Afternoon (12-18): 50% Claude Sonnet, 50% GLM-4
   • Evening (18-24): 90% GLM-4, 10% Claude
   
   💡 Insight: You switch to cheaper models in the evening,
      suggesting cost-conscious usage patterns.
```

#### 2.1.3 Efficiency Analyzer
**Analyzes**: How effectively you're using AI

**Metrics**:
- Tokens per prompt (verbosity indicator)
- Cache hit rate (efficiency indicator)
- Cost per successful session
- Input/output ratio (conversation balance)
- Thinking tokens usage (Claude extended thinking)

**Output**:
```
⚡ Efficiency Metrics:
   Tokens per Prompt: 315K avg (↓ 12% vs last week - improving!)
   Cache Hit Rate: 23% (could be better)
   Input/Output Ratio: 1:5.2 (good balance)
   
   Model Efficiency:
   • Claude Sonnet: $8.40/prompt, 89% success rate ✓
   • GLM-4: $6.20/prompt, 76% success rate
   • GPT-4o: $12.50/prompt, 95% success rate
   
   Cache Analysis:
   • You're only utilizing 23% cache hits
   • Potential savings with better cache: ~$450/month
   • Recommendation: Enable prompt caching for repeated tasks
```

#### 2.1.4 Anomaly Detector
**Analyzes**: Unusual sessions that need attention

**Detects**:
- Sessions with unexpectedly high costs
- Very long-running sessions (might be stuck)
- Sessions with poor efficiency
- Sudden spikes in usage
- Model switches that don't make sense

**Output**:
```
🔍 Anomalies Detected:
   
   ⚠️  CRITICAL (3 found):
   • Session 04b9e137: $64.88 cost (3.8x normal)
     → Used 76M tokens in single session
     → Recommendation: Review and optimize this workflow
   
   • Session abc123de: 4.5 hour duration
     → Possibly stuck or very complex task
     → Consider breaking into smaller sessions
   
   ⚠️  WARNING (5 found):
   • Oct 9, 9-11am: 6x normal usage
     → Caused by 15 sessions in 2 hours
     → Approaching rate limits
   
   ℹ️  INFO (12 found):
   • Cache miss rate increased to 85% (normally 77%)
     → Check if working on new projects
```

---

### 2.2 SQLite Caching Layer
**Goal**: 10-100x faster repeated queries

**Benefits**:
- Parse sessions only once
- Instant filtering and aggregation
- Historical tracking built-in
- Support complex queries

**Schema**:
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  date DATETIME,
  provider TEXT,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cache_create_tokens INTEGER,
  cache_read_tokens INTEGER,
  cost REAL,
  duration_ms INTEGER,
  prompt_count INTEGER,
  created_at DATETIME,
  updated_at DATETIME
);

CREATE INDEX idx_date ON sessions(date);
CREATE INDEX idx_provider ON sessions(provider);
CREATE INDEX idx_model ON sessions(model);
CREATE INDEX idx_cost ON sessions(cost DESC);

CREATE TABLE daily_aggregates (
  date DATE PRIMARY KEY,
  total_tokens INTEGER,
  total_cost REAL,
  session_count INTEGER,
  prompt_count INTEGER,
  computed_at DATETIME
);
```

**Implementation**:
```javascript
class CacheManager {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.initSchema();
  }
  
  async syncSessions(sessionsDir) {
    // Only parse new/modified sessions
    const existingSessions = await this.getSessionIds();
    const allSessions = await this.getSessionFiles();
    const newSessions = allSessions.filter(id => !existingSessions.has(id));
    
    // Parse and store only new sessions
    await this.parseAndStore(newSessions);
  }
  
  async query(filters) {
    // Lightning-fast SQL queries
    return this.db.prepare(`
      SELECT * FROM sessions 
      WHERE date BETWEEN ? AND ?
      AND provider = ?
      ORDER BY cost DESC
    `).all(filters.since, filters.until, filters.provider);
  }
}
```

**Performance**:
- First run: Parse all 454 sessions (~30s)
- Subsequent runs: Query cache (~0.1s) - **300x faster!**
- Incremental updates: Parse only new sessions

**Commands**:
```bash
# Force rebuild cache
droidusage cache --rebuild

# Show cache stats
droidusage cache --stats

# Clear cache
droidusage cache --clear
```

---

### 2.3 Smart Recommendations Engine
**Goal**: Actionable insights for cost optimization

**Categories**:

#### Cost Optimization
```
💡 Cost Saving Opportunities:

1. Switch to Haiku for Simple Tasks (Est. savings: $450/mo)
   • You used Claude Sonnet for 45 sessions with <100 output tokens
   • These could use Haiku (5x cheaper) without quality loss
   • Example sessions: [list of IDs]

2. Enable Prompt Caching (Est. savings: $380/mo)
   • Current cache hit rate: 23%
   • You repeat similar prompts frequently
   • Potential to reach 65% cache hits
   • Setup guide: [link]

3. Batch Similar Requests (Est. savings: $200/mo)
   • You made 23 separate sessions for code reviews
   • Batching would reduce overhead by ~40%
   • Consider: Single session with multiple files

Total Potential Savings: $1,030/month (27% reduction)
```

#### Model Selection
```
📊 Model Recommendations:

Based on your usage patterns:

✓ OPTIMAL:
  • Code generation: Claude Sonnet (you're using optimally)
  • Quick Q&A: GLM-4 (good choice for cost/quality)

⚠️  CONSIDER CHANGING:
  • Documentation writing: Switch from Sonnet → Haiku
    → 5x cheaper, similar quality for this task
    → Est. savings: $125/mo
  
  • Data analysis: Try GPT-4o
    → Better at structured data tasks
    → Slightly more expensive but faster
    → May save time (cost neutral)

❌ NOT RECOMMENDED:
  • Using GLM-4 for complex reasoning (15 cases found)
    → Lower quality vs cost savings
    → Consider Sonnet for better results
```

#### Usage Patterns
```
📈 Usage Recommendations:

1. Rate Limit Risk (⚠️  HIGH)
   • You approached 200 prompts/5h limit on Oct 9
   • Peak usage: 9-11am (187 prompts)
   • Recommendation: Spread usage or upgrade tier

2. Session Management
   • Avg session: 18 minutes
   • 12 sessions exceeded 1 hour (possibly stuck)
   • Recommendation: Set timeouts, break large tasks

3. Cache Strategy
   • You're inconsistent with prompt caching
   • Enable for: System prompts, code reviews, documentation
   • Disable for: One-off queries, unique tasks
```

---

## 🎨 Phase 3: Enhanced Reporting (Medium Impact, Medium Effort)

### 3.1 HTML Reports with Charts
**Goal**: Rich visual reports for deeper analysis

**Features**:
- Interactive charts (Chart.js)
- Drill-down capabilities
- Export/share reports
- Responsive design

**Example Generation**:
```bash
droidusage report --html --output usage-report.html --since 2025-10-01
```

**Report Sections**:

1. **Executive Summary**
   - Total cost, tokens, sessions
   - Period-over-period comparison
   - Key trends and alerts

2. **Cost Analysis**
   - Cost over time (line chart)
   - Cost by model (pie chart)
   - Cost by hour (heatmap)
   - Daily cost trend (bar chart)

3. **Usage Patterns**
   - Sessions per day (line chart)
   - Peak hours (bar chart)
   - Model distribution (stacked bar)
   - Session duration distribution (histogram)

4. **Efficiency Metrics**
   - Cache hit rate over time
   - Tokens per prompt trend
   - Cost per prompt by model
   - Input/output ratio

5. **Top Sessions**
   - Most expensive sessions (table)
   - Longest sessions (table)
   - Highest token sessions (table)

6. **Recommendations**
   - Automated insights
   - Cost-saving opportunities
   - Optimization suggestions

**Tech Stack**:
- Template engine: Handlebars
- Charts: Chart.js
- Styling: Tailwind CSS
- Export: Puppeteer (for PDF)

---

### 3.2 Advanced Filtering & Querying
**Goal**: Powerful data exploration

**New Filter Options**:
```bash
# Filter by model
droidusage daily --model "claude-3-5-sonnet-20241022"
droidusage daily --models "gpt-4o,glm-4"

# Filter by provider
droidusage session --provider anthropic

# Filter by cost range
droidusage session --min-cost 10 --max-cost 100

# Filter by token range
droidusage session --min-tokens 1000000

# Filter by duration
droidusage session --min-duration 30m

# Complex queries
droidusage session --model sonnet --min-cost 50 --since 2025-10-01 \
  --sort cost --desc --limit 20

# Export filtered results
droidusage session --provider anthropic --json > anthropic-sessions.json
droidusage session --model glm-4 --csv > glm4-sessions.csv
```

**Implementation**:
```javascript
class QueryBuilder {
  constructor() {
    this.filters = [];
  }
  
  addFilter(field, operator, value) {
    this.filters.push({ field, operator, value });
    return this;
  }
  
  build() {
    return this.filters.reduce((query, filter) => {
      return query.where(filter.field, filter.operator, filter.value);
    }, baseQuery);
  }
}
```

---

### 3.3 Watch Mode & Live Monitoring
**Goal**: Real-time usage tracking

**Features**:
- Auto-refresh display
- Live cost updates
- Alert on high usage
- Session streaming

**Example**:
```bash
# Watch mode - updates every 5 seconds
droidusage watch

# Watch with custom interval
droidusage watch --interval 10s

# Watch with alerts
droidusage watch --alert-cost 100 --alert-tokens 1000000

# Output:
╔══════════════════════════════════════════════════╗
║  Live Usage Monitor (updates every 5s)           ║
╠══════════════════════════════════════════════════╣
║  Current Session: abc123de                       ║
║  Duration: 00:05:23                              ║
║  Tokens: 45,231 ↑                                ║
║  Cost: $2.45 ↑                                   ║
║                                                  ║
║  Today's Total:                                  ║
║  Sessions: 12                                    ║
║  Cost: $187.50 (62% of daily budget)            ║
║  Tokens: 4.2M                                    ║
║                                                  ║
║  Status: ✓ Normal                                ║
╚══════════════════════════════════════════════════╝

Last updated: 2025-10-09 14:32:45
Press Ctrl+C to exit
```

---

## 🔮 Phase 4: Advanced Features (High Impact, High Effort)

### 4.1 Budget Management
**Goal**: Stay within spending limits

**Features**:
- Set monthly/daily budgets
- Real-time budget tracking
- Alerts when approaching limits
- Automatic slowdown/pause
- Budget forecasting

**Commands**:
```bash
# Set budget
droidusage budget set --monthly 5000
droidusage budget set --daily 200

# Check budget status
droidusage budget status

# Output:
Budget Status (October 2025):
  Monthly Budget: $5,000
  Current Spend: $3,813.53 (76%)
  Remaining: $1,186.47
  Days Remaining: 22
  
  Daily Budget: $200
  Today's Spend: $187.50 (94%)
  Remaining: $12.50
  
  Projection:
  • At current rate: $5,720/month
  • ⚠️  Will exceed budget by $720 (14%)
  • Recommended daily limit: $165 (to stay within budget)
  
  Alerts:
  ✓ Email when 80% of budget used
  ✓ Slack notification when 90% used
  ⚠️  Pause API access when 100% used
```

**Implementation**:
```javascript
class BudgetManager {
  async checkBudget(currentSpend) {
    const budget = await this.loadBudget();
    const percentage = (currentSpend / budget.monthly) * 100;
    
    if (percentage >= 90) {
      await this.sendAlert('critical', percentage);
    } else if (percentage >= 80) {
      await this.sendAlert('warning', percentage);
    }
    
    if (percentage >= 100 && budget.enforceLimit) {
      throw new Error('Budget limit exceeded');
    }
  }
  
  async forecast() {
    const history = await this.getSpendingHistory();
    const trend = this.calculateTrend(history);
    return this.projectFutureSpend(trend);
  }
}
```

---

### 4.2 Multi-User / Team Analysis
**Goal**: Track usage across team members

**Features**:
- Per-user cost tracking
- Team aggregations
- User comparisons
- Shared budgets
- Cost allocation

**Example**:
```bash
droidusage team --report

# Output:
Team Usage Report (October 2025):

┌──────────────┬──────────┬─────────┬─────────────┬──────────┐
│ User         │ Sessions │ Tokens  │ Cost        │ % of Tot │
├──────────────┼──────────┼─────────┼─────────────┼──────────┤
│ alice        │ 145      │ 3.2B    │ $1,650      │ 43%      │
│ bob          │ 89       │ 1.8B    │ $950        │ 25%      │
│ charlie      │ 124      │ 2.3B    │ $1,213.53   │ 32%      │
├──────────────┼──────────┼─────────┼─────────────┼──────────┤
│ TOTAL        │ 358      │ 7.3B    │ $3,813.53   │ 100%     │
└──────────────┴──────────┴─────────┴─────────────┴──────────┘

Cost Efficiency:
  • alice: $11.38/session (highest - review usage)
  • bob: $10.67/session (most efficient)
  • charlie: $9.78/session (good efficiency)

Model Preferences:
  • alice: 80% Claude Sonnet (quality-focused)
  • bob: 60% GLM-4 (cost-conscious)
  • charlie: Mixed (balanced approach)
```

---

### 4.3 Cost Forecasting & Predictions
**Goal**: Predict future spending

**Features**:
- ML-based forecasting
- Seasonal pattern detection
- Trend analysis
- What-if scenarios
- Budget planning

**Example**:
```bash
droidusage forecast --days 30

# Output:
30-Day Cost Forecast:

Based on your usage patterns:

  Historical Average: $190/day
  Trending: ↑ +12% per week
  Seasonal Pattern: Detected (weekdays higher)
  
  Forecast:
  Week 1 (Oct 10-16): $1,450 ± $200
  Week 2 (Oct 17-23): $1,520 ± $220
  Week 3 (Oct 24-30): $1,590 ± $230
  Week 4 (Oct 31-Nov 6): $1,640 ± $240
  
  Total Predicted: $6,200 ± $890
  
  ⚠️  This exceeds your $5,000 monthly budget
  
  Recommendations:
  1. Reduce Sonnet usage by 20% → saves $450
  2. Enable caching → saves $380
  3. Switch to Haiku for simple tasks → saves $370
  
  With recommendations: $5,000 (within budget!)
```

---

## 📊 Implementation Roadmap

### Sprint 1 (Week 1-2): Quick Wins
- [x] Fix cost calculation bug
- [ ] Add trend indicators & comparisons
- [ ] Add ASCII sparklines
- [ ] Add top sessions command
- [ ] Add basic filtering (model, provider)

### Sprint 2 (Week 3-4): Analysis Modules
- [ ] Implement CostAnalyzer
- [ ] Implement PatternAnalyzer  
- [ ] Implement EfficiencyAnalyzer
- [ ] Implement AnomalyDetector
- [ ] Create AnalysisOrchestrator

### Sprint 3 (Week 5-6): Caching & Performance
- [ ] Design SQLite schema
- [ ] Implement CacheManager
- [ ] Add incremental updates
- [ ] Benchmark performance improvements
- [ ] Add cache management commands

### Sprint 4 (Week 7-8): Recommendations
- [ ] Build RecommendationEngine
- [ ] Add cost optimization rules
- [ ] Add model selection logic
- [ ] Add usage pattern insights
- [ ] Create comprehensive analyze command

### Sprint 5 (Week 9-10): Rich Reporting
- [ ] HTML report generator
- [ ] Chart.js integration
- [ ] CSV export
- [ ] Watch mode
- [ ] Advanced filtering

### Sprint 6 (Week 11-12): Advanced Features
- [ ] Budget management
- [ ] Forecasting engine
- [ ] Multi-user support
- [ ] Alert system
- [ ] Web dashboard (stretch)

---

## 🎯 Success Metrics

### Performance
- Query time: <0.1s (with cache) vs ~30s (current)
- **Target: 300x faster**

### User Value
- Actionable recommendations: 5+ per run
- Cost savings identified: >20% of spend
- Time to insights: <5 seconds

### Adoption
- User satisfaction: >4.5/5
- Daily active usage: Team using regularly
- Cost optimization: Users saving money

---

## 💻 Quick Start (After Improvements)

```bash
# Comprehensive analysis (new!)
droidusage analyze

# Daily usage with trends
droidusage daily --trends

# Find expensive sessions
droidusage top --by cost

# Get recommendations
droidusage recommend

# Live monitoring
droidusage watch

# HTML report
droidusage report --html

# Check budget
droidusage budget status
```

---

## 🤝 Contributing

Each improvement is designed as an independent module, making it easy to contribute:

1. Pick a module from the roadmap
2. Implement following the orchestrator pattern
3. Add tests
4. Submit PR with clear documentation

See individual module specs in `/docs/modules/` for detailed requirements.
