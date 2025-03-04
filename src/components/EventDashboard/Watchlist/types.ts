
import { UseMutationResult } from "@tanstack/react-query";
import { Event } from "@/types/event";

export interface WatchlistProps {
  userId: string;
  searchTerm?: string;
  eventType?: string;
  severity?: string;
}

export interface StockWatch {
  id: string;
  created_at: string;
  status: "WATCHING" | "INVESTING" | "CANCELLED";
  entry_price: number | null;
  investment_amount: number | null;
  investment_type: "FOLLOW_ONLY" | "INVEST_AND_FOLLOW";
  broker_connection_id: string | null;
  stock_prediction: {
    id: string;
    symbol: string;
    rationale: string;
    is_positive: boolean;
    target_price: number | null;
    price_change_percentage: number;
    confidence_score: number;
    last_analysis_date: string;
    price_impact_analysis: {
      summary: string;
      factors: string[];
      risks: string[];
    } | null;
    event: Event;
  };
}
