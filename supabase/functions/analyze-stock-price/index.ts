
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  stockPredictionId: string;
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
    const { stockPredictionId } = await req.json() as RequestBody;

    // Validate inputs
    if (!stockPredictionId) {
      return new Response(
        JSON.stringify({ error: 'Missing stock prediction ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the stock prediction
    const { data: stockPrediction, error: stockError } = await supabase
      .from('stock_predictions')
      .select('*, event:event_id(*)')
      .eq('id', stockPredictionId)
      .single();

    if (stockError) {
      return new Response(
        JSON.stringify({ error: 'Stock prediction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const symbol = stockPrediction.symbol;
    const isPositive = stockPrediction.is_positive;
    let currentConfidenceScore = stockPrediction.confidence_score || 0;
    let currentPriceChangePercentage = stockPrediction.price_change_percentage || 0;

    console.log(`Analyzing stock ${symbol} with current confidence: ${currentConfidenceScore}`);

    // Simulate getting latest market data - in a real implementation, you would fetch from Alpaca or another API
    // Here we're simulating the analysis with random data
    try {
      // Simulate market reaction to news
      const marketReaction = Math.random() * 0.5 + 0.7; // Value between 0.7 and 1.2
      
      // Adjust confidence based on market reaction
      const newConfidenceScore = Math.min(100, Math.max(0, 
        currentConfidenceScore * marketReaction + (Math.random() * 10 - 5)
      ));
      
      // Adjust price change prediction
      const priceChangeMultiplier = newConfidenceScore / currentConfidenceScore;
      const newPriceChangePercentage = isPositive ? 
        currentPriceChangePercentage * priceChangeMultiplier :
        currentPriceChangePercentage / priceChangeMultiplier;
      
      console.log(`New confidence score: ${newConfidenceScore.toFixed(2)}`);
      console.log(`New price change prediction: ${newPriceChangePercentage.toFixed(2)}%`);
      
      // Generate an updated price impact analysis
      const updatedAnalysis = {
        confidence_adjustment: {
          previous: currentConfidenceScore,
          current: newConfidenceScore,
          change: newConfidenceScore - currentConfidenceScore
        },
        price_prediction_adjustment: {
          previous: currentPriceChangePercentage,
          current: newPriceChangePercentage,
          change: newPriceChangePercentage - currentPriceChangePercentage
        },
        market_factors: {
          market_volatility: Math.random() * 100,
          sector_performance: Math.random() * 20 - 10,
          recent_volume: Math.floor(Math.random() * 1000000) + 100000
        },
        last_updated: new Date().toISOString()
      };
      
      // Update the stock prediction
      const { data: updatedPrediction, error: updateError } = await supabase
        .from('stock_predictions')
        .update({
          confidence_score: newConfidenceScore,
          price_change_percentage: newPriceChangePercentage,
          price_impact_analysis: {
            ...stockPrediction.price_impact_analysis,
            updates: [...(stockPrediction.price_impact_analysis?.updates || []), updatedAnalysis]
          },
          last_analysis_date: new Date().toISOString()
        })
        .eq('id', stockPredictionId)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully updated analysis for ${symbol}`,
          updatedPrediction
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error analyzing stock price:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze stock price', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
