# PRD #0001: Droidusage Web Analytics Dashboard

## Introduction/Overview

This feature transforms droidusage from a CLI-only tool into a comprehensive analytics platform with both command-line and web-based interfaces. It adds trend analysis, specialized analysis modules (cost, patterns, efficiency), top sessions identification, and a professional web dashboard built with ShadCN Blocks Premium.

**Problem Statement:**
Individual developers using Factory AI's Droid need to:
1. Understand how their AI usage is changing over time (trending up/down)
2. Quickly identify expensive or unusual sessions that need attention
3. Get deep insights into cost optimization opportunities
4. Understand usage patterns and efficiency metrics
5. Visualize their usage data in an intuitive, interactive way

Currently, droidusage provides excellent terminal-based reports but lacks:
- Period-over-period comparisons
- Deep cost/efficiency analysis
- Visual data exploration
- Interactive filtering and drill-down capabilities

**Solution:**
Build a multi-phase enhancement that adds:
1. **Phase 1**: Trend analysis, top sessions identification, basic web UI
2. **Phase 2**: Specialized analysis modules (CostAnalyzer, PatternAnalyzer, EfficiencyAnalyzer)
3. **Phase 3**: Comprehensive web dashboard with ShadCN Blocks, advanced filtering, and rich visualizations

All while maintaining backward compatibility with existing CLI functionality.

---

## Goals

### Primary Goals
1. **Enable Period Comparisons**: Compare current usage against previous periods (day, week, month)
2. **Deep Analysis Capabilities**: Provide cost, pattern, and efficiency insights through specialized analyzers
3. **Surface High-Value Insights**: Automatically identify expensive, inefficient, or notable sessions
4. **Professional Web Interface**: Create a polished dashboard using ShadCN Blocks Premium
5. **Maintain CLI Excellence**: Keep all existing CLI functionality while adding web as optional enhancement

### Success Criteria
1. Users can identify cost optimization opportunities within 30 seconds
2. Web dashboard provides feature parity with CLI (and more)
3. Analysis runs in <5 seconds for 1000 sessions
4. >70% user adoption of web UI within first month
5. Zero breaking changes to existing functionality

---

## User Stories

### Core Analysis Stories

**US-1: Trend Analysis**  
**As a** developer tracking my AI costs  
**I want to** see how my usage has changed compared to last week/month  
**So that** I can understand if my spending is increasing and by how much

**Acceptance Criteria:**
- Run `droidusage daily --trends` to see period-over-period comparison
- See percentage changes with visual indicators (↑↓→)
- Compare day-over-day, week-over-week, or month-over-month
- Trends show: cost, tokens, sessions, and averages

**US-2: Top Sessions Identification**  
**As a** developer managing my AI budget  
**I want to** quickly see my most expensive sessions  
**So that** I can identify and optimize costly usage patterns

**Acceptance Criteria:**
- Run `droidusage top` to see top 10 most expensive sessions
- Sort by cost, tokens, duration, or efficiency
- See warnings for expensive sessions with recommendations
- Get actionable optimization suggestions

**US-3: Cost Analysis**  
**As a** developer optimizing spending  
**I want to** detailed cost breakdowns by model and provider  
**So that** I can understand where my money is going

**Acceptance Criteria:**
- Run `droidusage analyze --cost`
- See breakdown by model and provider
- See averages (per session, per prompt)
- See burn rate and projections

**US-4: Pattern Recognition**  
**As a** developer optimizing my workflow  
**I want to** understand when and how I use different AI models  
**So that** I can identify patterns and make informed decisions

**Acceptance Criteria:**
- Run `droidusage analyze --patterns`
- See peak usage hours and busiest days
- See model preference by time of day
- Identify usage spikes

**US-5: Efficiency Metrics**  
**As a** developer seeking value optimization  
**I want to** see efficiency metrics for each model  
**So that** I can choose the most cost-effective model

**Acceptance Criteria:**
- Run `droidusage analyze --efficiency`
- See cost per token/prompt for each model
- See cache utilization rates
- Get efficiency ratings (GOOD/FAIR/POOR)

### Web Interface Stories

