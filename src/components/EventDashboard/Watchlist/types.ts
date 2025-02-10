
export interface PriceImpactAnalysis {
  summary: string;
  factors: string[];
  risks: string[];
}

export interface StockPrediction {
  id: string;
  symbol: string;
  rationale: string;
  is_positive: boolean;
  target_price: number | null;
  price_change_percentage: number | null;
  price_impact_analysis: PriceImpactAnalysis | null;
  confidence_score: number | null;
  last_analysis_date: string | null;
  event: {
    id: string;
    title: string;
    description: string;
    event_type: string;
    severity: string;
    created_at: string;
    affected_organizations: string[] | Record<string, string> | null;
  };
}

export interface StockWatch {
  id: string;
  created_at: string;
  status: string;
  entry_price: number | null;
  investment_amount: number | null;
  investment_type: "FOLLOW_ONLY" | "INVEST_AND_FOLLOW" | null;
  broker_connection_id: string | null;
  stock_prediction: StockPrediction;
}

export interface WatchlistProps {
  userId: string;
}
