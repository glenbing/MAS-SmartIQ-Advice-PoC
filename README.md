# MAS-SmartIQ-Advice-PoC

Azure Function for NZ Financial Projections using deterministic and Monte Carlo methods.

## Overview

This Azure Function provides comprehensive financial projections for New Zealand investors, incorporating:

- **Deterministic projections**: Traditional linear projections based on expected returns
- **Monte Carlo simulations**: Probabilistic projections accounting for market volatility
- **NZ-specific features**:
  - KiwiSaver modeling with employer and government contributions
  - NZ Work Super (WorkSaver schemes)
  - NZ tax brackets and PIE tax calculations (2024-2025)
- **Withdrawal strategies**:
  - Safe Withdrawal Rate (SWR) - the 4% rule
  - Systematic Withdrawal Plan (SWP) - fixed amount withdrawals
  - Inflation-adjusted withdrawals
- **Visualization**: Vega-Lite JSON charts showing net worth and individual asset performance

## Features

### Financial Modeling
- **Accumulation Phase**: Model contributions, employer matches, government contributions, and asset growth
- **Decumulation Phase**: Model sustainable withdrawal rates across retirement horizon
- **Multiple Asset Types**: KiwiSaver, NZ Work Super, investment portfolios, property, and other assets
- **Liability Management**: Track mortgages, loans, and other liabilities with interest calculations

### Projections
- **Deterministic**: Single-path projection using expected returns
- **Monte Carlo**: 1000+ simulations showing percentile outcomes (10th, 25th, median, 75th, 90th)
- **Success Rate**: Percentage of simulations that maintain positive balance through life expectancy

### Visualization
- Combined chart showing net worth and individual asset performance
- Clear distinction between accumulation and decumulation phases
- Retirement age marker
- Sustainability ratio tracking
- Interactive tooltips with detailed information

## API Endpoint

### POST /api/nzFinancialProjections

RESTful endpoint that accepts financial goals, assets, and liabilities, returning projections with Vega-Lite visualization.

#### Request Body

```json
{
  "currentAge": 35,
  "goals": {
    "name": "Retirement Planning",
    "retirementAge": 65,
    "lifeExpectancy": 90,
    "desiredAnnualIncome": 60000,
    "inflationRate": 0.02
  },
  "assets": [
    {
      "name": "KiwiSaver",
      "type": "kiwisaver",
      "currentValue": 50000,
      "contributionAmount": 4000,
      "contributionFrequency": "annual",
      "expectedReturn": 0.06,
      "volatility": 0.12,
      "employerContribution": 3000,
      "governmentContribution": 521.43
    },
    {
      "name": "Investment Portfolio",
      "type": "portfolio",
      "currentValue": 100000,
      "contributionAmount": 10000,
      "contributionFrequency": "annual",
      "expectedReturn": 0.07,
      "volatility": 0.15
    }
  ],
  "liabilities": [
    {
      "name": "Mortgage",
      "type": "mortgage",
      "currentBalance": 400000,
      "interestRate": 0.065,
      "monthlyPayment": 2500,
      "remainingMonths": 240
    }
  ],
  "withdrawalStrategy": {
    "type": "swr",
    "rate": 0.04,
    "inflationAdjusted": true
  },
  "inflationRate": 0.02,
  "taxYear": 2024,
  "numSimulations": 1000,
  "projectionMethod": "monteCarlo"
}
```

#### Asset Types
- `kiwisaver`: KiwiSaver accounts with employer and government contributions
- `nz-work-super`: NZ Work Super schemes
- `portfolio`: Investment portfolios
- `property`: Real estate
- `other`: Other assets

#### Withdrawal Strategy Types
- `swr`: Safe Withdrawal Rate (default 4% rule)
- `swp`: Systematic Withdrawal Plan with fixed amount

#### Projection Methods
- `deterministic`: Single-path projection using expected returns (faster, linear growth)
- `monteCarlo`: Probabilistic projection with 1000+ simulations (default, shows percentile outcomes)

**Note:** The `projectionMethod` parameter controls which projection method is used for the Vega-Lite visualization. When set to `deterministic`, only deterministic projections are calculated and returned. When set to `monteCarlo` (default), Monte Carlo simulations are run and the median is used for visualization.

#### Response

```json
{
  "deterministic": [
    {
      "age": 35,
      "year": 2024,
      "netWorth": 150000,
      "assets": {
        "KiwiSaver": 50000,
        "Investment Portfolio": 100000
      },
      "liabilities": {
        "Mortgage": 400000
      }
    }
  ],
  "monteCarlo": {
    "median": [ /* projection points */ ],
    "p10": [ /* projection points */ ],
    "p25": [ /* projection points */ ],
    "p75": [ /* projection points */ ],
    "p90": [ /* projection points */ ],
    "successRate": 87.5
  },
  "vegaLiteSpec": {
    "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
    "title": "NZ Financial Projections - Net Worth and Asset Performance",
    "data": { /* chart data */ }
  }
}
```

## Installation

### Prerequisites
- Node.js 18+ or 20+
- Azure Functions Core Tools v4

### Setup

1. Clone the repository:
```bash
git clone https://github.com/glenbing/MAS-SmartIQ-Advice-PoC.git
cd MAS-SmartIQ-Advice-PoC
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run locally:
```bash
npm start
```

The function will be available at `http://localhost:7071/api/nzFinancialProjections`

## Usage Examples

### Example 1: Basic KiwiSaver Projection

