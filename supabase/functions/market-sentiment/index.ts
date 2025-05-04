
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { symbol } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Missing symbol parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In a real implementation, we would fetch data from financial APIs here
    // For now, we'll generate deterministic predictions based on the symbol
    
    // Create a deterministic seed based on the symbol
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
    
    // Generate deterministic predictions for each source
    const predictions = sources.map((source, index) => {
      // Create a deterministic value between 0 and 1 based on symbol and source
      const sourceValue = ((seed + index * 13) % 100) / 100;
      
      // Make RippleEffect AI slightly more positive for testing
      const threshold = source === "RippleEffect AI" ? 0.45 : 0.5;
      
      return {
        source,
        isPositive: sourceValue > threshold,
        confidence: Math.round((sourceValue + 0.3) * 100) / 100,
        explanation: source === "RippleEffect AI" ? 
          `Analysis based on market trends for ${symbol}` : undefined,
        timestamp: new Date().toISOString()
      };
    });
    
    // Calculate the sentiment score
    const totalPredictions = predictions.length;
    const positiveCount = predictions.filter(p => p.isPositive).length;
    const score = Math.round((positiveCount / totalPredictions) * 100);
    
    const result = {
      score,
      predictions,
      lastUpdated: new Date().toISOString()
    };

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
