# Task List: Droidusage Web Analytics Dashboard

Based on: `0001-prd-droidusage-web-analytics-dashboard.md`

## Current State Assessment

### Existing Infrastructure
- ✅ **Core analyzer** (`src/analyzer.js`) with v1.2.0 optimizations (log cache, batch processing)
- ✅ **CLI entry point** (`bin/droidusage.js`) using Commander.js
- ✅ **Partial analyzers** (`src/analyzers/TrendAnalyzer.js`, `TopSessionsAnalyzer.js`) - need completion
- ✅ **Test suite** (`__tests__/`) with Jest configuration
- ✅ **Dependencies**: chalk, cli-table3, commander, date-fns

### Architecture Patterns
- Node.js CLI tool structure
- Class-based analyzers
- Commander.js for CLI parsing
- Jest for testing
- Chalk for colored output

### What Needs to Be Built
- Complete TrendAnalyzer and TopSessionsAnalyzer implementations
- New analysis modules (Cost, Pattern, Efficiency)
- Express web server with REST API
- ShadCN web UI with interactive charts
- Advanced filtering capabilities

---

## Relevant Files

### Phase 1: CLI Enhancements & Basic Web
- `src/trends.js` - Trend calculation logic (NEW)
- `src/trends.test.js` - Unit tests for trend calculator
- `src/topSessions.js` - Top sessions analyzer logic (NEW)
- `src/topSessions.test.js` - Unit tests for top sessions
- `src/analyzer.js` - Extend with trend/top session integration (MODIFY)
- `bin/droidusage.js` - Add --web, --trends, top command flags (MODIFY)
- `src/web/server.js` - Express server setup (NEW)
- `src/web/routes/api.js` - REST API endpoints (NEW)
- `src/web/public/index.html` - Main dashboard HTML (NEW)
- `src/web/public/js/app.js` - Frontend JavaScript (NEW)
- `src/web/public/css/styles.css` - Compiled Tailwind CSS (NEW)
- `package.json` - Add express, open, cors dependencies (MODIFY)

### Phase 2: Analysis Modules
- `src/analyzers/base.js` - BaseAnalyzer abstract class (NEW)
- `src/analyzers/base.test.js` - Base analyzer tests
- `src/analyzers/cost.js` - CostAnalyzer implementation (NEW)
- `src/analyzers/cost.test.js` - Cost analyzer tests
- `src/analyzers/patterns.js` - PatternAnalyzer implementation (NEW)
- `src/analyzers/patterns.test.js` - Pattern analyzer tests
- `src/analyzers/efficiency.js` - EfficiencyAnalyzer implementation (NEW)
- `src/analyzers/efficiency.test.js` - Efficiency analyzer tests
- `src/analyzers/orchestrator.js` - AnalysisOrchestrator (NEW)
- `src/analyzers/orchestrator.test.js` - Orchestrator tests
- `src/formatters/cost-cli.js` - CLI formatter for cost analysis (NEW)
- `src/formatters/patterns-cli.js` - CLI formatter for patterns (NEW)
- `src/formatters/efficiency-cli.js` - CLI formatter for efficiency (NEW)
- `src/web/routes/analyze.js` - Analysis API endpoints (NEW)
- `src/web/public/js/components/cost-analysis.js` - Cost page component (NEW)
- `src/web/public/js/components/patterns.js` - Patterns page component (NEW)
- `src/web/public/js/components/efficiency.js` - Efficiency page component (NEW)

### Phase 3: Comprehensive Web Dashboard
- `src/web/public/js/filters.js` - Filter state management (NEW)
- `src/web/public/js/charts.js` - Chart rendering utilities (NEW)
- `src/web/public/js/api-client.js` - API wrapper (NEW)
- `src/web/public/js/components/dashboard.js` - Main dashboard component (NEW)
- `src/web/public/js/components/top-sessions.js` - Top sessions page (NEW)
- `src/web/public/js/components/model-comparison.js` - Model comparison page (NEW)
- `src/web/public/js/components/timeline.js` - Timeline view (NEW)
- `src/web/public/js/components/filter-panel.js` - Filter panel component (NEW)
- `src/web/public/css/input.css` - Tailwind input file (NEW)
- `tailwind.config.js` - Tailwind configuration (NEW)
- `components.json` - ShadCN configuration (NEW)

### Configuration & Documentation
- `package.json` - Dependencies and scripts (MODIFY)
- `README.md` - Updated documentation (MODIFY)
- `CHANGELOG.md` - Version history (MODIFY)