```bash
curl -X POST http://localhost:7071/api/nzFinancialProjections \
  -H "Content-Type: application/json" \
  -d '{
    "currentAge": 30,
    "goals": {
      "retirementAge": 65,
      "lifeExpectancy": 85
    },
    "assets": [
      {
        "name": "KiwiSaver",
        "type": "kiwisaver",
        "currentValue": 30000,
        "contributionAmount": 3000,
        "contributionFrequency": "annual",
        "expectedReturn": 0.06,
        "volatility": 0.12,
        "employerContribution": 3000,
        "governmentContribution": 521.43
      }
    ],
    "liabilities": []
  }'
```

### Example 2: Multiple Assets with SWR Withdrawal

```bash
curl -X POST http://localhost:7071/api/nzFinancialProjections \
  -H "Content-Type: application/json" \
  -d '{
    "currentAge": 55,
    "goals": {
      "retirementAge": 65,
      "lifeExpectancy": 90
    },
    "assets": [
      {
        "name": "KiwiSaver",
        "type": "kiwisaver",
        "currentValue": 250000,
        "expectedReturn": 0.05,
        "volatility": 0.10
      },
      {
        "name": "Investment Portfolio",
        "type": "portfolio",
        "currentValue": 500000,
        "expectedReturn": 0.07,
        "volatility": 0.15
      }
    ],
    "liabilities": [],
    "withdrawalStrategy": {
      "type": "swr",
      "rate": 0.04,
      "inflationAdjusted": true
    }
  }'
```

### Example 3: Systematic Withdrawal Plan (SWP)

```bash
curl -X POST http://localhost:7071/api/nzFinancialProjections \
  -H "Content-Type: application/json" \
  -d '{
    "currentAge": 65,
    "goals": {
      "retirementAge": 65,
      "lifeExpectancy": 90
    },
    "assets": [
      {
        "name": "Retirement Fund",
        "type": "portfolio",
        "currentValue": 1000000,
        "expectedReturn": 0.06,
        "volatility": 0.12
      }
    ],
    "liabilities": [],
    "withdrawalStrategy": {
      "type": "swp",
      "fixedAmount": 50000,
      "inflationAdjusted": true
    }
  }'
```

### Example 4: Deterministic Projection (Faster)

```bash
curl -X POST http://localhost:7071/api/nzFinancialProjections \
  -H "Content-Type: application/json" \
  -d '{
    "currentAge": 40,
    "goals": {
      "retirementAge": 65,
      "lifeExpectancy": 85
    },
    "assets": [
      {
        "name": "Investment Portfolio",
        "type": "portfolio",
        "currentValue": 200000,
        "contributionAmount": 15000,
        "contributionFrequency": "annual",
        "expectedReturn": 0.07,
        "volatility": 0.15
      }
    ],
    "liabilities": [],
    "projectionMethod": "deterministic"
  }'
```

**Note:** Using `projectionMethod: "deterministic"` provides a single linear projection that's significantly faster than Monte Carlo simulations. Use this for quick estimates or when probabilistic outcomes aren't needed.

## NZ Tax Considerations

The function incorporates NZ tax brackets for 2024-2025:
- 10.5% on income up to $14,000
- 17.5% on income between $14,001 and $48,000
- 30% on income between $48,001 and $70,000
- 33% on income between $70,001 and $180,000
- 39% on income over $180,000

Portfolio Investment Entity (PIE) tax rates for KiwiSaver:
- 10.5% for income up to $14,000
- 17.5% for income between $14,001 and $48,000
- 28% for income over $48,000

## Visualization

The Vega-Lite specification returned can be rendered using:
- [Vega Editor](https://vega.github.io/editor/)
- JavaScript libraries: `vega-lite`, `vega-embed`
- Python: `altair`
- R: `vegawidget`

Example rendering in HTML:
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
</head>
<body>
  <div id="vis"></div>
  <script>
    const spec = /* paste vegaLiteSpec from API response */;
    vegaEmbed('#vis', spec);
  </script>
</body>
</html>
```

## Deployment

### Deploy to Azure

1. Create an Azure Function App:
```bash
az functionapp create --resource-group <resource-group> \
  --consumption-plan-location <region> \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name <function-app-name> \
  --storage-account <storage-account>
```

2. Deploy the function:
```bash
func azure functionapp publish <function-app-name>
```

3. Test the deployed function:
```bash
curl -X POST https://<function-app-name>.azurewebsites.net/api/nzFinancialProjections \
  -H "Content-Type: application/json" \
  -d @example-request.json
```

## Technical Details

### Monte Carlo Simulation
- Uses Box-Muller transform for generating normally distributed random numbers
- Implements geometric Brownian motion for asset returns
- Runs 1000 simulations by default (configurable)
- Calculates percentile outcomes (10th, 25th, median, 75th, 90th)
- Tracks success rate (percentage of simulations maintaining positive balance)

### Withdrawal Strategies
- **Safe Withdrawal Rate (SWR)**: Withdraws fixed percentage (default 4%) of initial portfolio value, adjusted for inflation
- **Systematic Withdrawal Plan (SWP)**: Withdraws fixed dollar amount, optionally adjusted for inflation
- Both strategies account for portfolio depletion and sustainability ratios

### Asset Modeling
- **KiwiSaver**: Includes personal contributions, employer contributions (typically 3%), and government contributions (up to $521.43)
- **NZ Work Super**: Similar to KiwiSaver with employer matching
- **Portfolios**: Customizable expected returns and volatility
- **Property & Other**: Generic asset growth modeling

### Sustainability Metrics
- **Sustainability Ratio**: Portfolio value divided by expected remaining needs
- Ratio > 1.0 indicates sustainable withdrawals
- Ratio < 1.0 indicates potential portfolio depletion
- Tracked annually throughout retirement horizon

## License

MIT