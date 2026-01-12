/**
 * Integration test for projection method parameter
 * Tests the full API behavior with both deterministic and Monte Carlo methods
 */

import { calculateDeterministicProjection, calculateMonteCarloProjection } from './dist/src/lib/projections.js';
import { generateVegaLiteSpec } from './dist/src/lib/vegaLite.js';

async function runTests() {
  console.log('=== Projection Method Parameter Tests ===\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test data
  const testInput = {
    currentAge: 35,
    goals: {
      name: 'Test Retirement',
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
      }
    ],
    liabilities: [],
    inflationRate: 0.02,
    taxYear: 2024
  };

  const withdrawalStrategy = {
    type: 'swr',
    rate: 0.04,
    inflationAdjusted: true
  };

  // Test 1: Deterministic method produces valid Vega spec
  console.log('Test 1: Deterministic projection method');
  try {
    const input = { ...testInput, projectionMethod: 'deterministic' };
    const projections = calculateDeterministicProjection(input, withdrawalStrategy);
    const vegaSpec = await generateVegaLiteSpec(projections, input.goals.retirementAge);
    
    if (vegaSpec && vegaSpec.$schema && vegaSpec.data && vegaSpec.data.length > 0) {
      console.log('  ✓ PASSED: Deterministic method works correctly');
      console.log(`    - Generated Vega spec with ${vegaSpec.data.length} data sources\n`);
      passedTests++;
    } else {
      console.log('  ✗ FAILED: Invalid Vega spec structure\n');
      failedTests++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 2: Monte Carlo method produces valid Vega spec
  console.log('Test 2: Monte Carlo projection method');
  try {
    const input = { ...testInput, projectionMethod: 'monteCarlo' };
    const monteCarloResults = calculateMonteCarloProjection(input, withdrawalStrategy, 100);
    const vegaSpec = await generateVegaLiteSpec(monteCarloResults.median, input.goals.retirementAge);
    
    if (vegaSpec && vegaSpec.$schema && vegaSpec.data && vegaSpec.data.length > 0 && monteCarloResults.successRate !== undefined) {
      console.log('  ✓ PASSED: Monte Carlo method works correctly');
      console.log(`    - Generated Vega spec with ${vegaSpec.data.length} data sources`);
      console.log(`    - Success rate: ${monteCarloResults.successRate.toFixed(1)}%\n`);
      passedTests++;
  } else {
    console.log('  ✗ FAILED: Invalid Vega spec or missing success rate\n');
    failedTests++;
  }
} catch (error) {
  console.log(`  ✗ FAILED: ${error.message}\n`);
  failedTests++;
}

// Test 3: Both methods produce same number of projection points
console.log('Test 3: Projection point count consistency');
try {
  const detProjections = calculateDeterministicProjection(testInput, withdrawalStrategy);
  const mcResults = calculateMonteCarloProjection(testInput, withdrawalStrategy, 100);
  
  if (detProjections.length === mcResults.median.length) {
    console.log(`  ✓ PASSED: Both methods produce ${detProjections.length} projection points\n`);
    passedTests++;
  } else {
    console.log(`  ✗ FAILED: Deterministic (${detProjections.length}) != Monte Carlo (${mcResults.median.length})\n`);
    failedTests++;
  }
} catch (error) {
  console.log(`  ✗ FAILED: ${error.message}\n`);
  failedTests++;
}

// Test 4: Vega specs from both methods have same structure
console.log('Test 4: Vega spec structural consistency');
try {
  const detProjections = calculateDeterministicProjection(testInput, withdrawalStrategy);
  const mcResults = calculateMonteCarloProjection(testInput, withdrawalStrategy, 100);
  
  const vegaSpecDet = await generateVegaLiteSpec(detProjections, testInput.goals.retirementAge);
  const vegaSpecMC = await generateVegaLiteSpec(mcResults.median, testInput.goals.retirementAge);
  
  // Check they have the same structure
  const detKeys = Object.keys(vegaSpecDet).sort();
  const mcKeys = Object.keys(vegaSpecMC).sort();
  const sameKeys = JSON.stringify(detKeys) === JSON.stringify(mcKeys);
  
  const detLayers = vegaSpecDet.marks.length;
  const mcLayers = vegaSpecMC.marks.length;
  const sameLayers = detLayers === mcLayers;
  
  if (sameKeys && sameLayers) {
    console.log('  ✓ PASSED: Both Vega specs have identical structure');
    console.log(`    - Same top-level keys: ${detKeys.length}`);
    console.log(`    - Same number of layers: ${detLayers}\n`);
    passedTests++;
  } else {
    console.log('  ✗ FAILED: Vega specs have different structures');
    if (!sameKeys) console.log('    - Different keys');
    if (!sameLayers) console.log(`    - Different layers: Det=${detLayers}, MC=${mcLayers}\n`);
    failedTests++;
  }
} catch (error) {
  console.log(`  ✗ FAILED: ${error.message}\n`);
  failedTests++;
}

// Test 5: Deterministic projection is faster than Monte Carlo
console.log('Test 5: Performance comparison');
try {
  const start1 = Date.now();
  const detProjections = calculateDeterministicProjection(testInput, withdrawalStrategy);
  const detTime = Date.now() - start1;
  
  const start2 = Date.now();
  const mcResults = calculateMonteCarloProjection(testInput, withdrawalStrategy, 1000);
  const mcTime = Date.now() - start2;
  
  if (detTime < mcTime) {
    console.log('  ✓ PASSED: Deterministic is faster than Monte Carlo');
    console.log(`    - Deterministic: ${detTime}ms`);
    console.log(`    - Monte Carlo (1000 sims): ${mcTime}ms`);
    console.log(`    - Speedup: ${(mcTime/detTime).toFixed(1)}x\n`);
    passedTests++;
  } else {
    console.log('  ✗ FAILED: Monte Carlo was unexpectedly faster\n');
    failedTests++;
  }
} catch (error) {
  console.log(`  ✗ FAILED: ${error.message}\n`);
  failedTests++;
}

// Test 6: Verify Vega spec only contains data from selected projection
console.log('Test 6: Vega spec data source isolation');
try {
  const detProjections = calculateDeterministicProjection(testInput, withdrawalStrategy);
  const vegaSpecDet = await generateVegaLiteSpec(detProjections, testInput.goals.retirementAge);
  
  // Check that all net worth values match the deterministic projection
  const vegaNetWorthPoints = vegaSpecDet.data[0].values
    .filter(p => p.category === 'Net Worth')
    .sort((a, b) => a.age - b.age);
  
  const projectionNetWorth = detProjections.map(p => p.netWorth);
  
  let allMatch = true;
  for (let i = 0; i < Math.min(vegaNetWorthPoints.length, projectionNetWorth.length); i++) {
    if (Math.abs(vegaNetWorthPoints[i].value - projectionNetWorth[i]) > 0.01) {
      allMatch = false;
      break;
    }
  }
  
  if (allMatch) {
    console.log('  ✓ PASSED: Vega spec data matches source projection exactly');
    console.log(`    - Verified ${vegaNetWorthPoints.length} net worth data points\n`);
    passedTests++;
  } else {
    console.log('  ✗ FAILED: Vega spec data does not match source projection\n');
    failedTests++;
  }
} catch (error) {
  console.log(`  ✗ FAILED: ${error.message}\n`);
  failedTests++;
}

  // Summary
  console.log('=== Test Summary ===');
  console.log(`Total tests: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);

  if (failedTests === 0) {
    console.log('\n✓ All projection method tests passed!\n');
    return 0;
  } else {
    console.log('\n✗ Some tests failed\n');
    return 1;
  }
}

// Run tests
runTests().then(exitCode => process.exit(exitCode));