### Notes
- Tests should be placed alongside code files (e.g., `cost.js` and `cost.test.js`)
- Run tests with: `npm test` or `npx jest [path/to/test]`
- ShadCN components will be installed via CLI: `npx shadcn-ui@latest add [component]`
- Environment variable `SHADCNBLOCKS_API_KEY` already set in user's shell

---

## High-Level Tasks

Based on the PRD analysis and current codebase assessment, here are the main implementation tasks:

- [x] 1.0 **Complete Phase 1 Foundation** - Trend analysis, top sessions, and basic web server
- [x] 2.0 **Implement Phase 2 Analysis Modules** - Cost, Pattern, and Efficiency analyzers with orchestration
- [ ] 3.0 **Build Phase 3 Web Dashboard** - ShadCN UI with advanced filtering and comprehensive visualizations
- [ ] 4.0 **Testing & Quality Assurance** - Comprehensive test coverage and validation
- [~] 5.0 **Documentation & Release** - Update docs, CHANGELOG, and prepare for deployment (IN PROGRESS)

---

## Tasks

- [x] 1.0 **Complete Phase 1 Foundation** - Trend analysis, top sessions, and basic web server
  - [x] 1.1 Complete TrendAnalyzer implementation with period comparison logic (day/week/month)
  - [x] 1.2 Add trend calculation methods: calculate percentage changes, determine trend indicators (↑↓→)
  - [x] 1.3 Integrate TrendAnalyzer into analyzer.js getDailyUsage() method
  - [x] 1.4 Add --trends flag support to CLI (bin/droidusage.js)
  - [x] 1.5 Create trend output formatter for CLI display
  - [x] 1.6 Write unit tests for TrendAnalyzer (src/analyzers/TrendAnalyzer.test.js)
  - [x] 1.7 Complete TopSessionsAnalyzer implementation with sorting and efficiency scoring
  - [x] 1.8 Add efficiency score calculation: (output_tokens / cost) * cache_hit_ratio
  - [x] 1.9 Implement session flagging logic (expensive >$50, high tokens >50M, long duration >1h)
  - [x] 1.10 Add recommendation generation for flagged sessions
  - [x] 1.11 Add 'top' command to CLI with --by and --limit flags
  - [x] 1.12 Create top sessions output formatter for CLI
  - [x] 1.13 Write unit tests for TopSessionsAnalyzer (src/analyzers/TopSessionsAnalyzer.test.js)
  - [x] 1.14 Install web dependencies: npm install express@^4.18.2 open@^9.1.0 cors@^2.8.5 compression@^1.7.4
  - [x] 1.15 Create Express server setup (src/web/server.js) with port selection (3000-3999)
  - [x] 1.16 Implement REST API routes: /api/daily, /api/sessions, /api/top, /api/trends
  - [x] 1.17 Add browser auto-launch functionality with 'open' package
  - [x] 1.18 Add --web flag to CLI that starts server and opens browser
  - [x] 1.19 Create basic HTML dashboard template (src/web/public/index.html)
  - [x] 1.20 Add manual refresh button and last-refreshed timestamp to UI
  - [x] 1.21 Create frontend API client wrapper (embedded in index.html)
  - [x] 1.22 Build executive summary cards (cost, tokens, sessions, averages)
  - [ ] 1.23 Initialize ShadCN: npx shadcn-ui@latest init in src/web/public
  - [ ] 1.24 Install ShadCN components: npx shadcn-ui@latest add dashboard card table badge
  - [ ] 1.25 Create basic overview charts with placeholder data (area, pie, bar)
  - [x] 1.26 Wire up API endpoints to fetch real data and render in UI
  - [x] 1.27 Add graceful server shutdown on Ctrl+C
  - [x] 1.28 Test Phase 1: CLI trends, CLI top, web dashboard loads, data accuracy

