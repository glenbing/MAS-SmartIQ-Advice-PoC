# Implementation Summary: Liability & Income Asset Type Support

## Overview

This implementation adds comprehensive support for modeling income streams and liability servicing in retirement projections, ensuring accurate accounting of mortgages and other debts that extend past retirement age.

## Problem Statement Requirements

### 1. Liabilities Extending Past Retirement ✅
**Requirement**: Ensure liabilities (like mortgages) are properly accounted for in net wealth decumulation, especially when not paid before retirement.

**Implementation**:
- Modified `src/lib/projections.ts` to explicitly track and deduct liability payments from assets
- Liability payments are calculated annually: `annualPayment = monthlyPayment × 12`
- Payments are deducted proportionally across non-income assets based on their relative values
- Interest continues to accrue on unpaid balances using compound interest
- Liabilities reduce net worth calculation: `Net Worth = Total Assets - Outstanding Liabilities`

**Key Code Changes**:
```typescript
// Calculate liability payments
liabilities.forEach(liability => {
  const annualPayment = liability.monthlyPayment * 12;
  totalLiabilityPayments += annualPayment;
  
  // Interest accrual
  balance *= (1 + liability.interestRate);
  
  // Payments reduce the balance
  balance = Math.max(0, balance - annualPayment);
});

// Deduct payments from assets proportionally
if (totalLiabilityPayments > 0) {
  // Calculate proportion based on non-income assets only
  assets.forEach(asset => {
    if (asset.type !== 'income') {
      const proportion = assetValue / totalNonIncomeAssets;
      const assetPayment = totalLiabilityPayments * proportion;
      newAssets.set(asset.name, Math.max(0, assetValue - assetPayment));
    }
  });
}
```

### 2. Income Asset Type ✅
**Requirement**: Allow for income as an asset type that stops once retirement is taken.

**Implementation**:
- Added `'income'` to the asset type union in `src/types.ts`
- Income assets represent cash flow (e.g., salary, wages), not accumulated wealth
- Income assets have a `currentValue` representing the annual income amount
- They don't grow or accumulate like other assets
- Automatically set to $0 at retirement age
- Not depleted by liability payments or retirement withdrawals (as they represent flow, not stock)

**Key Code Changes**:
```typescript
if (asset.type === 'income') {
  if (!isRetired) {
    // Before retirement, income continues at its current value
    value = asset.currentValue;
  } else {
    // After retirement, income stops
    value = 0;
  }
}
```

### 3. Documentation & Examples ✅
**Requirement**: Provide examples as part of the README.md file.

**Implementation**:
Added three comprehensive examples to README.md:

1. **Example 7: Mortgage Extending Past Retirement**
   - Demonstrates a 30-year mortgage with retirement in 25 years
   - Shows how payments continue after retirement
   - Illustrates impact on net wealth during decumulation

2. **Example 8: Income Asset Stopping at Retirement**
   - Shows salary income of $80k/year modeled as an income asset
   - Demonstrates income stopping at retirement age
   - Compares asset values before and after retirement

3. **Example 9: Combined Mortgage and Income Scenario**
   - Comprehensive example with both features
   - $60k salary + mortgage extending 5 years past retirement
   - Includes KiwiSaver and investment portfolio
   - Monte Carlo projection with 1000 simulations

**Additional Documentation**:
- Added "Understanding Liability Impact on Retirement" section
- Explained how liabilities affect accumulation vs. decumulation phases
- Provided sustainability considerations
- Created `example-income-mortgage.json` with complete request example

### 4. Swagger/OpenAPI Specification ✅
**Requirement**: Provide a swagger file for the API request.

**Implementation**:
Created comprehensive `openapi.yaml` file with:
- Complete OpenAPI 3.0.3 specification
- Detailed schema definitions for all request/response types
- 4 example scenarios (basic KiwiSaver, mortgage scenario, income asset, comprehensive)
- Descriptions of all asset types including the new 'income' type
- Liability types and their properties
- Withdrawal strategy definitions
- Full request/response examples
- Server configuration for local and Azure deployments

