
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface AlpacaConfig {
  apiKey: string;
  apiSecret: string;
  paperTrading: boolean;
}

async function getAlpacaCredentials(brokerConnectionId: string): Promise<AlpacaConfig> {
  const { data: connection, error } = await supabase
    .from('broker_connections')
    .select('api_key, api_secret, broker_name')
    .eq('id', brokerConnectionId)
    .single();

  if (error) throw new Error('Failed to fetch broker credentials');
  if (!connection) throw new Error('Broker connection not found');

  return {
    apiKey: connection.api_key,
    apiSecret: connection.api_secret,
    paperTrading: connection.broker_name === 'alpaca_paper',
  };
}

async function executeAlpacaOrder(
  config: AlpacaConfig,
  symbol: string,
  amount: number,
  side: 'buy' | 'sell'
) {
  const baseUrl = config.paperTrading 
    ? 'https://paper-api.alpaca.markets' 
    : 'https://api.alpaca.markets';

  // Get current market price
  const quoteResponse = await fetch(
    `${baseUrl}/v2/stocks/${symbol}/quotes/latest`,
    {
      headers: {
        'APCA-API-KEY-ID': config.apiKey,
        'APCA-API-SECRET-KEY': config.apiSecret,
      },
    }
  );

  if (!quoteResponse.ok) {
    throw new Error(`Failed to get quote: ${await quoteResponse.text()}`);
  }

  const quote = await quoteResponse.json();
  const currentPrice = quote.quote.ap; // Ask price
  const quantity = Math.floor(amount / currentPrice);

  if (quantity <= 0) {
    throw new Error('Amount too small to purchase any shares');
  }

  // Place the market order
  const orderResponse = await fetch(`${baseUrl}/v2/orders`, {
    method: 'POST',
    headers: {
      'APCA-API-KEY-ID': config.apiKey,
      'APCA-API-SECRET-KEY': config.apiSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      symbol,
      qty: quantity,
      side,
      type: 'market',
      time_in_force: 'day',
    }),
  });

  if (!orderResponse.ok) {
    throw new Error(`Failed to place order: ${await orderResponse.text()}`);
  }

  const orderData = await orderResponse.json();
  return { orderData, initialPrice: currentPrice };
}

async function placeStopOrder(
  config: AlpacaConfig,
  symbol: string,
  quantity: number,
  stopPrice: number
) {
  const baseUrl = config.paperTrading 
    ? 'https://paper-api.alpaca.markets' 
    : 'https://api.alpaca.markets';

  const response = await fetch(`${baseUrl}/v2/orders`, {
    method: 'POST',
    headers: {
      'APCA-API-KEY-ID': config.apiKey,
      'APCA-API-SECRET-KEY': config.apiSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      symbol,
      qty: quantity,
      side: 'sell',
      type: 'stop',
      time_in_force: 'gtc',
      stop_price: stopPrice,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to place stop order: ${await response.text()}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stockPredictionId, amount, brokerConnectionId, userId } = await req.json();

    // Validate input
    if (!stockPredictionId || !amount || !brokerConnectionId || !userId) {
      throw new Error('Missing required parameters');
    }

    // Get stock prediction details
    const { data: prediction, error: predictionError } = await supabase
      .from('stock_predictions')
      .select('symbol, price_change_percentage, is_positive')
      .eq('id', stockPredictionId)
      .single();

    if (predictionError || !prediction) {
      throw new Error('Failed to fetch stock prediction');
    }

    // Get Alpaca credentials and execute trade
    const config = await getAlpacaCredentials(brokerConnectionId);
    const { orderData, initialPrice } = await executeAlpacaOrder(
      config,
      prediction.symbol,
      amount,
      'buy'
    );

    // Calculate stop price for negative predictions
    let stopOrderData = null;
    if (!prediction.is_positive && prediction.price_change_percentage) {
      const stopPrice = initialPrice * (1 + prediction.price_change_percentage / 100);
      stopOrderData = await placeStopOrder(
        config,
        prediction.symbol,
        orderData.qty,
        stopPrice
      );
    }

    // Update watch entry with order details
    const { error: updateError } = await supabase
      .from('user_stock_watches')
      .update({
        status: 'WATCHING',
        entry_price: initialPrice,
        initial_price: initialPrice,
        stop_price: stopOrderData?.stop_price,
        stop_order_id: stopOrderData?.id,
        last_price_check: new Date().toISOString(),
      })
      .eq('stock_prediction_id', stockPredictionId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update watch entry:', updateError);
      throw new Error('Failed to update watch entry');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order: orderData,
          stopOrder: stopOrderData,
          initialPrice,
        },
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
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
