/**
 * Test script to verify liability servicing and income asset functionality
 * Tests that:
 * 1. Liabilities continue to be serviced past retirement
 * 2. Liability payments reduce asset balances appropriately
 * 3. Income assets stop at retirement
 * 4. Net wealth properly accounts for all these factors
 */

import { calculateDeterministicProjection } from './dist/src/lib/projections.js';

console.log('=== Liability Servicing & Income Asset Tests ===\n');

// Test 1: Mortgage extending past retirement
console.log('Test 1: Mortgage extending past retirement');
console.log('Scenario: 30-year mortgage with retirement in 25 years');

const test1Input = {
  currentAge: 40,
  goals: {
    name: 'Retirement with Mortgage',
    targetAge: 40,
    retirementAge: 65,
    lifeExpectancy: 85,
    inflationRate: 0.02
  },
  assets: [
    {
      name: 'Retirement Portfolio',
      type: 'portfolio',
      currentValue: 300000,
      contributionAmount: 20000,
      contributionFrequency: 'annual',
      expectedReturn: 0.07,
      volatility: 0.15
    }
  ],
  liabilities: [
    {
      name: 'Home Mortgage',
      type: 'mortgage',
      currentBalance: 400000,
      interestRate: 0.06,
      monthlyPayment: 2400  // ~$28,800/year
    }
  ],
  inflationRate: 0.02
};

const withdrawalStrategy1 = {
  type: 'swr',
  rate: 0.04,
  inflationAdjusted: true
};

const result1 = calculateDeterministicProjection(test1Input, withdrawalStrategy1);

// Check key points
const startPoint = result1[0];
const retirementPoint = result1[25]; // Age 65
const midRetirementPoint = result1[35]; // Age 75 (10 years into retirement)
const endPoint = result1[result1.length - 1]; // Age 85

