/**
 * Vega Chart Generator
 * Creates visualization specifications for financial projections
 * Compiles Vega-Lite to full Vega specifications
 */

import { ProjectionPoint } from '../types.js';

// Cache for vega-lite module to avoid repeated dynamic imports
let vegaLiteModule: any = null;

/**
 * Lazy loader for vega-lite module
 */
async function getVegaLite(): Promise<any> {
  if (!vegaLiteModule) {
    // @ts-ignore - vega-lite is an ESM module
    vegaLiteModule = await import('vega-lite');
  }
  return vegaLiteModule;
}

/**
 * Generate Vega specification for combined chart showing:
 * - Net worth projection
 * - Individual asset performance (KiwiSaver, NZ Work Super, portfolios)
 * - Accumulation and decumulation phases
 * - Withdrawal sustainability indicators
 * 
 * @param projections - Array of projection points from either deterministic or Monte Carlo median calculations
 * @param retirementAge - Age at which retirement begins (for phase visualization)
 * @returns Vega specification object (compiled from Vega-Lite)
 */
export async function generateVegaLiteSpec(
  projections: ProjectionPoint[],
  retirementAge: number
): Promise<any> {
  // Get vega-lite module
  const vegaLite = await getVegaLite();
  // Prepare data for net worth projection
  const netWorthData = projections.map(point => ({
    age: point.age,
    year: point.year,
    value: point.netWorth,
    category: 'Net Worth',
    phase: point.age < retirementAge ? 'Accumulation' : 'Decumulation',
    withdrawalAmount: point.withdrawalAmount || 0,
    sustainabilityRatio: point.sustainabilityRatio || null
  }));
  
  // Prepare data for individual assets
  const assetData: any[] = [];
  
  projections.forEach(point => {
    Object.entries(point.assets).forEach(([assetName, value]) => {
      assetData.push({
        age: point.age,
        year: point.year,
        value: value,
        category: assetName,
        phase: point.age < retirementAge ? 'Accumulation' : 'Decumulation'
      });
    });
  });
  
  // Combine all data
  const allData = [...netWorthData, ...assetData];
  
  // Create Vega-Lite specification
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    title: {
      text: 'NZ Financial Projections - Net Worth and Asset Performance',
      subtitle: 'Showing accumulation and decumulation phases'
    },
    width: 800,
    height: 450,
    data: {
      values: allData
    },
    layer: [
      // Background rectangles for accumulation/decumulation phases
      {
        mark: {
          type: 'rect',
          opacity: 0.1,
          color: '#4CAF50'
        },
        encoding: {
          x: {
            field: 'age',
            type: 'quantitative',
            scale: { zero: false }
          },
          x2: {
            datum: retirementAge
          }
        }
      },
      {
        mark: {
          type: 'rect',
          opacity: 0.1,
          color: '#FF9800'
        },
        encoding: {
          x: {
            field: 'age',
            type: 'quantitative',
            scale: { zero: false }
          },
          x2: {
            datum: Math.max(...allData.map(d => d.age))
          }
        },
        transform: [
          {
            filter: `datum.age >= ${retirementAge}`
          }
        ]
      },
      // Vertical line at retirement age
      {
        mark: {
          type: 'rule',
          strokeDash: [5, 5],
          color: '#FF5722',
          strokeWidth: 2
        },
        encoding: {
          x: {
            datum: retirementAge
          }
        }
      },
      // Main line chart for all projections
      {
        mark: {
          type: 'line',
          point: false,
          strokeWidth: 2
        },
        encoding: {
          x: {
            field: 'age',
            type: 'quantitative',
            title: 'Age',
            scale: { zero: false }
          },
          y: {
            field: 'value',
            type: 'quantitative',
            title: 'Value (NZD)',
            axis: {
              format: '$,.0f'
            }
          },
          color: {
            field: 'category',
            type: 'nominal',
            title: 'Asset / Category',
            scale: {
              scheme: 'category20'
            },
            legend: {
              orient: 'right',
              title: 'Assets & Net Worth'
            }
          },
          strokeWidth: {
            condition: {
              test: "datum.category === 'Net Worth'",
              value: 4
            },
            value: 2
          },
          tooltip: [
            { field: 'category', type: 'nominal', title: 'Category' },
            { field: 'age', type: 'quantitative', title: 'Age' },
            { field: 'year', type: 'quantitative', title: 'Year' },
            { field: 'value', type: 'quantitative', title: 'Value', format: '$,.0f' },
            { field: 'phase', type: 'nominal', title: 'Phase' },
            { field: 'withdrawalAmount', type: 'quantitative', title: 'Annual Withdrawal', format: '$,.0f' },
            { field: 'sustainabilityRatio', type: 'quantitative', title: 'Sustainability Ratio', format: '.2f' }
          ]
        }
      },
      // Annotation for retirement age
      {
        mark: {
          type: 'text',
          align: 'left',
          dx: 5,
          dy: -10,
          fontSize: 12,
          fontWeight: 'bold',
          color: '#FF5722'
        },
        encoding: {
          x: {
            datum: retirementAge
          },
          y: {
            datum: Math.max(...allData.map(d => d.value))
          },
          text: {
            datum: `Retirement Age: ${retirementAge}`
          }
        }
      }
    ],
    config: {
      view: {
        strokeWidth: 0
      },
      axis: {
        grid: true,
        gridOpacity: 0.3
      }
    }
  };
  
  // Compile Vega-Lite to Vega spec
  const compiled = vegaLite.compile(spec);
  const vegaSpec = compiled.spec;
  
  // Add description field as required for valid Vega spec
  vegaSpec.description = 'Financial projections showing net worth and asset performance over time, including accumulation and decumulation phases for retirement planning.';
  
  return vegaSpec;
}

