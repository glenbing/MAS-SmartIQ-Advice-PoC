/**
 * NZ Tax Calculations
 * Based on NZ income tax brackets for 2024-2025
 */

import { TaxBracket } from '../types';

// NZ Tax brackets for 2024-2025 tax year
const NZ_TAX_BRACKETS_2024: TaxBracket[] = [
  { min: 0, max: 14000, rate: 0.105 },        // 10.5%
  { min: 14001, max: 48000, rate: 0.175 },    // 17.5%
  { min: 48001, max: 70000, rate: 0.30 },     // 30%
  { min: 70001, max: 180000, rate: 0.33 },    // 33%
  { min: 180001, max: Infinity, rate: 0.39 }  // 39%
];

/**
 * Calculate NZ income tax for a given income
 */
export function calculateNZTax(income: number, taxYear: number = 2024): number {
  if (income <= 0) return 0;
  
  const brackets = NZ_TAX_BRACKETS_2024; // Can be extended for different years
  let tax = 0;
  
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    
    const taxableInThisBracket = Math.min(income, bracket.max) - bracket.min;
    tax += taxableInThisBracket * bracket.rate;
    
    if (income <= bracket.max) break;
  }
  
  return tax;
}

/**
 * Calculate after-tax income
 */
export function calculateAfterTaxIncome(grossIncome: number, taxYear: number = 2024): number {
  const tax = calculateNZTax(grossIncome, taxYear);
  return grossIncome - tax;
}

/**
 * Calculate effective tax rate
 */
export function calculateEffectiveTaxRate(income: number, taxYear: number = 2024): number {
  if (income <= 0) return 0;
  const tax = calculateNZTax(income, taxYear);
  return tax / income;
}

/**
 * Calculate PIE (Portfolio Investment Entity) tax for KiwiSaver
 * Based on prescribed investor rate (PIR)
 */
export function calculatePIETax(income: number): number {
  // PIR rates based on income
  if (income <= 14000) return 0.105; // 10.5%
  if (income <= 48000) return 0.175; // 17.5%
  return 0.28; // 28%
}
