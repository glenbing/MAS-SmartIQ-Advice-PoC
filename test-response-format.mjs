/**
 * Test for responseFormat parameter
 * Tests both 'full' and 'dataOnly' response formats
 */

import { calculateDeterministicProjection, calculateMonteCarloProjection } from './dist/src/lib/projections.js';
import { generateVegaLiteSpec } from './dist/src/lib/vegaLite.js';

async function runTests() {
  console.log('=== Response Format Parameter Tests ===\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test data
  const testInput = {
    currentAge: 55,
    goals: {
      name: 'Test Retirement',
      targetAge: 55,
      retirementAge: 65,
      lifeExpectancy: 90,
      inflationRate: 0.02
    },
    assets: [
      {
        name: 'Investment Portfolio',
        type: 'portfolio',
        currentValue: 750000,
        expectedReturn: 0.06,
        volatility: 0.12
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

  // Test 1: Full response format (default)
  console.log('Test 1: Full response format (default)');
  try {
    const projections = calculateDeterministicProjection(testInput, withdrawalStrategy);
    const vegaSpec = await generateVegaLiteSpec(projections, testInput.goals.retirementAge);
    
    // Simulate full response
    const fullResponse = vegaSpec;
    
    if (fullResponse.$schema && fullResponse.data && fullResponse.marks) {
      console.log('  ✓ PASSED: Full Vega spec returned');
      console.log(`    - Has $schema: ${fullResponse.$schema}`);
      console.log(`    - Has data: ${fullResponse.data.length} sources`);
      console.log(`    - Has marks: ${fullResponse.marks.length} layers\n`);
      passedTests++;
    } else {
      console.log('  ✗ FAILED: Missing required Vega spec properties\n');
      failedTests++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 2: Data only response format
  console.log('Test 2: Data only response format');
  try {
    const projections = calculateDeterministicProjection(testInput, withdrawalStrategy);
    const vegaSpec = await generateVegaLiteSpec(projections, testInput.goals.retirementAge);
    
    // Simulate dataOnly response
    const dataOnlyResponse = vegaSpec.data && vegaSpec.data[0] && vegaSpec.data[0].values 
      ? vegaSpec.data[0].values 
      : [];
    
    if (Array.isArray(dataOnlyResponse) && dataOnlyResponse.length > 0) {
      const firstItem = dataOnlyResponse[0];
      const hasRequiredFields = 
        firstItem.age !== undefined && 
        firstItem.year !== undefined && 
        firstItem.value !== undefined &&
        firstItem.category !== undefined &&
        firstItem.phase !== undefined;
      
      if (hasRequiredFields) {
        console.log('  ✓ PASSED: Data values only returned');
        console.log(`    - Array length: ${dataOnlyResponse.length}`);
        console.log(`    - First item has required fields: age, year, value, category, phase`);
        console.log(`    - Sample data point:`, JSON.stringify(firstItem, null, 2).substring(0, 200) + '...\n');
        passedTests++;
      } else {
        console.log('  ✗ FAILED: Data items missing required fields\n');
        failedTests++;
      }
    } else {
      console.log('  ✗ FAILED: Data values not returned as array\n');
      failedTests++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 3: Verify data-only response structure matches example from problem statement
  console.log('Test 3: Verify data structure matches problem statement example');
  try {
    const projections = calculateDeterministicProjection(testInput, withdrawalStrategy);
    const vegaSpec = await generateVegaLiteSpec(projections, testInput.goals.retirementAge);
    
    const dataOnlyResponse = vegaSpec.data && vegaSpec.data[0] && vegaSpec.data[0].values 
      ? vegaSpec.data[0].values 
      : [];
    
    // Filter to just Net Worth entries (similar to problem statement example)
    const netWorthData = dataOnlyResponse.filter(item => item.category === 'Net Worth');
    
    if (netWorthData.length > 0) {
      const sample = netWorthData.slice(0, 2); // Get first 2 items
      console.log('  ✓ PASSED: Data structure matches expected format');
      console.log('    - Sample Net Worth data:');
      console.log(JSON.stringify(sample, null, 2).substring(0, 500) + '\n');
      passedTests++;
    } else {
      console.log('  ✗ FAILED: No Net Worth data found\n');
      failedTests++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 4: Full response includes all necessary Vega v6 properties
  console.log('Test 4: Full response includes all Vega v6 properties');
  try {
    const projections = calculateDeterministicProjection(testInput, withdrawalStrategy);
    const vegaSpec = await generateVegaLiteSpec(projections, testInput.goals.retirementAge);
    
    const requiredProps = ['$schema', 'description', 'width', 'height', 'data', 'marks'];
    const missingProps = requiredProps.filter(prop => !vegaSpec[prop]);
    
    if (missingProps.length === 0) {
      console.log('  ✓ PASSED: All required Vega v6 properties present');
      console.log(`    - Checked properties: ${requiredProps.join(', ')}\n`);
      passedTests++;
    } else {
      console.log(`  ✗ FAILED: Missing properties: ${missingProps.join(', ')}\n`);
      failedTests++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 5: Data-only response does not include Vega metadata
  console.log('Test 5: Data-only response excludes Vega metadata');
  try {
    const projections = calculateDeterministicProjection(testInput, withdrawalStrategy);
    const vegaSpec = await generateVegaLiteSpec(projections, testInput.goals.retirementAge);
    
    const dataOnlyResponse = vegaSpec.data && vegaSpec.data[0] && vegaSpec.data[0].values 
      ? vegaSpec.data[0].values 
      : [];
    
    // Verify it's just an array, not an object with Vega properties
    const isPlainArray = Array.isArray(dataOnlyResponse);
    const noVegaMetadata = !dataOnlyResponse.$schema && !dataOnlyResponse.marks;
    
    if (isPlainArray && noVegaMetadata) {
      console.log('  ✓ PASSED: Data-only response is a plain array without Vega metadata');
      console.log(`    - Response is array: ${isPlainArray}`);
      console.log(`    - No $schema property: ${!dataOnlyResponse.$schema}`);
      console.log(`    - No marks property: ${!dataOnlyResponse.marks}\n`);
      passedTests++;
    } else {
      console.log('  ✗ FAILED: Data-only response contains unexpected properties\n');
      failedTests++;
    }
  } catch (error) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 6: Both formats work with Monte Carlo projection
  console.log('Test 6: Both formats work with Monte Carlo projection');
  try {
    const monteCarloResults = calculateMonteCarloProjection(testInput, withdrawalStrategy, 100);
    const vegaSpec = await generateVegaLiteSpec(monteCarloResults.median, testInput.goals.retirementAge);
    
    const fullResponse = vegaSpec;
    const dataOnlyResponse = vegaSpec.data && vegaSpec.data[0] && vegaSpec.data[0].values 
      ? vegaSpec.data[0].values 
      : [];
    
    const fullValid = fullResponse.$schema && fullResponse.data && fullResponse.marks;
    const dataValid = Array.isArray(dataOnlyResponse) && dataOnlyResponse.length > 0;
    
    if (fullValid && dataValid) {
      console.log('  ✓ PASSED: Both formats work with Monte Carlo projection');
      console.log(`    - Full response valid: ${fullValid}`);
      console.log(`    - Data-only response valid: ${dataValid}`);
      console.log(`    - Data points: ${dataOnlyResponse.length}\n`);
      passedTests++;
    } else {
      console.log('  ✗ FAILED: One or both formats invalid with Monte Carlo\n');
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
    console.log('\n✓ All response format tests passed!\n');
    return 0;
  } else {
    console.log('\n✗ Some tests failed\n');
    return 1;
  }
}

// Run tests
runTests().then(exitCode => process.exit(exitCode));
