const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const open = require('open');
const FactoryUsageAnalyzer = require('../analyzer');
const AnalysisOrchestrator = require('../analyzers/AnalysisOrchestrator');

class WebServer {
  constructor(sessionsDir, port = null) {
    this.sessionsDir = sessionsDir;
    this.port = port || this.findAvailablePort();
    this.analyzer = new FactoryUsageAnalyzer(sessionsDir);
    this.app = express();
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  findAvailablePort() {
    // Try ports from 3000-3999
    return 3000;
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Daily usage
    this.app.get('/api/daily', async (req, res) => {
      try {
        const options = {
          since: req.query.since,
          until: req.query.until
        };
        const results = await this.analyzer.getDailyUsage(options);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Session usage
    this.app.get('/api/sessions', async (req, res) => {
      try {
        const options = {
          since: req.query.since,
          until: req.query.until
        };
        const results = await this.analyzer.getSessionUsage(options);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Top sessions
    this.app.get('/api/top', async (req, res) => {
      try {
        const options = {
          since: req.query.since,
          until: req.query.until,
          by: req.query.by || 'cost',
          limit: parseInt(req.query.limit) || 10
        };
        const results = await this.analyzer.getTopSessions(options);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Trends analysis
    this.app.get('/api/trends', async (req, res) => {
      try {
        const options = {
          since: req.query.since,
          until: req.query.until
        };
        const results = await this.analyzer.getTrendsAnalysis(options);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Block usage
    this.app.get('/api/blocks', async (req, res) => {
      try {
        const options = {
          since: req.query.since,
          until: req.query.until
        };
        const results = await this.analyzer.getBlockUsage(options);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Analysis endpoints
    this.app.get('/api/analyze/:type?', async (req, res) => {
      try {
        const options = {
          since: req.query.since,
          until: req.query.until
        };

        // Get sessions
        const sessionIds = await this.analyzer.getSessionFiles();
        const sessions = await this.analyzer.parseSessionsBatch(sessionIds, false);
        const filtered = this.analyzer.filterSessionsByDate(sessions, options);

        // Add costs
        const sessionsWithCost = filtered.map(session => ({
          ...session,
          cost: this.analyzer.calculateCost(session),
          totalTokens: session.inputTokens + session.outputTokens + 
                      session.cacheCreationTokens + session.cacheReadTokens
        }));

        const orchestrator = new AnalysisOrchestrator();

        // Determine which analyses to run
        const type = req.params.type || 'all';
        const analysisOptions = { ...options };

        if (type === 'cost') {
          analysisOptions.cost = true;
        } else if (type === 'patterns') {
          analysisOptions.patterns = true;
        } else if (type === 'efficiency') {
          analysisOptions.efficiency = true;
        } else {
          analysisOptions.all = true;
        }

        const results = await orchestrator.runAnalysis(sessionsWithCost, analysisOptions);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get available models
    this.app.get('/api/models', async (req, res) => {
      try {
        const sessionIds = await this.analyzer.getSessionFiles();
        const sessions = await this.analyzer.parseSessionsBatch(sessionIds, false);
        const models = [...new Set(sessions.map(s => s.model).filter(Boolean))].sort();
        res.json({ models });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get available providers
    this.app.get('/api/providers', async (req, res) => {
      try {
        const sessionIds = await this.analyzer.getSessionFiles();
        const sessions = await this.analyzer.parseSessionsBatch(sessionIds, false);
        const providers = [...new Set(sessions.map(s => s.provider).filter(Boolean))].sort();
        res.json({ providers });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Serve dashboard for root and SPA fallback
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });

    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });
  }

  async start(openBrowser = true) {
    return new Promise((resolve, reject) => {
      // Try to find an available port
      const tryPort = (port) => {
        this.server = this.app.listen(port, async () => {
          this.port = port;
          const url = `http://localhost:${this.port}`;
          console.log(`\n🚀 Droidusage Web Dashboard running at ${url}`);
          console.log(`📊 Sessions directory: ${this.sessionsDir}`);
          console.log(`\nPress Ctrl+C to stop the server\n`);

          if (openBrowser) {
            try {
              await open(url);
            } catch (error) {
              console.log(`Could not open browser automatically: ${error.message}`);
              console.log(`Please open ${url} manually`);
            }
          }

          resolve(url);
        }).on('error', (err) => {
          if (err.code === 'EADDRINUSE' && port < 3999) {
            // Try next port
            tryPort(port + 1);
          } else {
            reject(err);
          }
        });
      };

      tryPort(this.port);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('\n👋 Server stopped');
    }
  }
}

module.exports = WebServer;
