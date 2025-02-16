
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { stockPredictionId, amount, brokerConnectionId, userId } = await req.json() as TradeRequest;

    // Basic input validation
    if (!stockPredictionId || !amount || !brokerConnectionId || !userId) {
      throw new Error('Missing required parameters');
    }

    // Check if market is open (NYSE hours: 9:30 AM - 4:00 PM ET, Monday-Friday)
    const now = new Date();
    const etOffset = -4; // EDT offset from UTC
    const etTime = new Date(now.getTime() + etOffset * 60 * 60 * 1000);
    const hour = etTime.getUTCHours();
    const minute = etTime.getUTCMinutes();
    const day = etTime.getUTCDay();

    // Check if it's a weekday and within market hours
    const isWeekday = day >= 1 && day <= 5;
    const currentTimeInMinutes = hour * 60 + minute;
    const marketOpenInMinutes = 9 * 60 + 30;  // 9:30 AM
    const marketCloseInMinutes = 16 * 60;     // 4:00 PM

    if (!isWeekday || currentTimeInMinutes < marketOpenInMinutes || currentTimeInMinutes >= marketCloseInMinutes) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Market is currently closed. Trading is only available during market hours (9:30 AM - 4:00 PM ET, Monday-Friday)."
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get broker connection details
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

    // Create trade execution record
    const { data: trade, error: tradeError } = await supabase
      .from('trade_executions')
      .insert([
        {
          user_id: userId,
          stock_prediction_id: stockPredictionId,
          broker_connection_id: brokerConnectionId,
          amount: amount,
          status: 'PENDING',
          trade_type: prediction.is_positive ? 'BUY' : 'SELL',
          symbol: prediction.symbol
        }
      ])
      .select()
      .single();

    if (tradeError) {
      throw tradeError;
    }

    // Here you would typically integrate with the actual broker API
    // For now, we'll simulate a successful trade
    console.log('Trade execution initiated:', {
      tradeId: trade.id,
      symbol: prediction.symbol,
      amount,
      type: prediction.is_positive ? 'BUY' : 'SELL'
    });

    return new Response(
      JSON.stringify({ success: true, trade }),
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
