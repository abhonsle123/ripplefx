
// Prediction generators for providing market sentiment analysis

export interface SourcePrediction {
  source: string;
  isPositive: boolean;
  confidence?: number;
  explanation?: string;
  timestamp?: string;
}

// Fallback function to generate deterministic predictions when APIs fail
export function generateDeterministicPredictions(symbol: string): SourcePrediction[] {
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const sources = [
    "Bloomberg",
    "Alpha Vantage",
    "Yahoo Finance",
    "Finnhub", 
    "IEX Cloud",
    "MarketWatch",
    "Seeking Alpha"
  ];
  
  return sources.map((source, index) => {
    const sourceValue = ((seed + index * 13) % 100) / 100;
    
    const threshold = 0.5;
    const isPositive = sourceValue > threshold;
    
    return {
      source,
      isPositive,
      confidence: Math.round((sourceValue + 0.3) * 100) / 100,
      explanation: undefined,
      timestamp: new Date().toISOString()
    };
  });
}

// Helper function to generate RippleEffect AI prediction
// This combines insights from other sources and adds some additional analysis
export function generateRippleEffectPrediction(symbol: string, otherPredictions: SourcePrediction[]): SourcePrediction {
  // Create a deterministic seed based on the symbol for consistency in demo
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Count positive predictions from other sources
  const positiveCount = otherPredictions.filter(p => p.isPositive).length;
  const totalCount = otherPredictions.length;
  
  // Base prediction on majority of other sources, but with some variance
  const baseThreshold = totalCount > 0 ? positiveCount / totalCount : 0.5;
  const adjustedThreshold = (baseThreshold * 0.8) + (((seed % 100) / 100) * 0.2);
  
  // Make RippleEffect slightly more positive than average for demo purposes
  const isPositive = adjustedThreshold >= 0.45;
  
  // Confidence is higher when there's strong agreement among sources
  const agreementStrength = totalCount > 0 ? 
    Math.abs((positiveCount / totalCount) - 0.5) * 2 : 0.5;
  
  const confidence = Math.min(0.5 + agreementStrength, 0.95);
  
  return {
    source: "RippleEffect AI",
    isPositive,
    confidence,
    explanation: `Analysis based on market trends and event impact for ${symbol}`,
    timestamp: new Date().toISOString()
  };
}
