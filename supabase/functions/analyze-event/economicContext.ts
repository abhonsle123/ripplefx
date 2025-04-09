
// Economic context service to provide current macroeconomic conditions
// This could be expanded in the future to fetch real-time economic indicators

export interface EconomicContext {
  currentState: "expansion" | "recession" | "recovery" | "contraction";
  interestRateEnvironment: "rising" | "falling" | "stable";
  inflationRate: "high" | "moderate" | "low";
  unemploymentTrend: "rising" | "falling" | "stable";
  consumerConfidence: "high" | "moderate" | "low";
  marketVolatility: "high" | "moderate" | "low";
  description: string;
}

/**
 * Get the current economic context for analysis
 * In a production environment, this would fetch data from economic APIs
 * For now, we'll hardcode the current economic conditions
 */
export function getCurrentEconomicContext(): EconomicContext {
  // Current recession environment (April 2025)
  return {
    currentState: "recession",
    interestRateEnvironment: "falling",
    inflationRate: "moderate",
    unemploymentTrend: "rising",
    consumerConfidence: "low",
    marketVolatility: "high",
    description: "The economy is currently in a recession with central banks beginning to cut interest rates. Unemployment is rising, consumer confidence is low, and market volatility remains high. Corporate earnings growth has slowed significantly across most sectors."
  };
}

/**
 * Get sector-specific recession impacts
 * Returns information about how different sectors typically perform during recessions
 */
export function getSectorRecessionImpacts(): Record<string, string> {
  return {
    "Technology": "Technology stocks typically underperform during recessions, particularly growth-oriented companies with high valuations and limited profitability. However, established tech companies with strong balance sheets may be more resilient.",
    "Healthcare": "Healthcare is generally considered defensive and tends to outperform during recessions as healthcare spending is relatively inelastic. However, elective procedures and services may see reduced demand.",
    "Consumer Staples": "Consumer staples stocks often outperform during recessions as demand for essential goods remains relatively stable regardless of economic conditions.",
    "Consumer Discretionary": "Consumer discretionary stocks typically underperform during recessions as consumers reduce spending on non-essential goods and services.",
    "Financials": "Financial stocks often underperform during recessions due to concerns about loan defaults, reduced lending activity, and potential regulatory pressures.",
    "Energy": "Energy stocks performance during recessions can vary based on oil prices, but generally underperform due to reduced industrial activity and transportation.",
    "Industrials": "Industrial stocks typically underperform during recessions due to reduced capital expenditure, manufacturing activity, and global trade.",
    "Materials": "Materials stocks often underperform during recessions due to reduced construction activity and manufacturing output.",
    "Utilities": "Utilities stocks are generally considered defensive and may outperform during recessions as demand for electricity and water remains relatively stable.",
    "Real Estate": "Real estate stocks typically underperform during recessions due to concerns about property values, rental income, and financing costs."
  };
}
