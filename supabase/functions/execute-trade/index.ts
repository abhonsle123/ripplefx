
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
      .select('symbol')
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

    const alpacaBaseUrl = connection.broker_name === 'alpaca_paper' 
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';

    console.log('Checking market hours and fetching current price for:', symbol);
    
    try {
      // First check if the market is open
      const clockResponse = await fetch(
        `${alpacaBaseUrl}/v2/clock`,
        {
          headers: {
            'APCA-API-KEY-ID': connection.api_key,
            'APCA-API-SECRET-KEY': connection.api_secret,
          },
        }
      );

      if (!clockResponse.ok) {
        throw new Error('Failed to check market hours');
      }

      const clockData = await clockResponse.json();
      if (!clockData.is_open) {
        throw new Error('Market is currently closed');
      }

      // Get the current price using trades/latest for real-time data
      const quoteResponse = await fetch(
        `${alpacaBaseUrl}/v2/stocks/${symbol}/trades/latest`,
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
          url: `${alpacaBaseUrl}/v2/stocks/${symbol}/trades/latest`
        });
        throw new Error(`Failed to fetch price: ${quoteResponse.status} ${errorText}`);
      }

      const quote = await quoteResponse.json();
      if (!quote || !quote.trade || !quote.trade.p) {
        console.error('Invalid quote response from Alpaca:', quote);
        throw new Error('Could not get current price for symbol');
      }

      const currentPrice = quote.trade.p;
      const quantity = Math.floor(amount / currentPrice); // Round down to nearest whole share

      if (quantity < 1) {
        throw new Error('Investment amount too small to purchase at least one share');
      }

      console.log('Placing order with Alpaca:', {
        symbol,
        quantity,
        currentPrice
      });

      // Create the order in Alpaca
      const orderResponse = await fetch(
        `${alpacaBaseUrl}/v2/orders`,
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
            side: 'buy',
            type: 'market',
            time_in_force: 'day'
          })
        }
      );

      const orderResult = await orderResponse.json() as AlpacaOrderResponse;

      if (!orderResponse.ok) {
        console.error('Error placing order with Alpaca:', orderResult);
        throw new Error(orderResult.error || 'Failed to place order with Alpaca');
      }

      console.log('Order placed successfully with Alpaca:', orderResult);

      // Create trade execution record
      const { data: execution, error: executionError } = await supabaseClient
        .from('trade_executions')
        .insert([{
          user_id: userId,
          stock_symbol: symbol,
          action: 'BUY',
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
                `${alpacaBaseUrl}/v2/orders/${orderResult.id}`,
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