/**
 * Generate a simplified specification for withdrawal sustainability
 * Returns a compiled Vega specification
 */
export async function generateWithdrawalSustainabilitySpec(
  projections: ProjectionPoint[],
  retirementAge: number
): Promise<any> {
  // Get vega-lite module
  const vegaLite = await getVegaLite();
  
  // Filter to retirement years only
  const retirementData = projections
    .filter(p => p.age >= retirementAge && p.sustainabilityRatio !== undefined)
    .map(p => ({
      age: p.age,
      year: p.year,
      sustainabilityRatio: p.sustainabilityRatio || 0,
      sustainable: (p.sustainabilityRatio || 0) >= 1.0,
      netWorth: p.netWorth,
      withdrawalAmount: p.withdrawalAmount || 0
    }));
  
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    title: 'Withdrawal Sustainability Over Retirement Horizon',
    width: 600,
    height: 300,
    data: {
      values: retirementData
    },
    layer: [
      {
        mark: {
          type: 'line',
          point: true
        },
        encoding: {
          x: {
            field: 'age',
            type: 'quantitative',
            title: 'Age'
          },
          y: {
            field: 'sustainabilityRatio',
            type: 'quantitative',
            title: 'Sustainability Ratio',
            scale: {
              domain: [0, 3]
            }
          },
          color: {
            field: 'sustainable',
            type: 'nominal',
            scale: {
              domain: [true, false],
              range: ['#4CAF50', '#F44336']
            },
            legend: {
              title: 'Sustainable?'
            }
          },
          tooltip: [
            { field: 'age', type: 'quantitative', title: 'Age' },
            { field: 'year', type: 'quantitative', title: 'Year' },
            { field: 'sustainabilityRatio', type: 'quantitative', title: 'Sustainability Ratio', format: '.2f' },
            { field: 'netWorth', type: 'quantitative', title: 'Net Worth', format: '$,.0f' },
            { field: 'withdrawalAmount', type: 'quantitative', title: 'Annual Withdrawal', format: '$,.0f' }
          ]
        }
      },
      // Reference line at ratio = 1.0
      {
        mark: {
          type: 'rule',
          strokeDash: [5, 5],
          color: '#666'
        },
        encoding: {
          y: {
            datum: 1.0
          }
        }
      }
    ]
  };
  
  // Compile Vega-Lite to Vega spec
  const compiled = vegaLite.compile(spec);
  const vegaSpec = compiled.spec;
  
  // Add description field as required for valid Vega spec
  vegaSpec.description = 'Withdrawal sustainability chart showing the ratio of available funds to required withdrawals over retirement years.';
  
  return vegaSpec;
}
