
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  stockPredictionId: string;
  amount: number;
  brokerConnectionId: string;
  userId: string;
}

interface AlpacaOrderResponse {
  id: string;
  client_order_id: string;
  status: string;
  symbol: string;
  quantity: number;
  filled_avg_price?: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    const { stockPredictionId, amount, brokerConnectionId, userId } = await req.json() as RequestBody;

    console.log('Processing trade execution request:', { stockPredictionId, amount, brokerConnectionId, userId });

    // Get broker connection details
    const { data: connection, error: connectionError } = await supabaseClient
      .from('broker_connections')
      .select('broker_name, api_key, api_secret')
      .eq('id', brokerConnectionId)
      .single();

    if (connectionError) {
      console.error('Error fetching broker connection:', connectionError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch broker connection' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get stock prediction details
    const { data: prediction, error: predictionError } = await supabaseClient
      .from('stock_predictions')
      .select('symbol, is_positive')
      .eq('id', stockPredictionId)
      .single();

    if (predictionError) {
      console.error('Error fetching stock prediction:', predictionError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stock prediction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean and validate stock symbol
    const symbol = prediction.symbol.trim().toUpperCase();
    if (!symbol.match(/^[A-Z]+$/)) {
      console.error('Invalid stock symbol format:', symbol);
      return new Response(
        JSON.stringify({ error: 'Invalid stock symbol format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set up API endpoints
    const tradingBaseUrl = 'https://paper-api.alpaca.markets/v2';
    const dataBaseUrl = 'https://data.alpaca.markets/v2';

    console.log('Checking market hours and fetching current price for:', symbol);
    
    try {
      // First check if the market is open
      const clockResponse = await fetch(
        `${tradingBaseUrl}/clock`,
        {
          headers: {
            'APCA-API-KEY-ID': connection.api_key,
            'APCA-API-SECRET-KEY': connection.api_secret,
          },
        }
      );

      if (!clockResponse.ok) {
        const clockError = await clockResponse.text();
        console.error('Error checking market hours:', clockError);
        throw new Error(`Failed to check market hours: ${clockResponse.status} ${clockError}`);
      }

      const clockData = await clockResponse.json();
      if (!clockData.is_open) {
        throw new Error('Market is currently closed');
      }

      // Get account information to verify API keys and check buying power
      const accountResponse = await fetch(
        `${tradingBaseUrl}/account`,
        {
          headers: {
            'APCA-API-KEY-ID': connection.api_key,
            'APCA-API-SECRET-KEY': connection.api_secret,
          },
        }
      );

      if (!accountResponse.ok) {
        const accountError = await accountResponse.text();
        console.error('Error verifying account:', accountError);
        throw new Error(`Failed to verify trading account: ${accountResponse.status} ${accountError}`);
      }

      const accountData = await accountResponse.json();
      console.log('Account data:', accountData);

      // Verify sufficient buying power
      const buyingPower = parseFloat(accountData.buying_power);
      if (amount > buyingPower) {
        throw new Error(`Insufficient buying power. Available: $${buyingPower}, Required: $${amount}`);
      }

      // Get the latest trade using the Data API
      const quoteResponse = await fetch(
        `${dataBaseUrl}/stocks/${symbol}/trades/latest`,
        {
          headers: {
            'APCA-API-KEY-ID': connection.api_key,
            'APCA-API-SECRET-KEY': connection.api_secret,
          },
        }
      );

      if (!quoteResponse.ok) {
        const errorText = await quoteResponse.text();
        console.error('Error response from Alpaca:', {
          status: quoteResponse.status,
          statusText: quoteResponse.statusText,
          body: errorText,
          url: `${dataBaseUrl}/stocks/${symbol}/trades/latest`
        });
        throw new Error(`Failed to fetch price: ${quoteResponse.status} ${errorText}`);
      }

      const quoteData = await quoteResponse.json();
      if (!quoteData.trade || !quoteData.trade.p) {
        console.error('Invalid quote response from Alpaca:', quoteData);
        throw new Error('Could not get current price for symbol');
      }

      const currentPrice = quoteData.trade.p;
      const quantity = Math.floor(amount / currentPrice); // Round down to nearest whole share

      if (quantity < 1) {
        throw new Error('Investment amount too small to purchase at least one share');
      }

      // Determine order side and validate position for sells
      let orderSide = prediction.is_positive ? 'buy' : 'sell';
      
      // If this is a sell order, check the position
      if (!prediction.is_positive) {
        const positionResponse = await fetch(
          `${tradingBaseUrl}/positions/${symbol}`,
          {
            headers: {
              'APCA-API-KEY-ID': connection.api_key,
              'APCA-API-SECRET-KEY': connection.api_secret,
            },
          }
        );

        // If no position exists or error fetching position, we can't sell
        if (!positionResponse.ok || positionResponse.status === 404) {
          return new Response(
            JSON.stringify({
              error: 'Cannot execute trade',
              details: 'Shorting is not supported. You must own shares to sell.'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify sufficient shares for selling
        const position = await positionResponse.json();
        const availableShares = parseInt(position.qty);
        
        if (availableShares < quantity) {
          return new Response(
            JSON.stringify({
              error: 'Insufficient shares',
              details: `You only have ${availableShares} shares available to sell, but trying to sell ${quantity} shares.`
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Position verified for sell order:', {
          symbol,
          availableShares,
          requestedQuantity: quantity
        });
      }

      console.log('Placing order with Alpaca:', {
        symbol,
        quantity,
        currentPrice,
        side: orderSide
      });

      // Create the order in Alpaca using the Trading API
      const orderResponse = await fetch(
        `${tradingBaseUrl}/orders`,
        {
          method: 'POST',
          headers: {
            'APCA-API-KEY-ID': connection.api_key,
            'APCA-API-SECRET-KEY': connection.api_secret,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol: symbol,
            qty: quantity,
            side: orderSide,
            type: 'market',
            time_in_force: 'day'
          })
        }
      );

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('Error placing order with Alpaca:', {
          status: orderResponse.status,
          response: errorText
        });
        throw new Error(`Failed to place order: ${orderResponse.status} - ${errorText}`);
      }

      const orderResult = await orderResponse.json() as AlpacaOrderResponse;
      console.log('Order response from Alpaca:', orderResult);

      // Create trade execution record
      const { data: execution, error: executionError } = await supabaseClient
        .from('trade_executions')
        .insert([{
          user_id: userId,
          stock_symbol: symbol,
          action: orderSide.toUpperCase(),
          price: currentPrice,
          quantity: quantity,
          status: 'PENDING',
          error_message: null
        }])
        .select()
        .single();

      if (executionError) {
        console.error('Error creating trade execution:', executionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create trade execution', details: executionError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Start background task to monitor order status
      EdgeRuntime.waitUntil(
        (async () => {
          try {
            let orderStatus = orderResult.status;
            let attempts = 0;
            const maxAttempts = 30; // Maximum number of attempts (1 minute with 2-second intervals)

            while (orderStatus !== 'filled' && orderStatus !== 'canceled' && orderStatus !== 'expired' && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
              attempts++;
              
              const statusResponse = await fetch(
                `${tradingBaseUrl}/orders/${orderResult.id}`,
                {
                  headers: {
                    'APCA-API-KEY-ID': connection.api_key,
                    'APCA-API-SECRET-KEY': connection.api_secret,
                  }
                }
              );
              
              if (!statusResponse.ok) {
                throw new Error('Failed to fetch order status');
              }
              
              const statusResult = await statusResponse.json() as AlpacaOrderResponse;
              orderStatus = statusResult.status;
              
              // Update execution record with final details when order is filled
              if (orderStatus === 'filled') {
                await supabaseClient
                  .from('trade_executions')
                  .update({
                    status: 'COMPLETED',
                    price: statusResult.filled_avg_price
                  })
                  .eq('id', execution.id);
              } else if (orderStatus === 'canceled' || orderStatus === 'expired' || attempts >= maxAttempts) {
                await supabaseClient
                  .from('trade_executions')
                  .update({
                    status: 'FAILED',
                    error_message: attempts >= maxAttempts ? 'Order timeout' : `Order ${orderStatus}`
                  })
                  .eq('id', execution.id);
              }
            }
          } catch (error) {
            console.error('Error in background task:', error);
            await supabaseClient
              .from('trade_executions')
              .update({
                status: 'FAILED',
                error_message: error.message
              })
              .eq('id', execution.id);
          }
        })()
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Trade execution initiated',
          data: {
            ...execution,
            alpaca_order_id: orderResult.id
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('Error in Alpaca API operations:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to execute trade with Alpaca', 
          details: error.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