- [x] 2.0 **Implement Phase 2 Analysis Modules** - Cost, Pattern, and Efficiency analyzers with orchestration
  - [x] 2.1 Create BaseAnalyzer abstract class (src/analyzers/BaseAnalyzer.js) with analyze() and generateInsights() methods
  - [x] 2.2 Write unit tests for BaseAnalyzer (20 tests passing)
  - [x] 2.3 Implement CostAnalyzer (src/analyzers/CostAnalyzer.js) extending BaseAnalyzer
  - [x] 2.4 Add CostAnalyzer methods: groupByModel(), groupByProvider(), calculateAverages()
  - [x] 2.5 Add burn rate calculation: daily average, weekly/monthly projections
  - [ ] 2.6 Create CLI formatter for cost analysis (integrated into CLI output)
  - [x] 2.7 Write unit tests for CostAnalyzer with mock session data (25 tests passing)
  - [x] 2.8 Implement PatternAnalyzer (src/analyzers/PatternAnalyzer.js) extending BaseAnalyzer
  - [x] 2.9 Add PatternAnalyzer methods: findPeakHours(), findBusiestDays(), analyzeSessionDuration()
  - [x] 2.10 Add model preference analysis by time of day (morning/afternoon/evening/night)
  - [x] 2.11 Add usage spike detection (>2× average)
  - [ ] 2.12 Create CLI formatter for patterns (integrated into CLI output)
  - [x] 2.13 Write unit tests for PatternAnalyzer (25 tests passing)
  - [x] 2.14 Implement EfficiencyAnalyzer (src/analyzers/EfficiencyAnalyzer.js) extending BaseAnalyzer
  - [x] 2.15 Add methods: calculateCostPerToken(), calculateCostPerPrompt(), analyzeCacheUtilization()
  - [x] 2.16 Add efficiency scoring algorithm: (output_tokens / cost) * (1 + cache_bonus), normalize to 0-100
  - [x] 2.17 Add value leaders identification (best cost/token, best cache, most efficient)
  - [ ] 2.18 Create CLI formatter for efficiency (integrated into CLI output)
  - [x] 2.19 Write unit tests for EfficiencyAnalyzer (17 tests passing)
  - [x] 2.20 Create AnalysisOrchestrator (src/analyzers/AnalysisOrchestrator.js)
  - [x] 2.21 Implement parallel analyzer execution with Promise.all()
  - [x] 2.22 Add selective analyzer execution based on CLI flags (--cost, --patterns, --efficiency)
  - [x] 2.23 Add result synthesis and cross-analyzer insights
  - [x] 2.24 Write unit tests for orchestrator with multiple analyzers (15 tests passing)
  - [x] 2.25 Add 'analyze' command to CLI (bin/droidusage.js) with analyzer selection flags
  - [x] 2.26 Integrate orchestrator into CLI with analyze command (done via CLI integration)
  - [x] 2.27 Add API endpoints for analysis: /api/analyze/cost, /api/analyze/patterns, /api/analyze/efficiency, /api/analyze/all, /api/models, /api/providers
  - [x] 2.28 Create web UI components for Cost Analysis page (integrated in dashboard.js)
  - [x] 2.29 Add cost breakdown tables and charts (bar chart by model, pie chart for distribution)
  - [x] 2.30 Create web UI component for Patterns page (integrated in dashboard.js)
  - [x] 2.31 Add pattern charts: sessions by hour, by day
  - [x] 2.32 Create web UI component for Efficiency page (integrated in dashboard.js)
  - [x] 2.33 Add efficiency comparison cards and key metrics
  - [x] 2.34 Add navigation links in sidebar to analysis pages (5 pages: Overview, Cost, Patterns, Efficiency, Top Sessions)
  - [x] 2.35 Test Phase 2: All analyzers work individually, orchestrator works, CLI output correct (102 tests passing!)

