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
  .action(async (command, options) => {
    try {
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
          const dailyResults = await analyzer.getDailyUsage(options);
          analyzer.outputResults(dailyResults, options.json);
          break;

        case 'session':
        case 'sessions':
          const sessionResults = await analyzer.getSessionUsage(options);
          analyzer.outputResults(sessionResults, options.json);
          break;

        default:
          console.error(`Unknown command: ${command}`);
          console.log('Available commands: daily, session');
          console.log('Or use --blocks option with any command for 5-hour block analysis');
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
