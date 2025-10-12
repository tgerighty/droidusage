const fs = require('fs').promises;
const path = require('path');
const Table = require('cli-table3');
const chalk = require('chalk');
const { format, parseISO, startOfDay, endOfDay, isWithinInterval, startOfHour, addHours } = require('date-fns');
const TrendAnalyzer = require('./analyzers/TrendAnalyzer');
const TopSessionsAnalyzer = require('./analyzers/TopSessionsAnalyzer');

class FactoryUsageAnalyzer {
  constructor(sessionsDir) {
    this.sessionsDir = sessionsDir;
    this.logsDir = path.join(path.dirname(sessionsDir), 'logs');
    this.batchSize = 10; // Number of sessions to process in parallel (balance between speed and memory)
    this.trendAnalyzer = new TrendAnalyzer();
    this.topSessionsAnalyzer = new TopSessionsAnalyzer();
    this.pricing = {
      anthropic: {
        'claude-3-5-sonnet-20241022': {
          input: 3.0,  // $3.00 per 1M input tokens
          output: 15.0, // $15.00 per 1M output tokens
          cacheRead: 0.3, // $0.30 per 1M cache read tokens
          cacheWrite: 3.75 // $3.75 per 1M cache write tokens
        },
        'claude-3-5-haiku-20241022': {
          input: 0.8,
          output: 4.0,
          cacheRead: 0.08,
          cacheWrite: 1.0
        }
      },
      openai: {
        'gpt-4o': {
          input: 2.5,
          output: 10.0,
          cacheRead: 0.125,
          cacheWrite: 2.5
        },
        'gpt-4o-mini': {
          input: 0.15,
          output: 0.6,
          cacheRead: 0.075,
          cacheWrite: 0.3
        },
        'gpt-5-codex': {
          input: 5.0,   // $5.00 per 1M input tokens
          output: 15.0, // $15.00 per 1M output tokens
          cacheRead: 0.25,
          cacheWrite: 2.5
        },
        'gpt-5-2025-08-07': {
          input: 7.5,   // $7.50 per 1M input tokens
          output: 22.5, // $22.50 per 1M output tokens
          cacheRead: 0.375,
          cacheWrite: 3.75
        }
      },
      zhipuai: {
        'glm-4': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'glm-4.6': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'glm-4-custom': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'custom:glm-4': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'custom:glm-4.6': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        }
      },
      fireworks: {
        'glm-4': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'glm-4.6': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'glm-4-custom': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'custom:glm-4': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'custom:glm-4.6': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'gpt-4o': {
          input: 2.5,   // $2.50 per 1M input tokens
          output: 10.0, // $10.00 per 1M output tokens
          cacheRead: 0.125,
          cacheWrite: 2.5
        },
        'gpt-5-codex': {
          input: 5.0,   // $5.00 per 1M input tokens
          output: 15.0, // $15.00 per 1M output tokens
          cacheRead: 0.25,
          cacheWrite: 2.5
        },
        'gpt-5-2025-08-07': {
          input: 7.5,   // $7.50 per 1M input tokens
          output: 22.5, // $22.50 per 1M output tokens
          cacheRead: 0.375,
          cacheWrite: 3.75
        }
      },
      'generic-chat-completion-api': {
        'glm-4': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'glm-4.6': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'glm-4-custom': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'custom:glm-4': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'custom:glm-4.6': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        }
      },
      zai: {
        'glm-4': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'glm-4.6': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'glm-4-custom': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'custom:glm-4': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        },
        'custom:glm-4.6': {
          input: 0.5,   // $0.50 per 1M input tokens
          output: 2.5,  // $2.50 per 1M output tokens
          cacheRead: 0.05,
          cacheWrite: 0.25
        }
      }
    };
  }

  async getSessionFiles() {
    try {
      const files = await fs.readdir(this.sessionsDir);
      const sessionFiles = files
        .filter(file => file.endsWith('.settings.json'))
        .map(file => file.replace('.settings.json', ''));
      return sessionFiles;
    } catch (error) {
      throw new Error(`Cannot read sessions directory: ${this.sessionsDir}`);
    }
  }

  async extractModelFromLogs(logPath, provider) {
    try {
      const logData = await fs.readFile(logPath, 'utf8');
      const lines = logData.split('\n').filter(line => line.trim());
      
      // Look for model information in assistant messages
      for (const line of lines) {
        try {
          const logEntry = JSON.parse(line);
          
          // Check if this is an assistant message that might contain model info
          if (logEntry.type === 'message' && logEntry.message?.role === 'assistant') {
            const content = logEntry.message.content || [];
            
            // Look for text content that might contain model names
            for (const contentItem of content) {
              if (contentItem.type === 'text') {
                const text = contentItem.text;
                
                // Search for various model name patterns
                const modelPatterns = [
                  /glm[-\s]?(\d+(?:\.\d+)?)/i,           // GLM-4, GLM 4.6, etc.
                  /claude[-\s]?3[-\s]?5[-\s]?sonnet/i,    // Claude 3.5 Sonnet
                  /gpt[-\s]?4o/i,                           // GPT-4o
                  /gpt[-\s]?3\.5/i,                        // GPT-3.5
                  /sonnet/i,                              // Sonnet models
                  /haiku/i,                               // Haiku models
                  /op[-\s]?\d+/i,                          // OP models
                  /custom/i,                              // Custom models
                ];
                
                for (const pattern of modelPatterns) {
                  const match = text.match(pattern);
                  if (match) {
                    // Return the full matched model name if possible
                    const fullMatch = text.match(/(glm[-\s]?[\d.]+(?:\s*(?:sonnet|haiku|op|custom))?)/i);
                    if (fullMatch) {
                      return fullMatch[1].toLowerCase().replace(/\s+/g, '-');
                    }
                    return match[1].toLowerCase();
                  }
                }
              }
            }
          }
          
          // Also check for any model references in message metadata
          if (logEntry.model) {
            return logEntry.model;
          }
        } catch (parseError) {
          // Skip invalid JSON lines
          continue;
        }
      }
      
      // Fallback to provider-based assumptions
      switch (provider) {
        case 'anthropic':
          return 'claude-3-5-sonnet-20241022';
        case 'openai':
          return 'gpt-4o';
        case 'zhipuai':
          return 'glm-4';
        default:
          return 'unknown';
      }
    } catch (error) {
      // If log parsing fails, use provider fallback
      switch (provider) {
        case 'anthropic':
          return 'claude-3-5-sonnet-20241022';
        case 'openai':
          return 'gpt-4o';
        case 'zhipuai':
          return 'glm-4';
        default:
          return 'unknown';
      }
    }
  }

  async parseLogEntriesForSession(sessionId) {
    try {
      const logPath = path.join(this.logsDir, 'droid-log-single.log');
      const logData = await fs.readFile(logPath, 'utf8');
      const lines = logData.split('\n').filter(line => line.trim());

      const sessionEntries = [];
      let currentSessionId = null;

      for (const line of lines) {
        if (line.includes(`"sessionId":"${sessionId}"`)) {
          currentSessionId = sessionId;
        }

        if (currentSessionId === sessionId && line.includes('modelId')) {
          const match = line.match(/"modelId":"([^"]+)"/);
          if (match) {
            sessionEntries.push({
              modelId: match[1],
              timestamp: this.extractTimestampFromLogLine(line)
            });
          }
        }

        if (currentSessionId === sessionId && (line.includes('outputTokens') || line.includes('cacheReadInputTokens') || line.includes('inputTokens'))) {
          const outputMatch = line.match(/"outputTokens":(\d+)/);
          const cacheReadMatch = line.match(/"cacheReadInputTokens":(\d+)/);
          const inputMatch = line.match(/"inputTokens":(\d+)/);

          if (outputMatch || cacheReadMatch || inputMatch) {
            sessionEntries.push({
              outputTokens: outputMatch ? parseInt(outputMatch[1]) || 0 : 0,
              cacheReadInputTokens: cacheReadMatch ? parseInt(cacheReadMatch[1]) || 0 : 0,
              inputTokens: inputMatch ? parseInt(inputMatch[1]) || 0 : 0,
              timestamp: this.extractTimestampFromLogLine(line)
            });
          }
        }
      }

      return sessionEntries;
    } catch (error) {
      console.warn(`Warning: Could not parse log entries for session ${sessionId}: ${error.message}`);
      return [];
    }
  }

  async countUserPromptsInSession(sessionId) {
    try {
      const sessionLogPath = path.join(this.sessionsDir, `${sessionId}.jsonl`);
      const logData = await fs.readFile(sessionLogPath, 'utf8');
      const lines = logData.split('\n').filter(line => line.trim());

      let userPromptCount = 0;

      for (const line of lines) {
        try {
          const logEntry = JSON.parse(line);

          // Count only actual user text messages, not tool results
          // {"type":"message","message":{"role":"user","content":[{"type":"text","text":"..."}]}}
          if (logEntry.type === 'message' && logEntry.message && logEntry.message.role === 'user') {
            // Check if this message contains actual user text (not tool results)
            const hasUserText = logEntry.message.content.some(item =>
              item.type === 'text' && item.text && !item.text.includes('<system-reminder>')
            );

            if (hasUserText) {
              userPromptCount++;
            }
          }
        } catch (parseError) {
          // Skip invalid JSON lines
          continue;
        }
      }

      return userPromptCount;
    } catch (error) {
      console.warn(`Warning: Could not count user prompts for session ${sessionId}: ${error.message}`);
      return 0;
    }
  }

  normalizeModelName(modelId) {
    // Handle various model ID formats and normalize them
    return modelId
      .toLowerCase()
      .replace(/^custom:/, '')
      .replace(/custom:glm-/g, 'glm-')
      .replace(/^gpt-/g, 'gpt-')
      .replace(/^claude-3-5-/, 'claude-3-5-')
      .replace(/^sonnet/, 'sonnet');
  }

  extractTimestampFromLogLine(line) {
    const timestampMatch = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
    return timestampMatch ? new Date(timestampMatch[1]) : null;
  }

  async parseSession(sessionId, countPrompts = true) {
    try {
      const settingsPath = path.join(this.sessionsDir, `${sessionId}.settings.json`);
      const logPath = path.join(this.sessionsDir, `${sessionId}.jsonl`);
      
      const settingsData = await fs.readFile(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      
      // Initialize with settings data
      let sessionStart = settings.providerLockTimestamp;
      let aggregatedInputTokens = settings.tokenUsage?.inputTokens || 0;
      let aggregatedOutputTokens = settings.tokenUsage?.outputTokens || 0;
      let cacheCreationTokens = settings.tokenUsage?.cacheCreationTokens || 0;
      let cacheReadTokens = settings.tokenUsage?.cacheReadTokens || 0;
      let userPrompts = 0;
      let model = 'unknown';
      
      // Use shared log data if available (parsed once for all sessions)
      if (this.sharedLogData && this.sharedLogData.has(sessionId)) {
        const logData = this.sharedLogData.get(sessionId);
        if (logData.inputTokens > 0) aggregatedInputTokens = Math.max(logData.inputTokens, aggregatedInputTokens);
        if (logData.outputTokens > 0) aggregatedOutputTokens = Math.max(logData.outputTokens, aggregatedOutputTokens);
        if (logData.cacheReadTokens > 0) cacheReadTokens = Math.max(logData.cacheReadTokens, cacheReadTokens);
        if (logData.modelId) model = this.normalizeModelName(logData.modelId);
      }
      
      // Parse session log file for timestamp and additional model info if needed
      try {
        const logData = await fs.readFile(logPath, 'utf8');
        const firstLine = logData.split('\n')[0];
        if (firstLine) {
          const firstEntry = JSON.parse(firstLine);
          if (firstEntry.timestamp && !sessionStart) {
            sessionStart = firstEntry.timestamp;
          }
          // Try to get model from first message if still unknown
          if (model === 'unknown' && firstEntry.type === 'message' && firstEntry.message?.model) {
            model = this.normalizeModelName(firstEntry.message.model);
          }
        }
      } catch (logError) {
        // Log file doesn't exist or can't be read - use settings data
      }
      
      // Fallback to provider-based model detection if still unknown
      if (model === 'unknown' && settings.providerLock) {
        switch (settings.providerLock) {
          case 'anthropic':
            model = 'claude-3-5-sonnet-20241022';
            break;
          case 'openai':
            model = 'gpt-4o';
            break;
          case 'zhipuai':
          case 'zai':
          case 'fireworks':
          case 'generic-chat-completion-api':
            model = 'glm-4';
            break;
          default:
            model = 'unknown';
        }
      }
      
      // Count user prompts from session conversation file (only if needed)
      if (countPrompts) {
        userPrompts = await this.countUserPromptsInSession(sessionId);
      }

      // Parse date with error handling
      let parsedDate = null;
      if (sessionStart) {
        try {
          parsedDate = parseISO(sessionStart);
          // Check if the date is valid
          if (isNaN(parsedDate.getTime())) {
            parsedDate = null;
          }
        } catch (error) {
          parsedDate = null;
        }
      }

      return {
        id: sessionId,
        date: parsedDate,
        model: model,
        provider: settings.providerLock || 'unknown',
        inputTokens: aggregatedInputTokens,
        outputTokens: aggregatedOutputTokens,
        cacheCreationTokens: settings.tokenUsage?.cacheCreationTokens || 0,
        cacheReadTokens: settings.tokenUsage?.cacheReadTokens || 0,
        thinkingTokens: settings.tokenUsage?.thinkingTokens || 0,
        activeTimeMs: settings.assistantActiveTimeMs || 0,
        userInteractions: userPrompts,
        totalTokens: aggregatedInputTokens + aggregatedOutputTokens + (settings.tokenUsage?.cacheCreationTokens || 0) + (settings.tokenUsage?.cacheReadTokens || 0)
      };
    } catch (error) {
      console.warn(`Warning: Could not parse session ${sessionId}: ${error.message}`);
      return null;
    }
  }

  // Parse shared log file once and build lookup map (much faster than parsing per-session)
  async parseSharedLogOnce() {
    try {
      const logPath = path.join(this.logsDir, 'droid-log-single.log');
      const logData = await fs.readFile(logPath, 'utf8');
      const lines = logData.split('\n').filter(line => line.trim());
      
      const sessionData = new Map();
      
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          
          if (!entry.sessionId) continue;
          
          if (!sessionData.has(entry.sessionId)) {
            sessionData.set(entry.sessionId, {
              inputTokens: 0,
              outputTokens: 0,
              cacheReadTokens: 0,
              modelId: null
            });
          }
          
          const data = sessionData.get(entry.sessionId);
          
          // Extract model
          if (!data.modelId && entry.modelId) {
            data.modelId = entry.modelId;
          }
          
          // Aggregate tokens
          if (entry.inputTokens) data.inputTokens += entry.inputTokens;
          if (entry.outputTokens) data.outputTokens += entry.outputTokens;
          if (entry.cacheReadInputTokens) data.cacheReadTokens += entry.cacheReadInputTokens;
        } catch (e) {
          continue;
        }
      }
      
      return sessionData;
    } catch (error) {
      // Log file doesn't exist or can't be read
      return new Map();
    }
  }

  // NEW: Parse sessions in parallel batches for better performance
  async parseSessionsBatch(sessionIds, countPrompts = false) {
    const sessions = [];
    const batchSize = this.batchSize;
    const totalBatches = Math.ceil(sessionIds.length / batchSize);
    
    // Show progress for large datasets
    const showProgress = sessionIds.length > 100 && !process.env.NODE_ENV?.includes('test');
    
    // Parse shared log file once for all sessions (huge performance win!)
    if (showProgress) {
      process.stderr.write('\rParsing shared log file...');
    }
    this.sharedLogData = await this.parseSharedLogOnce();
    if (showProgress) {
      process.stderr.write('\rParsing shared log file... ✓\n');
    }
    
    // Process in batches to avoid overwhelming memory
    for (let i = 0; i < sessionIds.length; i += batchSize) {
      const batch = sessionIds.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      if (showProgress) {
        const progress = Math.round((currentBatch / totalBatches) * 100);
        process.stderr.write(`\rProcessing sessions: ${progress}% (${i + batch.length}/${sessionIds.length})`);
      }
      
      // Parse this batch in parallel
      const batchResults = await Promise.all(
        batch.map(sessionId => this.parseSession(sessionId, countPrompts))
      );
      
      // Filter out null results and add to sessions array
      sessions.push(...batchResults.filter(session => session !== null));
    }
    
    if (showProgress) {
      process.stderr.write(`\rProcessing sessions: 100% (${sessionIds.length}/${sessionIds.length}) ✓\n`);
    }
    
    // Clear shared log data to free memory
    this.sharedLogData = null;
    
    return sessions;
  }

  filterSessionsByDate(sessions, since, until) {
    if (!since && !until) return sessions;
    
    return sessions.filter(session => {
      if (!session.date) return true; // Include sessions without dates when no filter
      
      const sessionDate = startOfDay(session.date);
      let withinRange = true;
      
      if (since) {
        const sinceDate = startOfDay(parseISO(since));
        withinRange = withinRange && sessionDate >= sinceDate;
      }
      
      if (until) {
        const untilDate = endOfDay(parseISO(until));
        withinRange = withinRange && sessionDate <= untilDate;
      }
      
      return withinRange;
    });
  }

  calculateCost(session) {
    const providerPricing = this.pricing[session.provider];
    if (!providerPricing) return 0;
    
    const modelPricing = providerPricing[session.model];
    if (!modelPricing) return 0;
    
    const inputCost = (session.inputTokens / 1000000) * modelPricing.input;
    const outputCost = (session.outputTokens / 1000000) * modelPricing.output;
    const cacheReadCost = (session.cacheReadTokens / 1000000) * modelPricing.cacheRead;
    const cacheWriteCost = (session.cacheCreationTokens / 1000000) * modelPricing.cacheWrite;
    
    return inputCost + outputCost + cacheReadCost + cacheWriteCost;
  }

  groupSessionsByDate(sessions) {
    const grouped = {};
    
    sessions.forEach(session => {
      let dateKey;
      if (!session.date) {
        // Use file modification time or current date as fallback
        dateKey = 'Unknown Date';
      } else {
        dateKey = format(session.date, 'yyyy-MM-dd');
      }
      
      // Create a unique key for each date + model combination
      const dateModelKey = `${dateKey}::${session.model}`;
      
      if (!grouped[dateModelKey]) {
        grouped[dateModelKey] = {
          date: dateKey,
          model: session.model,
          provider: session.provider,
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 0,
          userInteractions: 0,
          cost: 0,
          sessions: []
        };
      }
      
      const dayModel = grouped[dateModelKey];
      dayModel.inputTokens += session.inputTokens;
      dayModel.outputTokens += session.outputTokens;
      dayModel.cacheCreationTokens += session.cacheCreationTokens;
      dayModel.cacheReadTokens += session.cacheReadTokens;
      dayModel.userInteractions += session.userInteractions || 0;
      dayModel.totalTokens += session.inputTokens + session.outputTokens + session.cacheCreationTokens + session.cacheReadTokens;
      dayModel.cost += this.calculateCost(session);
      dayModel.sessions.push(session);
    });
    
    // Convert to array and sort by date, then by model
    return Object.values(grouped)
      .sort((a, b) => {
        if (a.date === 'Unknown Date') return 1;
        if (b.date === 'Unknown Date') return -1;
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.model.localeCompare(b.model);
      });
  }

  async getDailyUsage(options = {}) {
    const sessionIds = await this.getSessionFiles();
    
    // Process sessions in parallel batches (don't need prompt counting for daily report)
    const sessions = await this.parseSessionsBatch(sessionIds, false);
    
    const filteredSessions = this.filterSessionsByDate(sessions, options.since, options.until);
    const dailyData = this.groupSessionsByDate(filteredSessions);
    
    return {
      type: 'daily',
      data: dailyData,
      summary: this.calculateSummary(dailyData)
    };
  }

  async getSessionUsage(options = {}) {
    const sessionIds = await this.getSessionFiles();
    
    // Process sessions in parallel batches (don't need prompt counting for session report)
    const sessions = await this.parseSessionsBatch(sessionIds, false);
    
    const filteredSessions = this.filterSessionsByDate(sessions, options.since, options.until);
    
    // Add cost to each session
    const sessionsWithCost = filteredSessions.map(session => ({
      ...session,
      cost: this.calculateCost(session),
      totalTokens: session.inputTokens + session.outputTokens + session.cacheCreationTokens + session.cacheReadTokens
    }));
    
    return {
      type: 'session',
      data: sessionsWithCost.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date - a.date;
      }),
      summary: this.calculateSummary(sessionsWithCost)
    };
  }

  calculateSummary(data) {
    if (data.length === 0) {
      return {
        totalSessions: 0,
        totalTokens: 0,
        totalCost: 0,
        totalActiveTime: 0,
        totalPrompts: 0
      };
    }

    const summary = data.reduce((acc, item) => {
      if (item.type === 'daily') {
        acc.totalTokens += item.totalTokens;
        acc.totalCost += item.cost;
        acc.totalSessions += item.sessions.length;
        acc.totalActiveTime += item.sessions.reduce((time, session) => time + session.activeTimeMs, 0);
        acc.totalPrompts += item.userInteractions || 0;
      } else if (item.sessions && Array.isArray(item.sessions)) {
        // This is a block (has sessions array)
        acc.totalTokens += item.totalTokens || 0;
        acc.totalCost += item.cost || 0;
        acc.totalSessions += item.sessions.length;
        acc.totalActiveTime += item.sessions.reduce((time, session) => time + session.activeTimeMs, 0);
        acc.totalPrompts += item.userPrompts || item.userInteractions || 0;
      } else {
        // This is a session
        acc.totalTokens += item.totalTokens || 0;
        acc.totalCost += item.cost || 0;
        acc.totalSessions += 1;
        acc.totalActiveTime += item.activeTimeMs || 0;
        acc.totalPrompts += item.userInteractions || 0;
      }
      return acc;
    }, { totalSessions: 0, totalTokens: 0, totalCost: 0, totalActiveTime: 0, totalPrompts: 0 });

    return summary;
  }

  getBlockKey(date, earliestSessionTime) {
    // Group sessions into rolling 5-hour windows starting from earliest session
    const hoursSinceFirstSession = (date.getTime() - earliestSessionTime.getTime()) / (1000 * 60 * 60);
    const blockNumber = Math.floor(hoursSinceFirstSession / 5);
    const blockStart = addHours(earliestSessionTime, blockNumber * 5);
    const blockEnd = addHours(blockStart, 5);

    return {
      start: blockStart,
      end: blockEnd,
      key: format(blockStart, 'yyyy-MM-dd HH:mm') + ' - ' + format(blockEnd, 'yyyy-MM-dd HH:mm')
    };
  }

  groupSessionsByBlock(sessions) {
    const grouped = {};

    // Find the earliest session time to use as starting point
    const sessionsWithDates = sessions.filter(session => session.date);
    if (sessionsWithDates.length === 0) {
      return [];
    }

    const earliestSessionTime = sessionsWithDates.reduce((earliest, session) => {
      return session.date < earliest ? session.date : earliest;
    }, sessionsWithDates[0].date);

    sessions.forEach(session => {
      if (!session.date) {
        // Skip sessions without dates for block analysis
        return;
      }

      const blockInfo = this.getBlockKey(session.date, earliestSessionTime);
      const blockKey = blockInfo.key;

      if (!grouped[blockKey]) {
        grouped[blockKey] = {
          start: blockInfo.start,
          end: blockInfo.end,
          date: format(blockInfo.start, 'yyyy-MM-dd'),
          timeRange: format(blockInfo.start, 'HH:mm') + ' - ' + format(blockInfo.end, 'HH:mm'),
          models: new Set(),
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
          totalTokens: 0,
          userPrompts: 0,
          cost: 0,
          sessions: []
        };
      }

      const block = grouped[blockKey];
      block.models.add(session.model);
      block.inputTokens += session.inputTokens;
      block.outputTokens += session.outputTokens;
      block.cacheCreationTokens += session.cacheCreationTokens;
      block.cacheReadTokens += session.cacheReadTokens;
      block.userPrompts += session.userInteractions || 0;
      block.totalTokens += session.inputTokens + session.outputTokens + session.cacheCreationTokens + session.cacheReadTokens;
      block.cost += this.calculateCost(session);
      block.sessions.push(session);
    });

    // Convert to array and sort by start time
    return Object.values(grouped).map(block => ({
      ...block,
      models: Array.from(block.models).sort().join(', ') // Convert Set to sorted string
    })).sort((a, b) => a.start - b.start);
  }

  async getBlockUsage(options = {}) {
    const sessionIds = await this.getSessionFiles();
    
    // Process sessions in parallel batches (WITH prompt counting for blocks report)
    const allSessions = await this.parseSessionsBatch(sessionIds, true);
    const sessions = allSessions.filter(session => session && session.date);

    const filteredSessions = this.filterSessionsByDate(sessions, options.since, options.until);
    const blockData = this.groupSessionsByBlock(filteredSessions);

    return {
      type: 'blocks',
      data: blockData,
      summary: this.calculateSummary(blockData)
    };
  }

  async getTopSessions(options = {}) {
    const sessionIds = await this.getSessionFiles();
    
    // Process sessions in parallel batches
    const allSessions = await this.parseSessionsBatch(sessionIds, false);
    const sessions = allSessions.filter(session => session && session.date);
    const filteredSessions = this.filterSessionsByDate(sessions, options.since, options.until);
    
    // Add costs to sessions
    const sessionsWithCost = filteredSessions.map(session => ({
      ...session,
      cost: this.calculateCost(session),
      totalTokens: session.inputTokens + session.outputTokens + session.cacheCreationTokens + session.cacheReadTokens
    }));
    
    // Get top sessions based on criteria
    let topSessions;
    const by = options.by || 'cost';
    const limit = options.limit || 10;
    
    switch (by) {
      case 'tokens':
        topSessions = this.topSessionsAnalyzer.getTopByTokens(sessionsWithCost, limit);
        break;
      case 'duration':
        topSessions = this.topSessionsAnalyzer.getTopByDuration(sessionsWithCost, limit);
        break;
      case 'inefficient':
        topSessions = this.topSessionsAnalyzer.getInefficient(sessionsWithCost, limit);
        break;
      case 'outliers':
        topSessions = this.topSessionsAnalyzer.getOutliers(sessionsWithCost);
        break;
      case 'cost':
      default:
        topSessions = this.topSessionsAnalyzer.getTopByCost(sessionsWithCost, limit);
    }
    
    return {
      type: 'top',
      by: by,
      data: topSessions,
      summary: this.topSessionsAnalyzer.getSummaryStats(topSessions),
      allSessionsStats: this.calculateSummary(sessionsWithCost)
    };
  }

  async getTrendsAnalysis(options = {}) {
    // Get current period data
    const currentResults = await this.getDailyUsage(options);
    
    // Get previous period data
    const previousPeriod = this.trendAnalyzer.getPreviousPeriod(options.since, options.until);
    const previousResults = await this.getDailyUsage(previousPeriod);
    
    // Compare periods
    const trends = this.trendAnalyzer.comparePeriods(currentResults.summary, previousResults.summary);
    
    return {
      type: 'trends',
      current: currentResults,
      previous: previousResults,
      trends: trends,
      patterns: this.trendAnalyzer.detectPatterns(currentResults.data.flatMap(d => d.sessions || []))
    };
  }

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

  outputDailyTable(data) {
    const table = new Table({
      head: [
        chalk.cyan('Date'),
        chalk.cyan('Model'),
        chalk.cyan('Input'),
        chalk.cyan('Output'),
        chalk.cyan('Cache Create'),
        chalk.cyan('Cache Read'),
        chalk.cyan('Total Tokens'),
        chalk.cyan('Prompts'),
        chalk.cyan('Cost (USD)')
      ],
      style: {
        head: ['bold'],
        border: []
      }
    });

    let lastDate = '';
    data.forEach(dayModel => {
      const dateDisplay = dayModel.date === lastDate ? '' : dayModel.date;
      lastDate = dayModel.date;

      table.push([
        dateDisplay,
        dayModel.model,
        this.formatNumber(dayModel.inputTokens),
        this.formatNumber(dayModel.outputTokens),
        this.formatNumber(dayModel.cacheCreationTokens),
        this.formatNumber(dayModel.cacheReadTokens),
        this.formatNumber(dayModel.totalTokens),
        this.formatNumber(dayModel.userInteractions || 0),
        this.formatCost(dayModel.cost)
      ]);
    });

    console.log(table.toString());
  }

  outputSessionTable(data) {
    const table = new Table({
      head: [
        chalk.cyan('Session ID'),
        chalk.cyan('Date'),
        chalk.cyan('Model'),
        chalk.cyan('Input'),
        chalk.cyan('Output'),
        chalk.cyan('Cache'),
        chalk.cyan('Total'),
        chalk.cyan('Cost'),
        chalk.cyan('Active Time'),
        chalk.cyan('Prompts')
      ],
      style: {
        head: ['bold'],
        border: []
      }
    });
    
    data.forEach(session => {
      table.push([
        session.id.substring(0, 8) + '...',
        session.date ? format(session.date, 'yyyy-MM-dd HH:mm') : 'Unknown',
        session.model,
        this.formatNumber(session.inputTokens),
        this.formatNumber(session.outputTokens),
        this.formatNumber(session.cacheCreationTokens + session.cacheReadTokens),
        this.formatNumber(session.totalTokens),
        this.formatCost(session.cost),
        this.formatTime(session.activeTimeMs),
        this.formatNumber(session.userInteractions || 0)
      ]);
    });
    
    console.log(table.toString());
  }

  outputBlockTable(data) {
    const table = new Table({
      head: [
        chalk.cyan('Date'),
        chalk.cyan('Time Block'),
        chalk.cyan('Model(s)'),
        chalk.cyan('Sessions'),
        chalk.cyan('Input'),
        chalk.cyan('Output'),
        chalk.cyan('Cache Create'),
        chalk.cyan('Cache Read'),
        chalk.cyan('Total Tokens'),
        chalk.cyan('Prompts'),
        chalk.cyan('Cost (USD)')
      ],
      style: {
        head: ['bold'],
        border: []
      }
    });

    let lastDate = '';
    data.forEach(block => {
      const dateDisplay = block.date === lastDate ? '' : block.date;
      lastDate = block.date;

      table.push([
        dateDisplay,
        block.timeRange,
        block.models || 'Unknown',
        block.sessions.length,
        this.formatNumber(block.inputTokens),
        this.formatNumber(block.outputTokens),
        this.formatNumber(block.cacheCreationTokens),
        this.formatNumber(block.cacheReadTokens),
        this.formatNumber(block.totalTokens),
        this.formatNumber(block.userPrompts || 0),
        this.formatCost(block.cost)
      ]);
    });

    console.log(table.toString());
  }

  outputSummary(summary, trends = null) {
    console.log();
    console.log(chalk.bold('Summary:'));
    
    if (summary.totalSessions !== undefined) {
      console.log(`  Total Sessions: ${this.formatNumber(summary.totalSessions || 0)}`);
    }
    if (summary.totalTokens !== undefined) {
      console.log(`  Total Tokens: ${this.formatNumber(summary.totalTokens || 0)}`);
    }
    if (summary.totalPrompts !== undefined) {
      console.log(`  Total Prompts: ${this.formatNumber(summary.totalPrompts || 0)}`);
    }
    if (summary.totalCost !== undefined) {
      console.log(`  Total Cost: ${this.formatCost(summary.totalCost || 0)}`);
    }
    if (summary.totalActiveTime !== undefined) {
      console.log(`  Total Active Time: ${this.formatTime(summary.totalActiveTime || 0)}`);
    }
    if (summary.avgCost !== undefined) {
      console.log(`  Avg Cost/Session: ${this.formatCost(summary.avgCost || 0)}`);
    }
    if (summary.avgTokens !== undefined) {
      console.log(`  Avg Tokens/Session: ${this.formatNumber(summary.avgTokens || 0)}`);
    }
    if (summary.avgEfficiency !== undefined) {
      console.log(`  Avg Efficiency Score: ${summary.avgEfficiency.toFixed(0) || 0}/100`);
    }
    
    if (trends) {
      console.log();
      console.log(chalk.bold('Trends (vs previous period):'));
      console.log(`  Cost: ${this.formatCost(trends.cost.value)} ${this.trendAnalyzer.formatTrendColored(trends.cost, chalk, true)}`);
      console.log(`  Tokens: ${this.formatNumber(trends.tokens.value)} ${this.trendAnalyzer.formatTrendColored(trends.tokens, chalk)}`);
      console.log(`  Sessions: ${this.formatNumber(trends.sessions.value)} ${this.trendAnalyzer.formatTrendColored(trends.sessions, chalk)}`);
      console.log(`  Avg Cost/Session: ${this.formatCost(trends.avgCostPerSession.value)} ${this.trendAnalyzer.formatTrendColored(trends.avgCostPerSession, chalk, true)}`);
    }
  }

  outputTopSessionsTable(data, by) {
    const table = new Table({
      head: [
        chalk.cyan('Session ID'),
        chalk.cyan('Date'),
        chalk.cyan('Model'),
        chalk.cyan('Tokens'),
        chalk.cyan('Cost'),
        chalk.cyan('Duration'),
        chalk.cyan('Efficiency'),
        chalk.cyan('Notes')
      ],
      style: {
        head: ['bold'],
        border: []
      }
    });
    
    data.forEach(session => {
      const effStatus = session.efficiency ? session.efficiency.status : 'unknown';
      const effColor = effStatus === 'good' ? chalk.green : effStatus === 'poor' ? chalk.red : chalk.yellow;
      const effDisplay = effColor(effStatus.toUpperCase());
      
      const notes = [];
      if (session.warnings && session.warnings.length > 0) {
        notes.push(...session.warnings);
      }
      
      table.push([
        session.id.substring(0, 8) + '...',
        session.date ? format(session.date, 'MM-dd HH:mm') : 'Unknown',
        session.model,
        this.formatNumber(session.totalTokens),
        this.formatCost(session.cost),
        this.formatTime(session.activeTimeMs),
        effDisplay,
        notes.join('\n') || ''
      ]);
    });
    
    console.log(`\n${chalk.bold(`Top ${data.length} Sessions by ${by.charAt(0).toUpperCase() + by.slice(1)}:`)}\n`);
    console.log(table.toString());
    
    // Show recommendations if any
    const recs = data.flatMap(s => s.recommendations || []);
    if (recs.length > 0) {
      console.log(`\n${chalk.bold('💡 Recommendations:')}`);
      const uniqueRecs = [...new Set(recs)];
      uniqueRecs.slice(0, 5).forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
  }

  outputResults(results, asJson = false) {
    if (asJson) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    if (results.data.length === 0) {
      console.log('No session data found.');
      return;
    }

    if (results.type === 'daily') {
      this.outputDailyTable(results.data);
    } else if (results.type === 'session') {
      this.outputSessionTable(results.data);
    } else if (results.type === 'blocks') {
      this.outputBlockTable(results.data);
    } else if (results.type === 'top') {
      this.outputTopSessionsTable(results.data, results.by);
    }

    this.outputSummary(results.summary, results.trends);
  }
}

module.exports = FactoryUsageAnalyzer;