**US-6: Web Dashboard**  
**As a** developer who prefers visual data  
**I want to** launch a web dashboard to explore my usage  
**So that** I can interact with charts and drill into details

**Acceptance Criteria:**
- Run `droidusage --web` to launch dashboard
- Browser opens automatically
- See same data as CLI with interactive charts
- Professional appearance using ShadCN Blocks
- Manual refresh button

**US-7: Interactive Charts**  
**As a** visual learner  
**I want to** interact with charts (hover, click, drill-down)  
**So that** I can explore my data intuitively

**Acceptance Criteria:**
- Hover shows detailed tooltips
- Click to filter/drill-down
- Charts are responsive
- Consistent colors and styling

**US-8: Advanced Filtering**  
**As a** power user  
**I want to** filter data by model, provider, date, cost, and tokens  
**So that** I can answer specific questions about usage

**Acceptance Criteria:**
- Filter by model (multi-select)
- Filter by provider (multi-select)
- Filter by date range
- Filter by cost/token ranges
- Filters persist across pages

---

## Functional Requirements

## Phase 1: Foundation - Trends, Top Sessions & Basic Web UI

### FR-1.1: Trend Analysis Engine
**Priority: HIGH**

1. System MUST calculate usage for current period vs previous equal period
   - Day: today vs yesterday
   - Week: this week vs last week
   - Month: this month vs last month

2. System MUST calculate percentage changes for:
   - Total cost
   - Total tokens (input, output, cache)
   - Session count
   - Average cost per session
   - Average tokens per session

3. System MUST display trend indicators:
   - `↑` for increases >5% (red)
   - `↓` for decreases >5% (green)
   - `→` for changes ≤5% (gray)

4. System MUST support `--trends` flag on existing commands:
   - `droidusage daily --trends`
   - `droidusage session --trends`
   - Works with all date filters

**Example Output:**
```
Trends (vs previous period):
  Cost: $3,804.97 ↑ +19.2%
  Tokens: 7,243,277,704 ↑ +18.1%
  Sessions: 200 ↓ -13.0%
  Avg Cost/Session: $19.02 ↑ +37.1%
```

### FR-1.2: Top Sessions Analysis
**Priority: HIGH**

1. System MUST implement `droidusage top` command:
   - `--by cost` (default): Sort by total cost
   - `--by tokens`: Sort by token count
   - `--by duration`: Sort by session duration
   - `--by inefficient`: Sort by efficiency score
   - `--limit N`: Show top N (default: 10)

2. System MUST calculate efficiency score per session:
   - Formula: `(output_tokens / cost) * cache_hit_ratio`
   - Status: GOOD (>threshold), FAIR, POOR
   - Color-coded display

3. System MUST flag notable sessions:
   - ⚠️  Very expensive: cost >$50
   - ⚠️  High tokens: >50M tokens
   - ⚠️  Long duration: >1 hour
   - ⚠️  Poor efficiency: bottom 10%

4. System MUST provide recommendations:
   - Break large sessions into smaller ones
   - Enable prompt caching
   - Switch to cost-effective models

**Example Output:**
```
Top 5 Sessions by Cost:
┌─────────────┬─────────────┬──────────┬───────────────┬──────────┬────────────┬─────────────────────────────┐
│ Session ID  │ Date        │ Model    │ Tokens        │ Cost     │ Efficiency │ Notes                       │
├─────────────┼─────────────┼──────────┼───────────────┼──────────┼────────────┼─────────────────────────────┤
│ f87e393c... │ 10-09 07:13 │ glm-4    │ 5,743,128,263 │ $2973.12 │ FAIR       │ ⚠️  Very expensive session  │
└─────────────┴─────────────┴──────────┴───────────────┴──────────┴────────────┴─────────────────────────────┘
```

### FR-1.3: Web Server Foundation
**Priority: HIGH**

1. System MUST implement Express.js server:
   - Standalone server (not embedded in CLI)
   - Localhost, random port 3000-3999
   - Graceful shutdown on exit

2. System MUST launch browser with `--web` flag:
   - Detect default browser
   - Auto-open to correct URL
   - Terminal message: "Opening web dashboard at http://localhost:3245"

