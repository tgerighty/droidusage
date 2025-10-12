const FactoryUsageAnalyzer = require('./src/analyzer');

async function diagnoseCostIssue() {
  console.log('Diagnosing cost calculation issue...\n');
  
  const analyzer = new FactoryUsageAnalyzer(process.env.HOME + '/.factory/sessions');
  
  try {
    const sessionIds = await analyzer.getSessionFiles();
    console.log(`Found ${sessionIds.length} sessions\n`);
    
    // Parse ALL sessions to see the real distribution
    console.log('Parsing all sessions (this may take a moment)...\n');
    
    const sampleSessions = await analyzer.parseSessionsBatch(sessionIds, false);
    
    let sessionsWithCost = 0;
    let sessionsWithoutCost = 0;
    const providerCounts = {};
    const modelCounts = {};
    const missingPricing = [];
    
    let totalTokensAllSessions = 0;
    let totalCostAllSessions = 0;
    
    for (const session of sampleSessions) {
      const cost = analyzer.calculateCost(session);
      totalTokensAllSessions += session.totalTokens;
      totalCostAllSessions += cost;
      
      // Only show details for problematic sessions
      if (cost === 0 && session.totalTokens > 0) {
        console.log(`\n⚠️  Session: ${session.id.substring(0, 12)}...`);
        console.log(`  Provider: "${session.provider}"`);
        console.log(`  Model: "${session.model}"`);
        console.log(`  Input Tokens: ${session.inputTokens.toLocaleString()}`);
        console.log(`  Output Tokens: ${session.outputTokens.toLocaleString()}`);
        console.log(`  Total Tokens: ${session.totalTokens.toLocaleString()}`);
        console.log(`  Calculated Cost: $${cost.toFixed(4)}`);
      }
      
      if (cost === 0 && session.totalTokens > 0) {
        sessionsWithoutCost++;
        missingPricing.push({
          provider: session.provider,
          model: session.model
        });
        console.log(`  ⚠️  WARNING: No cost calculated despite having ${session.totalTokens.toLocaleString()} tokens!`);
        
        // Check why
        const providerPricing = analyzer.pricing[session.provider];
        if (!providerPricing) {
          console.log(`  ❌ Provider "${session.provider}" not found in pricing table`);
          console.log(`  Available providers: ${Object.keys(analyzer.pricing).join(', ')}`);
        } else {
          const modelPricing = providerPricing[session.model];
          if (!modelPricing) {
            console.log(`  ❌ Model "${session.model}" not found in ${session.provider} pricing`);
            console.log(`  Available models: ${Object.keys(providerPricing).join(', ')}`);
          }
        }
      } else {
        sessionsWithCost++;
      }
      
      // Count providers and models
      providerCounts[session.provider] = (providerCounts[session.provider] || 0) + 1;
      modelCounts[session.model] = (modelCounts[session.model] || 0) + 1;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\nDIAGNOSTIC SUMMARY:');
    console.log(`  Total sessions analyzed: ${sampleSessions.length}`);
    console.log(`  Total tokens across all sessions: ${totalTokensAllSessions.toLocaleString()}`);
    console.log(`  Total cost calculated: $${totalCostAllSessions.toFixed(2)}`);
    console.log(`  Sessions with cost > 0: ${sessionsWithCost}`);
    console.log(`  Sessions with tokens but no cost: ${sessionsWithoutCost}`);
    
    console.log('\nProvider Distribution:');
    Object.entries(providerCounts).sort((a, b) => b[1] - a[1]).forEach(([provider, count]) => {
      console.log(`  ${provider}: ${count}`);
    });
    
    console.log('\nModel Distribution:');
    Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).forEach(([model, count]) => {
      console.log(`  ${model}: ${count}`);
    });
    
    if (missingPricing.length > 0) {
      console.log('\n⚠️  Missing pricing for:');
      const unique = [...new Set(missingPricing.map(m => `${m.provider}/${m.model}`))];
      unique.forEach(combo => console.log(`  - ${combo}`));
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error(error.stack);
  }
}

diagnoseCostIssue();
