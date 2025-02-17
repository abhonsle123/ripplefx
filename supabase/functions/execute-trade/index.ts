
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { AlpacaClient } from 'https://esm.sh/@alpacahq/alpaca-trade-api@3.0.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TradeRequest {
  stockPredictionId: string;
  amount: number;
  brokerConnectionId: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { stockPredictionId, amount, brokerConnectionId, userId } = await req.json() as TradeRequest;

    if (!stockPredictionId || !amount || !brokerConnectionId || !userId) {
      throw new Error('Missing required parameters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get broker connection details with API keys
    const { data: brokerConnection, error: brokerError } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('id', brokerConnectionId)
      .single();

    if (brokerError || !brokerConnection) {
      throw new Error('Invalid broker connection');
    }

    // Get stock prediction details
    const { data: prediction, error: predictionError } = await supabase
      .from('stock_predictions')
      .select('symbol, is_positive')
      .eq('id', stockPredictionId)
      .single();

    if (predictionError || !prediction) {
      throw new Error('Invalid stock prediction');
    }

    console.log('Initializing Alpaca client for', brokerConnection.broker_name);
    
    // Initialize Alpaca client with broker credentials
    const baseURL = brokerConnection.broker_name === 'alpaca_paper' 
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';

    const alpaca = new AlpacaClient({
      credentials: {
        key: brokerConnection.api_key,
        secret: brokerConnection.api_secret,
      },
      paper: brokerConnection.broker_name === 'alpaca_paper',
    });

    // Get current market price
    console.log('Fetching latest price for', prediction.symbol);
    const quote = await alpaca.getLatestTrade(prediction.symbol);
    const currentPrice = quote.price;
    console.log('Current price:', currentPrice);

    // Calculate quantity based on amount and current price
    const quantity = Math.floor(amount / currentPrice);
    if (quantity <= 0) {
      throw new Error(`Investment amount (${amount}) too small for current stock price (${currentPrice})`);
    }

    // Create trade execution record
    const { data: trade, error: tradeError } = await supabase
      .from('trade_executions')
      .insert([
        {
          user_id: userId,
          stock_symbol: prediction.symbol,
          quantity: quantity,
          price: currentPrice,
          stock_price: currentPrice,
          trade_type: prediction.is_positive ? 'BUY' : 'SELL',
          status: 'PENDING',
          action: prediction.is_positive ? 'BUY' : 'SELL'
        }
      ])
      .select()
      .single();

    if (tradeError) {
      throw tradeError;
    }

    console.log('Submitting order to Alpaca');
    
    // Submit the order to Alpaca
    const order = await alpaca.submitOrder({
      symbol: prediction.symbol,
      qty: quantity,
      side: prediction.is_positive ? 'buy' : 'sell',
      type: 'market',
      time_in_force: 'day'
    });

    console.log('Order submitted successfully:', order);

    // Update trade execution status
    const { error: updateError } = await supabase
      .from('trade_executions')
      .update({ 
        status: 'EXECUTED',
        external_order_id: order.id
      })
      .eq('id', trade.id);

    if (updateError) {
      console.error('Error updating trade status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        trade,
        order 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Trade execution error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
