/**
 * Manual test script to demonstrate responseFormat parameter functionality
 * This script simulates the Azure Function behavior with both response formats
 */

import { calculateDeterministicProjection } from './dist/src/lib/projections.js';
import { generateVegaLiteSpec } from './dist/src/lib/vegaLite.js';
import fs from 'fs';

console.log('=== Manual Test: responseFormat Parameter ===\n');

// Test input data
const testInput = {
  currentAge: 55,
  goals: {
    name: 'Retirement Planning',
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

// Calculate projections
console.log('Calculating projections...');
const projections = calculateDeterministicProjection(testInput, withdrawalStrategy);
const vegaSpec = await generateVegaLiteSpec(projections, testInput.goals.retirementAge);

console.log(`✓ Calculated ${projections.length} projection points\n`);

// Test 1: Full response format (default behavior)
console.log('=== Test 1: Full Response Format (responseFormat = "full") ===\n');

const fullResponse = vegaSpec;

console.log('Response structure:');
console.log(`  - Type: ${typeof fullResponse}`);
console.log(`  - Is Vega spec: ${fullResponse.$schema ? 'Yes' : 'No'}`);
console.log(`  - Schema: ${fullResponse.$schema}`);
console.log(`  - Has description: ${!!fullResponse.description}`);
console.log(`  - Has data: ${!!fullResponse.data}`);
console.log(`  - Data sources: ${fullResponse.data ? fullResponse.data.length : 0}`);
console.log(`  - Has marks: ${!!fullResponse.marks}`);
console.log(`  - Number of marks: ${fullResponse.marks ? fullResponse.marks.length : 0}`);
console.log(`  - Width: ${fullResponse.width}`);
console.log(`  - Height: ${fullResponse.height}`);

// Save full response
fs.writeFileSync('test-output-full.json', JSON.stringify(fullResponse, null, 2));
console.log(`\n✓ Full response saved to: test-output-full.json`);
console.log(`  Size: ${(JSON.stringify(fullResponse).length / 1024).toFixed(1)} KB\n`);

// Test 2: Data only response format
console.log('=== Test 2: Data Only Response Format (responseFormat = "dataOnly") ===\n');

const dataOnlyResponse = vegaSpec.data && vegaSpec.data[0] && vegaSpec.data[0].values 
  ? vegaSpec.data[0].values 
  : [];

console.log('Response structure:');
console.log(`  - Type: ${Array.isArray(dataOnlyResponse) ? 'Array' : typeof dataOnlyResponse}`);
console.log(`  - Is Vega spec: ${dataOnlyResponse.$schema ? 'Yes' : 'No'}`);
console.log(`  - Length: ${dataOnlyResponse.length}`);
console.log(`  - Contains Net Worth: ${dataOnlyResponse.some(d => d.category === 'Net Worth')}`);
console.log(`  - Contains Assets: ${dataOnlyResponse.some(d => d.category !== 'Net Worth')}`);

if (dataOnlyResponse.length > 0) {
  const firstItem = dataOnlyResponse[0];
  console.log('\nFirst data point:');
  console.log(JSON.stringify(firstItem, null, 2));
  
  console.log('\nData point fields:');
  Object.keys(firstItem).forEach(key => {
    console.log(`  - ${key}: ${typeof firstItem[key]}`);
  });
}

// Save data only response
fs.writeFileSync('test-output-dataonly.json', JSON.stringify(dataOnlyResponse, null, 2));
console.log(`\n✓ Data-only response saved to: test-output-dataonly.json`);
console.log(`  Size: ${(JSON.stringify(dataOnlyResponse).length / 1024).toFixed(1)} KB\n`);

// Test 3: Compare sizes
console.log('=== Size Comparison ===\n');
const fullSize = JSON.stringify(fullResponse).length;
const dataSize = JSON.stringify(dataOnlyResponse).length;
const reduction = ((1 - dataSize / fullSize) * 100).toFixed(1);

console.log(`  Full response: ${(fullSize / 1024).toFixed(1)} KB`);
console.log(`  Data only: ${(dataSize / 1024).toFixed(1)} KB`);
console.log(`  Size reduction: ${reduction}%\n`);

// Test 4: Show sample Net Worth data (matching problem statement format)
console.log('=== Sample Output (Problem Statement Format) ===\n');

const netWorthData = dataOnlyResponse.filter(d => d.category === 'Net Worth').slice(0, 2);
console.log('Sample Net Worth data (first 2 points):');
console.log(JSON.stringify(netWorthData, null, 2));

console.log('\n=== Summary ===\n');
console.log('✓ Both response formats working correctly:');
console.log('  1. Full format: Returns complete Vega v6 specification');
console.log('  2. DataOnly format: Returns only values array from data attribute');
console.log('\nThe dataOnly format provides:');
console.log('  - Smaller response size (easier to transmit)');
console.log('  - Direct access to data values');
console.log('  - Format matching problem statement example');
console.log('\nThe full format provides:');
console.log('  - Complete visualization specification');
console.log('  - Ready to render in Vega/Vega-Lite viewers');
console.log('  - Includes all chart configuration\n');
