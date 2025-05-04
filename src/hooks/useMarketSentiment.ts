
import { useState, useEffect } from "react";
import type { MarketSentimentScore, SourcePrediction } from "@/types/marketSentiment";
import { calculateMarketSentimentScore } from "@/utils/marketSentiment";
import { supabase } from "@/integrations/supabase/client";

// Create deterministic predictions based on stock symbol to ensure consistency
const generateDeterministicPredictions = (symbol: string): SourcePrediction[] => {
  // Use the symbol to create a deterministic seed
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // List of financial sources
  const sources = [
    "RippleEffect AI",
    "Bloomberg",
    "Alpha Vantage",
    "Yahoo Finance",
    "Finnhub", 
    "IEX Cloud",
    "MarketWatch",
    "Seeking Alpha"
  ];
  
  // Generate deterministic predictions for each source
  return sources.map((source, index) => {
    // Create a deterministic value between 0 and 1 based on symbol and source
    const sourceValue = ((seed + index * 13) % 100) / 100;
    
    // Make RippleEffect AI slightly more positive for testing purposes
    const threshold = source === "RippleEffect AI" ? 0.45 : 0.5;
    const isPositive = sourceValue > threshold;
    
    return {
      source,
      isPositive,
      confidence: Math.round((sourceValue + 0.3) * 100) / 100, // Normalized confidence between 0.3 and 1.3
      explanation: source === "RippleEffect AI" ? 
        `Analysis based on event impact for ${symbol}` : undefined,
      timestamp: new Date().toISOString()
    };
  });
};

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
        
        // In a production environment, we would fetch real data from our market-sentiment edge function
        // For now, we'll use deterministic predictions based on the symbol
        const predictions = generateDeterministicPredictions(symbol);
        
        // Calculate the sentiment score
        const calculatedScore = calculateMarketSentimentScore(predictions);
        
        // In a real implementation, we would save this to the database
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
