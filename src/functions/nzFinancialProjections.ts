import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ProjectionInput, WithdrawalStrategy, ProjectionPoint, MonteCarloProjectionResult } from '../types.js';
import { calculateDeterministicProjection, calculateMonteCarloProjection } from '../lib/projections.js';
import { generateVegaLiteSpec } from '../lib/vegaLite.js';

// Valid projection methods
const VALID_PROJECTION_METHODS = ['deterministic', 'monteCarlo'] as const;
type ProjectionMethod = typeof VALID_PROJECTION_METHODS[number];

// Valid response formats
const VALID_RESPONSE_FORMATS = ['full', 'dataOnly'] as const;
type ResponseFormat = typeof VALID_RESPONSE_FORMATS[number];

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
      projectionMethod: body.projectionMethod || 'monteCarlo',
      responseFormat: body.responseFormat || 'full'
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
    
    // Validate response format
    if (input.responseFormat && !VALID_RESPONSE_FORMATS.includes(input.responseFormat as ResponseFormat)) {
      return {
        status: 400,
        jsonBody: {
          error: `Invalid responseFormat. Must be one of: ${VALID_RESPONSE_FORMATS.join(', ')}`
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
    } else if (input.goals.desiredAnnualIncome) {
      // If desiredAnnualIncome is provided but no explicit withdrawal strategy,
      // use it as the fixed withdrawal amount with SWP (Systematic Withdrawal Plan) strategy
      withdrawalStrategy = {
        type: 'swp',
        fixedAmount: input.goals.desiredAnnualIncome,
        inflationAdjusted: true
      };
    } else {
      // Default to 4% rule (SWR - Safe Withdrawal Rate)
      withdrawalStrategy = {
        type: 'swr',
        rate: 0.04,
        inflationAdjusted: true
      };
    }
    
    // Calculate projections based on requested method
    let deterministicProjections: ProjectionPoint[] | null = null;
    let monteCarloResults: MonteCarloProjectionResult | null = null;
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
    
    // Generate Vega visualization using selected projection method
    context.log('Generating Vega specification...');
    const vegaSpec = await generateVegaLiteSpec(
      vegaProjections,
      input.goals.retirementAge
    );
    
    if (monteCarloResults) {
      context.log(`Projection complete. Success rate: ${monteCarloResults.successRate.toFixed(1)}%`);
    } else {
      context.log('Deterministic projection complete.');
    }
    
    // Determine response format
    const responseFormat = input.responseFormat || 'full';
    let responseBody: any;
    
    if (responseFormat === 'dataOnly') {
      // Return only the values array from the first data source
      context.log('Returning data values only');
      responseBody = vegaSpec.data && vegaSpec.data[0] && vegaSpec.data[0].values 
        ? vegaSpec.data[0].values 
        : [];
    } else {
      // Return full Vega spec (default behavior)
      context.log('Returning full Vega specification');
      responseBody = vegaSpec;
    }
    
    // Return the response based on selected format
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      jsonBody: responseBody
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
