
export interface ConfidenceScores {
  overall_prediction: number;
  sector_impact: number;
  market_direction: number;
}

export interface MarketSentiment {
  short_term: string;
  long_term: string;
}

export interface StockPrediction {
  symbol: string;
  rationale: string;
}

export interface StockPredictions {
  positive: StockPrediction[];
  negative: StockPrediction[];
  confidence_scores: ConfidenceScores;
}

export interface AnalysisMetadata {
  confidence_factors: string[];
  uncertainty_factors: string[];
  data_quality_score: number;
}

export interface ImpactAnalysis {
  affected_sectors: string[];
  market_impact: string;
  supply_chain_impact: string;
  market_sentiment: MarketSentiment;
  stock_predictions: StockPredictions;
  risk_level: "low" | "medium" | "high" | "critical";
  analysis_metadata: AnalysisMetadata;
}
