/**
 * Financial Projections Calculator
 * Handles both deterministic and Monte Carlo projections
 */

import { 
  ProjectionInput, 
  ProjectionPoint, 
  Asset, 
  Liability,
  WithdrawalStrategy,
  MonteCarloProjectionResult
} from '../types.js';
import { calculateAfterTaxIncome } from './nzTax.js';
import { runMonteCarloSimulations } from './monteCarlo.js';

/**
 * Calculate deterministic projection
 */
export function calculateDeterministicProjection(
  input: ProjectionInput,
  withdrawalStrategy?: WithdrawalStrategy
): ProjectionPoint[] {
  const { currentAge, goals, assets, liabilities, inflationRate = 0.02 } = input;
  const { retirementAge, lifeExpectancy } = goals;
  
  const projections: ProjectionPoint[] = [];
  const yearsToProject = lifeExpectancy - currentAge;
  
  // Initialize asset and liability tracking
  let currentAssets = new Map<string, number>();
  let currentLiabilities = new Map<string, number>();
  
  // Track initial retirement portfolio value for SWR calculation
  let retirementPortfolioValue: number | null = null;
  
  assets.forEach(asset => currentAssets.set(asset.name, asset.currentValue));
  liabilities.forEach(liability => currentLiabilities.set(liability.name, liability.currentBalance));
  
  for (let year = 0; year <= yearsToProject; year++) {
    const age = currentAge + year;
    const isRetired = age >= retirementAge;
    
    // Calculate asset growth
    const newAssets = new Map<string, number>();
    let totalAssetValue = 0;
    
    assets.forEach(asset => {
      let value = currentAssets.get(asset.name) || 0;
      const expectedReturn = asset.expectedReturn || 0.05;
      
      // Growth
      value *= (1 + expectedReturn);
      
      // Contributions (only before retirement)
      if (!isRetired && asset.contributionAmount) {
        let annualContribution = asset.contributionAmount;
        
        if (asset.contributionFrequency === 'monthly') {
          annualContribution *= 12;
        } else if (asset.contributionFrequency === 'weekly') {
          annualContribution *= 52;
        }
        
        // Add employer and government contributions for KiwiSaver
        if (asset.type === 'kiwisaver') {
          if (asset.employerContribution) {
            annualContribution += asset.employerContribution;
          }
          if (asset.governmentContribution) {
            annualContribution += asset.governmentContribution;
          }
        }
        
        value += annualContribution;
      }
      
      newAssets.set(asset.name, value);
      totalAssetValue += value;
    });
    
    // Calculate liability payments
    const newLiabilities = new Map<string, number>();
    let totalLiabilityValue = 0;
    
    liabilities.forEach(liability => {
      let balance = currentLiabilities.get(liability.name) || 0;
      
      if (balance > 0) {
        // Interest accrual
        balance *= (1 + liability.interestRate);
        
        // Payments
        const annualPayment = liability.monthlyPayment * 12;
        balance = Math.max(0, balance - annualPayment);
      }
      
      newLiabilities.set(liability.name, balance);
      totalLiabilityValue += balance;
    });
    
    // Calculate withdrawal if retired
    let withdrawalAmount = 0;
    if (isRetired && withdrawalStrategy) {
      // Store initial retirement portfolio value on first retirement year
      // This value is captured AFTER growth but BEFORE withdrawals for the retirement year.
      // This is the correct base value for SWR calculations:
      // - It represents the portfolio value available at the start of retirement
      // - It remains fixed for all subsequent years (not recalculated)
      // - Inflation adjustments are applied to the withdrawal amount, not the base value
      if (retirementPortfolioValue === null) {
        retirementPortfolioValue = totalAssetValue;
      }
      
      if (withdrawalStrategy.type === 'swr') {
        const rate = withdrawalStrategy.rate || 0.04;
        const yearsRetired = age - retirementAge;
        
        // Calculate initial withdrawal based on retirement portfolio value
        // Defensive check: should always be non-null here, but check anyway for safety
        if (retirementPortfolioValue !== null) {
          const initialWithdrawal = retirementPortfolioValue * rate;
          
          // Adjust for inflation if enabled
          withdrawalAmount = withdrawalStrategy.inflationAdjusted 
            ? initialWithdrawal * Math.pow(1 + inflationRate, yearsRetired)
            : initialWithdrawal;
        }
      } else if (withdrawalStrategy.type === 'swp' && withdrawalStrategy.fixedAmount) {
        const yearsRetired = age - retirementAge;
        withdrawalAmount = withdrawalStrategy.inflationAdjusted
          ? withdrawalStrategy.fixedAmount * Math.pow(1 + inflationRate, yearsRetired)
          : withdrawalStrategy.fixedAmount;
      }
      
      // Apply withdrawal proportionally across assets
      if (withdrawalAmount > 0 && totalAssetValue > 0) {
        assets.forEach(asset => {
          const assetValue = newAssets.get(asset.name) || 0;
          const proportion = assetValue / totalAssetValue;
          const assetWithdrawal = withdrawalAmount * proportion;
          newAssets.set(asset.name, Math.max(0, assetValue - assetWithdrawal));
        });
        
        // Recalculate total after withdrawal
        totalAssetValue = Array.from(newAssets.values()).reduce((sum, val) => sum + val, 0);
      }
    }
    
    // Calculate net worth
    const netWorth = totalAssetValue - totalLiabilityValue;
    
    // Calculate sustainability ratio
    let sustainabilityRatio: number | undefined;
    if (isRetired && withdrawalAmount > 0) {
      const yearsRemaining = lifeExpectancy - age;
      const expectedTotalNeed = withdrawalAmount * yearsRemaining;
      sustainabilityRatio = expectedTotalNeed > 0 ? totalAssetValue / expectedTotalNeed : Infinity;
    }
    
    // Store projection point
    const assetSnapshot: { [key: string]: number } = {};
    newAssets.forEach((value, name) => assetSnapshot[name] = value);
    
    const liabilitySnapshot: { [key: string]: number } = {};
    newLiabilities.forEach((value, name) => liabilitySnapshot[name] = value);
    
    projections.push({
      age,
      year: new Date().getFullYear() + year,
      netWorth,
      assets: assetSnapshot,
      liabilities: liabilitySnapshot,
      withdrawalAmount,
      sustainabilityRatio
    });
    
    // Update for next iteration
    currentAssets = newAssets;
    currentLiabilities = newLiabilities;
  }
  
  return projections;
}

