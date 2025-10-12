#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const os = require('os');
const FactoryUsageAnalyzer = require('../src/analyzer');

const packageJson = require('../package.json');

program
  .name('droidusage')
  .description('Analyze Droid AI usage from local session files')
  .version(packageJson.version);

program
  .argument('[command]', 'Command to run', 'daily')
  .option('-s, --since <date>', 'Filter sessions since this date (YYYY-MM-DD)')
  .option('-u, --until <date>', 'Filter sessions until this date (YYYY-MM-DD)')
  .option('-j, --json', 'Output results as JSON')
  .option('--sessions-dir <path>', 'Path to Droid sessions directory', path.join(os.homedir(), '.factory', 'sessions'))
  .option('--blocks', 'Group sessions into 5-hour blocks for rate limit analysis')
  .option('--trends', 'Show trend analysis compared to previous period')
  .option('--by <criteria>', 'Sort top sessions by: cost, tokens, duration, inefficient, outliers', 'cost')
  .option('--limit <number>', 'Number of top sessions to show', '10')
  .option('--web', 'Start web dashboard server')
  .option('--port <number>', 'Port for web server (default: 3000-3999 auto)', parseInt)
  .option('--cost', 'Run cost analysis (for analyze command)')
  .option('--patterns', 'Run pattern analysis (for analyze command)')
  .option('--efficiency', 'Run efficiency analysis (for analyze command)')
  .option('--all', 'Run all analyses (for analyze command)')
  .action(async (command, options) => {
    try {
      // Handle web server mode
      if (options.web) {
        const WebServer = require('../src/web/server');
        const server = new WebServer(options.sessionsDir, options.port);
        
        try {
          await server.start(true);
          
          // Handle graceful shutdown
          process.on('SIGINT', () => {
            server.stop();
            process.exit(0);
          });
          
          process.on('SIGTERM', () => {
            server.stop();
            process.exit(0);
          });
          
          // Keep process alive
          await new Promise(() => {});
        } catch (error) {
          console.error('Failed to start web server:', error.message);
          process.exit(1);
        }
        return;
      }

      const analyzer = new FactoryUsageAnalyzer(options.sessionsDir);

      // Handle blocks option - it works with either daily or session commands
      if (options.blocks) {
        const blockResults = await analyzer.getBlockUsage(options);
        analyzer.outputResults(blockResults, options.json);
        return;
      }

      switch (command) {
        case 'daily':
        case 'day':
          if (options.trends) {
            const trendResults = await analyzer.getTrendsAnalysis(options);
            analyzer.outputResults(trendResults.current, options.json);
            if (!options.json) {
              analyzer.outputSummary(trendResults.current.summary, trendResults.trends);
            }
          } else {
            const dailyResults = await analyzer.getDailyUsage(options);
            analyzer.outputResults(dailyResults, options.json);
          }
          break;

        case 'session':
        case 'sessions':
          const sessionResults = await analyzer.getSessionUsage(options);
          analyzer.outputResults(sessionResults, options.json);
          break;

        case 'top':
          const topOptions = {
            ...options,
            by: options.by,
            limit: parseInt(options.limit, 10)
          };
          const topResults = await analyzer.getTopSessions(topOptions);
          analyzer.outputResults(topResults, options.json);
          break;

        case 'analyze':
          const AnalysisOrchestrator = require('../src/analyzers/AnalysisOrchestrator');
          const orchestrator = new AnalysisOrchestrator();
          
          // Get all sessions for analysis
          const sessionIds = await analyzer.getSessionFiles();
          const sessions = await analyzer.parseSessionsBatch(sessionIds, false);
          const filteredForAnalysis = analyzer.filterSessionsByDate(sessions, options);

          // Add costs to sessions
          const sessionsWithCost = filteredForAnalysis.map(session => ({
            ...session,
            cost: analyzer.calculateCost(session),
            totalTokens: session.inputTokens + session.outputTokens + 
                        session.cacheCreationTokens + session.cacheReadTokens
          }));

          // Run analysis
          const analysisResult = await orchestrator.runAnalysis(sessionsWithCost, options);

          if (options.json) {
            console.log(JSON.stringify(analysisResult, null, 2));
          } else {
            // Pretty print analysis results
            console.log(chalk.bold('\n📊 Analysis Results\n'));
            console.log(chalk.cyan('Overall Health:'), analysisResult.synthesized.overallHealth.toUpperCase());
            console.log(chalk.cyan('Sessions Analyzed:'), analysisResult.sessionCount);
            console.log(chalk.cyan('Analyzers Run:'), analysisResult.analyzersRun.join(', '));
            
            // Show key metrics
            console.log(chalk.bold('\n💡 Key Metrics:'));
            const metrics = analysisResult.synthesized.keyMetrics;
            if (metrics.totalCost) console.log(`  Total Cost: $${metrics.totalCost.toFixed(2)}`);
            if (metrics.burnRate) console.log(`  Monthly Burn Rate: $${metrics.burnRate.monthlyProjection.toFixed(2)}`);
            if (metrics.avgEfficiencyScore) console.log(`  Avg Efficiency: ${metrics.avgEfficiencyScore.toFixed(0)}/100`);
            if (metrics.peakHour !== undefined) console.log(`  Peak Hour: ${metrics.peakHour}:00`);
            if (metrics.busiestDay) console.log(`  Busiest Day: ${metrics.busiestDay}`);

            // Show recommendations
            if (analysisResult.synthesized.recommendations.length > 0) {
              console.log(chalk.bold('\n🎯 Top Recommendations:'));
              analysisResult.synthesized.recommendations.slice(0, 5).forEach((rec, i) => {
                console.log(`  ${i + 1}. [${rec.priority}] ${rec.message}`);
                console.log(`     → ${rec.action}`);
              });
            }

            // Show cross-insights
            if (analysisResult.crossInsights.length > 0) {
              console.log(chalk.bold('\n🔗 Cross-Analyzer Insights:'));
              analysisResult.crossInsights.forEach((insight, i) => {
                console.log(`  ${i + 1}. ${insight.message}`);
                if (insight.recommendation) {
                  console.log(`     → ${insight.recommendation}`);
                }
              });
            }

            console.log(); // Empty line at end
          }
          break;

        default:
          console.error(`Unknown command: ${command}`);
          console.log('Available commands: daily, session, top, analyze');
          console.log('Or use --blocks option with any command for 5-hour block analysis');
          console.log('Use --trends option with daily for trend analysis');
          console.log('Use analyze command with --cost, --patterns, --efficiency, or --all flags');
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
