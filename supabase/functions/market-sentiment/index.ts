
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
    // For now, we'll simulate the data
    
    // Simulate market sentiment with data that might be slightly biased based on the first letter
    // Just to create some differentiation between stocks
    const firstChar = symbol.charAt(0).toLowerCase();
    const charValue = firstChar.charCodeAt(0) - 97; // 'a' is 97
    const basePositivity = (charValue % 26) / 26; // 0-1 range based on letter
    
    // Create predictions from 8 sources with the slight bias
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
    
    const predictions = sources.map(source => {
      // RippleEffect AI prediction is weighted
      const bias = source === "RippleEffect AI" ? 0.1 : 0;
      const positivityThreshold = 0.5 - basePositivity * 0.2 - bias;
      
      return {
        source,
        isPositive: Math.random() > positivityThreshold,
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