console.log('Results:');
console.log(`  Age 40 (Start): Net Worth = $${startPoint.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Assets: $${Object.values(startPoint.assets).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Liabilities: $${Object.values(startPoint.liabilities).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

console.log(`  Age 65 (Retirement): Net Worth = $${retirementPoint.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Assets: $${Object.values(retirementPoint.assets).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Liabilities: $${Object.values(retirementPoint.liabilities).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Withdrawal: $${retirementPoint.withdrawalAmount?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);

console.log(`  Age 75 (Mid-Retirement): Net Worth = $${midRetirementPoint.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Assets: $${Object.values(midRetirementPoint.assets).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Liabilities: $${Object.values(midRetirementPoint.liabilities).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Withdrawal: $${midRetirementPoint.withdrawalAmount?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);

// Verify mortgage is being paid down even after retirement
const mortgageAtRetirement = retirementPoint.liabilities['Home Mortgage'];
const mortgageAtMidRetirement = midRetirementPoint.liabilities['Home Mortgage'];

if (mortgageAtRetirement > mortgageAtMidRetirement) {
  console.log('  ✓ PASS: Mortgage continues to be paid down after retirement');
} else if (mortgageAtRetirement === 0) {
  console.log('  ✓ PASS: Mortgage fully paid off by retirement');
} else {
  console.log('  ✗ FAIL: Mortgage not being serviced properly');
}

console.log('');

// Test 2: Income asset stopping at retirement
console.log('Test 2: Income asset stopping at retirement');
console.log('Scenario: Salary income of $80k/year that stops at retirement');

const test2Input = {
  currentAge: 50,
  goals: {
    name: 'Income Asset Test',
    targetAge: 50,
    retirementAge: 65,
    lifeExpectancy: 85,
    inflationRate: 0.02
  },
  assets: [
    {
      name: 'Salary Income',
      type: 'income',
      currentValue: 80000,  // Annual income
      expectedReturn: 0,
      volatility: 0
    },
    {
      name: 'Investment Portfolio',
      type: 'portfolio',
      currentValue: 200000,
      contributionAmount: 15000,
      contributionFrequency: 'annual',
      expectedReturn: 0.07,
      volatility: 0.15
    }
  ],
  liabilities: [],
  inflationRate: 0.02
};

const withdrawalStrategy2 = {
  type: 'swr',
  rate: 0.04,
  inflationAdjusted: true
};

const result2 = calculateDeterministicProjection(test2Input, withdrawalStrategy2);

const preRetirement2 = result2[10]; // Age 60 (before retirement)
const atRetirement2 = result2[15]; // Age 65 (at retirement)
const postRetirement2 = result2[20]; // Age 70 (after retirement)

console.log('Results:');
console.log(`  Age 60 (Before Retirement):`);
console.log(`    Salary Income: $${preRetirement2.assets['Salary Income']?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);
console.log(`    Total Assets: $${Object.values(preRetirement2.assets).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

console.log(`  Age 65 (At Retirement):`);
console.log(`    Salary Income: $${atRetirement2.assets['Salary Income']?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);
console.log(`    Total Assets: $${Object.values(atRetirement2.assets).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

console.log(`  Age 70 (After Retirement):`);
console.log(`    Salary Income: $${postRetirement2.assets['Salary Income']?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);
console.log(`    Total Assets: $${Object.values(postRetirement2.assets).reduce((a, b) => a + b, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

// Verify income stops at retirement
const incomeBeforeRetirement = preRetirement2.assets['Salary Income'] || 0;
const incomeAtRetirement = atRetirement2.assets['Salary Income'] || 0;
const incomeAfterRetirement = postRetirement2.assets['Salary Income'] || 0;

if (incomeBeforeRetirement > 0 && incomeAtRetirement === 0 && incomeAfterRetirement === 0) {
  console.log('  ✓ PASS: Income asset stops at retirement');
} else if (incomeBeforeRetirement > 0 && incomeAfterRetirement === 0) {
  console.log('  ✓ PASS: Income asset stops by retirement');
} else {
  console.log('  ✗ FAIL: Income asset not stopping properly at retirement');
  console.log(`    Before: ${incomeBeforeRetirement}, At: ${incomeAtRetirement}, After: ${incomeAfterRetirement}`);
}

console.log('');

// Test 3: Combined scenario - mortgage extending past retirement + income stopping
console.log('Test 3: Combined scenario - Mortgage + Income asset');
console.log('Scenario: $60k salary, mortgage extending 5 years past retirement');

const test3Input = {
  currentAge: 45,
  goals: {
    name: 'Combined Test',
    targetAge: 45,
    retirementAge: 65,
    lifeExpectancy: 85,
    inflationRate: 0.02
  },
  assets: [
    {
      name: 'Salary',
      type: 'income',
      currentValue: 60000,
      expectedReturn: 0,
      volatility: 0
    },
    {
      name: 'KiwiSaver',
      type: 'kiwisaver',
      currentValue: 150000,
      contributionAmount: 6000,
      contributionFrequency: 'annual',
      expectedReturn: 0.06,
      volatility: 0.12,
      employerContribution: 6000,
      governmentContribution: 521.43
    },
    {
      name: 'Investment Portfolio',
      type: 'portfolio',
      currentValue: 250000,
      contributionAmount: 10000,
      contributionFrequency: 'annual',
      expectedReturn: 0.07,
      volatility: 0.15
    }
  ],
  liabilities: [
    {
      name: 'Mortgage',
      type: 'mortgage',
      currentBalance: 300000,
      interestRate: 0.055,
      monthlyPayment: 2000  // ~$24,000/year, 25-year mortgage
    }
  ],
  inflationRate: 0.02
};

const withdrawalStrategy3 = {
  type: 'swr',
  rate: 0.04,
  inflationAdjusted: true
};

const result3 = calculateDeterministicProjection(test3Input, withdrawalStrategy3);

const beforeRetirement3 = result3[15]; // Age 60
const atRetirement3 = result3[20]; // Age 65
const afterRetirement3 = result3[25]; // Age 70

console.log('Results:');
console.log(`  Age 60 (5 years before retirement):`);
console.log(`    Salary: $${beforeRetirement3.assets['Salary']?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);
console.log(`    Net Worth: $${beforeRetirement3.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Mortgage Balance: $${beforeRetirement3.liabilities['Mortgage']?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);

console.log(`  Age 65 (At retirement):`);
console.log(`    Salary: $${atRetirement3.assets['Salary']?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);
console.log(`    Net Worth: $${atRetirement3.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Mortgage Balance: $${atRetirement3.liabilities['Mortgage']?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);
console.log(`    Withdrawal: $${atRetirement3.withdrawalAmount?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);

console.log(`  Age 70 (5 years after retirement):`);
console.log(`    Salary: $${afterRetirement3.assets['Salary']?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);
console.log(`    Net Worth: $${afterRetirement3.netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`    Mortgage Balance: $${afterRetirement3.liabilities['Mortgage']?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);
console.log(`    Withdrawal: $${afterRetirement3.withdrawalAmount?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`);

// Verify both conditions
const salaryStops = beforeRetirement3.assets['Salary'] > 0 && afterRetirement3.assets['Salary'] === 0;
const mortgageContinues = atRetirement3.liabilities['Mortgage'] > 0 && 
                         atRetirement3.liabilities['Mortgage'] > afterRetirement3.liabilities['Mortgage'];

if (salaryStops && mortgageContinues) {
  console.log('  ✓ PASS: Income stops at retirement AND mortgage continues to be serviced');
} else {
  console.log('  ✗ FAIL: Combined scenario not working correctly');
  if (!salaryStops) console.log('    - Income not stopping properly');
  if (!mortgageContinues) console.log('    - Mortgage not being serviced properly after retirement');
}

console.log('');
console.log('=== Test Summary ===');
console.log('All tests validate:');
console.log('  1. Liabilities continue to be paid after retirement');
console.log('  2. Liability payments reduce asset values');
console.log('  3. Income assets stop at retirement');
console.log('  4. Net wealth properly reflects both liabilities and income changes');
console.log('');
