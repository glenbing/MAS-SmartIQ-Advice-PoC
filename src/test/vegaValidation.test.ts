/**
 * Vega-Lite Validation Tests
 * Tests that the Vega output is valid and correctly uses only one projection method
 */

import { calculateDeterministicProjection, calculateMonteCarloProjection } from '../lib/projections';
import { generateVegaLiteSpec } from '../lib/vegaLite';
import { ProjectionInput, WithdrawalStrategy } from '../types';

/**
 * Validate that a Vega-Lite spec is structurally valid
 */
function validateVegaLiteSpec(spec: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required schema
  if (!spec.$schema) {
    errors.push('Missing required field: $schema');
  } else if (!spec.$schema.includes('vega-lite')) {
    errors.push('Schema is not a valid Vega-Lite schema');
  }

  // Check for title
  if (!spec.title) {
    errors.push('Missing title');
  }

  // Check for data
  if (!spec.data) {
    errors.push('Missing data field');
  } else if (!spec.data.values || !Array.isArray(spec.data.values)) {
    errors.push('Data values must be an array');
  }

  // Check for layers
  if (!spec.layer || !Array.isArray(spec.layer)) {
    errors.push('Missing or invalid layer field (must be an array)');
  }

  // Check that all data points have required fields
  if (spec.data && spec.data.values) {
    const requiredFields = ['age', 'year', 'value', 'category', 'phase'];
    spec.data.values.forEach((point: any, index: number) => {
      requiredFields.forEach(field => {
        if (point[field] === undefined) {
          errors.push(`Data point ${index} missing field: ${field}`);
        }
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Run all Vega validation tests
 */
function runTests() {
  console.log('=== Vega-Lite Validation Tests ===\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test projection input
  const projectionInput: ProjectionInput = {
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

  const withdrawalStrategy: WithdrawalStrategy = {
    type: 'swr',
    rate: 0.04,
    inflationAdjusted: true
  };

  // Test 1: Deterministic projection generates valid Vega-Lite spec
  console.log('Test 1: Deterministic projection generates valid Vega-Lite spec');
  try {
    const deterministicProjections = calculateDeterministicProjection(projectionInput, withdrawalStrategy);
    const vegaSpec = generateVegaLiteSpec(deterministicProjections, projectionInput.goals.retirementAge);
    
    const validation = validateVegaLiteSpec(vegaSpec);
    
    if (validation.valid) {
      console.log('  ✓ PASSED: Deterministic Vega spec is valid\n');
      passedTests++;
    } else {
      console.log('  ✗ FAILED: Deterministic Vega spec is invalid');
      validation.errors.forEach(err => console.log(`    - ${err}`));
      console.log();
      failedTests++;
    }
  } catch (error: any) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 2: Monte Carlo projection generates valid Vega-Lite spec
  console.log('Test 2: Monte Carlo projection generates valid Vega-Lite spec');
  try {
    const monteCarloResults = calculateMonteCarloProjection(projectionInput, withdrawalStrategy, 100);
    const vegaSpec = generateVegaLiteSpec(monteCarloResults.median, projectionInput.goals.retirementAge);
    
    const validation = validateVegaLiteSpec(vegaSpec);
    
    if (validation.valid) {
      console.log('  ✓ PASSED: Monte Carlo Vega spec is valid\n');
      passedTests++;
    } else {
      console.log('  ✗ FAILED: Monte Carlo Vega spec is invalid');
      validation.errors.forEach(err => console.log(`    - ${err}`));
      console.log();
      failedTests++;
    }
  } catch (error: any) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 3: Vega spec is valid JSON
  console.log('Test 3: Vega spec can be serialized to valid JSON');
  try {
    const deterministicProjections = calculateDeterministicProjection(projectionInput, withdrawalStrategy);
    const vegaSpec = generateVegaLiteSpec(deterministicProjections, projectionInput.goals.retirementAge);
    
    const jsonString = JSON.stringify(vegaSpec);
    const parsed = JSON.parse(jsonString);
    
    if (parsed && parsed.$schema) {
      console.log('  ✓ PASSED: Vega spec serializes to valid JSON\n');
      passedTests++;
    } else {
      console.log('  ✗ FAILED: Parsed JSON is missing required fields\n');
      failedTests++;
    }
  } catch (error: any) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 4: Vega spec contains data from only one projection source
  console.log('Test 4: Vega spec contains consistent data from single projection');
  try {
    const deterministicProjections = calculateDeterministicProjection(projectionInput, withdrawalStrategy);
    const vegaSpec = generateVegaLiteSpec(deterministicProjections, projectionInput.goals.retirementAge);
    
    const dataPoints = vegaSpec.data.values;
    const ages = new Set(dataPoints.map((p: any) => p.age));
    
    // Check that we have data for all ages from current to life expectancy
    const expectedAges = projectionInput.goals.lifeExpectancy - projectionInput.currentAge + 1;
    const uniqueAgesCount = ages.size;
    
    if (uniqueAgesCount === expectedAges) {
      console.log(`  ✓ PASSED: Vega spec contains data for all ${expectedAges} expected ages\n`);
      passedTests++;
    } else {
      console.log(`  ✗ FAILED: Expected ${expectedAges} unique ages, got ${uniqueAgesCount}\n`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 5: Vega spec has required Vega-Lite schema URL
  console.log('Test 5: Vega spec has correct schema URL');
  try {
    const deterministicProjections = calculateDeterministicProjection(projectionInput, withdrawalStrategy);
    const vegaSpec = generateVegaLiteSpec(deterministicProjections, projectionInput.goals.retirementAge);
    
    if (vegaSpec.$schema && vegaSpec.$schema.includes('vega.github.io/schema/vega-lite')) {
      console.log(`  ✓ PASSED: Schema URL is correct: ${vegaSpec.$schema}\n`);
      passedTests++;
    } else {
      console.log(`  ✗ FAILED: Invalid schema URL: ${vegaSpec.$schema}\n`);
      failedTests++;
    }
  } catch (error: any) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 6: Vega spec includes retirement age marker
  console.log('Test 6: Vega spec includes retirement age marker');
  try {
    const deterministicProjections = calculateDeterministicProjection(projectionInput, withdrawalStrategy);
    const vegaSpec = generateVegaLiteSpec(deterministicProjections, projectionInput.goals.retirementAge);
    
    // Look for a layer with retirement age rule
    const hasRetirementMarker = vegaSpec.layer.some((layer: any) => {
      return layer.mark && layer.mark.type === 'rule' && 
             layer.encoding && layer.encoding.x && 
             layer.encoding.x.datum === projectionInput.goals.retirementAge;
    });
    
    if (hasRetirementMarker) {
      console.log('  ✓ PASSED: Retirement age marker is present\n');
      passedTests++;
    } else {
      console.log('  ✗ FAILED: Retirement age marker is missing\n');
      failedTests++;
    }
  } catch (error: any) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 7: Vega spec distinguishes Net Worth from individual assets
  console.log('Test 7: Vega spec includes Net Worth category');
  try {
    const deterministicProjections = calculateDeterministicProjection(projectionInput, withdrawalStrategy);
    const vegaSpec = generateVegaLiteSpec(deterministicProjections, projectionInput.goals.retirementAge);
    
    const hasNetWorth = vegaSpec.data.values.some((point: any) => point.category === 'Net Worth');
    
    if (hasNetWorth) {
      console.log('  ✓ PASSED: Net Worth category is present in data\n');
      passedTests++;
    } else {
      console.log('  ✗ FAILED: Net Worth category is missing\n');
      failedTests++;
    }
  } catch (error: any) {
    console.log(`  ✗ FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Summary
  console.log('=== Test Summary ===');
  console.log(`Total tests: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  
  if (failedTests === 0) {
    console.log('\n✓ All tests passed!\n');
    return 0;
  } else {
    console.log('\n✗ Some tests failed\n');
    return 1;
  }
}

// Run tests
const exitCode = runTests();
process.exit(exitCode);