**Key Sections**:
- `/nzFinancialProjections` POST endpoint with complete documentation
- Asset schema with 6 types: `kiwisaver`, `nz-work-super`, `portfolio`, `property`, `income`, `other`
- Liability schema with 4 types: `mortgage`, `loan`, `credit-card`, `other`
- Comprehensive examples demonstrating all features

## Technical Implementation Details

### Proportional Calculations
To ensure accurate deductions, both liability payments and retirement withdrawals:
1. Calculate the total value of non-income assets
2. Determine each asset's proportion of that total
3. Apply the payment/withdrawal proportionally
4. Skip income assets entirely (they represent flow, not depleted stock)

This ensures:
- Proportions always sum to 100%
- Income assets aren't incorrectly depleted
- All accumulated wealth (non-income assets) shares the burden proportionally

### Asset Value Tracking
- **Regular Assets**: Grow with returns, accumulate contributions, depleted by payments/withdrawals
- **Income Assets**: Set to annual income amount before retirement, $0 after retirement, never depleted

### Net Worth Calculation
Remains unchanged: `Net Worth = Total Assets - Outstanding Liabilities`

This properly reflects:
- Income assets as part of total assets (while they exist)
- Outstanding liability balances reducing net worth
- The decumulation impact of both retirement withdrawals and liability servicing

## Testing

### New Test File: `test-liability-income.mjs`
Three comprehensive test scenarios:

1. **Test 1: Mortgage Extending Past Retirement**
   - 30-year mortgage, retirement in 25 years
   - Verifies mortgage continues to be paid down after retirement
   - Validates proper asset depletion

2. **Test 2: Income Asset Stopping at Retirement**
   - $80k salary income
   - Verifies income exists before retirement, $0 after
   - Validates asset tracking

3. **Test 3: Combined Scenario**
   - $60k salary + mortgage extending 5 years past retirement
   - Verifies both features work together correctly
   - Validates complex interaction of income and liabilities

**Test Results**: All 3 tests PASS ✓

### Existing Tests
All 13 existing tests continue to pass:
- 7 Vega validation tests ✓
- 6 projection method tests ✓

### Security Analysis
CodeQL analysis: **0 vulnerabilities found** ✓

## Files Changed

1. **src/types.ts** - Added 'income' to Asset type union
2. **src/lib/projections.ts** - Enhanced liability servicing and income asset handling
3. **README.md** - Added 3 examples, documentation updates, OpenAPI reference
4. **openapi.yaml** - New comprehensive API specification (528 lines)
5. **test-liability-income.mjs** - New test file (273 lines)
6. **example-income-mortgage.json** - New example request file

**Total Changes**: 1,052 insertions, 23 deletions across 6 files

## Benefits

### For Users
1. **Realistic Modeling**: Can now model common scenarios where debts extend into retirement
2. **Income Tracking**: Accurately represent salary/wage income that stops at retirement
3. **Better Planning**: See the true impact of carrying debt into retirement
4. **Comprehensive View**: Understand both income needs and liability servicing requirements

### For Developers
1. **Clear API**: OpenAPI spec provides complete documentation
2. **Type Safety**: TypeScript types include new asset type
3. **Well Tested**: Comprehensive test coverage
4. **Maintainable**: Clear comments and logical code structure

## Usage Example

```bash
curl -X POST http://localhost:7071/api/nzFinancialProjections \
  -H "Content-Type: application/json" \
  -d @example-income-mortgage.json
```

Or use the comprehensive examples in the README for different scenarios.

## Conclusion

This implementation successfully addresses all requirements from the problem statement:
- ✅ Liabilities properly accounted for past retirement
- ✅ Income asset type that stops at retirement
- ✅ Comprehensive examples in README
- ✅ Complete Swagger/OpenAPI specification

The code is well-tested, secure, and ready for production use.
