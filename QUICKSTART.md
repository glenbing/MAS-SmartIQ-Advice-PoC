# Quick Start Guide

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Run Tests
```bash
# Run simple functionality test
node test.js

# Run demo with example request
node demo.js
```

### 4. Start Azure Function Locally (Optional)
If you have Azure Functions Core Tools installed:
```bash
npm start
```

Then test with:
```bash
curl -X POST http://localhost:7071/api/nzFinancialProjections \
  -H "Content-Type: application/json" \
  -d @example-request.json
```

## Quick Test Without Azure Functions Runtime

Since the core functionality is in pure TypeScript/JavaScript modules, you can test without running the full Azure Functions runtime:

```bash
# Run quick test
node test.js

# Run comprehensive demo
node demo.js
```

The `demo.js` script will:
- Process the example request
- Generate full projections
- Create a Vega-Lite visualization
- Save the complete response to `example-response.json`

## Project Structure

```
MAS-SmartIQ-Advice-PoC/
├── src/
│   ├── functions/
│   │   └── nzFinancialProjections.ts    # Main Azure Function endpoint
│   ├── lib/
│   │   ├── monteCarlo.ts                # Monte Carlo simulation engine
│   │   ├── nzTax.ts                     # NZ tax calculations
│   │   ├── projections.ts               # Financial projection logic
│   │   └── vegaLite.ts                  # Chart generation
│   └── types.ts                         # TypeScript interfaces
├── dist/                                # Compiled JavaScript (gitignored)
├── example-request.json                 # Sample API request
├── test.js                             # Simple test script
├── demo.js                             # Comprehensive demo script
├── package.json
├── tsconfig.json
└── host.json                           # Azure Functions configuration
```

## Key Features

### 1. Deterministic Projections
Linear projections based on expected returns:
```typescript
const result = calculateDeterministicProjection(input, withdrawalStrategy);
```

### 2. Monte Carlo Simulations
Probabilistic projections with percentile outcomes:
```typescript
const result = calculateMonteCarloProjection(input, withdrawalStrategy, 1000);
// Returns: median, p10, p25, p75, p90, successRate
```

### 3. NZ Tax Calculations
```typescript
const tax = calculateNZTax(80000);  // Returns tax amount
const afterTax = calculateAfterTaxIncome(80000);  // Returns after-tax income
```

### 4. Vega-Lite Charts
```typescript
const spec = generateVegaLiteSpec(deterministic, monteCarloMedian, retirementAge);
// Returns complete Vega-Lite specification
```

## Asset Types

- **kiwisaver**: KiwiSaver accounts with employer/government contributions
- **nz-work-super**: NZ Work Super schemes  
- **portfolio**: Investment portfolios
- **property**: Real estate
- **other**: Other assets

## Withdrawal Strategies

### Safe Withdrawal Rate (SWR)
The 4% rule - withdraw 4% of initial portfolio, adjusted for inflation:
```json
{
  "type": "swr",
  "rate": 0.04,
  "inflationAdjusted": true
}
```

### Systematic Withdrawal Plan (SWP)
Fixed dollar amount withdrawals:
```json
{
  "type": "swp",
  "fixedAmount": 50000,
  "inflationAdjusted": true
}
```

## Visualization

The Vega-Lite specification can be visualized:

1. **Online**: Copy spec to https://vega.github.io/editor/
2. **JavaScript**: Use `vega-embed` library
3. **Python**: Use `altair` library
4. **R**: Use `vegawidget` package

Example HTML:
```html
<script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
<div id="vis"></div>
<script>
  fetch('example-response.json')
    .then(r => r.json())
    .then(data => vegaEmbed('#vis', data.vegaLiteSpec));
</script>
```

## Understanding Results

### Success Rate
- **100%**: All simulations maintained positive balance
- **90-99%**: Highly sustainable
- **75-89%**: Moderately sustainable  
- **<75%**: Risk of portfolio depletion

### Sustainability Ratio
- **>1.0**: Portfolio can support withdrawals
- **1.0**: Portfolio exactly matches needs
- **<1.0**: Risk of running out of money

### Percentiles
- **P10**: 10% of simulations did worse (pessimistic)
- **P25**: 25% of simulations did worse
- **Median (P50)**: Middle outcome (realistic)
- **P75**: 75% of simulations did worse
- **P90**: 90% of simulations did worse (optimistic)

## NZ Tax Rates (2024-2025)

| Income Range | Tax Rate |
|--------------|----------|
| $0 - $14,000 | 10.5% |
| $14,001 - $48,000 | 17.5% |
| $48,001 - $70,000 | 30% |
| $70,001 - $180,000 | 33% |
| $180,001+ | 39% |

## Troubleshooting

### Build fails
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Tests fail
```bash
# Make sure build completed
npm run build

# Check paths in test files match dist/
node test.js
```

### Azure Functions won't start
The project can be tested without Azure Functions Core Tools using the demo scripts. For full Azure Functions support, install Core Tools separately.
