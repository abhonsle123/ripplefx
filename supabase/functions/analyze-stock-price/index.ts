
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stock_prediction_id } = await req.json();

    // Fetch stock prediction and event details
    const { data: prediction, error: predictionError } = await supabase
      .from('stock_predictions')
      .select(`
        *,
        events!stock_predictions_event_id_fkey (
          title,
          description,
          event_type,
          severity
        )
      `)
      .eq('id', stock_prediction_id)
      .single();

    if (predictionError) throw predictionError;
    if (!prediction) throw new Error('Stock prediction not found');

    const event = prediction.events;
    const prompt = `Analyze the potential stock price impact for ${prediction.symbol} based on this event:
      Event: ${event.title}
      Description: ${event.description}
      Type: ${event.event_type}
      Severity: ${event.severity}
      Current Prediction: ${prediction.is_positive ? 'Positive' : 'Negative'} impact expected
      Rationale: ${prediction.rationale}

      Please provide:
      1. Expected percentage change in stock price (a specific number)
      2. Detailed impact analysis considering market trends and sentiment
      3. Confidence score (between 0 and 1)
      
      Format your response as a JSON object with these exact keys:
      {
        "price_change_percentage": number,
        "price_impact_analysis": {
          "summary": string,
          "factors": string[],
          "risks": string[]
        },
        "confidence_score": number
      }`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst specializing in predicting stock price movements based on events. Provide specific numerical predictions and detailed analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      }),
    });

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    // Update stock prediction with the analysis
    const { error: updateError } = await supabase
      .from('stock_predictions')
      .update({
        price_change_percentage: analysis.price_change_percentage,
        price_impact_analysis: analysis.price_impact_analysis,
        confidence_score: analysis.confidence_score
      })
      .eq('id', stock_prediction_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-stock-price function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
