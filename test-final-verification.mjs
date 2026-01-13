/**
 * Comprehensive test to verify all problem statement requirements
 */

import { calculateDeterministicProjection } from './dist/src/lib/projections.js';
import { generateVegaLiteSpec } from './dist/src/lib/vegaLite.js';

console.log('=' .repeat(80));
console.log('COMPREHENSIVE REQUIREMENTS VERIFICATION');
console.log('=' .repeat(80));
console.log();

console.log('Problem Statement:');
console.log('  1. Salary would be a fixed value');
console.log('  2. It would be expected to stop once hitting retirement');
console.log('  3. The chart needs to show liabilities as well as assets');
console.log();

// Test scenario with all elements
const testInput = {
  currentAge: 45,
  goals: {
    name: 'Complete Test',
    retirementAge: 65,
    lifeExpectancy: 85,
    inflationRate: 0.02
  },
  assets: [
    {
      name: 'Annual Salary',
      type: 'income',
      currentValue: 75000,  // Fixed annual salary
      expectedReturn: 0,
      volatility: 0
    },
    {
      name: 'KiwiSaver',
      type: 'kiwisaver',
      currentValue: 200000,
      contributionAmount: 7500,
      contributionFrequency: 'annual',
      expectedReturn: 0.06,
      volatility: 0.12,
      employerContribution: 7500,
      governmentContribution: 521.43
    },
    {
      name: 'Investment Portfolio',
      type: 'portfolio',
      currentValue: 300000,
      contributionAmount: 12000,
      contributionFrequency: 'annual',
      expectedReturn: 0.07,
      volatility: 0.15
    }
  ],
  liabilities: [
    {
      name: 'Home Mortgage',
      type: 'mortgage',
      currentBalance: 350000,
      interestRate: 0.055,
      monthlyPayment: 2200  // ~$26,400/year
    },
    {
      name: 'Car Loan',
      type: 'loan',
      currentBalance: 25000,
      interestRate: 0.08,
      monthlyPayment: 500  // ~$6,000/year, should pay off before retirement
    }
  ],
  inflationRate: 0.02
};

const withdrawalStrategy = {
  type: 'swr',
  rate: 0.04,
  inflationAdjusted: true
};

console.log('Generating projections...');
const projections = calculateDeterministicProjection(testInput, withdrawalStrategy);

console.log('Generating Vega chart...');
const vegaSpec = await generateVegaLiteSpec(projections, testInput.goals.retirementAge);

console.log();
console.log('=' .repeat(80));
console.log('REQUIREMENT 1: SALARY IS FIXED VALUE');
console.log('=' .repeat(80));

// Check salary values over time
const salaryValues = [];
for (let age = 45; age < 65; age++) {
  const point = projections.find(p => p.age === age);
  if (point && point.assets['Annual Salary']) {
    salaryValues.push(point.assets['Annual Salary']);
  }
}

const allSalariesSame = salaryValues.every(v => v === 75000);
const salaryNeverGrows = salaryValues.length > 0 && Math.max(...salaryValues) === Math.min(...salaryValues);

console.log(`Salary values checked: ${salaryValues.length} years`);
console.log(`All values are $75,000: ${allSalariesSame ? 'YES' : 'NO'}`);
console.log(`Salary never grows: ${salaryNeverGrows ? 'YES' : 'NO'}`);

if (allSalariesSame && salaryNeverGrows) {
  console.log('✓ REQUIREMENT 1 PASSED: Salary remains fixed at $75,000');
} else {
  console.log('✗ REQUIREMENT 1 FAILED');
}

console.log();
console.log('=' .repeat(80));
console.log('REQUIREMENT 2: INCOME STOPS AT RETIREMENT');
console.log('=' .repeat(80));

const beforeRetirement = projections.find(p => p.age === 64);
const atRetirement = projections.find(p => p.age === 65);
const afterRetirement = projections.find(p => p.age === 66);

const salaryBefore = beforeRetirement?.assets['Annual Salary'] ?? -1;
const salaryAt = atRetirement?.assets['Annual Salary'] ?? -1;
const salaryAfter = afterRetirement?.assets['Annual Salary'] ?? -1;

console.log(`Age 64 (before retirement): Salary = $${salaryBefore.toLocaleString()}`);
console.log(`Age 65 (at retirement):     Salary = $${salaryAt.toLocaleString()}`);
console.log(`Age 66 (after retirement):  Salary = $${salaryAfter.toLocaleString()}`);

const salaryStopsCorrectly = salaryBefore > 0 && salaryAt === 0 && salaryAfter === 0;

if (salaryStopsCorrectly) {
  console.log('✓ REQUIREMENT 2 PASSED: Salary stops at retirement');
} else {
  console.log('✗ REQUIREMENT 2 FAILED');
}

console.log();
console.log('=' .repeat(80));
console.log('REQUIREMENT 3: CHART SHOWS LIABILITIES');
console.log('=' .repeat(80));

// Check chart data
const mainData = vegaSpec.data?.[0]?.values || [];
const categories = new Set(mainData.map(p => p.category));

console.log(`Total data points in chart: ${mainData.length}`);
console.log(`Categories found: ${categories.size}`);
console.log();

console.log('Categories:');
categories.forEach(cat => {
  const isLiability = cat.includes('(Liability)');
  const marker = isLiability ? ' ← LIABILITY' : '';
  console.log(`  - ${cat}${marker}`);
});

const liabilityCategories = Array.from(categories).filter(cat => cat.includes('(Liability)'));
const hasHomeMortgage = liabilityCategories.some(cat => cat.includes('Home Mortgage'));
const hasCarLoan = liabilityCategories.some(cat => cat.includes('Car Loan'));

console.log();
console.log(`Liabilities in chart: ${liabilityCategories.length}`);
console.log(`  Home Mortgage: ${hasHomeMortgage ? 'FOUND' : 'NOT FOUND'}`);
console.log(`  Car Loan: ${hasCarLoan ? 'FOUND' : 'NOT FOUND'}`);

// Verify chart title mentions liabilities
const titleMentionsLiabilities = 
  (vegaSpec.title?.text || '').toLowerCase().includes('liabilit') ||
  (vegaSpec.title?.subtitle || '').toLowerCase().includes('liabilit');

console.log(`  Chart title mentions liabilities: ${titleMentionsLiabilities ? 'YES' : 'NO'}`);

if (liabilityCategories.length >= 2 && hasHomeMortgage && hasCarLoan && titleMentionsLiabilities) {
  console.log('✓ REQUIREMENT 3 PASSED: Chart shows liabilities');
} else {
  console.log('✗ REQUIREMENT 3 FAILED');
}

console.log();
console.log('=' .repeat(80));
console.log('FINAL RESULT');
console.log('=' .repeat(80));

if (allSalariesSame && salaryStopsCorrectly && liabilityCategories.length >= 2) {
  console.log('✓✓✓ ALL REQUIREMENTS PASSED ✓✓✓');
  console.log();
  console.log('Summary:');
  console.log('  1. ✓ Salary is fixed at $75,000 (no growth)');
  console.log('  2. ✓ Salary stops at retirement age (65)');
  console.log('  3. ✓ Chart displays liabilities (Home Mortgage, Car Loan)');
} else {
  console.log('✗ SOME REQUIREMENTS FAILED');
}

console.log();
console.log('=' .repeat(80));