/**
 * Calculate Monte Carlo projection
 */
export function calculateMonteCarloProjection(
  input: ProjectionInput,
  withdrawalStrategy?: WithdrawalStrategy,
  numSimulations: number = 1000
): MonteCarloProjectionResult {
  const { currentAge, goals, assets, liabilities, inflationRate = 0.02 } = input;
  const { retirementAge, lifeExpectancy } = goals;
  const yearsToProject = lifeExpectancy - currentAge;
  
  // Calculate total portfolio value
  const totalPortfolioValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  
  // Calculate weighted average return and volatility
  let weightedReturn = 0;
  let weightedVolatility = 0;
  
  assets.forEach(asset => {
    const weight = asset.currentValue / totalPortfolioValue;
    weightedReturn += (asset.expectedReturn || 0.05) * weight;
    weightedVolatility += (asset.volatility || 0.10) * weight;
  });
  
  // Build contribution and withdrawal arrays
  const contributions: number[] = [];
  const withdrawals: number[] = [];
  
  for (let year = 0; year <= yearsToProject; year++) {
    const age = currentAge + year;
    const isRetired = age >= retirementAge;
    
    // Contributions (only before retirement)
    let totalContribution = 0;
    if (!isRetired) {
      assets.forEach(asset => {
        if (asset.contributionAmount) {
          let annualContribution = asset.contributionAmount;
          
          if (asset.contributionFrequency === 'monthly') {
            annualContribution *= 12;
          } else if (asset.contributionFrequency === 'weekly') {
            annualContribution *= 52;
          }
          
          if (asset.type === 'kiwisaver') {
            if (asset.employerContribution) annualContribution += asset.employerContribution;
            if (asset.governmentContribution) annualContribution += asset.governmentContribution;
          }
          
          totalContribution += annualContribution;
        }
      });
    }
    contributions.push(totalContribution);
    
    // Withdrawals (only after retirement)
    let withdrawalAmount = 0;
    if (isRetired && withdrawalStrategy) {
      if (withdrawalStrategy.type === 'swr') {
        const rate = withdrawalStrategy.rate || 0.04;
        const yearsRetired = age - retirementAge;
        
        if (year === retirementAge - currentAge) {
          withdrawalAmount = totalPortfolioValue * rate;
        } else {
          withdrawalAmount = totalPortfolioValue * rate * (withdrawalStrategy.inflationAdjusted 
            ? Math.pow(1 + inflationRate, yearsRetired)
            : 1);
        }
      } else if (withdrawalStrategy.type === 'swp' && withdrawalStrategy.fixedAmount) {
        const yearsRetired = age - retirementAge;
        withdrawalAmount = withdrawalStrategy.inflationAdjusted
          ? withdrawalStrategy.fixedAmount * Math.pow(1 + inflationRate, yearsRetired)
          : withdrawalStrategy.fixedAmount;
      }
    }
    withdrawals.push(withdrawalAmount);
  }
  
  // Run Monte Carlo simulations
  const mcResults = runMonteCarloSimulations(
    totalPortfolioValue,
    weightedReturn,
    weightedVolatility,
    yearsToProject,
    numSimulations,
    contributions,
    withdrawals
  );
  
  // Convert results to ProjectionPoint format
  const convertToProjectionPoints = (values: number[]): ProjectionPoint[] => {
    return values.map((value, year) => {
      const age = currentAge + year;
      const isRetired = age >= retirementAge;
      
      // Distribute value across assets proportionally
      const assetSnapshot: { [key: string]: number } = {};
      assets.forEach(asset => {
        const proportion = asset.currentValue / totalPortfolioValue;
        assetSnapshot[asset.name] = value * proportion;
      });
      
      // Liabilities (simplified - use deterministic)
      const liabilitySnapshot: { [key: string]: number } = {};
      let totalLiabilities = 0;
      liabilities.forEach(liability => {
        liabilitySnapshot[liability.name] = 0; // Simplified
      });
      
      const withdrawalAmount = isRetired ? withdrawals[year] : undefined;
      
      return {
        age,
        year: new Date().getFullYear() + year,
        netWorth: value - totalLiabilities,
        assets: assetSnapshot,
        liabilities: liabilitySnapshot,
        withdrawalAmount,
        sustainabilityRatio: isRetired && withdrawalAmount 
          ? value / (withdrawalAmount * (lifeExpectancy - age))
          : undefined
      };
    });
  };
  
  return {
    median: convertToProjectionPoints(mcResults.median),
    p10: convertToProjectionPoints(mcResults.p10),
    p25: convertToProjectionPoints(mcResults.p25),
    p75: convertToProjectionPoints(mcResults.p75),
    p90: convertToProjectionPoints(mcResults.p90),
    successRate: mcResults.successRate
  };
}
