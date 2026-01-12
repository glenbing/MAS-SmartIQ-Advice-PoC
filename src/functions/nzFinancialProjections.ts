import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ProjectionInput, ProjectionResult, WithdrawalStrategy, ProjectionPoint } from '../types';
import { calculateDeterministicProjection, calculateMonteCarloProjection } from '../lib/projections';
import { generateVegaLiteSpec } from '../lib/vegaLite';

// Valid projection methods
const VALID_PROJECTION_METHODS = ['deterministic', 'monteCarlo'] as const;
type ProjectionMethod = typeof VALID_PROJECTION_METHODS[number];

/**
 * Azure Function: NZ Financial Projections
 * 
 * Accepts goals, assets, liabilities and returns projections with Vega-Lite visualization
 */
export async function nzFinancialProjections(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Processing NZ Financial Projections request');
  
  try {
    // Parse request body
    const body = await request.json() as any;
    
    // Validate required fields
    if (!body.currentAge || !body.goals || !body.assets) {
      return {
        status: 400,
        jsonBody: {
          error: 'Missing required fields. Required: currentAge, goals, assets'
        }
      };
    }
    
    // Build projection input
    const input: ProjectionInput = {
      currentAge: body.currentAge,
      goals: {
        name: body.goals.name || 'Retirement Goal',
        targetAge: body.goals.targetAge || body.currentAge,
        retirementAge: body.goals.retirementAge,
        lifeExpectancy: body.goals.lifeExpectancy || 90,
        desiredAnnualIncome: body.goals.desiredAnnualIncome,
        inflationRate: body.goals.inflationRate || 0.02
      },
      assets: body.assets || [],
      liabilities: body.liabilities || [],
      inflationRate: body.inflationRate || 0.02,
      taxYear: body.taxYear || 2024,
      projectionMethod: body.projectionMethod || 'monteCarlo'
    };
    
    // Validate retirement age
    if (!input.goals.retirementAge) {
      return {
        status: 400,
        jsonBody: {
          error: 'goals.retirementAge is required'
        }
      };
    }
    
    // Validate projection method
    if (input.projectionMethod && !VALID_PROJECTION_METHODS.includes(input.projectionMethod as ProjectionMethod)) {
      return {
        status: 400,
        jsonBody: {
          error: `Invalid projectionMethod. Must be one of: ${VALID_PROJECTION_METHODS.join(', ')}`
        }
      };
    }
    
    // Parse withdrawal strategy
    let withdrawalStrategy: WithdrawalStrategy | undefined;
    if (body.withdrawalStrategy) {
      withdrawalStrategy = {
        type: body.withdrawalStrategy.type || 'swr',
        rate: body.withdrawalStrategy.rate || 0.04,
        fixedAmount: body.withdrawalStrategy.fixedAmount,
        inflationAdjusted: body.withdrawalStrategy.inflationAdjusted !== false
      };
    } else {
      // Default to 4% rule (SWR)
      withdrawalStrategy = {
        type: 'swr',
        rate: 0.04,
        inflationAdjusted: true
      };
    }
    
    // Calculate projections based on requested method
    let deterministicProjections: ProjectionPoint[] | null = null;
    let monteCarloResults: { median: ProjectionPoint[]; p10: ProjectionPoint[]; p25: ProjectionPoint[]; p75: ProjectionPoint[]; p90: ProjectionPoint[]; successRate: number } | null = null;
    let vegaProjections: ProjectionPoint[];
    
    const projectionMethod = input.projectionMethod || 'monteCarlo';
    
    if (projectionMethod === 'deterministic') {
      context.log('Calculating deterministic projection...');
      deterministicProjections = calculateDeterministicProjection(input, withdrawalStrategy);
      vegaProjections = deterministicProjections;
    } else {
      context.log('Calculating Monte Carlo projections...');
      const numSimulations = body.numSimulations || 1000;
      monteCarloResults = calculateMonteCarloProjection(input, withdrawalStrategy, numSimulations);
      vegaProjections = monteCarloResults.median;
    }
    
    // Generate Vega-Lite visualization using selected projection method
    context.log('Generating Vega-Lite specification...');
    const vegaLiteSpec = generateVegaLiteSpec(
      vegaProjections,
      input.goals.retirementAge
    );
    
    // Build result
    const result: ProjectionResult = {
      deterministic: deterministicProjections,
      monteCarlo: monteCarloResults ? {
        median: monteCarloResults.median,
        p10: monteCarloResults.p10,
        p25: monteCarloResults.p25,
        p75: monteCarloResults.p75,
        p90: monteCarloResults.p90,
        successRate: monteCarloResults.successRate
      } : null,
      vegaLiteSpec
    };
    
    if (monteCarloResults) {
      context.log(`Projection complete. Success rate: ${monteCarloResults.successRate.toFixed(1)}%`);
    } else {
      context.log('Deterministic projection complete.');
    }
    
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      jsonBody: result
    };
    
  } catch (error: any) {
    context.error('Error processing request:', error);
    
    return {
      status: 500,
      jsonBody: {
        error: 'Internal server error',
        message: error.message
      }
    };
  }
}

app.http('nzFinancialProjections', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: nzFinancialProjections
});