3. System MUST use ShadCN Blocks Premium:
   - API key from environment: `SHADCNBLOCKS_API_KEY` (already set)
   - Dashboard blocks from premium library
   - Chart components from ShadCN UI (Recharts)

4. System MUST provide REST API endpoints:
   - `GET /api/daily?since=X&until=Y`
   - `GET /api/sessions?filters`
   - `GET /api/top?by=cost&limit=10`
   - `GET /api/trends?period=day|week|month`

5. Web UI MUST include:
   - Manual refresh button (no auto-refresh)
   - Last refreshed timestamp
   - Same data as CLI (exact match)

### FR-1.4: Basic Web Dashboard
**Priority: HIGH**

1. Dashboard MUST show executive summary:
   - Total cost (with trend if enabled)
   - Total tokens
   - Total sessions
   - Average cost/session
   - Active time
   - Cache hit rate

2. Dashboard MUST show overview charts:
   - Area chart: Cost over time
   - Pie chart: Cost by model
   - Bar chart: Sessions per day
   - Bar chart: Cost by provider

3. Dashboard MUST show top sessions:
   - Top 5 most expensive
   - Click to see details
   - Link to full top sessions page

---

## Phase 2: Specialized Analysis Modules

### FR-2.1: Analysis Architecture
**Priority: HIGH**

1. System MUST implement modular analyzer architecture:
   ```javascript
   class BaseAnalyzer {
     async analyze(sessions) { /* abstract */ }
     generateInsights() { /* abstract */ }
   }
   ```

2. System MUST implement AnalysisOrchestrator:
   - Run analyzers in parallel (Promise.all)
   - Configurable: which analyzers to run
   - Graceful failure handling
   - Reuse v1.2.0 cache optimizations

3. System MUST support selective execution:
   - `droidusage analyze` - all analyzers
   - `droidusage analyze --cost` - cost only
   - `droidusage analyze --patterns` - patterns only
   - `droidusage analyze --efficiency` - efficiency only
   - `droidusage analyze --cost --efficiency` - multiple

### FR-2.2: CostAnalyzer Module
**Priority: HIGH**

1. System MUST calculate:
   - Cost by model (breakdown, percentages)
   - Cost by provider (breakdown, percentages)
   - Average cost per session
   - Average cost per prompt
   - Burn rate (daily average, weekly/monthly projections)

2. System MUST display cost summary:
```
💰 Cost Analysis (Oct 1-9, 2025):

Total Spend: $3,813.53
Daily Average: $423.73
Weekly Projection: $2,966.08
Monthly Projection: $12,711.90

By Model:
┌─────────────────────────────┬───────────┬────────┬──────────────┐
│ Model                       │ Cost      │ % Total│ Avg/Session  │
├─────────────────────────────┼───────────┼────────┼──────────────┤
│ claude-3-5-sonnet-20241022  │ $2,100.00 │ 55.1%  │ $14.48       │
│ glm-4                       │ $1,500.00 │ 39.3%  │ $8.33        │
│ gpt-4o                      │ $213.53   │ 5.6%   │ $21.35       │
└─────────────────────────────┴───────────┴────────┴──────────────┘

By Provider:
• Anthropic: $2,100.00 (55.1%)
• GLM: $1,500.00 (39.3%)
• OpenAI: $213.53 (5.6%)
```

### FR-2.3: PatternAnalyzer Module
**Priority: HIGH**

1. System MUST identify:
   - Peak usage hours (top 3)
   - Busiest days of week (top 3)
   - Average session duration (mean, median, max)
   - Model preferences by time of day
   - Usage spikes (>2× average)

2. System MUST display pattern summary:
```
📊 Usage Patterns (Oct 1-9, 2025):

Peak Hours:
• 9-10am: 47 sessions (21.3% of daily usage)
• 2-3pm: 38 sessions (17.2%)
• 4-5pm: 29 sessions (13.1%)

Busiest Days:
• Tuesday: 68 sessions avg
• Thursday: 62 sessions avg
• Wednesday: 54 sessions avg

Session Duration:
• Average: 18 minutes
• Median: 12 minutes
• Longest: 4h 23m

Model Preferences by Time:
• Morning (6-12): 78% Sonnet, 22% GLM-4
• Afternoon (12-18): 52% Sonnet, 48% GLM-4
• Evening (18-24): 15% Sonnet, 85% GLM-4

💡 Insight: You shift to cheaper models in the evening
```

