const fs = require('fs');
const path = require('path');

// Simulate ORIGINAL parseLogEntriesForSession
function originalParse(sessionId, logsDir) {
  const logPath = path.join(logsDir, 'droid-log-single.log');
  const logData = fs.readFileSync(logPath, 'utf8');
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
        sessionEntries.push({ modelId: match[1] });
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
          inputTokens: inputMatch ? parseInt(inputMatch[1]) || 0 : 0
        });
      }
    }
  }

  return sessionEntries;
}

// Get first session ID with actual data
const sessionsDir = require('os').homedir() + '/.factory/sessions';
const logsDir = path.join(path.dirname(sessionsDir), 'logs');
const files = fs.readdirSync(sessionsDir);

// Find a session with token data
let sessionId = null;
let settings = null;
for (const file of files) {
  if (!file.endsWith('.settings.json')) continue;
  const id = file.replace('.settings.json', '');
  const settingsPath = path.join(sessionsDir, file);
  const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  if (s.tokenUsage && s.tokenUsage.outputTokens > 0) {
    sessionId = id;
    settings = s;
    break;
  }
}

if (!sessionId) {
  console.log('No session with token data found');
  process.exit(1);
}

console.log('\n=== Session:', sessionId.substring(0, 12) + '...', '===');

// Test original
const originalEntries = originalParse(sessionId, logsDir);

console.log('\nOriginal method results:');
console.log('  Entries found:', originalEntries.length);
console.log('  Output tokens from logs:', originalEntries.reduce((sum, e) => sum + (e.outputTokens || 0), 0));
console.log('  Input tokens from logs:', originalEntries.reduce((sum, e) => sum + (e.inputTokens || 0), 0));
console.log('\nSettings data:');
console.log('  Output tokens:', settings.tokenUsage?.outputTokens || 0);
console.log('  Input tokens:', settings.tokenUsage?.inputTokens || 0);

// Now test cached version
const Analyzer = require('./src/analyzer');
const analyzer = new Analyzer(sessionsDir);
(async () => {
  const logCache = await analyzer.parseAllSessionLogs();
  const cachedEntries = logCache.get(sessionId) || [];
  
  console.log('\nCached method results:');
  console.log('  Entries found:', cachedEntries.length);
  console.log('  Output tokens from cache:', cachedEntries.reduce((sum, e) => sum + (e.outputTokens || 0), 0));
  console.log('  Input tokens from cache:', cachedEntries.reduce((sum, e) => sum + (e.inputTokens || 0), 0));
  
  if (originalEntries.length !== cachedEntries.length) {
    console.log('\n❌ MISMATCH: Entry counts differ!');
    console.log('   Original:', originalEntries.length, 'vs Cached:', cachedEntries.length);
  } else {
    console.log('\n✓ Entry counts match');
  }
  
  const origOutput = originalEntries.reduce((sum, e) => sum + (e.outputTokens || 0), 0);
  const cachedOutput = cachedEntries.reduce((sum, e) => sum + (e.outputTokens || 0), 0);
  
  if (origOutput !== cachedOutput) {
    console.log('❌ MISMATCH: Output token sums differ!');
    console.log('   Difference:', origOutput - cachedOutput);
  } else {
    console.log('✓ Output token sums match');
  }
})();
