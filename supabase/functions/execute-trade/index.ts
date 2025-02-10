
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

    // Create trade execution record
    const { data: execution, error: executionError } = await supabaseClient
      .from('trade_executions')
      .insert([{
        user_id: userId,
        broker_connection_id: brokerConnectionId,
        stock_prediction_id: stockPredictionId,
        symbol: prediction.symbol,
        amount: amount,
        status: 'PENDING',
        broker_order_id: null,
        execution_details: null
      }])
      .select()
      .single();

    if (executionError) {
      console.error('Error creating trade execution:', executionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create trade execution' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, just return success - in a real implementation, 
    // you would make API calls to the broker here
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Trade execution created',
        data: execution
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
