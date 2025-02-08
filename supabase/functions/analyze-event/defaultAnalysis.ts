
import { ImpactAnalysis } from "./types.ts";

export function getDefaultAnalysis(): ImpactAnalysis {
  return {
    affected_sectors: ["Energy", "Utilities", "Infrastructure"],
    market_impact: "Unable to analyze impact",
    supply_chain_impact: "Unable to analyze supply chain impact",
    market_sentiment: {
      short_term: "Neutral",
      long_term: "Neutral"
    },
    stock_predictions: {
      positive: [
        { symbol: "NEE", rationale: "Leading renewable energy provider" },
        { symbol: "PCG", rationale: "Major utility with strong infrastructure" },
        { symbol: "DUK", rationale: "Diversified energy operations" }
      ],
      negative: [
        { symbol: "SO", rationale: "High exposure to affected region" },
        { symbol: "ED", rationale: "Infrastructure vulnerability" },
        { symbol: "EXC", rationale: "Operational risks in the area" }
      ],
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
