/**
 * Demo script that simulates the Azure Function API response
 * Loads example-request.json and generates a full response
 */

const fs = require('fs');
const path = require('path');

const { calculateDeterministicProjection, calculateMonteCarloProjection } = require('./dist/src/lib/projections');
const { generateVegaLiteSpec } = require('./dist/src/lib/vegaLite');

// Load example request
const exampleRequest = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'example-request.json'), 'utf8')
);

console.log('=== NZ Financial Projections API Demo ===\n');
console.log('Processing request with:');
console.log(`  Current Age: ${exampleRequest.currentAge}`);
console.log(`  Retirement Age: ${exampleRequest.goals.retirementAge}`);
console.log(`  Life Expectancy: ${exampleRequest.goals.lifeExpectancy}`);
console.log(`  Assets: ${exampleRequest.assets.length}`);
exampleRequest.assets.forEach(asset => {
  console.log(`    - ${asset.name} (${asset.type}): $${asset.currentValue.toLocaleString()}`);
});
console.log(`  Liabilities: ${exampleRequest.liabilities.length}`);
exampleRequest.liabilities.forEach(liability => {
  console.log(`    - ${liability.name}: $${liability.currentBalance.toLocaleString()}`);
});
console.log(`  Withdrawal Strategy: ${exampleRequest.withdrawalStrategy.type.toUpperCase()} (${exampleRequest.withdrawalStrategy.rate * 100}% rate)`);
console.log(`  Simulations: ${exampleRequest.numSimulations}\n`);

// Test both projection methods
console.log('=== Testing Projection Methods ===\n');

// Test 1: Monte Carlo projection (default)
console.log('Test 1: Monte Carlo Projection Method');
const input1 = {
  currentAge: exampleRequest.currentAge,
  goals: exampleRequest.goals,
  assets: exampleRequest.assets,
  liabilities: exampleRequest.liabilities,
  inflationRate: exampleRequest.inflationRate,
  taxYear: exampleRequest.taxYear,
  projectionMethod: 'monteCarlo'
};

const withdrawalStrategy = exampleRequest.withdrawalStrategy;

const startTime1 = Date.now();
const monteCarloResults = calculateMonteCarloProjection(input1, withdrawalStrategy, exampleRequest.numSimulations);
const vegaLiteSpecMC = generateVegaLiteSpec(
  monteCarloResults.median,
  input1.goals.retirementAge
);
const time1 = Date.now() - startTime1;

console.log(`  ✓ Completed in ${time1}ms`);
console.log(`  Success Rate: ${monteCarloResults.successRate.toFixed(1)}%`);
console.log(`  Vega data points: ${vegaLiteSpecMC.data.values.length}\n`);

// Test 2: Deterministic projection
console.log('Test 2: Deterministic Projection Method');
const input2 = {
  currentAge: exampleRequest.currentAge,
  goals: exampleRequest.goals,
  assets: exampleRequest.assets,
  liabilities: exampleRequest.liabilities,
  inflationRate: exampleRequest.inflationRate,
  taxYear: exampleRequest.taxYear,
  projectionMethod: 'deterministic'
};

const startTime2 = Date.now();
const deterministicProjections = calculateDeterministicProjection(input2, withdrawalStrategy);
const vegaLiteSpecDet = generateVegaLiteSpec(
  deterministicProjections,
  input2.goals.retirementAge
);
const time2 = Date.now() - startTime2;

console.log(`  ✓ Completed in ${time2}ms`);
console.log(`  Vega data points: ${vegaLiteSpecDet.data.values.length}\n`);

console.log('Performance comparison:');
console.log(`  Monte Carlo: ${time1}ms (includes ${exampleRequest.numSimulations} simulations)`);
console.log(`  Deterministic: ${time2}ms (single projection)`);
console.log(`  Speedup: ${(time1/time2).toFixed(1)}x faster with deterministic\n`);

console.log('=== Using Monte Carlo Results for Demo ===\n');

