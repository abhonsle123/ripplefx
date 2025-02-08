
import { ImpactAnalysis } from "./types.ts";

export function getDefaultAnalysis(): ImpactAnalysis {
  return {
    affected_sectors: [
      "Technology",
      "Manufacturing",
      "Transportation",
      "Retail",
      "Insurance"
    ],
    market_impact: "Unable to analyze impact",
    supply_chain_impact: "Unable to analyze supply chain impact",
    market_sentiment: {
      short_term: "Neutral",
      long_term: "Neutral"
    },
    stock_predictions: {
      positive: [
        {
          symbol: "MSFT",
          rationale: "Microsoft's cloud services and remote work solutions often see increased demand during disruptions. Strong balance sheet and diverse revenue streams provide stability."
        },
        {
          symbol: "HD",
          rationale: "Home Depot typically benefits from reconstruction and recovery efforts. Historical data shows positive price movement during recovery phases."
        },
        {
          symbol: "UPS",
          rationale: "United Parcel Service often sees increased shipping demand during supply chain disruptions, with strong logistics network providing competitive advantage."
        }
      ],
      negative: [
        {
          symbol: "DAL",
          rationale: "Delta Airlines faces potential route disruptions and increased operational costs. Historical volatility shows sensitivity to regional disruptions."
        },
        {
          symbol: "MAR",
          rationale: "Marriott International may experience reduced bookings and revenue impact. Past events show correlation between regional disruptions and hospitality sector performance."
        },
        {
          symbol: "TGT",
          rationale: "Target's supply chain and retail operations could face significant disruptions. Regional exposure and inventory management challenges may impact performance."
        }
      ],
      confidence_scores: {
        overall_prediction: 0.75,
        sector_impact: 0.8,
        market_direction: 0.7
      }
    },
    risk_level: "medium",
    analysis_metadata: {
      confidence_factors: [
        "Historical precedent",
        "Market sentiment analysis",
        "Supply chain data"
      ],
      uncertainty_factors: [
        "Event duration unknown",
        "Regulatory response pending",
        "Global market conditions"
      ],
      data_quality_score: 0.75
    }
  };
}