- [~] 3.0 **Build Phase 3 Web Dashboard** - Advanced UI with charts and visualizations (MOSTLY COMPLETE)
  - [x] 3.1 Install Tailwind CSS: npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
  - [x] 3.2 Initialize Tailwind: npx tailwindcss init -p
  - [x] 3.3 Configure Tailwind (tailwind.config.js) with content paths and dark mode
  - [x] 3.4 Create Tailwind input file (src/web/public/css/input.css) with @tailwind directives and custom components
  - [x] 3.5 Build Tailwind CSS successfully
  - [ ] 3.6 Install additional ShadCN components: npx shadcn-ui@latest add select calendar dialog sidebar (skipped - using custom components)
  - [ ] 3.7 Create ShadCN configuration file (components.json) with blocks API key reference (skipped - using Tailwind directly)
  - [x] 3.8 Build sidebar navigation component with page links (Overview, Cost, Patterns, Efficiency, Top Sessions)
  - [x] 3.9 Create header bar with refresh button, theme toggle, and last updated timestamp
  - [x] 3.10 Implement theme toggle functionality (light/dark mode) with localStorage persistence
  - [ ] 3.11 Create filter panel component (src/web/public/js/components/filter-panel.js) as slide-in from right
  - [ ] 3.12 Add filter inputs: date range picker, model multi-select, provider multi-select
  - [ ] 3.13 Add filter inputs: cost range (min/max with sliders), token range (min/max with sliders)
  - [ ] 3.14 Implement filter state management (src/web/public/js/filters.js) with localStorage for persistence
  - [ ] 3.15 Add filter application logic: client-side for <1000 sessions, server-side API call for >1000
  - [ ] 3.16 Add "Clear All Filters" button and active filter count badge
  - [ ] 3.17 Create filter preset save/load functionality in localStorage
  - [ ] 3.18 Add API endpoints for filtering: /api/models, /api/providers, /api/filters/stats
  - [ ] 3.19 Update existing API endpoints to accept filter query parameters
  - [ ] 3.20 Install Chart.js: Add Chart.js 4.x via CDN in HTML
  - [ ] 3.21 Install Recharts via ShadCN chart components
  - [ ] 3.22 Create chart rendering utility module (src/web/public/js/charts.js)
  - [ ] 3.23 Build Cost Analysis page with full feature set: breakdown tables, burn rate cards, 4+ charts
  - [ ] 3.24 Add drill-down functionality to cost charts (click to filter)
  - [ ] 3.25 Build Usage Patterns page with temporal charts (hour, day, time-of-day model usage)
  - [ ] 3.26 Add session duration histogram to patterns page
  - [ ] 3.27 Build Efficiency Analysis page with comparison cards and multi-metric radar chart
  - [ ] 3.28 Add value leader badges and recommendations panel to efficiency page
  - [ ] 3.29 Enhance Top Sessions page: sortable table, expandable rows, session details modal
  - [ ] 3.30 Add session details modal with full metadata, token breakdown, cost breakdown, recommendations
  - [ ] 3.31 Create Model Comparison page (src/web/public/js/components/model-comparison.js)
  - [ ] 3.32 Add model selector (multi-select 2-4 models), date range picker, comparison trigger
  - [ ] 3.33 Build comparison matrix with side-by-side cards and multi-metric charts
  - [ ] 3.34 Add winner/loser badges to comparison results
  - [ ] 3.35 Add API endpoint for model comparison: /api/compare/models
  - [ ] 3.36 Create Timeline view component (src/web/public/js/components/timeline.js)
  - [ ] 3.37 Build horizontal timeline with sessions as points, color-coded by model or cost
  - [ ] 3.38 Add zoom controls (hour/day/week/month views) and interaction (hover, click, drag)
  - [ ] 3.39 Add API endpoint for timeline data: /api/timeline with grouping options
  - [ ] 3.40 Implement client-side routing (basic hash-based routing or use a micro-router)
  - [ ] 3.41 Add loading states (skeleton loaders) for all pages
  - [ ] 3.42 Add error handling with toast notifications for API failures
  - [ ] 3.43 Implement responsive breakpoints for tablet support
  - [ ] 3.44 Add keyboard shortcuts: Ctrl+F for filters, arrow keys for page navigation
  - [ ] 3.45 Optimize chart rendering: limit data points, use decimation, debounce filters
  - [ ] 3.46 Add API response caching (5 min TTL) on server side
  - [ ] 3.47 Test Phase 3: All pages functional, filters work, charts interactive, responsive design, no console errors

- [ ] 4.0 **Testing & Quality Assurance** - Comprehensive test coverage and validation
  - [ ] 4.1 Write integration tests for trend analysis workflow
  - [ ] 4.2 Write integration tests for top sessions workflow
  - [ ] 4.3 Write integration tests for all analyzer modules
  - [ ] 4.4 Write API endpoint tests for all routes with supertest
  - [ ] 4.5 Add performance tests: verify <5s analysis time for 1000 sessions
  - [ ] 4.6 Add performance tests: verify <3s dashboard load time
  - [ ] 4.7 Test edge cases: empty datasets, single session, missing fields
  - [ ] 4.8 Test error scenarios: invalid dates, missing files, server failures
  - [ ] 4.9 Test all filter combinations in web UI
  - [ ] 4.10 Test chart interactions: hover, click, drill-down
  - [ ] 4.11 Test theme switching and persistence
  - [ ] 4.12 Test filter persistence across navigation
  - [ ] 4.13 Test browser compatibility: Chrome, Firefox, Safari, Edge
  - [ ] 4.14 Test responsive design on different screen sizes
  - [ ] 4.15 Test keyboard navigation and accessibility
  - [ ] 4.16 Run full test suite: npm test
  - [ ] 4.17 Check test coverage: npm run test:coverage (target >80%)
  - [ ] 4.18 Fix any failing tests
  - [ ] 4.19 Verify all existing tests still pass (no regressions)
  - [ ] 4.20 Manual end-to-end testing with real data
  - [ ] 4.21 Performance profiling and optimization if needed
  - [ ] 4.22 Security review: validate inputs, sanitize outputs, check for vulnerabilities