// Build API response (using Monte Carlo for demo)
const apiResponse = {
  deterministic: null,
  monteCarlo: {
    median: monteCarloResults.median,
    p10: monteCarloResults.p10,
    p25: monteCarloResults.p25,
    p75: monteCarloResults.p75,
    p90: monteCarloResults.p90,
    successRate: monteCarloResults.successRate
  },
  vegaLiteSpec: vegaLiteSpecMC
};

// Display summary
console.log('=== Results Summary ===\n');

console.log('Starting Position (Age 35):');
const startPoint = monteCarloResults.median[0];
console.log(`  Total Assets: $${Object.values(startPoint.assets).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
startPoint.assets && Object.entries(startPoint.assets).forEach(([name, value]) => {
  console.log(`    - ${name}: $${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
});
console.log(`  Net Worth: $${startPoint.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n`);

console.log(`At Retirement (Age ${input1.goals.retirementAge}):`);
const retirementIndex = input1.goals.retirementAge - input1.currentAge;
const retirementPoint = monteCarloResults.median[retirementIndex];
console.log(`  Total Assets: $${Object.values(retirementPoint.assets).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
retirementPoint.assets && Object.entries(retirementPoint.assets).forEach(([name, value]) => {
  console.log(`    - ${name}: $${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
});
console.log(`  Net Worth: $${retirementPoint.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  Annual Withdrawal: $${(retirementPoint.withdrawalAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}\n`);

console.log(`At Life Expectancy (Age ${input1.goals.lifeExpectancy}):`);
const endPoint = monteCarloResults.median[monteCarloResults.median.length - 1];
console.log(`  Net Worth (Median): $${endPoint.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  Net Worth (P10): $${monteCarloResults.p10[monteCarloResults.p10.length - 1].netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  Net Worth (P90): $${monteCarloResults.p90[monteCarloResults.p90.length - 1].netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  Annual Withdrawal: $${(endPoint.withdrawalAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  Sustainability Ratio: ${(endPoint.sustainabilityRatio || 0).toFixed(2)}\n`);

console.log('Monte Carlo Analysis:');
console.log(`  Success Rate: ${monteCarloResults.successRate.toFixed(1)}%`);
console.log(`  Simulations: ${exampleRequest.numSimulations}`);
console.log(`  Interpretation: ${monteCarloResults.successRate >= 90 ? '✓ Highly sustainable' : monteCarloResults.successRate >= 75 ? '⚠ Moderately sustainable' : '✗ Risk of depletion'}\n`);

// Save full response to file
const outputPath = path.join(__dirname, 'example-response.json');
fs.writeFileSync(outputPath, JSON.stringify(apiResponse, null, 2));
console.log(`Full API response saved to: ${path.basename(outputPath)}`);
console.log(`Response size: ${(JSON.stringify(apiResponse).length / 1024).toFixed(1)} KB\n`);

// Display Vega-Lite information
console.log('Vega-Lite Visualization:');
console.log(`  Chart type: Multi-layer line chart`);
console.log(`  Data points: ${vegaLiteSpecMC.data.values.length}`);
console.log(`  Layers: ${vegaLiteSpecMC.layer.length}`);
console.log(`  - Background phase rectangles`);
console.log(`  - Retirement age marker`);
console.log(`  - Asset performance lines`);
console.log(`  - Net worth line (bold)`);
console.log(`  - Retirement age annotation`);
console.log('\n  To visualize:');
console.log('  1. Copy vegaLiteSpec from example-response.json');
console.log('  2. Paste into https://vega.github.io/editor/');
console.log('  3. Or use vega-embed in your application\n');

console.log('=== API Response Ready ===\n');
console.log('The function returns:');
console.log('  - deterministic: Array of projection points (linear growth)');
console.log('  - monteCarlo: Object with percentile arrays (p10, p25, median, p75, p90)');
console.log('  - vegaLiteSpec: Complete Vega-Lite visualization specification');
console.log('  - successRate: Percentage of successful retirement scenarios\n');
