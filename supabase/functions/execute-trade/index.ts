
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { stockPredictionId, amount, brokerConnectionId, userId } = await req.json()
    console.log('Received trade request:', { stockPredictionId, amount, brokerConnectionId, userId })

    if (!stockPredictionId || !amount || !brokerConnectionId || !userId) {
      throw new Error('Missing required parameters')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the stock prediction details
    const { data: prediction, error: predictionError } = await supabase
      .from('stock_predictions')
      .select('symbol, is_positive')
      .eq('id', stockPredictionId)
      .single()

    if (predictionError || !prediction) {
      throw new Error('Failed to fetch stock prediction')
    }

    // Create a trade execution record
    const { data: trade, error: tradeError } = await supabase
      .from('trade_executions')
      .insert([
        {
          user_id: userId,
          stock_symbol: prediction.symbol,
          quantity: amount,
          price: 0, // This would be the actual execution price
          stock_price: 0, // This would be the market price at execution
          trade_type: prediction.is_positive ? 'BUY' : 'SELL',
          status: 'EXECUTED',
          action: prediction.is_positive ? 'BUY' : 'SELL'
        }
      ])
      .select()
      .single()

    if (tradeError) {
      throw tradeError
    }

    // For now, we're just simulating the trade execution
    // In a real implementation, this would connect to the broker's API
    
    return new Response(
      JSON.stringify({
        success: true,
        trade: trade,
        message: `Successfully executed ${prediction.is_positive ? 'buy' : 'sell'} order for ${prediction.symbol}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error executing trade:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
