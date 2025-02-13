
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
    console.error('Asset verification error:', await response.text());
    throw new Error(`Symbol ${symbol} is not available for trading`);
  }

  const asset = await response.json();
  if (!asset.tradable) {
    throw new Error(`Symbol ${symbol} is not currently tradable`);
  }

  return asset;
}

async function getLatestPrice(config: AlpacaConfig, symbol: string): Promise<number> {
  const marketDataUrl = 'https://data.alpaca.markets';

  // First verify if market is open
  const isMarketOpen = await checkMarketStatus(config);
  if (!isMarketOpen) {
    throw new Error('Market is currently closed');
  }

  // Then verify if the asset is tradable
  await verifyTradableAsset(config, symbol);

  // Try to get the latest quote first
  try {
    const quoteResponse = await fetch(
      `${marketDataUrl}/v2/stocks/${symbol}/quotes/latest`,
      {
        headers: {
          'APCA-API-KEY-ID': config.apiKey,
          'APCA-API-SECRET-KEY': config.apiSecret,
        },
      }
    );

    if (quoteResponse.ok) {
      const quoteData = await quoteResponse.json();
      if (quoteData.quote?.ap) {
        console.log(`Got latest quote price for ${symbol}:`, quoteData.quote.ap);
        return quoteData.quote.ap;
      }
    }
    console.log('Quote data not available, falling back to trade data');
  } catch (error) {
    console.error('Error getting quote:', error);
  }

  // If quote not available, try latest trade
  try {
    const tradeResponse = await fetch(
      `${marketDataUrl}/v2/stocks/${symbol}/trades/latest`,
      {
        headers: {
          'APCA-API-KEY-ID': config.apiKey,
          'APCA-API-SECRET-KEY': config.apiSecret,
        },
      }
    );

    if (tradeResponse.ok) {
      const tradeData = await tradeResponse.json();
      if (tradeData.trade?.p) {
        console.log(`Got latest trade price for ${symbol}:`, tradeData.trade.p);
        return tradeData.trade.p;
      }
    }
    console.log('Trade data not available, falling back to bars');
  } catch (error) {
    console.error('Error getting trade:', error);
  }

  // If still no price, try getting recent bars
  const now = new Date();
  const start = new Date(now.getTime() - 5 * 60000); // 5 minutes ago

  const response = await fetch(
    `${marketDataUrl}/v2/stocks/${symbol}/bars?start=${start.toISOString()}&end=${now.toISOString()}&limit=1`,
    {
      headers: {
        'APCA-API-KEY-ID': config.apiKey,
        'APCA-API-SECRET-KEY': config.apiSecret,
      },
    }
  );

  if (!response.ok) {
    console.error('Failed to get bars:', await response.text());
    throw new Error(`Unable to get current price for ${symbol}. Please verify the symbol is correct and trading is available.`);
  }

  const data = await response.json();
  if (!data.bars || data.bars.length === 0) {
    throw new Error(`No recent price data available for ${symbol}. The stock might not be actively trading.`);
  }

  console.log(`Got bar price for ${symbol}:`, data.bars[0].c);
  return data.bars[0].c;
}

