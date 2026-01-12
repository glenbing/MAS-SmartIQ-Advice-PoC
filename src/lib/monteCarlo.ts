/**
 * Monte Carlo Simulation Engine
 */

/**
 * Box-Muller transform to generate normally distributed random numbers
 * Protects against Math.log(0) by ensuring u1 and u2 are in valid range
 */
function boxMullerTransform(): number {
  let u1 = 0;
  let u2 = 0;
  
  // Ensure u1 and u2 are not 0 or 1 to avoid Math.log(0) or Math.log(1)
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0;
}

/**
 * Generate a random return based on expected return and volatility
 * Uses geometric Brownian motion model
 */
export function generateRandomReturn(expectedReturn: number, volatility: number): number {
  const z = boxMullerTransform();
  // Geometric Brownian motion: log-normal distribution
  const randomReturn = expectedReturn + volatility * z;
  return randomReturn;
}

/**
 * Run a single Monte Carlo simulation
 */
export function runSingleSimulation(
  startValue: number,
  expectedReturn: number,
  volatility: number,
  years: number,
  contributions: number[] = [],
  withdrawals: number[] = []
): number[] {
  const values: number[] = [startValue];
  
  for (let year = 0; year < years; year++) {
    const currentValue = values[values.length - 1];
    if (currentValue <= 0) {
      values.push(0);
      continue;
    }
    
    const randomReturn = generateRandomReturn(expectedReturn, volatility);
    let newValue = currentValue * (1 + randomReturn);
    
    // Add contributions
    if (contributions[year]) {
      newValue += contributions[year];
    }
    
    // Subtract withdrawals
    if (withdrawals[year]) {
      newValue -= withdrawals[year];
    }
    
    values.push(Math.max(0, newValue));
  }
  
  return values;
}

/**
 * Run multiple Monte Carlo simulations and return percentile results
 */
export function runMonteCarloSimulations(
  startValue: number,
  expectedReturn: number,
  volatility: number,
  years: number,
  numSimulations: number = 1000,
  contributions: number[] = [],
  withdrawals: number[] = []
): {
  median: number[];
  p10: number[];
  p25: number[];
  p75: number[];
  p90: number[];
  successRate: number;
} {
  const allSimulations: number[][] = [];
  
  // Run simulations
  for (let i = 0; i < numSimulations; i++) {
    const simulation = runSingleSimulation(
      startValue,
      expectedReturn,
      volatility,
      years,
      contributions,
      withdrawals
    );
    allSimulations.push(simulation);
  }
  
  // Calculate percentiles for each year
  const median: number[] = [];
  const p10: number[] = [];
  const p25: number[] = [];
  const p75: number[] = [];
  const p90: number[] = [];
  
  for (let year = 0; year <= years; year++) {
    const valuesAtYear = allSimulations.map(sim => sim[year]).sort((a, b) => a - b);
    
    median.push(valuesAtYear[Math.floor(numSimulations * 0.50)]);
    p10.push(valuesAtYear[Math.floor(numSimulations * 0.10)]);
    p25.push(valuesAtYear[Math.floor(numSimulations * 0.25)]);
    p75.push(valuesAtYear[Math.floor(numSimulations * 0.75)]);
    p90.push(valuesAtYear[Math.floor(numSimulations * 0.90)]);
  }
  
  // Calculate success rate (simulations that didn't run out of money)
  const successfulSimulations = allSimulations.filter(
    sim => sim[sim.length - 1] > 0
  ).length;
  const successRate = (successfulSimulations / numSimulations) * 100;
  
  return { median, p10, p25, p75, p90, successRate };
}
