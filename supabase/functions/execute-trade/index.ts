
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function createErrorResponse(error: string, details: string, status = 400) {
  return new Response(
    JSON.stringify({ error, details }),
    { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

function createSuccessResponse(data: unknown) {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
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
    );

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
      return createErrorResponse(
        'Failed to fetch broker connection',
        connectionError.message
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
      return createErrorResponse(
        'Failed to fetch stock prediction',
        predictionError.message
      );
    }

    // Clean and validate stock symbol
    const symbol = prediction.symbol.trim().toUpperCase();
    if (!symbol.match(/^[A-Z]+$/)) {
      console.error('Invalid stock symbol format:', symbol);
      return createErrorResponse(
        'Invalid stock symbol format',
        'Stock symbol must contain only uppercase letters'
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
        return createErrorResponse(
          'Failed to check market hours',
          clockError,
          clockResponse.status
        );
      }

      const clockData = await clockResponse.json();
      if (!clockData.is_open) {
        return createErrorResponse(
          'Market is closed',
          'Cannot execute trades when the market is closed'
        );
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
        return createErrorResponse(
          'Failed to verify trading account',
          accountError,
          accountResponse.status
        );
      }

      const accountData = await accountResponse.json();
      console.log('Account data:', accountData);

      // Verify sufficient buying power for buys
      if (prediction.is_positive) {
        const buyingPower = parseFloat(accountData.buying_power);
        if (amount > buyingPower) {
          return createErrorResponse(
            'Insufficient funds',
            `Available buying power: $${buyingPower}, Required: $${amount}`
          );
        }
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
        return createErrorResponse(
          'Failed to fetch price',
          errorText,
          quoteResponse.status
        );
      }

      const quoteData = await quoteResponse.json();
      if (!quoteData.trade || !quoteData.trade.p) {
        console.error('Invalid quote response from Alpaca:', quoteData);
        return createErrorResponse(
          'Invalid price data',
          'Could not get current price for symbol'
        );
      }

      const currentPrice = quoteData.trade.p;
      const quantity = Math.floor(amount / currentPrice); // Round down to nearest whole share

      if (quantity < 1) {
        return createErrorResponse(
          'Invalid quantity',
          'Investment amount too small to purchase at least one share'
        );
      }

      // Determine order side based on prediction
      const orderSide = prediction.is_positive ? 'buy' : 'sell';
      
      // If this is a sell order, check the position first
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
          return createErrorResponse(
            'No position found',
            'You must own shares to sell. Shorting is not supported.'
          );
        }

        // Verify sufficient shares for selling
        const position = await positionResponse.json();
        const availableShares = parseInt(position.qty);
        
        if (availableShares < quantity) {
          return createErrorResponse(
            'Insufficient shares',
            `You only have ${availableShares} shares available to sell, but trying to sell ${quantity} shares.`
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
        return createErrorResponse(
          'Failed to place order',
          errorText,
          orderResponse.status
        );
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
        return createErrorResponse(
          'Failed to create trade execution',
          executionError.message
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

      return createSuccessResponse({
        message: 'Trade execution initiated',
        execution: {
          ...execution,
          alpaca_order_id: orderResult.id
        }
      });

    } catch (error) {
      console.error('Error in Alpaca API operations:', error);
      return createErrorResponse(
        'Failed to execute trade with Alpaca',
        error.message,
        500
      );
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return createErrorResponse(
      'Internal server error',
      error.message,
      500
    );
  }
});