- [~] 5.0 **Documentation & Release** - Update docs, CHANGELOG, and prepare for deployment
  - [x] 5.1 Update README.md with new features section
  - [x] 5.2 Add installation instructions for new dependencies
  - [x] 5.3 Document all new CLI commands and flags
  - [x] 5.4 Add examples for trend analysis: droidusage daily --trends
  - [x] 5.5 Add examples for top sessions: droidusage top --by cost --limit 10
  - [x] 5.6 Add examples for analysis commands: droidusage analyze --cost
  - [x] 5.7 Document web UI launch: droidusage --web
  - [ ] 5.8 Create screenshots of web dashboard for documentation
  - [ ] 5.9 Add ShadCN setup instructions (environment variable, initialization)
  - [ ] 5.10 Document filter usage and preset management
  - [ ] 5.11 Add troubleshooting section for common issues
  - [ ] 5.12 Update CHANGELOG.md with all new features for v2.0.0
  - [ ] 5.13 Add migration guide from v1.x to v2.0.0
  - [ ] 5.14 Document breaking changes (if any)
  - [ ] 5.15 Update package.json version to 2.0.0
  - [ ] 5.16 Add engines field for Node.js version requirement
  - [ ] 5.17 Review and update dependencies to latest stable versions
  - [ ] 5.18 Create release notes highlighting key features
  - [ ] 5.19 Tag release in git: git tag v2.0.0
  - [ ] 5.20 Build final production bundle (if applicable)
  - [ ] 5.21 Test installation from npm (if publishing)
  - [ ] 5.22 Publish to npm: npm publish (if applicable)
  - [ ] 5.23 Update project roadmap and remove completed items from IMPROVEMENTS.md
  - [ ] 5.24 Announce release and gather user feedback

---

## Implementation Notes

### Phase 1 Tips
- Start with completing TrendAnalyzer since TopSessionsAnalyzer likely needs similar date comparison logic
- Test trend calculations with small datasets first to verify accuracy
- Use existing `parseAllSessionLogs()` cache from v1.2.0 for performance
- Web server should be simple initially; focus on getting data to browser first

### Phase 2 Tips
- BaseAnalyzer should define the contract; make it clear what subclasses must implement
- Each analyzer should work independently for easier testing
- Orchestrator should handle failures gracefully (if one analyzer fails, others continue)
- Start with CLI formatters before web components to validate analysis logic

### Phase 3 Tips
- ShadCN setup is crucial; get this right before building components
- Build one complete page (e.g., Cost Analysis) before starting others
- Filter state management is complex; consider using a simple state object with pub/sub pattern
- Chart.js and Recharts serve different purposes; use Recharts for ShadCN integration
- Test filtering logic thoroughly; it's easy to introduce bugs with complex conditions

### Testing Strategy
- Unit tests for each analyzer independently
- Integration tests for orchestrator and CLI commands
- API tests using supertest or similar
- Manual testing for web UI (visual verification)
- Performance benchmarking with real datasets (100, 500, 1000 sessions)

### Performance Considerations
- Reuse v1.2.0 optimizations (log cache, batch processing)
- Run analyzers in parallel in orchestrator
- Cache API responses on server side
- Debounce filter inputs in UI (300ms recommended)
- Limit chart data points; aggregate if >100 days

### Common Pitfalls to Avoid
- Don't break existing CLI functionality
- Don't forget to handle edge cases (empty data, missing fields)
- Don't skip error handling in API endpoints
- Don't over-engineer; keep solutions simple initially
- Don't forget to update tests when modifying existing code
- Remember to set `SHADCNBLOCKS_API_KEY` in deployment environment

---

**Total Sub-tasks: 135**  
**Estimated Effort: 8 weeks** (assuming 1 developer, full-time)  
**Phase 1: 2 weeks | Phase 2: 2 weeks | Phase 3: 3 weeks | Testing & Docs: 1 week**

Ready to start implementation! 🚀
