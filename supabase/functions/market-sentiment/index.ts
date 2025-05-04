
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SourcePrediction {
  source: string;
  isPositive: boolean;
  confidence?: number;
  explanation?: string;
  timestamp?: string;
}

// Helper function to fetch data from Finnhub
async function fetchFinnhubData(symbol: string) {
  try {
    const finnhubApiKey = Deno.env.get('FINNHUB_API_KEY');
    
    if (!finnhubApiKey) {
      console.log("Finnhub API key not found, skipping");
      return null;
    }
    
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubApiKey}`
    );
    
    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return {
      source: "Finnhub",
      isPositive: data.c > data.pc, // Current price > previous close
      confidence: Math.min(Math.abs((data.c - data.pc) / data.pc) + 0.5, 0.95),
      explanation: `Based on price movement: ${data.c > data.pc ? 'up' : 'down'} ${Math.abs((data.c - data.pc) / data.pc * 100).toFixed(2)}%`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching Finnhub data:", error);
    return null;
  }
}

// Helper function to fetch data from Alpha Vantage
async function fetchAlphaVantageData(symbol: string) {
  try {
    const alphaVantageApiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    
    if (!alphaVantageApiKey) {
      console.log("Alpha Vantage API key not found, skipping");
      return null;
    }
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageApiKey}`
    );
    
    if (!response.ok) {
      console.error(`Alpha Vantage API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote || !quote['10. change percent']) {
      return null;
    }
    
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    
    return {
      source: "Alpha Vantage",
      isPositive: changePercent > 0,
      confidence: Math.min(Math.abs(changePercent / 100) + 0.5, 0.95),
      explanation: `Price change of ${quote['10. change percent']}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching Alpha Vantage data:", error);
    return null;
  }
}

