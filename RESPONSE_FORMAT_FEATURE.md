# Response Format Feature

## Overview

The API now supports a `responseFormat` parameter that controls the format of the API response. This allows clients to choose between receiving the complete Vega v6 specification or just the raw data values.

## Parameter

### `responseFormat` (optional)

**Type:** `string`  
**Values:** `"full"` | `"dataOnly"`  
**Default:** `"full"`

- `"full"` - Returns the complete Vega v6 specification (default behavior, backward compatible)
- `"dataOnly"` - Returns only the values array from the data attribute

## Usage Examples

### Full Response Format (Default)

**Request:**
```json
{
  "currentAge": 55,
  "goals": {
    "retirementAge": 65,
    "lifeExpectancy": 90
  },
  "assets": [
    {
      "name": "Investment Portfolio",
      "type": "portfolio",
      "currentValue": 750000,
      "expectedReturn": 0.06,
      "volatility": 0.12
    }
  ],
  "liabilities": [],
  "responseFormat": "full"
}
```

**Response:** Complete Vega v6 specification
```json
{
  "$schema": "https://vega.github.io/schema/vega/v6.json",
  "description": "Financial projections showing net worth...",
  "width": 800,
  "height": 450,
  "data": [...],
  "marks": [...],
  "scales": [...],
  ...
}
```

### Data Only Response Format

**Request:**
```json
{
  "currentAge": 55,
  "goals": {
    "retirementAge": 65,
    "lifeExpectancy": 90
  },
  "assets": [
    {
      "name": "Investment Portfolio",
      "type": "portfolio",
      "currentValue": 750000,
      "expectedReturn": 0.06,
      "volatility": 0.12
    }
  ],
  "liabilities": [],
  "responseFormat": "dataOnly"
}
```

**Response:** Array of data values only
```json
[
  {
    "age": 55,
    "year": 2026,
    "value": 750000,
    "category": "Net Worth",
    "phase": "Accumulation",
    "withdrawalAmount": 0,
    "sustainabilityRatio": null
  },
  {
    "age": 56,
    "year": 2027,
    "value": 792281.863652523,
    "category": "Net Worth",
    "phase": "Accumulation",
    "withdrawalAmount": 0,
    "sustainabilityRatio": null
  },
  ...
]
```

## Use Cases

### When to use `"full"` (default)
- Need to render visualization directly in Vega/Vega-Lite viewers
- Want complete chart configuration
- Building interactive visualizations
- Need all Vega metadata

### When to use `"dataOnly"`
- Only need the raw data for custom visualizations
- Want smaller response size (~33% reduction)
- Building custom charts with different libraries
- Processing data for analysis
- Integrating with non-Vega visualization tools

## Benefits

1. **Flexibility** - Choose the format that best fits your use case
2. **Efficiency** - Smaller responses when you only need data (~33% size reduction)
3. **Backward Compatible** - Default behavior unchanged
4. **Simple** - Easy to use with a single parameter

## Data Structure

The `dataOnly` format returns an array where each element contains:

- `age` (number) - Age at this projection point
- `year` (number) - Calendar year
- `value` (number) - Dollar value
- `category` (string) - Asset name or "Net Worth"
- `phase` (string) - "Accumulation" or "Decumulation"
- `withdrawalAmount` (number) - Annual withdrawal amount (0 during accumulation)
- `sustainabilityRatio` (number|null) - Sustainability ratio during retirement

The array includes data points for:
- Net Worth (total)
- Individual assets (KiwiSaver, portfolios, property, etc.)

## Testing

Run the test suite to verify both formats work correctly:

```bash
# Run all tests
npm test

# Run response format specific tests
node test-response-format.mjs

# Run manual demonstration
node test-manual.mjs
```

## Curl Examples

```bash
# Test dataOnly format
curl -X POST http://localhost:7071/api/nzFinancialProjections \
  -H "Content-Type: application/json" \
  -d '{
    "currentAge": 55,
    "goals": {"retirementAge": 65, "lifeExpectancy": 90},
    "assets": [{
      "name": "Portfolio",
      "type": "portfolio",
      "currentValue": 750000,
      "expectedReturn": 0.06,
      "volatility": 0.12
    }],
    "liabilities": [],
    "responseFormat": "dataOnly"
  }'

# Test full format
curl -X POST http://localhost:7071/api/nzFinancialProjections \
  -H "Content-Type: application/json" \
  -d '{
    "currentAge": 55,
    "goals": {"retirementAge": 65, "lifeExpectancy": 90},
    "assets": [{
      "name": "Portfolio",
      "type": "portfolio",
      "currentValue": 750000,
      "expectedReturn": 0.06,
      "volatility": 0.12
    }],
    "liabilities": [],
    "responseFormat": "full"
  }'
```
