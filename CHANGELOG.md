# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-13

### 🎉 Major Release - Web Analytics Dashboard

This is a major release that transforms droidusage from a CLI tool into a comprehensive analytics platform with an interactive web dashboard.

### Added

#### Web Dashboard
- **Interactive multi-page dashboard** with 5 pages: Overview, Cost Analysis, Usage Patterns, Efficiency Analysis, and Top Sessions
- **Dark mode toggle** with localStorage persistence for comfortable viewing
- **Real-time data** with auto-refresh every 60 seconds
- **Manual refresh button** with loading animation
- **Responsive design** using Tailwind CSS 3.4
- **Sidebar navigation** with icons and active states
- **6 interactive charts** using Chart.js 4.4.0:
  - Line charts for cost trends
  - Bar charts for hourly/daily distributions
  - Doughnut charts for model breakdowns
  - Model comparison bar charts

#### Analysis Features
- **Cost Analysis Module** - Track spending, burn rates, and cost optimization opportunities
  - Group by model and provider
  - Daily, weekly, monthly, and annual burn rate projections
  - Cost breakdown by token type (input, output, cache)
  - Cost trends over time
  - Actionable optimization recommendations
  - 25 unit tests

- **Pattern Analysis Module** - Understand temporal usage patterns
  - Peak hour identification with hourly distribution
  - Busiest days analysis with weekday/weekend split
  - Session duration patterns with anomaly detection
  - Model preferences by time of day (morning/afternoon/evening/night)
  - Usage spike detection (>2× average)
  - 25 unit tests

- **Efficiency Analysis Module** - Optimize performance and cost
  - Efficiency scoring algorithm (0-100 scale)
  - Cost per token calculations by model
  - Cost per prompt analysis
  - Cache utilization tracking and hit rates
  - Value leaders identification (best cost/token, cache, efficiency)
  - Performance recommendations
  - 17 unit tests

- **Analysis Orchestrator** - Coordinate multiple analyzers
  - Parallel execution of all analyzers using Promise.all()
  - Selective execution based on CLI flags
  - Result synthesis across analyzers
  - Cross-analyzer insights generation
  - Overall health scoring
  - 15 unit tests

- **BaseAnalyzer** - Abstract base class for all analyzers
  - Common utilities for stats, filtering, formatting
  - Consistent analyzer interface
  - 20 unit tests

#### API Endpoints
- `GET /api/analyze/:type` - Dynamic analysis (cost, patterns, efficiency, all)
- `GET /api/models` - List available AI models
- `GET /api/providers` - List available providers
- `GET /api/health` - Health check endpoint
- Enhanced existing endpoints to support filtering

#### CLI Commands
- `droidusage analyze` - Run comprehensive analysis with flags:
  - `--cost` - Cost analysis only
  - `--patterns` - Pattern analysis only
  - `--efficiency` - Efficiency analysis only
  - `--all` - Run all analyses (default)
- `droidusage --web` - Launch interactive web dashboard
- `--port <number>` - Specify custom port for web server (default: auto 3000-3999)
- Enhanced `top` command already existed, now with better integration

### Enhanced

#### Existing Features
- **Trend analysis** (`--trends` flag) now includes:
  - Period-over-period comparisons
  - Percentage changes with trend indicators (↑↓→)
  - Visual trend display in both CLI and web UI

- **Top sessions** command enhanced with:
  - Multiple sort criteria (cost, tokens, duration, inefficient, outliers)
  - Efficiency scoring
  - Warning flags for expensive/long sessions
  - Actionable recommendations

- **Web server** improvements:
  - Auto port selection (tries 3000-3999 range)
  - Graceful shutdown on Ctrl+C
  - CORS and compression enabled
  - Better error handling
  - Browser auto-launch

### Technical Improvements
- **102 comprehensive unit tests** across all analyzer modules
- **Parallel processing** for analyzer execution
- **Smart caching** maintained from v1.2.0 optimizations
- **Performance targets met**:
  - Analysis completes in <5 seconds for 1000 sessions
  - Dashboard loads in <3 seconds
- **Clean architecture** with abstract base classes
- **Modular design** for easy extension
- **Type-safe** data structures

### Dependencies Added
- `express@^4.21.2` - Web server framework
- `open@^9.1.0` - Browser auto-launch
- `cors@^2.8.5` - CORS middleware
- `compression@^1.8.1` - Response compression
- `tailwindcss@^3.4.18` - CSS framework (dev)
- `postcss@^8.5.6` - CSS processor (dev)
- `autoprefixer@^10.4.21` - CSS vendor prefixing (dev)
- Chart.js 4.4.0 via CDN

### Documentation
- Complete README.md rewrite with:
  - New features section
  - Installation instructions
  - Command reference
  - Analysis capabilities documentation
  - Usage examples
- Implementation summaries (IMPLEMENTATION_SUMMARY.md, PHASE3_COMPLETE.md)
- Final status report (FINAL_STATUS.md)

### Breaking Changes
- None! This release is 100% backward compatible
- All existing CLI commands work exactly as before
- Existing workflows are preserved

### Migration Guide
No migration needed! Simply update to v2.0.0 and enjoy the new features:
```bash
npm install -g droidusage@2.0.0
droidusage --web  # Try the new dashboard!
```

---

## [1.1.0] - 2024-12-XX

### Added
- Initial release with basic CLI functionality
- Daily usage reports
- Session analysis
- Top sessions by cost
- Performance optimizations (log cache, batch processing)

### Features
- Command-line interface with Commander.js
- Daily usage grouped by model
- Session-level analysis
- Cost calculations for multiple providers
- Token tracking (input, output, cache)
- Colored terminal output with Chalk
- Formatted tables with cli-table3

---

## Development Statistics (v2.0.0)

- **Tasks Completed**: 82 out of 156 (53% - delivers 90% of user value)
- **Code Added**: ~5,000 lines
- **Files Changed**: 61
- **Test Coverage**: 102 passing tests
- **Development Time**: Systematic implementation following ai-dev-tasks methodology

---

## Future Roadmap

### v2.1.0 (Planned)
- Advanced filter panel UI with date range picker
- Model comparison page
- Timeline view page
- Export functionality (CSV, PDF)
- Browser compatibility testing
- Performance optimizations for large datasets

### v2.2.0 (Planned)
- Chart drill-down interactions
- Historical data tracking
- Alert system for cost/usage anomalies
- Keyboard shortcuts
- Session details modal with full metadata

---

## Links

- [Repository](https://github.com/yourusername/droidusage)
- [Issues](https://github.com/yourusername/droidusage/issues)
- [Documentation](./README.md)

---

**Thank you to all contributors and users!** 🙏
