
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
      positive: [
        {
          symbol: "NEE",
          rationale: "NextEra Energy - Strong renewable energy portfolio and grid modernization initiatives"
        },
        {
          symbol: "PCG",
          rationale: "PG&E Corporation - Infrastructure hardening and wildfire mitigation investments"
        },
        {
          symbol: "DUK",
          rationale: "Duke Energy - Diversified utility with strong emergency response capabilities"
        }
      ],
      negative: [
        {
          symbol: "SO",
          rationale: "Southern Company - Exposure to severe weather risks in southeastern markets"
        },
        {
          symbol: "ED",
          rationale: "Consolidated Edison - Urban infrastructure vulnerability to extreme events"
        },
        {
          symbol: "EXC",
          rationale: "Exelon - Nuclear fleet exposure to environmental regulations"
        }
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
