
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

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
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the stock prediction
    const { data: stockPrediction, error: stockError } = await supabase
      .from('stock_predictions')
      .select('*')
      .eq('id', stockPredictionId)
      .single();

    if (stockError) {
      return new Response(
        JSON.stringify({ error: 'Stock prediction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const symbol = stockPrediction.symbol;
    
    // In a real implementation, fetch the latest stock price from a financial API
    // For this example, we'll simulate a price and update
    const currentPrice = Math.random() * 100 + 50; // Random price between $50 and $150
    console.log(`Simulated current price for ${symbol}: $${currentPrice.toFixed(2)}`);
    
    // Calculate a slight adjustment to the price change percentage
    let adjustedPercentage = stockPrediction.price_change_percentage;
    const adjustment = (Math.random() * 2) - 1; // Random adjustment between -1% and +1%
    
    if (stockPrediction.is_positive) {
      adjustedPercentage = Math.max(0.5, adjustedPercentage + adjustment);
    } else {
      adjustedPercentage = Math.min(-0.5, adjustedPercentage + adjustment);
    }
    
    console.log(`Adjusted price change percentage for ${symbol}: ${adjustedPercentage.toFixed(2)}%`);
    
    // Update the stock prediction with new analysis
    const { data: updatedPrediction, error: updateError } = await supabase
      .from('stock_predictions')
      .update({
        price_change_percentage: adjustedPercentage,
        last_analysis_date: new Date().toISOString(),
        // In a real implementation, you might update other fields based on real analysis
      })
      .eq('id', stockPredictionId)
      .select()
      .single();
      
    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update stock prediction', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update all user watches for this stock prediction with the latest price
    await supabase
      .from('user_stock_watches')
      .update({
        last_price_check: new Date().toISOString(),
        last_price: currentPrice,
      })
      .eq('stock_prediction_id', stockPredictionId);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Analysis updated for ${symbol}`,
        data: updatedPrediction
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error analyzing stock price:', error);
    return new Response(
      JSON.stringify({ error: 'Server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