### FR-2.4: EfficiencyAnalyzer Module
**Priority: HIGH**

1. System MUST calculate:
   - Cost per token ($/M tokens by model)
   - Cost per prompt (by model)
   - Cache utilization rate (% cache hits)
   - Tokens per prompt average
   - Efficiency score (0-100 scale)
   - Value leaders (best metrics)

2. System MUST display efficiency summary:
```
⚡ Efficiency Metrics (Oct 1-9, 2025):

Cost Per Token:
┌─────────────────────────────┬──────────────┬──────────────┐
│ Model                       │ $/M Tokens   │ Rating       │
├─────────────────────────────┼──────────────┼──────────────┤
│ glm-4                       │ $0.52        │ GOOD ✓       │
│ claude-3-5-sonnet-20241022  │ $2.73        │ FAIR         │
│ gpt-4o                      │ $8.50        │ POOR         │
└─────────────────────────────┴──────────────┴──────────────┘

Cost Per Prompt:
• GLM-4: $8.33/prompt (best value)
• Claude Sonnet: $14.48/prompt
• GPT-4o: $21.35/prompt

Cache Utilization:
• Claude Sonnet: 28% cache hit rate
• GPT-4o: 12% cache hit rate
• GLM-4: N/A (no cache support)

💡 Potential savings with 60% cache rate: ~$380/month

Efficiency Scores (output per dollar):
• GLM-4: 87/100 (GOOD) - Best value for high volume
• Claude Sonnet: 62/100 (FAIR)
• GPT-4o: 34/100 (POOR) - Use for critical tasks only
```

### FR-2.5: Web UI - Analysis Pages
**Priority: HIGH**

1. System MUST add API endpoints:
   - `GET /api/analyze/cost`
   - `GET /api/analyze/patterns`
   - `GET /api/analyze/efficiency`
   - `GET /api/analyze/all`

2. Web UI MUST have dedicated pages:
   - Cost Analysis page (charts, tables, insights)
   - Usage Patterns page (temporal charts, model usage)
   - Efficiency Analysis page (comparisons, scores, recommendations)

---

## Phase 3: Comprehensive Web Dashboard

### FR-3.1: Advanced Filtering
**Priority: HIGH**

1. System MUST implement filter panel:
   - Slide-in panel from right side
   - Accessible from all pages
   - Keyboard shortcut support

2. Filter panel MUST include:
   - **Date Range**: Picker + quick select (today, 7d, 30d, month)
   - **Model**: Multi-select dropdown
   - **Provider**: Multi-select dropdown
   - **Cost Range**: Min/max inputs + slider
   - **Token Range**: Min/max inputs + slider
   - **Duration Range**: Min/max minutes

3. Filters MUST:
   - Apply to all charts and tables
   - Persist across page navigation
   - Save/load presets (localStorage)
   - Show active filter count
   - Support "Clear All" button

4. Filtering performance:
   - Client-side for <1000 sessions
   - Server-side for >1000 sessions
   - Debounced inputs (300ms)

### FR-3.2: Dashboard Layout & Navigation
**Priority: HIGH**

1. System MUST implement sidebar navigation:
   - 🏠 Dashboard (overview)
   - 💰 Cost Analysis
   - 📊 Usage Patterns
   - ⚡ Efficiency
   - 🔝 Top Sessions
   - 🔀 Model Comparison
   - 📈 Timeline
   - Active page highlighted
   - Collapsible sidebar

2. System MUST implement header bar:
   - Date range display
   - Active filters badge
   - Refresh button
   - Theme toggle (light/dark)
   - Help/docs link

3. Layout MUST be responsive:
   - Desktop: Full sidebar + content
   - Tablet: Collapsible sidebar
   - Loading states (skeleton loaders)

### FR-3.3: Cost Analysis Page
**Priority: HIGH**

