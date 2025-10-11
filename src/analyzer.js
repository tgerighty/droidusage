const fs = require('fs').promises;
const path = require('path');
const Table = require('cli-table3');
const chalk = require('chalk');
const { format, parseISO, startOfDay, endOfDay, isWithinInterval, startOfHour, addHours } = require('date-fns');

class FactoryUsageAnalyzer {
  constructor(sessionsDir) {
    this.sessionsDir = sessionsDir;
    this.logsDir = path.join(path.dirname(sessionsDir), 'logs');
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

  async parseSession(sessionId) {
    try {
      const settingsPath = path.join(this.sessionsDir, `${sessionId}.settings.json`);
      const logPath = path.join(this.sessionsDir, `${sessionId}.jsonl`);
      
      const settingsData = await fs.readFile(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      
      // First, try to extract comprehensive data from log files
      const logEntries = await this.parseLogEntriesForSession(sessionId);
      
      // Get session start time from the first log entry or settings timestamp
      let sessionStart = null;
      let model = 'unknown';
      let aggregatedInputTokens = 0;
      let aggregatedOutputTokens = 0;
      let cacheCreationTokens = 0;
      let cacheReadTokens = 0;
      let userPrompts = 0;
      
      // Use log data as primary source
      if (logEntries.length > 0) {
        // Use first log entry timestamp as session start
        sessionStart = logEntries[0].timestamp ?
          logEntries[0].timestamp.toISOString() :
          settings.providerLockTimestamp;

        // Extract the most common model used in this session
        const modelCounts = {};
        logEntries.forEach(entry => {
          if (entry.modelId) {
            const modelName = this.normalizeModelName(entry.modelId);
            modelCounts[modelName] = (modelCounts[modelName] || 0) + 1;
          }
        });

        // Use the first model detected in the session (chronological order)
        if (logEntries.length > 0) {
          const firstModelEntry = logEntries.find(entry => entry.modelId);
          if (firstModelEntry) {
            model = this.normalizeModelName(firstModelEntry.modelId);

            // Only infer provider if not already set (don't override existing provider settings)
            if (!settings.providerLock || settings.providerLock === 'unknown') {
              if (model.includes('glm')) {
                settings.providerLock = 'zhipuai'; // GLM models use zhipuai/zai provider
              } else if (model.includes('gpt')) {
                settings.providerLock = 'openai'; // GPT models use openai provider
              } else if (model.includes('claude')) {
                settings.providerLock = 'anthropic'; // Claude models use anthropic provider
              }
            }
          }
        }

        // Aggregate tokens from log entries (streaming results)
        let logCacheReadTokens = 0;
        let logInputTokens = 0;
        logEntries.forEach(entry => {
          if (entry.outputTokens) aggregatedOutputTokens += entry.outputTokens;
          if (entry.cacheReadInputTokens) logCacheReadTokens += entry.cacheReadInputTokens;
          if (entry.inputTokens) logInputTokens += entry.inputTokens;
        });

        // Use settings data as fallback, but prefer log data when available
        aggregatedInputTokens = logInputTokens > 0 ? logInputTokens : (settings.tokenUsage?.inputTokens || 0);
        cacheCreationTokens = settings.tokenUsage?.cacheCreationTokens || 0;

        // Use cache read tokens from logs if available, otherwise fall back to settings
        cacheReadTokens = logCacheReadTokens > 0 ? logCacheReadTokens : (settings.tokenUsage?.cacheReadTokens || 0);

        // Count user prompts from session conversation file
        userPrompts = await this.countUserPromptsInSession(sessionId);
      }
      
      // Fallback to settings if no log data available
      if (logEntries.length === 0) {
        // Get session start time from the first log entry or settings timestamp
        try {
          const logData = await fs.readFile(logPath, 'utf8');
          const lines = logData.split('\n').filter(line => line.trim());
          
          // Look for first entry with a timestamp
          for (const line of lines) {
            try {
              const logEntry = JSON.parse(line);
              if (logEntry.timestamp) {
                sessionStart = logEntry.timestamp;
                break;
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              continue;
            }
          }
          
          // If no timestamp found, try settings timestamp
          if (!sessionStart && settings.providerLockTimestamp) {
            sessionStart = settings.providerLockTimestamp;
          }
        } catch (logError) {
          // Log file might not exist or be empty, try settings timestamp
          if (settings.providerLockTimestamp) {
            sessionStart = settings.providerLockTimestamp;
          }
        }
        
        // Fallback to provider assumptions for model
        model = await this.extractModelFromLogs(logPath, settings.providerLock);
        
        // Use settings token data as fallback
        aggregatedInputTokens = settings.tokenUsage?.inputTokens || 0;
        aggregatedOutputTokens = settings.tokenUsage?.outputTokens || 0;
      }
      
      // Count user prompts from session conversation file
      userPrompts = await this.countUserPromptsInSession(sessionId);

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
    const sessions = [];
    
    for (const sessionId of sessionIds) {
      const session = await this.parseSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }
    
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
    const sessions = [];
    
    for (const sessionId of sessionIds) {
      const session = await this.parseSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }
    
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
        acc.totalPrompts += item.userPrompts || 0;
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
    const sessions = [];

    for (const sessionId of sessionIds) {
      const session = await this.parseSession(sessionId);
      if (session && session.date) {
        sessions.push(session);
      }
    }

    const filteredSessions = this.filterSessionsByDate(sessions, options.since, options.until);
    const blockData = this.groupSessionsByBlock(filteredSessions);

    return {
      type: 'blocks',
      data: blockData,
      summary: this.calculateSummary(blockData)
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

  outputSummary(summary) {
    console.log();
    console.log(chalk.bold('Summary:'));
    console.log(`  Total Sessions: ${this.formatNumber(summary.totalSessions)}`);
    console.log(`  Total Tokens: ${this.formatNumber(summary.totalTokens)}`);
    console.log(`  Total Prompts: ${this.formatNumber(summary.totalPrompts)}`);
    console.log(`  Total Cost: ${this.formatCost(summary.totalCost)}`);
    console.log(`  Total Active Time: ${this.formatTime(summary.totalActiveTime)}`);
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
    }

    this.outputSummary(results.summary);
  }
}

module.exports = FactoryUsageAnalyzer;
