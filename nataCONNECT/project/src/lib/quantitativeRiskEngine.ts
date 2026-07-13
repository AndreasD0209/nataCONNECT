/**
 * Quantitative risk engine for Practice.
 * Designed to run as a compute job on the AMD Developer Cloud.
 * Currently runs client-side in this build; AMD Developer Cloud
 * deployment is the next planned step (see README).
 */

export interface RiskEngineInput {
  initialCapital: number;
  expectedReturn: number;
  volatility: number;
  riskFreeRate?: number;
  winRate?: number;
  payoffRatio?: number;
  confidenceLevel?: number;
  simulations?: number;
  horizonDays?: number;
}

export interface RiskEngineOutput {
  expectedTerminalValue: number;
  monteCarloVaR: number;
  monteCarloCVaR: number;
  kellyFraction: number;
  recommendedPositionSize: number;
  winProbability: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalSample(): number {
  let u = 0;
  let v = 0;

  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();

  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function calculateKellyFraction(winRate: number, payoffRatio: number): number {
  const b = Math.max(payoffRatio, 0);
  if (b === 0) return 0;

  const raw = (winRate * (b + 1) - 1) / b;
  return clamp(raw, 0, 1);
}

export function runQuantitativeRiskEngine(input: RiskEngineInput): RiskEngineOutput {
  const {
    initialCapital,
    expectedReturn,
    volatility,
    riskFreeRate = 0,
    winRate = 0.5,
    payoffRatio = 1.5,
    confidenceLevel = 0.95,
    simulations = 1000,
    horizonDays = 252,
  } = input;

  const dailyDrift = (expectedReturn - riskFreeRate) / horizonDays;
  const dailyVolatility = volatility / Math.sqrt(horizonDays);
  const terminalValues: number[] = [];

  for (let i = 0; i < simulations; i += 1) {
    let value = initialCapital;

    for (let day = 0; day < horizonDays; day += 1) {
      const shock = normalSample();
      const dailyGrowth = dailyDrift + dailyVolatility * shock;
      value *= Math.max(0, 1 + dailyGrowth);
    }

    terminalValues.push(value);
  }

  const sorted = [...terminalValues].sort((a, b) => a - b);
  const varIndex = Math.max(0, Math.min(sorted.length - 1, Math.floor((1 - confidenceLevel) * sorted.length)));
  const monteCarloVaR = Math.max(0, initialCapital - sorted[varIndex]);
  const tailSlice = sorted.slice(0, Math.max(1, varIndex + 1));
  const monteCarloCVaR = Math.max(0, initialCapital - tailSlice.reduce((sum, value) => sum + value, 0) / tailSlice.length);
  const expectedTerminalValue = terminalValues.reduce((sum, value) => sum + value, 0) / terminalValues.length;
  const kellyFraction = calculateKellyFraction(winRate, payoffRatio);
  const recommendedPositionSize = initialCapital * kellyFraction;

  return {
    expectedTerminalValue,
    monteCarloVaR,
    monteCarloCVaR,
    kellyFraction,
    recommendedPositionSize,
    winProbability: winRate,
  };
}

export function formatRiskSummary(output: RiskEngineOutput): string {
  return [
    `Expected terminal value: €${output.expectedTerminalValue.toFixed(2)}`,
    `Monte Carlo VaR: €${output.monteCarloVaR.toFixed(2)}`,
    `Monte Carlo CVaR: €${output.monteCarloCVaR.toFixed(2)}`,
    `Kelly fraction: ${(output.kellyFraction * 100).toFixed(1)}%`,
    `Recommended position size: €${output.recommendedPositionSize.toFixed(2)}`,
  ].join('\n');
}