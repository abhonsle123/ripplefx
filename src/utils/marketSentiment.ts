
import type { SourcePrediction, MarketSentimentScore } from "@/types/marketSentiment";

/**
 * Calculate the Market Sentiment Score based on predictions from various sources
 * @param predictions Array of predictions from different sources
 * @param weightRippleEffectAI Whether to weight RippleEffect's AI prediction higher
 * @returns A score between 0-100
 */
export const calculateMarketSentimentScore = (
  predictions: SourcePrediction[],
  weightRippleEffectAI = true
): MarketSentimentScore => {
  if (!predictions || predictions.length === 0) {
    return {
      score: 0,
      predictions: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  let totalWeight = 0;
  let positiveWeight = 0;

  predictions.forEach((prediction) => {
    // Apply higher weight to RippleEffect AI prediction if specified
    const weight = weightRippleEffectAI && prediction.source === "RippleEffect AI" ? 1.5 : 1;
    totalWeight += weight;
    
    if (prediction.isPositive) {
      positiveWeight += weight;
    }
  });

  const score = Math.round((positiveWeight / totalWeight) * 100);

  return {
    score,
    predictions,
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Get a color based on the sentiment score
 * @param score A number between 0-100
 * @returns A tailwind color class
 */
export const getSentimentColor = (score: number): string => {
  if (score >= 75) return "text-green-600";
  if (score >= 60) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  if (score >= 25) return "text-red-500";
  return "text-red-600";
};

/**
 * Get a descriptive label based on the sentiment score
 * @param score A number between 0-100
 * @returns A descriptive label
 */
export const getSentimentLabel = (score: number): string => {
  if (score >= 75) return "Very Bullish";
  if (score >= 60) return "Bullish";
  if (score >= 50) return "Slightly Bullish";
  if (score >= 40) return "Slightly Bearish";
  if (score >= 25) return "Bearish";
  return "Very Bearish";
};
