
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

// CORS headers for browser requests
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the request body
    const { stockPredictionId, amount, brokerId, userId } = await req.json();

    // Validate the request
    if (!stockPredictionId || !amount || !brokerId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing trade request: Stock ID: ${stockPredictionId}, Amount: ${amount}, Broker ID: ${brokerId}`);

    // Get the stock prediction details
    const { data: stockPrediction, error: stockError } = await supabaseClient
      .from('stock_predictions')
      .select('*')
      .eq('id', stockPredictionId)
      .single();

    if (stockError) {
      console.error('Error fetching stock prediction:', stockError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stock prediction details' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // In a real implementation, this would connect to an actual broker API
    // For now, we'll simulate a successful trade execution

    // Log the trade in the database
    const { data: trade, error: tradeError } = await supabaseClient
      .from('trades')
      .insert([
        {
          user_id: userId,
          stock_prediction_id: stockPredictionId,
          broker_connection_id: brokerId,
          amount,
          status: 'COMPLETED',
          direction: stockPrediction.is_positive ? 'BUY' : 'SELL'
        }
      ])
      .select()
      .single();

    if (tradeError) {
      console.error('Error recording trade:', tradeError);
      return new Response(
        JSON.stringify({ error: 'Failed to record trade' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update the watch record to reflect the investment
    const { error: watchUpdateError } = await supabaseClient
      .from('user_stock_watches')
      .update({ 
        status: 'INVESTING', 
        investment_amount: amount,
        entry_price: stockPrediction.current_price || null
      })
      .eq('user_id', userId)
      .eq('stock_prediction_id', stockPredictionId);

    if (watchUpdateError) {
      console.error('Error updating watch status:', watchUpdateError);
      // We'll still consider this a success since the trade went through
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Trade executed successfully',
        trade 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
