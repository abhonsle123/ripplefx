
import { ImpactAnalysis } from "./types.ts";

export function getDefaultAnalysis(): ImpactAnalysis {
  return {
    affected_sectors: [],
    market_impact: "Unable to analyze impact",
    supply_chain_impact: "Unable to analyze supply chain impact",
    market_sentiment: {
      short_term: "Neutral",
      long_term: "Neutral"
    },
    stock_predictions: {
      positive: ["Default Stock 1"],
      negative: ["Default Stock 1"],
      confidence_scores: {
        overall_prediction: 0.5,
        sector_impact: 0.5,
        market_direction: 0.5
      }
    },
    risk_level: "medium",
    analysis_metadata: {
      confidence_factors: [],
      uncertainty_factors: [],
      data_quality_score: 0.5
    }
  };
}