1. Page MUST display:
   - Cost breakdown tables (by model, by provider)
   - Burn rate cards (daily avg, weekly/monthly projections)
   - Charts:
     - Line: Daily cost trend
     - Stacked bar: Cost by model over time
     - Pie: Cost distribution
   - Cost insights panel

2. Page MUST support drill-down:
   - Click model → filter to that model
   - Click time period → zoom into period
   - Click provider → filter to provider

### FR-3.4: Usage Patterns Page
**Priority: HIGH**

1. Page MUST display:
   - Bar chart: Sessions by hour
   - Bar chart: Sessions by day of week
   - Stacked bar: Model usage by time of day
   - Line chart: Sessions over time
   - Session duration histogram

2. Page MUST show pattern insights:
   - Peak hours (top 3)
   - Busiest days (top 3)
   - Usage spikes
   - Model preference patterns

### FR-3.5: Efficiency Analysis Page
**Priority: HIGH**

1. Page MUST display:
   - Comparison cards: Cost per token by model
   - Comparison cards: Cost per prompt by model
   - Gauge charts: Cache utilization rates
   - Table: Models ranked by efficiency score
   - Radar chart: Multi-metric comparison

2. Page MUST show:
   - Value leaders (badges)
   - Efficiency trend over time
   - Recommendations for optimization

### FR-3.6: Top Sessions Page
**Priority: HIGH**

1. Page MUST have controls:
   - Dropdown: Sort by (Cost, Tokens, Duration, Efficiency)
   - Input: Limit (default 10, max 100)
   - Apply button

2. Page MUST display:
   - Sortable table with all columns
   - Expandable rows for details
   - Efficiency badges (color-coded)
   - Warning icons for flags
   - Click session → modal with full details

3. Session details modal MUST show:
   - Full session ID
   - Complete metadata
   - Token breakdown
   - Cost breakdown
   - Activity timeline
   - Recommendations

### FR-3.7: Model Comparison Page
**Priority: MEDIUM**

1. Page MUST have:
   - Multi-select: Choose 2-4 models
   - Date range picker
   - Run comparison button

2. Page MUST display:
   - Side-by-side comparison cards
   - Bar charts: Cost and token comparison
   - Line chart: Usage over time (overlaid)
   - Radar chart: Multi-metric
   - Winner/loser badges

### FR-3.8: Timeline View
**Priority: MEDIUM**

1. Page MUST display:
   - Horizontal timeline with sessions
   - Color-coded by model or cost
   - Size-coded by cost or duration
   - Zoom controls (hour, day, week, month)

2. Timeline MUST support:
   - Hover: Session summary tooltip
   - Click: Session details modal
   - Drag: Select time range
   - Scroll: Navigate through time

### FR-3.9: Chart Requirements
**Priority: HIGH**

All charts MUST:
- Use ShadCN UI Charts (Recharts)
- Match ShadCN theme colors
- Show tooltips on hover
- Include legends for multi-series
- Be responsive to container width
- Support dark mode
- Format numbers properly (currency, abbreviated)

Chart types needed:
- Area charts (cost over time)
- Bar charts (comparisons, daily breakdown)
- Pie charts (distribution)
- Line charts (trends)
- Radar charts (multi-metric comparison)
- Histograms (duration distribution)
- Gauge charts (cache utilization)

---

## Non-Goals (Out of Scope)

1. **Real-time Updates**: No WebSocket/polling (manual refresh only)
2. **Export Functionality**: No PDF/CSV export (use CLI --json)
3. **User Authentication**: Single-user, no login/multi-user
4. **Database Persistence**: Parse from files on-demand
5. **Mobile App**: Web-only, desktop-first design
6. **Anomaly Detection**: Not in initial release (future phase)
7. **Budget Alerts**: No alert system (future Phase 4)
8. **Cost Forecasting**: No predictive analytics (future Phase 4)
9. **External Integrations**: No BI tools, Slack, etc.
10. **Custom Dashboards**: No user-configurable layouts
11. **Seasonal Trends**: Only day/week/month, no yearly comparison
12. **Machine Learning**: Simple statistics only, no ML patterns

