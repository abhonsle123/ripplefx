
import { useState, useEffect } from "react";
import type { MarketSentimentScore, SourcePrediction } from "@/types/marketSentiment";
import { calculateMarketSentimentScore } from "@/utils/marketSentiment";
import { supabase } from "@/integrations/supabase/client";

export const useMarketSentiment = (symbol: string, eventId: string) => {
  const [sentimentData, setSentimentData] = useState<MarketSentimentScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentimentData = async () => {
      if (!symbol) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // In a production environment, we would fetch real data from the financial APIs
        // For now, we'll simulate data from various sources
        const simulatedPredictions: SourcePrediction[] = [
          {
            source: "RippleEffect AI",
            isPositive: Math.random() > 0.4, // Slightly biased toward positive
            explanation: "Based on event analysis and historical patterns",
            timestamp: new Date().toISOString()
          },
          {
            source: "Bloomberg",
            isPositive: Math.random() > 0.5,
            timestamp: new Date().toISOString()
          },
          {
            source: "Alpha Vantage",
            isPositive: Math.random() > 0.5,
            timestamp: new Date().toISOString()
          },
          {
            source: "Yahoo Finance",
            isPositive: Math.random() > 0.5,
            timestamp: new Date().toISOString()
          },
          {
            source: "Finnhub",
            isPositive: Math.random() > 0.5,
            timestamp: new Date().toISOString()
          },
          {
            source: "IEX Cloud",
            isPositive: Math.random() > 0.5,
            timestamp: new Date().toISOString()
          },
          {
            source: "MarketWatch",
            isPositive: Math.random() > 0.5,
            timestamp: new Date().toISOString()
          },
          {
            source: "Seeking Alpha",
            isPositive: Math.random() > 0.5,
            timestamp: new Date().toISOString()
          }
        ];
        
        // Calculate the sentiment score
        const calculatedScore = calculateMarketSentimentScore(simulatedPredictions);
        
        // In a real implementation, we would save this to the database
        // For now, we'll just set it to state
        setSentimentData(calculatedScore);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching market sentiment:", err);
        setError("Failed to fetch market sentiment data");
        setIsLoading(false);
      }
    };

    fetchSentimentData();
  }, [symbol, eventId]);

  return { sentimentData, isLoading, error };
};
