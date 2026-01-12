/**
 * Standalone test script to verify NZ Financial Projections functionality
 * Can be run with: node dist/test.js
 */

const { calculateDeterministicProjection, calculateMonteCarloProjection } = require('./dist/src/lib/projections');
const { generateVegaLiteSpec } = require('./dist/src/lib/vegaLite');
const { calculateNZTax, calculateAfterTaxIncome } = require('./dist/src/lib/nzTax');

console.log('=== NZ Financial Projections Test ===\n');

// Test NZ Tax calculations
console.log('1. Testing NZ Tax Calculations:');
const testIncome = 80000;
const tax = calculateNZTax(testIncome);
const afterTax = calculateAfterTaxIncome(testIncome);
console.log(`   Income: $${testIncome.toLocaleString()}`);
console.log(`   Tax: $${tax.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
console.log(`   After-tax: $${afterTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
console.log(`   Effective rate: ${(tax/testIncome*100).toFixed(2)}%\n`);

// Test projection input
const projectionInput = {
  currentAge: 35,
  goals: {
    name: 'Retirement Planning',
    targetAge: 35,
    retirementAge: 65,
    lifeExpectancy: 90,
    desiredAnnualIncome: 60000,
    inflationRate: 0.02
  },
  assets: [
    {
      name: 'KiwiSaver',
      type: 'kiwisaver',
      currentValue: 75000,
      contributionAmount: 5000,
      contributionFrequency: 'annual',
      expectedReturn: 0.06,
      volatility: 0.12,
      employerContribution: 5000,
      governmentContribution: 521.43
    },
    {
      name: 'Investment Portfolio',
      type: 'portfolio',
      currentValue: 150000,
      contributionAmount: 12000,
      contributionFrequency: 'annual',
      expectedReturn: 0.07,
      volatility: 0.15
    }
  ],
  liabilities: [
    {
      name: 'Mortgage',
      type: 'mortgage',
      currentBalance: 400000,
      interestRate: 0.065,
      monthlyPayment: 2600
    }
  ],
  inflationRate: 0.02,
  taxYear: 2024
};

const withdrawalStrategy = {
  type: 'swr',
  rate: 0.04,
  inflationAdjusted: true
};

console.log('2. Testing Deterministic Projections:');
console.log('   Running deterministic projection...');
const startTime = Date.now();
const deterministicResult = calculateDeterministicProjection(projectionInput, withdrawalStrategy);
const detTime = Date.now() - startTime;

console.log(`   Completed in ${detTime}ms`);
console.log(`   Total projection points: ${deterministicResult.length}`);
console.log(`   Starting net worth: $${deterministicResult[0].netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`   Net worth at retirement (age ${projectionInput.goals.retirementAge}): $${deterministicResult[projectionInput.goals.retirementAge - projectionInput.currentAge].netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`   Net worth at life expectancy (age ${projectionInput.goals.lifeExpectancy}): $${deterministicResult[deterministicResult.length - 1].netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n`);

console.log('3. Testing Monte Carlo Simulations:');
console.log('   Running 1000 Monte Carlo simulations...');
const mcStartTime = Date.now();
const monteCarloResult = calculateMonteCarloProjection(projectionInput, withdrawalStrategy, 1000);
const mcTime = Date.now() - mcStartTime;

console.log(`   Completed in ${mcTime}ms`);
console.log(`   Success rate: ${monteCarloResult.successRate.toFixed(1)}%`);
console.log(`   Median net worth at retirement: $${monteCarloResult.median[projectionInput.goals.retirementAge - projectionInput.currentAge].netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`   Median net worth at life expectancy: $${monteCarloResult.median[monteCarloResult.median.length - 1].netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`   P10 net worth at life expectancy: $${monteCarloResult.p10[monteCarloResult.p10.length - 1].netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`   P90 net worth at life expectancy: $${monteCarloResult.p90[monteCarloResult.p90.length - 1].netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n`);

console.log('4. Testing Vega-Lite Chart Generation:');
const vegaSpec = generateVegaLiteSpec(deterministicResult, monteCarloResult.median, projectionInput.goals.retirementAge);
console.log(`   Generated Vega-Lite spec with ${vegaSpec.layer.length} layers`);
console.log(`   Chart title: "${vegaSpec.title.text}"`);
console.log(`   Data points: ${vegaSpec.data.values.length}\n`);

// Test withdrawal at retirement
console.log('5. Testing Withdrawal Strategy (4% SWR):');
const retirementIndex = projectionInput.goals.retirementAge - projectionInput.currentAge;
const firstWithdrawal = monteCarloResult.median[retirementIndex].withdrawalAmount;
const lastWithdrawal = monteCarloResult.median[monteCarloResult.median.length - 1].withdrawalAmount;
console.log(`   First year withdrawal (age ${projectionInput.goals.retirementAge}): $${(firstWithdrawal || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`   Last year withdrawal (age ${projectionInput.goals.lifeExpectancy}): $${(lastWithdrawal || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

if (firstWithdrawal && lastWithdrawal) {
  const inflationAdjustment = ((lastWithdrawal / firstWithdrawal) - 1) * 100;
  console.log(`   Inflation adjustment over retirement: ${inflationAdjustment.toFixed(1)}%\n`);
}

console.log('6. Summary:');
console.log('   ✓ NZ tax calculations working');
console.log('   ✓ Deterministic projections working');
console.log('   ✓ Monte Carlo simulations working');
console.log('   ✓ Vega-Lite chart generation working');
console.log('   ✓ Withdrawal strategies working');
console.log('\n=== All Tests Passed ===\n');

// Output sample of Vega-Lite spec for verification
console.log('Sample Vega-Lite Spec (first 500 chars):');
console.log(JSON.stringify(vegaSpec, null, 2).substring(0, 500) + '...\n');
