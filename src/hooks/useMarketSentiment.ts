
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
        console.log(`Fetching sentiment data for symbol: ${symbol}, event: ${eventId || 'N/A'}`);
        
        // Call the market-sentiment edge function which will now use real APIs when possible
        const { data, error: fnError } = await supabase.functions.invoke('market-sentiment', {
          body: { symbol, eventId }
        });
        
        if (fnError) {
          console.error("Error calling market-sentiment function:", fnError);
          throw new Error(fnError.message);
        }
        
        console.log("Received sentiment data:", data);
        
        if (data && data.predictions) {
          setSentimentData(data);
        } else {
          throw new Error("Invalid response from market sentiment API");
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching market sentiment:", err);
        setError("Failed to fetch market sentiment data");
        setIsLoading(false);
        
        // Fall back to deterministic predictions if the API call fails
        const fallbackPredictions = generateDeterministicPredictions(symbol);
        const calculatedScore = calculateMarketSentimentScore(fallbackPredictions);
        setSentimentData(calculatedScore);
      }
    };

    fetchSentimentData();
  }, [symbol, eventId]);

  return { sentimentData, isLoading, error };
};

// Create deterministic predictions based on stock symbol to ensure consistency
// This is now used as a fallback when the API call fails
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
