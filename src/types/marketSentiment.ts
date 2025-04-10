
export interface SourcePrediction {
  source: string;
  isPositive: boolean;
  confidence?: number;
  explanation?: string;
  timestamp?: string;
}

export interface MarketSentimentScore {
  score: number; // 0-100 percentage
  predictions: SourcePrediction[];
  lastUpdated: string;
}
