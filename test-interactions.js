const FactoryUsageAnalyzer = require('./src/analyzer');

async function testUserInteractions() {
  console.log('Testing user interaction counting...\n');
  
  const analyzer = new FactoryUsageAnalyzer('/Users/cris/.factory/sessions');
  
  // Test with the current session
  const sessionId = 'dbe0ddba-7116-410d-8bd9-7e19b9674850';
  
  try {
    console.log('Parsing session...');
    const session = await analyzer.parseSession(sessionId);
    
    console.log('Session data:');
    console.log(`  ID: ${session.id}`);
    console.log(`  Model: ${session.model}`);
    console.log(`  User Interactions: ${session.userInteractions}`);
    console.log(`  Input Tokens: ${session.inputTokens}`);
    console.log(`  Output Tokens: ${session.outputTokens}`);
    console.log(`  Total Tokens: ${session.totalTokens}`);
    
    console.log('\n✅ User interaction counting test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserInteractions();
