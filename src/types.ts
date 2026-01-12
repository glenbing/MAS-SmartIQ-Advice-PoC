/**
 * Core types for NZ Financial Projections
 */

export interface Asset {
  name: string;
  type: 'kiwisaver' | 'nz-work-super' | 'portfolio' | 'property' | 'other';
  currentValue: number;
  contributionAmount?: number;
  contributionFrequency?: 'annual' | 'monthly' | 'weekly';
  expectedReturn?: number; // Annual return as decimal (e.g., 0.07 for 7%)
  volatility?: number; // Standard deviation for Monte Carlo (e.g., 0.15 for 15%)
  employerContribution?: number; // For KiwiSaver
  governmentContribution?: number; // For KiwiSaver
}

export interface Liability {
  name: string;
  type: 'mortgage' | 'loan' | 'credit-card' | 'other';
  currentBalance: number;
  interestRate: number; // Annual rate as decimal
  monthlyPayment: number;
  remainingMonths?: number;
}

export interface Goal {
  name: string;
  targetAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  desiredAnnualIncome?: number; // In retirement
  inflationRate?: number; // Default 0.02 for 2%
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface ProjectionInput {
  currentAge: number;
  goals: Goal;
  assets: Asset[];
  liabilities: Liability[];
  inflationRate?: number;
  taxYear?: number; // For NZ tax calculations
  projectionMethod?: 'deterministic' | 'monteCarlo'; // Which projection method to use for Vega visualization
}

export interface ProjectionPoint {
  age: number;
  year: number;
  netWorth: number;
  assets: {
    [assetName: string]: number;
  };
  liabilities: {
    [liabilityName: string]: number;
  };
  withdrawalAmount?: number;
  sustainabilityRatio?: number; // Ratio of portfolio value to expected remaining needs
}

export interface MonteCarloResult {
  percentile: number;
  projections: ProjectionPoint[];
}

export interface ProjectionResult {
  deterministic: ProjectionPoint[] | null;
  monteCarlo: {
    median: ProjectionPoint[];
    p10: ProjectionPoint[];
    p25: ProjectionPoint[];
    p75: ProjectionPoint[];
    p90: ProjectionPoint[];
    successRate?: number; // Percentage of simulations that didn't run out of money
  } | null;
  vegaLiteSpec: any; // Vega-Lite JSON specification
}

export interface WithdrawalStrategy {
  type: 'swr' | 'swp';
  rate?: number; // For SWR (default 0.04 for 4% rule)
  fixedAmount?: number; // For SWP
  inflationAdjusted?: boolean;
}