---

## Design Considerations

### ShadCN Blocks Premium Integration

**Setup:**
```bash
# Environment variable (already set in user's shell)
export SHADCNBLOCKS_API_KEY=****************************************

# Initialize ShadCN
cd src/web/public
npx shadcn-ui@latest init

# Install required blocks
npx shadcn-ui@latest add dashboard card table chart dialog sidebar select calendar badge
```

**Components to use:**
- Dashboard layout blocks
- Stat cards
- Data tables with sorting
- Chart containers
- Filter panels
- Navigation sidebar
- Modal dialogs
- Toast notifications

**References:**
- https://www.shadcnblocks.com/
- https://ui.shadcn.com/charts
- https://ui.shadcn.com/docs

### UI/UX Guidelines

1. **Color Scheme**:
   - Increases: Red (`text-red-600`)
   - Decreases: Green (`text-green-600`)
   - Flat: Gray (`text-gray-600`)
   - Efficiency: Green (GOOD), Yellow (FAIR), Red (POOR)

2. **Typography**: Follow ShadCN standards

3. **Spacing**: Use ShadCN utility classes

4. **Responsive**: Desktop-first (1280px+), works on tablet

5. **Dark Mode**: Support theme toggle, persist preference

### CLI Output Format Examples

**Trend Display:**
```
Trends (vs previous period):
  Cost: $3,804.97 ↑ +19.2%
  Tokens: 7,243,277,704 ↑ +18.1%
  Sessions: 200 ↓ -13.0%
```

**Top Sessions Table:**
```
Top 5 Sessions by Cost:
┌─────────────┬─────────────┬──────────┬───────────────┬──────────┬────────────┬─────────────────────┐
│ Session ID  │ Date        │ Model    │ Tokens        │ Cost     │ Efficiency │ Notes               │
├─────────────┼─────────────┼──────────┼───────────────┼──────────┼────────────┼─────────────────────┤
│ f87e393c... │ 10-09 07:13 │ glm-4    │ 5,743,128,263 │ $2973.12 │ FAIR       │ ⚠️  Very expensive  │
└─────────────┴─────────────┴──────────┴───────────────┴──────────┴────────────┴─────────────────────┘
```

---

## Technical Considerations

### Architecture

```
droidusage/
├── src/
│   ├── analyzer.js              # Existing (enhanced)
│   ├── trends.js                # NEW: Trend calculation
│   ├── topSessions.js           # NEW: Top sessions analyzer
│   ├── analyzers/               # NEW: Analysis modules
│   │   ├── base.js              # BaseAnalyzer class
│   │   ├── cost.js              # CostAnalyzer
│   │   ├── patterns.js          # PatternAnalyzer
│   │   ├── efficiency.js        # EfficiencyAnalyzer
│   │   └── orchestrator.js      # AnalysisOrchestrator
│   ├── formatters/              # NEW: CLI formatters
│   │   ├── cost-cli.js
│   │   ├── patterns-cli.js
│   │   └── efficiency-cli.js
│   └── web/                     # NEW: Web server
│       ├── server.js            # Express server
│       ├── routes/
│       │   ├── api.js           # REST API
│       │   └── static.js        # Static files
│       └── public/
│           ├── index.html       # SPA entry
│           ├── css/
│           │   └── styles.css   # Compiled Tailwind
│           ├── js/
│           │   ├── app.js       # Main app
│           │   ├── charts.js    # Chart rendering
│           │   ├── filters.js   # Filter state
│           │   ├── api-client.js # API wrapper
│           │   └── components/  # Page components
│           └── lib/
│               └── utils.js     # Utilities
├── bin/
│   └── droidusage.js            # CLI (add flags)
└── package.json                 # Add dependencies
```

### Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "open": "^9.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

**Frontend (CDN):**
- Chart.js 4.x
- ShadCN UI components (via CLI)

### Performance Strategy

1. **Reuse v1.2.0 Optimizations**:
   - Log cache (parseAllSessionLogs)
   - Parallel batch processing
   - No redundant I/O

2. **Analysis Performance**:
   - Run analyzers in parallel (Promise.all)
   - Share parsed data across analyzers
   - Simple O(n) algorithms

