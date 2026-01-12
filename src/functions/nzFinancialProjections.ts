import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ProjectionInput, ProjectionResult, WithdrawalStrategy } from '../types';
import { calculateDeterministicProjection, calculateMonteCarloProjection } from '../lib/projections';
import { generateVegaLiteSpec } from '../lib/vegaLite';

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
      taxYear: body.taxYear || 2024
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
    
    // Calculate projections
    context.log('Calculating deterministic projection...');
    const deterministicProjections = calculateDeterministicProjection(input, withdrawalStrategy);
    
    context.log('Calculating Monte Carlo projections...');
    const numSimulations = body.numSimulations || 1000;
    const monteCarloResults = calculateMonteCarloProjection(input, withdrawalStrategy, numSimulations);
    
    // Generate Vega-Lite visualization
    context.log('Generating Vega-Lite specification...');
    const vegaLiteSpec = generateVegaLiteSpec(
      deterministicProjections,
      monteCarloResults.median,
      input.goals.retirementAge
    );
    
    // Build result
    const result: ProjectionResult = {
      deterministic: deterministicProjections,
      monteCarlo: {
        median: monteCarloResults.median,
        p10: monteCarloResults.p10,
        p25: monteCarloResults.p25,
        p75: monteCarloResults.p75,
        p90: monteCarloResults.p90,
        successRate: monteCarloResults.successRate
      },
      vegaLiteSpec
    };
    
    context.log(`Projection complete. Success rate: ${monteCarloResults.successRate.toFixed(1)}%`);
    
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
