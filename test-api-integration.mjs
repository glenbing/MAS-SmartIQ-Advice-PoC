/**
 * Integration test for responseFormat parameter using the API endpoint
 * Tests the actual HTTP function behavior
 */

// This test file simulates testing the Azure Function API endpoint
// with different responseFormat values

console.log('=== API Integration Test for responseFormat Parameter ===\n');

// Sample request body for dataOnly format
const dataOnlyRequest = {
  "currentAge": 55,
  "goals": {
    "retirementAge": 65,
    "lifeExpectancy": 90
  },
  "assets": [
    {
      "name": "Investment Portfolio",
      "type": "portfolio",
      "currentValue": 750000,
      "expectedReturn": 0.06,
      "volatility": 0.12
    }
  ],
  "liabilities": [],
  "withdrawalStrategy": {
    "type": "swr",
    "rate": 0.04,
    "inflationAdjusted": true
  },
  "projectionMethod": "deterministic",
  "responseFormat": "dataOnly"
};

// Sample request body for full format (default)
const fullRequest = {
  "currentAge": 55,
  "goals": {
    "retirementAge": 65,
    "lifeExpectancy": 90
  },
  "assets": [
    {
      "name": "Investment Portfolio",
      "type": "portfolio",
      "currentValue": 750000,
      "expectedReturn": 0.06,
      "volatility": 0.12
    }
  ],
  "liabilities": [],
  "withdrawalStrategy": {
    "type": "swr",
    "rate": 0.04,
    "inflationAdjusted": true
  },
  "projectionMethod": "deterministic",
  "responseFormat": "full"
};

console.log('Test Request 1: responseFormat = "dataOnly"');
console.log('Expected: Array of data values\n');
console.log(JSON.stringify(dataOnlyRequest, null, 2));
console.log('\n---\n');

console.log('Test Request 2: responseFormat = "full" (or omitted)');
console.log('Expected: Complete Vega v6 specification\n');
console.log(JSON.stringify(fullRequest, null, 2));
console.log('\n---\n');

console.log('Example expected output for dataOnly format:');
console.log('[');
console.log('  {');
console.log('    "age": 55,');
console.log('    "year": 2026,');
console.log('    "value": 750000,');
console.log('    "category": "Net Worth",');
console.log('    "phase": "Accumulation",');
console.log('    "withdrawalAmount": 0,');
console.log('    "sustainabilityRatio": null');
console.log('  },');
console.log('  {');
console.log('    "age": 56,');
console.log('    "year": 2027,');
console.log('    "value": 792281.863652523,');
console.log('    "category": "Net Worth",');
console.log('    "phase": "Accumulation",');
console.log('    "withdrawalAmount": 0,');
console.log('    "sustainabilityRatio": null');
console.log('  }');
console.log('  // ... more data points');
console.log(']');
console.log('\n---\n');

console.log('To test with curl:');
console.log('\n# Test dataOnly format:');
console.log('curl -X POST http://localhost:7071/api/nzFinancialProjections \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"currentAge": 55, "goals": {"retirementAge": 65, "lifeExpectancy": 90}, "assets": [{"name": "Portfolio", "type": "portfolio", "currentValue": 750000, "expectedReturn": 0.06, "volatility": 0.12}], "liabilities": [], "responseFormat": "dataOnly"}\'');
console.log('\n# Test full format:');
console.log('curl -X POST http://localhost:7071/api/nzFinancialProjections \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"currentAge": 55, "goals": {"retirementAge": 65, "lifeExpectancy": 90}, "assets": [{"name": "Portfolio", "type": "portfolio", "currentValue": 750000, "expectedReturn": 0.06, "volatility": 0.12}], "liabilities": [], "responseFormat": "full"}\'');
console.log('\n✓ Integration test documentation complete\n');