async function waitForOrderFill(config: AlpacaConfig, orderId: string, maxAttempts = 10): Promise<any> {
  const baseUrl = config.paperTrading 
    ? 'https://paper-api.alpaca.markets' 
    : 'https://api.alpaca.markets';

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${baseUrl}/v2/orders/${orderId}`, {
      headers: {
        'APCA-API-KEY-ID': config.apiKey,
        'APCA-API-SECRET-KEY': config.apiSecret,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check order status');
    }

    const orderData = await response.json();
    console.log(`Order ${orderId} status:`, orderData.status);

    if (orderData.status === 'filled') {
      return orderData;
    } else if (orderData.status === 'rejected' || orderData.status === 'canceled') {
      throw new Error(`Order was ${orderData.status}: ${orderData.failure_reason || 'Unknown reason'}`);
    }

    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Order did not fill within expected time');
}

async function verifyPosition(config: AlpacaConfig, symbol: string): Promise<number> {
  const baseUrl = config.paperTrading 
    ? 'https://paper-api.alpaca.markets' 
    : 'https://api.alpaca.markets';

  const response = await fetch(`${baseUrl}/v2/positions/${symbol}`, {
    headers: {
      'APCA-API-KEY-ID': config.apiKey,
      'APCA-API-SECRET-KEY': config.apiSecret,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to verify position');
  }

  const position = await response.json();
  console.log('Current position:', position);
  return parseFloat(position.qty);
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

  const initialOrderData = await orderResponse.json();
  console.log(`Initial ${side} order placed:`, initialOrderData);

  // Wait for the order to be filled
  const filledOrderData = await waitForOrderFill(config, initialOrderData.id);
  console.log(`${side} order filled:`, filledOrderData);

  return {
    orderData: filledOrderData,
    initialPrice: parseFloat(filledOrderData.filled_avg_price) || currentPrice,
    quantity: parseFloat(filledOrderData.filled_qty)
  };
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

  console.log(`Placing stop market sell order for ${quantity} shares of ${symbol} at ${stopPrice}`);

  // First, cancel any existing open orders for this symbol
  try {
    await fetch(`${baseUrl}/v2/orders`, {
      method: 'DELETE',
      headers: {
        'APCA-API-KEY-ID': config.apiKey,
        'APCA-API-SECRET-KEY': config.apiSecret,
      },
      body: JSON.stringify({
        symbol: symbol
      })
    });
    console.log('Cancelled any existing orders for symbol:', symbol);
  } catch (error) {
    console.log('No existing orders to cancel:', error);
  }

  // Place the stop market order
  const orderRequest = {
    symbol: symbol,
    qty: quantity.toString(),
    side: 'sell',
    type: 'stop',
    time_in_force: 'gtc',
    stop_price: stopPrice.toFixed(2)
  };

  console.log('Sending stop order request:', orderRequest);

  const response = await fetch(`${baseUrl}/v2/orders`, {
    method: 'POST',
    headers: {
      'APCA-API-KEY-ID': config.apiKey,
      'APCA-API-SECRET-KEY': config.apiSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderRequest)
  });

  const responseText = await response.text();
  console.log('Stop order response:', responseText);

  if (!response.ok) {
    throw new Error(`Failed to place stop order: ${responseText}`);
  }

  const stopOrderData = JSON.parse(responseText);
  console.log('Stop order placed successfully:', stopOrderData);
  return stopOrderData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stockPredictionId, amount, brokerConnectionId, userId } = await req.json();

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

    const symbol = prediction.symbol.trim().toUpperCase();
    console.log('Stock prediction found:', { ...prediction, symbol });

    // Get Alpaca credentials
    const config = await getAlpacaCredentials(brokerConnectionId);

    // Execute initial buy order and wait for it to be filled
    console.log('Executing buy order...');
    const { orderData: buyOrderData, initialPrice, quantity } = await executeAlpacaOrder(
      config,
      symbol,
      amount,
      'buy'
    );

    // Verify the position exists and get the actual quantity
    const actualPosition = await verifyPosition(config, symbol);
    console.log('Verified position quantity:', actualPosition);

    // Only place stop order if the prediction is negative and we have a position
    let stopOrderData = null;
    if (!prediction.is_positive && prediction.price_change_percentage && actualPosition > 0) {
      // Calculate stop price based on the entry price and predicted percentage
      const priceChangeDecimal = prediction.price_change_percentage / 100;
      const stopPrice = initialPrice * (1 + priceChangeDecimal);

      console.log('Stop order calculation:', {
        initialPrice,
        priceChangePercentage: prediction.price_change_percentage,
        priceChangeDecimal,
        stopPrice,
        positionQuantity: actualPosition
      });

      // Place the stop order using the verified position quantity
      stopOrderData = await placeStopOrder(
        config,
        symbol,
        actualPosition,
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
