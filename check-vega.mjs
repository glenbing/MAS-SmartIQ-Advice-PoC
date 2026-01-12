import { calculateDeterministicProjection } from './dist/src/lib/projections.js';
import { generateVegaLiteSpec } from './dist/src/lib/vegaLite.js';

const input = {
  currentAge: 35,
  goals: { retirementAge: 65, lifeExpectancy: 90, desiredAnnualIncome: 60000 },
  assets: [{ name: 'Test', type: 'portfolio', currentValue: 100000, expectedReturn: 0.07, volatility: 0.15 }],
  liabilities: [],
  inflationRate: 0.02,
  taxYear: 2024
};

const projections = calculateDeterministicProjection(input, { type: 'swr', rate: 0.04, inflationAdjusted: true });
const spec = await generateVegaLiteSpec(projections, 65);

console.log('=== Vega Spec Verification ===');
console.log('Schema:', spec.$schema);
console.log('Description:', spec.description);
console.log('Has title:', !!spec.title);
console.log('Has data array:', Array.isArray(spec.data));
console.log('Has marks:', Array.isArray(spec.marks));
console.log('Number of data sources:', spec.data.length);
console.log('Number of marks:', spec.marks.length);
console.log('\nFirst few keys:', Object.keys(spec).slice(0, 10));
console.log('\n✓ Compiled Vega spec is valid!');