3. **Web Performance**:
   - Load summary data first
   - Lazy-load charts
   - Cache API responses (5 min TTL)
   - Debounce filter inputs (300ms)
   - Limit chart data points (aggregate if >100 days)

### API Design

**Endpoint Format:**
```
GET /api/{resource}?filters
```

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-12T10:30:00Z",
    "filters": { ... },
    "count": 123
  }
}
```

**Query Parameters:**
- `since`, `until` (ISO date or relative: "7d")
- `model` (comma-separated)
- `provider` (comma-separated)
- `minCost`, `maxCost`
- `minTokens`, `maxTokens`
- `sort`, `order` (asc|desc)
- `limit`, `offset`

### Error Handling

**API Errors:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "Start date must be before end date"
  }
}
```

**UI Error Handling:**
- Toast notifications for errors
- Fallback UI when data unavailable
- Graceful degradation
- User-friendly error messages

---

## Success Metrics

### User Value Metrics
1. **Time to Insight**: Find expensive sessions in <30 seconds
2. **Cost Awareness**: Users can explain their AI spending after using tool
3. **Decision Making**: Users report choosing models more effectively
4. **Adoption**: >70% try web UI within first month
5. **Retention**: Users access web UI at least weekly

### Technical Metrics
1. **Performance**: Dashboard loads in <3s for 1000 sessions
2. **Analysis Speed**: All analyzers complete in <5s for 1000 sessions
3. **Accuracy**: Web UI matches CLI output exactly
4. **Reliability**: Server launches successfully 99%+ of time
5. **Coverage**: Test coverage >80%

### Quality Metrics
1. **Zero Regressions**: Existing CLI tests pass
2. **Compatibility**: Works on macOS, Linux, Windows (WSL)
3. **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
4. **Lighthouse**: >90 for Performance and Accessibility

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Trend Analysis & Top Sessions**
- [ ] Add trend calculation logic
- [ ] Implement `--trends` flag
- [ ] Create `droidusage top` command
- [ ] Add efficiency scoring
- [ ] Generate recommendations
- [ ] Write tests

**Basic Web UI**
- [ ] Set up Express server
- [ ] Implement REST API endpoints
- [ ] Add browser auto-launch
- [ ] Set up ShadCN Blocks
- [ ] Create basic dashboard layout
- [ ] Build summary cards and overview charts
- [ ] Add manual refresh

### Phase 2: Analysis Modules (Weeks 3-4)
- [ ] Create BaseAnalyzer and Orchestrator
- [ ] Implement CostAnalyzer
- [ ] Implement PatternAnalyzer
- [ ] Implement EfficiencyAnalyzer
- [ ] Add CLI formatters
- [ ] Create web API endpoints
- [ ] Build analysis pages in web UI
- [ ] Write unit tests

### Phase 3: Comprehensive Dashboard (Weeks 5-8)
**Advanced Web Features**
- [ ] Implement advanced filtering panel
- [ ] Build Cost Analysis page
- [ ] Build Usage Patterns page
- [ ] Build Efficiency Analysis page
- [ ] Build Top Sessions page (enhanced)
- [ ] Build Model Comparison page
- [ ] Build Timeline view
- [ ] Add all charts (Chart.js/Recharts)

**Polish & Testing**
- [ ] Responsive design testing
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Dark mode implementation
- [ ] Documentation and screenshots
- [ ] End-to-end testing
- [ ] Update README and CHANGELOG

---

## Acceptance Criteria

### Phase 1: CLI Enhancements
- ✅ `droidusage daily --trends` shows period comparison
- ✅ `droidusage top` shows top 10 most expensive sessions
- ✅ `droidusage top --by tokens --limit 5` works correctly
- ✅ Trend indicators display with percentages
- ✅ Efficiency scores calculated correctly
- ✅ Recommendations provided for expensive sessions

### Phase 1: Basic Web UI
- ✅ `droidusage --web` launches browser with dashboard
- ✅ Dashboard shows accurate data matching CLI
- ✅ Manual refresh updates data
- ✅ ShadCN Blocks Premium components used
- ✅ Charts render correctly
- ✅ Server shuts down gracefully