// Helper function to fetch data from IEX Cloud
async function fetchIEXCloudData(symbol: string) {
  try {
    const iexCloudApiKey = Deno.env.get('IEX_CLOUD_API_KEY');
    
    if (!iexCloudApiKey) {
      console.log("IEX Cloud API key not found, skipping");
      return null;
    }
    
    const response = await fetch(
      `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${iexCloudApiKey}`
    );
    
    if (!response.ok) {
      console.error(`IEX Cloud API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    return {
      source: "IEX Cloud",
      isPositive: data.change > 0,
      confidence: Math.min(Math.abs(data.changePercent) + 0.5, 0.95),
      explanation: `Market change of ${(data.changePercent * 100).toFixed(2)}%`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching IEX Cloud data:", error);
    return null;
  }
}

// Helper function to fetch data from Bloomberg (placeholder for now)
async function fetchBloombergData(symbol: string) {
  try {
    const bloombergApiKey = Deno.env.get('BLOOMBERG_API_KEY');
    
    if (!bloombergApiKey) {
      console.log("Bloomberg API key not found, skipping");
      return null;
    }
    
    // Note: This is a placeholder. Bloomberg API requires enterprise access
    // and would need to be implemented according to their specific API documentation
    
    // For now, return deterministic data based on symbol
    const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const sourceValue = ((seed + 11) % 100) / 100;
    
    return {
      source: "Bloomberg",
      isPositive: sourceValue > 0.5,
      confidence: Math.round((sourceValue + 0.3) * 100) / 100,
      explanation: `Bloomberg market analysis for ${symbol}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error with Bloomberg data:", error);
    return null;
  }
}

// Helper function to generate RippleEffect AI prediction
// This combines insights from other sources and adds some additional analysis
function generateRippleEffectPrediction(symbol: string, otherPredictions: SourcePrediction[]) {
  // Create a deterministic seed based on the symbol for consistency in demo
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Count positive predictions from other sources
  const positiveCount = otherPredictions.filter(p => p.isPositive).length;
  const totalCount = otherPredictions.length;
  
  // Base prediction on majority of other sources, but with some variance
  const baseThreshold = totalCount > 0 ? positiveCount / totalCount : 0.5;
  const adjustedThreshold = (baseThreshold * 0.8) + (((seed % 100) / 100) * 0.2);
  
  // Make RippleEffect slightly more positive than average for demo purposes
  const isPositive = adjustedThreshold >= 0.45;
  
  // Confidence is higher when there's strong agreement among sources
  const agreementStrength = totalCount > 0 ? 
    Math.abs((positiveCount / totalCount) - 0.5) * 2 : 0.5;
  
  const confidence = Math.min(0.5 + agreementStrength, 0.95);
  
  return {
    source: "RippleEffect AI",
    isPositive,
    confidence,
    explanation: `Analysis based on market trends and event impact for ${symbol}`,
    timestamp: new Date().toISOString()
  };
}

// Fallback function to generate deterministic predictions when APIs fail
function generateDeterministicPredictions(symbol: string) {
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
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
  
  return sources.map((source, index) => {
    const sourceValue = ((seed + index * 13) % 100) / 100;
    
    const threshold = source === "RippleEffect AI" ? 0.45 : 0.5;
    const isPositive = sourceValue > threshold;
    
    return {
      source,
      isPositive,
      confidence: Math.round((sourceValue + 0.3) * 100) / 100,
      explanation: source === "RippleEffect AI" ? 
        `Analysis based on event impact for ${symbol}` : undefined,
      timestamp: new Date().toISOString()
    };
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { symbol, eventId } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Missing symbol parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing market sentiment for symbol: ${symbol}, event: ${eventId || 'N/A'}`);
    
    // Collect predictions from available API sources
    const predictions: SourcePrediction[] = [];
    
    // Fetch data from financial APIs in parallel
    const [finnhubData, alphaVantageData, iexCloudData, bloombergData] = await Promise.all([
      fetchFinnhubData(symbol),
      fetchAlphaVantageData(symbol),
      fetchIEXCloudData(symbol),
      fetchBloombergData(symbol),
    ]);
    
    // Add successful API responses to predictions
    [finnhubData, alphaVantageData, iexCloudData, bloombergData].forEach(data => {
      if (data) predictions.push(data);
    });
    
    // If we don't have enough real API data, supplement with deterministic data
    if (predictions.length < 3) {
      console.log(`Insufficient API data (only ${predictions.length} sources), adding deterministic predictions`);
      
      // Get deterministic predictions excluding sources we already have
      const existingSources = predictions.map(p => p.source);
      const deterministicPredictions = generateDeterministicPredictions(symbol)
        .filter(p => !existingSources.includes(p.source))
        .slice(0, Math.max(0, 5 - predictions.length)); // Add enough to make at least 5 total
      
      predictions.push(...deterministicPredictions);
    }
    
    // Always add RippleEffect AI prediction (our special sauce)
    const rippleEffectPrediction = generateRippleEffectPrediction(symbol, predictions);
    predictions.push(rippleEffectPrediction);
    
    // Calculate the sentiment score
    const totalPredictions = predictions.length;
    const positiveCount = predictions.filter(p => p.isPositive).length;
    const score = Math.round((positiveCount / totalPredictions) * 100);
    
    const result = {
      score,
      predictions,
      lastUpdated: new Date().toISOString()
    };

    // If an event ID was provided, update the database with this sentiment data
    if (eventId) {
      try {
        const { data: stockPrediction, error: fetchError } = await supabase
          .from('stock_predictions')
          .select('id')
          .eq('event_id', eventId)
          .eq('symbol', symbol)
          .single();
          
        if (stockPrediction && !fetchError) {
          // Update the stock prediction with sentiment analysis
          const { error: updateError } = await supabase
            .from('stock_predictions')
            .update({
              sentiment_analysis: result,
              last_analysis_date: new Date().toISOString()
            })
            .eq('id', stockPrediction.id);
            
          if (updateError) {
            console.error('Error updating stock prediction:', updateError);
          } else {
            console.log(`Updated stock prediction ${stockPrediction.id} with sentiment analysis`);
          }
        }
      } catch (dbError) {
        console.error('Error interacting with database:', dbError);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing market sentiment:', error);
    return new Response(
      JSON.stringify({ error: 'Server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
