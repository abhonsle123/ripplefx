
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
    const prompt = `Analyze the stock price impact for ${prediction.symbol} based on this event:

Event: ${event.title}
Description: ${event.description}
Type: ${event.event_type}
Severity: ${event.severity}
Current Prediction: ${prediction.is_positive ? 'Positive' : 'Negative'} impact expected
Rationale: ${prediction.rationale}

IMPORTANT: This stock has already been predicted to have a ${prediction.is_positive ? 'POSITIVE' : 'NEGATIVE'} impact. 
Your analysis must maintain this same directional bias (${prediction.is_positive ? 'positive' : 'negative'}).

Return a JSON object with these exact fields:
{
  "price_change_percentage": (a number ${prediction.is_positive ? 'between 0 and 100' : 'between -100 and 0'}),
  "price_impact_analysis": {
    "summary": "a brief analysis summary",
    "factors": ["list", "of", "key", "factors"],
    "risks": ["list", "of", "key", "risks"]
  },
  "confidence_score": (a number between 0 and 1)
}

Only return the JSON object, no other text or formatting.`;

    console.log('Sending prompt to Perplexity:', prompt);

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
            content: 'You are a financial analyst. You always maintain the same directional prediction (positive or negative) as specified in the original prediction. Always respond with only a valid JSON object, no markdown formatting or additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', await response.text());
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw Perplexity response:', JSON.stringify(data.choices[0].message.content, null, 2));

    let analysis;
    try {
      const content = data.choices[0].message.content.trim();
      // Remove any potential JSON code block markers
      const cleanContent = content.replace(/```json\n|\n```|```/g, '');
      analysis = JSON.parse(cleanContent);
    } catch (e) {
      console.error('JSON parsing error:', e, 'Content:', data.choices[0].message.content);
      throw new Error('Failed to parse Perplexity response as JSON');
    }

    // Validate and normalize the analysis structure
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Invalid analysis: not an object');
    }

    // Ensure all required fields exist and are of correct type
    if (typeof analysis.price_change_percentage !== 'number') {
      throw new Error('Invalid price_change_percentage: must be a number');
    }
    if (typeof analysis.confidence_score !== 'number') {
      throw new Error('Invalid confidence_score: must be a number');
    }
    if (!analysis.price_impact_analysis || typeof analysis.price_impact_analysis !== 'object') {
      throw new Error('Invalid price_impact_analysis: must be an object');
    }
    if (typeof analysis.price_impact_analysis.summary !== 'string') {
      throw new Error('Invalid summary: must be a string');
    }
    if (!Array.isArray(analysis.price_impact_analysis.factors)) {
      throw new Error('Invalid factors: must be an array');
    }
    if (!Array.isArray(analysis.price_impact_analysis.risks)) {
      throw new Error('Invalid risks: must be an array');
    }

    // Force the price_change_percentage to maintain the same direction as the original prediction
    if (prediction.is_positive && analysis.price_change_percentage < 0) {
      analysis.price_change_percentage = Math.abs(analysis.price_change_percentage);
    } else if (!prediction.is_positive && analysis.price_change_percentage > 0) {
      analysis.price_change_percentage = -Math.abs(analysis.price_change_percentage);
    }

    // Normalize values
    analysis.price_change_percentage = Math.max(-100, Math.min(100, analysis.price_change_percentage));
    analysis.confidence_score = Math.max(0, Math.min(1, analysis.confidence_score));

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
