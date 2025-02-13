
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

async function checkMarketStatus(config: AlpacaConfig): Promise<boolean> {
  const baseUrl = config.paperTrading 
    ? 'https://paper-api.alpaca.markets' 
    : 'https://api.alpaca.markets';

  const response = await fetch(`${baseUrl}/v2/clock`, {
    headers: {
      'APCA-API-KEY-ID': config.apiKey,
      'APCA-API-SECRET-KEY': config.apiSecret,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check market status');
  }

  const data = await response.json();
  return data.is_open;
}

async function verifyTradableAsset(config: AlpacaConfig, symbol: string) {
  const baseUrl = config.paperTrading 
    ? 'https://paper-api.alpaca.markets' 
    : 'https://api.alpaca.markets';

  const response = await fetch(`${baseUrl}/v2/assets/${symbol}`, {
    headers: {
      'APCA-API-KEY-ID': config.apiKey,
      'APCA-API-SECRET-KEY': config.apiSecret,
    },
  });

  if (!response.ok) {
    throw new Error(`Symbol ${symbol} is not available for trading`);
  }

  const asset = await response.json();
  if (!asset.tradable) {
    throw new Error(`Symbol ${symbol} is not currently tradable`);
  }

  return asset;
}

async function getLatestPrice(config: AlpacaConfig, symbol: string): Promise<number> {
  const baseUrl = config.paperTrading 
    ? 'https://paper-api.alpaca.markets' 
    : 'https://api.alpaca.markets';

  // First verify if market is open
  const isMarketOpen = await checkMarketStatus(config);
  if (!isMarketOpen) {
    throw new Error('Market is currently closed');
  }

  // Then verify if the asset is tradable
  await verifyTradableAsset(config, symbol);

  // Try to get the latest quote
  const quoteResponse = await fetch(
    `${baseUrl}/v2/stocks/${symbol}/trades/latest`,
    {
      headers: {
        'APCA-API-KEY-ID': config.apiKey,
        'APCA-API-SECRET-KEY': config.apiSecret,
      },
    }
  );

  if (!quoteResponse.ok) {
    console.error('Failed to get latest trade:', await quoteResponse.text());
    throw new Error(`Unable to get current price for ${symbol}`);
  }

  const tradeData = await quoteResponse.json();
  if (!tradeData.trade?.p) {
    throw new Error(`No recent trade price available for ${symbol}`);
  }

  return tradeData.trade.p;
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
  console.log(`Fetching current price for ${symbol}...`);
  const currentPrice = await getLatestPrice(config, symbol);
  console.log(`Current price for ${symbol}: $${currentPrice}`);

  const quantity = Math.floor(amount / currentPrice);
  if (quantity <= 0) {
    throw new Error('Amount too small to purchase any shares');
  }

  console.log(`Placing ${side} order for ${quantity} shares of ${symbol} at market price`);
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
    const errorText = await orderResponse.text();
    console.error('Order placement error:', errorText);
    throw new Error(`Failed to place order: ${errorText}`);
  }

  const orderData = await orderResponse.json();
  console.log(`${side} order placed successfully:`, orderData);
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

  console.log(`Placing stop order for ${quantity} shares of ${symbol} at $${stopPrice}`);
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
      type: 'stop_limit', // Changed to stop_limit for better execution
      time_in_force: 'gtc',
      stop_price: stopPrice,
      limit_price: stopPrice * 0.99, // Set limit price slightly below stop price to ensure execution
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Stop order placement error:', errorText);
    throw new Error(`Failed to place stop order: ${errorText}`);
  }

  const stopOrderData = await response.json();
  console.log('Stop order placed successfully:', stopOrderData);
  return stopOrderData;
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

    console.log('Processing trade request:', { stockPredictionId, amount, brokerConnectionId, userId });

    // Get stock prediction details
    const { data: prediction, error: predictionError } = await supabase
      .from('stock_predictions')
      .select('symbol, price_change_percentage, is_positive')
      .eq('id', stockPredictionId)
      .single();

    if (predictionError || !prediction) {
      console.error('Prediction fetch error:', predictionError);
      throw new Error('Failed to fetch stock prediction');
    }

    // Clean up the symbol
    const symbol = prediction.symbol.trim().toUpperCase();
    console.log('Stock prediction found:', { ...prediction, symbol });

    // Get Alpaca credentials
    const config = await getAlpacaCredentials(brokerConnectionId);

    // Execute initial buy order
    console.log('Executing buy order...');
    const { orderData: buyOrderData, initialPrice } = await executeAlpacaOrder(
      config,
      symbol,
      amount,
      'buy'
    );

    // Wait for buy order to be filled
    console.log('Waiting for buy order to be filled...');
    let filledQuantity = 0;
    if (buyOrderData.status === 'filled') {
      filledQuantity = parseFloat(buyOrderData.filled_qty);
    }

    // Calculate and place stop order for negative predictions
    let stopOrderData = null;
    if (!prediction.is_positive && prediction.price_change_percentage && filledQuantity > 0) {
      console.log('Calculating stop price...');
      const stopPrice = initialPrice * (1 + prediction.price_change_percentage / 100);
      
      console.log('Placing stop order...');
      stopOrderData = await placeStopOrder(
        config,
        symbol,
        filledQuantity,
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
      console.error('Watch entry update error:', updateError);
      throw new Error('Failed to update watch entry');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order: buyOrderData,
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
