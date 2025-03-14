
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  stockPredictionId: string;
  amount: number;
  brokerId: string;
  userId: string;
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
    const { stockPredictionId, amount, brokerId, userId } = await req.json() as RequestBody;

    // Validate inputs
    if (!stockPredictionId || !amount || !brokerId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the broker connection
    const { data: brokerConnection, error: brokerError } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('id', brokerId)
      .eq('user_id', userId)
      .single();

    if (brokerError) {
      return new Response(
        JSON.stringify({ error: 'Broker connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Connect to Alpaca API - in a real implementation, you would use their API
    // Here we simulate the interaction
    console.log(`Connecting to Alpaca API with key: ${brokerConnection.api_key.substring(0, 5)}...`);
    console.log(`Attempting to place order for $${amount} of ${symbol}`);

    // Get recent stock price
    let stockPrice;
    try {
      // In a real implementation, you would fetch the stock price from Alpaca or another source
      // For this example, we'll use a simulated price
      stockPrice = Math.random() * 100 + 50; // Random price between $50 and $150
      console.log(`Current stock price for ${symbol}: $${stockPrice.toFixed(2)}`);

      // Calculate shares to buy
      const shares = amount / stockPrice;
      console.log(`Will purchase ${shares.toFixed(4)} shares of ${symbol}`);

      // Create a record of the trade execution
      const { data: tradeExecution, error: tradeError } = await supabase
        .from('trade_executions')
        .insert([
          {
            user_id: userId,
            stock_symbol: symbol,
            quantity: shares,
            price: stockPrice,
            action: 'BUY',
            status: 'COMPLETED',
            stock_price: stockPrice,
            trade_type: 'MARKET'
          }
        ])
        .select()
        .single();

      if (tradeError) {
        throw tradeError;
      }

      // Update the stock watch with the initial price
      const { data: watchData, error: watchQueryError } = await supabase
        .from('user_stock_watches')
        .select('id')
        .eq('user_id', userId)
        .eq('stock_prediction_id', stockPredictionId)
        .single();

      if (watchQueryError && watchQueryError.code !== 'PGRST116') {
        throw watchQueryError;
      }

      if (watchData) {
        const { error: watchUpdateError } = await supabase
          .from('user_stock_watches')
          .update({
            initial_price: stockPrice,
            investment_amount: amount,
            broker_connection_id: brokerId,
            investment_type: 'INVEST_AND_FOLLOW',
            last_price_check: new Date().toISOString()
          })
          .eq('id', watchData.id);

        if (watchUpdateError) {
          throw watchUpdateError;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully placed order for ${shares.toFixed(4)} shares of ${symbol} at $${stockPrice.toFixed(2)}`,
          tradeExecution
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error executing trade:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to execute trade', details: error.message }),
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