### Phase 2: Analysis Modules
- ✅ `droidusage analyze` runs all analyzers
- ✅ `droidusage analyze --cost` shows cost breakdown
- ✅ `droidusage analyze --patterns` shows usage patterns
- ✅ `droidusage analyze --efficiency` shows efficiency metrics
- ✅ All calculations accurate
- ✅ Analysis completes in <5s for 1000 sessions
- ✅ Web UI shows analysis results

### Phase 3: Comprehensive Dashboard
- ✅ All report pages functional (Cost, Patterns, Efficiency, etc.)
- ✅ Advanced filtering works correctly
- ✅ Filters persist across navigation
- ✅ All charts render with accurate data
- ✅ Interactive features work (hover, click, drill-down)
- ✅ Model comparison page functional
- ✅ Timeline view works correctly
- ✅ Dark mode works
- ✅ Responsive on desktop and tablet
- ✅ Keyboard navigation functional

### Technical
- ✅ All existing tests pass
- ✅ New tests with >80% coverage
- ✅ No breaking changes to existing API
- ✅ Performance targets met
- ✅ Documentation complete
- ✅ Works on all supported platforms

---

## Open Questions

1. **Q1**: Should filter presets be saved server-side or client-side?
   - **Recommendation**: Client-side (localStorage) for Phase 3, server-side later

2. **Q2**: Should charts have export/download capability?
   - **Recommendation**: Nice-to-have, not required for v1

3. **Q3**: Should web UI support URL-based sharing of filtered views?
   - **Recommendation**: Yes, encode filters in URL query params

4. **Q4**: What's the maximum date range to support?
   - **Recommendation**: 1 year; aggregate data for longer ranges

5. **Q5**: Should we implement keyboard shortcuts for navigation?
   - **Recommendation**: Yes, basic ones (Ctrl+F for filters, arrow keys for pages)

6. **Q6**: How should efficiency scoring normalization work?
   - **Recommendation**: Fixed scale initially, adaptive later

7. **Q7**: Should pattern analysis detect day-of-week patterns?
   - **Recommendation**: Yes, include in busiest days analysis

---

## Notes for Developers

### Getting Started

1. **Environment Setup**:
   - Ensure `SHADCNBLOCKS_API_KEY` is set (already in user's `.zshrc`)
   - Install dependencies: `npm install`

2. **Development Workflow**:
   ```bash
   # Start server with hot reload
   nodemon src/web/server.js
   
   # Build Tailwind CSS
   npx tailwindcss -i ./src/web/public/css/input.css -o ./src/web/public/css/styles.css --watch
   
   # Run tests
   npm test
   ```

3. **Initialize ShadCN**:
   ```bash
   cd src/web/public
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add dashboard card table chart dialog sidebar
   ```

### Code Style Guidelines

- Use arrow functions: `const analyze = () => { ... }`
- Keep functions under 20 lines
- Use descriptive names: `totalCost` not `tc`
- Add JSDoc comments for public methods
- Early returns over nesting
- Use Array methods: map(), reduce(), filter()

### Testing Strategy

1. **Unit Tests**: Each analyzer and calculation function
2. **Integration Tests**: API endpoints with sample data
3. **E2E Tests**: Full CLI commands with flags
4. **Manual Testing**: Visual verification of charts

### Resources

- ShadCN Blocks: https://www.shadcnblocks.com/
- ShadCN UI: https://ui.shadcn.com/
- Chart.js: https://www.chartjs.org/
- Recharts: https://recharts.org/
- Express.js: https://expressjs.com/

---

## Target Audience

**Primary Users**: Individual developers tracking their personal AI usage through Factory AI's Droid.

The PRD is written for a **junior developer** audience, with:
- Clear, explicit requirements
- Example code snippets
- Step-by-step guidance
- Detailed acceptance criteria
- Links to relevant documentation

---

**Version**: 1.0  
**Status**: Ready for Development  
**Total Estimated Effort**: 8 weeks  
**Priority**: HIGH  
**Dependencies**: Existing droidusage v1.2.0
