
export interface SourcePrediction {
  source: string;
  isPositive: boolean;
  confidence?: number; // 0-1 scale representing confidence level
  explanation?: string;
  timestamp?: string;
}

export interface MarketSentimentScore {
  score: number; // 0-100 percentage
  predictions: SourcePrediction[];
  lastUpdated: string;
}
