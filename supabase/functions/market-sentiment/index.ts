
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { 
  corsHeaders, 
  fetchFinnhubData, 
  fetchAlphaVantageData, 
  fetchYahooFinanceData, 
  fetchBloombergData 
} from './apiServices.ts';
import { 
  SourcePrediction,
  generateDeterministicPredictions, 
  generateRippleEffectPrediction 
} from './predictionGenerators.ts';
import { updateStockPrediction } from './databaseServices.ts';

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
    const [finnhubData, alphaVantageData, yahooFinanceData, bloombergData] = await Promise.all([
      fetchFinnhubData(symbol),
      fetchAlphaVantageData(symbol),
      fetchYahooFinanceData(symbol),
      fetchBloombergData(symbol),
    ]);
    
    // Add successful API responses to predictions
    [finnhubData, alphaVantageData, yahooFinanceData, bloombergData].forEach(data => {
      if (data) predictions.push(data);
    });
    
    // If we don't have enough real API data, supplement with deterministic data
    // excluding sources we already have (including RippleEffect AI)
    if (predictions.length < 3) {
      console.log(`Insufficient API data (only ${predictions.length} sources), adding deterministic predictions`);
      
      // Get deterministic predictions excluding sources we already have
      const existingSources = predictions.map(p => p.source);
      const deterministicPredictions = generateDeterministicPredictions(symbol)
        .filter(p => !existingSources.includes(p.source) && p.source !== "RippleEffect AI")
        .slice(0, Math.max(0, 5 - predictions.length)); // Add enough to make at least 5 total
      
      predictions.push(...deterministicPredictions);
    }
    
    // Always add RippleEffect AI prediction (our special sauce)
    // Make sure it doesn't already exist in the predictions
    if (!predictions.some(p => p.source === "RippleEffect AI")) {
      const rippleEffectPrediction = generateRippleEffectPrediction(symbol, predictions);
      predictions.push(rippleEffectPrediction);
    }
    
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
      await updateStockPrediction(supabase, eventId, symbol, result);
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
