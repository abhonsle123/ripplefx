
import { useState, useEffect } from "react";
import type { MarketSentimentScore, SourcePrediction } from "@/types/marketSentiment";
import { calculateMarketSentimentScore } from "@/utils/marketSentiment";
import { supabase } from "@/integrations/supabase/client";

export const useMarketSentiment = (symbol: string, eventId: string) => {
  const [sentimentData, setSentimentData] = useState<MarketSentimentScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Don't fetch if no symbol is provided
    if (!symbol) {
      setIsLoading(false);
      return;
    }
    
    // Use a cache key that includes the symbol and a timestamp rounded to the nearest hour
    // This ensures we don't constantly refetch for the same symbol, but still refresh periodically
    const cacheTimestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // Nearest hour
    const cacheKey = `market-sentiment-${symbol}-${cacheTimestamp}`;
    
    const fetchSentimentData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check for cached data first
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setSentimentData(parsed);
          setLastUpdated(parsed.lastUpdated);
          setIsLoading(false);
          console.log(`Using cached sentiment data for ${symbol}`);
          return;
        }
        
        // If no cached data, call our Supabase edge function
        const { data, error } = await supabase.functions.invoke('market-sentiment', {
          body: { symbol, eventId }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data) {
          // Update state with the fetched data
          setSentimentData(data);
          setLastUpdated(data.lastUpdated);
          
          // Cache the response for an hour
          localStorage.setItem(cacheKey, JSON.stringify(data));
          console.log(`Fetched new sentiment data for ${symbol}`);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching market sentiment:", err);
        setError("Failed to fetch market sentiment data");
        setIsLoading(false);
        
        // If the API call fails, fall back to deterministic generation
        // to ensure the UI still works
        fallbackToStaticData(symbol);
      }
    };
    
    // Fallback to static data generation in case of API failure
    const fallbackToStaticData = (tickerSymbol: string) => {
      console.log(`Falling back to static data for ${tickerSymbol}`);
      
      // Create deterministic predictions based on stock symbol
      const seed = tickerSymbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
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
      
      // Generate deterministic predictions
      const predictions = sources.map((source, index) => {
        const sourceValue = ((seed + index * 13) % 100) / 100;
        const threshold = source === "RippleEffect AI" ? 0.45 : 0.5;
        
        return {
          source,
          isPositive: sourceValue > threshold,
          confidence: Math.round((sourceValue + 0.3) * 100) / 100,
          explanation: source === "RippleEffect AI" ? 
            `Analysis based on event impact for ${tickerSymbol}` : undefined,
          timestamp: new Date().toISOString()
        };
      });
      
      // Calculate the sentiment score
      const calculatedScore = calculateMarketSentimentScore(predictions);
      setSentimentData(calculatedScore);
    };

    fetchSentimentData();
  }, [symbol, eventId]);

  return { sentimentData, isLoading, error, lastUpdated };
};
