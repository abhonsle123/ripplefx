
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
    console.log(`Processing stock prediction ID: ${stock_prediction_id}`);

    // Fetch stock prediction and event details
    const { data: prediction, error: predictionError } = await supabase
      .from('stock_predictions')
      .select(`
        *,
        events!stock_predictions_event_id_fkey (
          title,
          description,
          event_type,
          severity,
          impact_analysis
        )
      `)
      .eq('id', stock_prediction_id)
      .single();

    if (predictionError) {
      console.error('Error fetching prediction:', predictionError);
      throw predictionError;
    }
    if (!prediction) throw new Error('Stock prediction not found');

    const event = prediction.events;
    console.log(`Analyzing ${prediction.symbol} for event: ${event.title}`);

    // Extract sector information from impact analysis if available
    let sectorInfo = "";
    if (event.impact_analysis?.affected_sectors && Array.isArray(event.impact_analysis.affected_sectors)) {
      sectorInfo = `Affected sectors: ${event.impact_analysis.affected_sectors.join(', ')}`;
    }

    // Retrieve historical performance data for the stock if available
    const prompt = `Analyze the stock price impact for ${prediction.symbol} based on this event:

Event: ${event.title}
Description: ${event.description}
Type: ${event.event_type}
Severity: ${event.severity}
${sectorInfo}

Current Prediction: ${prediction.is_positive ? 'POSITIVE' : 'NEGATIVE'} impact expected
Rationale from initial analysis: ${prediction.rationale}

IMPORTANT REQUIREMENTS:
1. This stock has already been predicted to have a ${prediction.is_positive ? 'POSITIVE' : 'NEGATIVE'} impact. 
   Your analysis MUST maintain this same directional bias (${prediction.is_positive ? 'positive' : 'negative'}).
2. Provide a highly specific price change percentage based on historical performance of similar stocks during comparable events.
3. Analyze similar historical events to establish precedent for your prediction.
4. Consider the company's market capitalization, beta, and sector when determining magnitude of price movement.
5. For your confidence score, be realistic but not overly cautious (values between 0.6-0.8 are typical).

Return ONLY a JSON object with these exact fields:
{
  "price_change_percentage": (a number ${prediction.is_positive ? 'between 0.5 and 15' : 'between -15 and -0.5'}),
  "price_impact_analysis": {
    "summary": "a detailed analysis summary with specific factors and magnitude justification",
    "factors": ["list", "of", "specific", "key", "factors"],
    "risks": ["list", "of", "specific", "key", "risks"]
  },
  "confidence_score": (a number between 0.6 and 0.85)
}

Only return the JSON object, no other text or formatting.`;

    console.log('Sending prompt to Perplexity');

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
            content: 'You are a financial analyst with extensive experience in event-driven price analysis. Your predictions maintain consistency with initial directional assessments while providing detailed, data-driven magnitude estimates. Always respond with only a valid JSON object, no markdown formatting or additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
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
    // and ensure it's a reasonable value (not too extreme)
    if (prediction.is_positive) {
      // For positive predictions, ensure the value is positive and within a reasonable range
      analysis.price_change_percentage = Math.abs(analysis.price_change_percentage);
      // Limit positive predictions to a reasonable range (0.5% to 15%)
      analysis.price_change_percentage = Math.max(0.5, Math.min(15, analysis.price_change_percentage));
    } else {
      // For negative predictions, ensure the value is negative and within a reasonable range
      analysis.price_change_percentage = -Math.abs(analysis.price_change_percentage);
      // Limit negative predictions to a reasonable range (-15% to -0.5%)
      analysis.price_change_percentage = Math.min(-0.5, Math.max(-15, analysis.price_change_percentage));
    }

    // Normalize confidence score to a reasonable range
    analysis.confidence_score = Math.max(0.6, Math.min(0.85, analysis.confidence_score));

    console.log(`Final analysis for ${prediction.symbol}: ${analysis.price_change_percentage.toFixed(2)}% with ${(analysis.confidence_score * 100).toFixed(1)}% confidence`);

    // Update stock prediction with the analysis
    const { error: updateError } = await supabase
      .from('stock_predictions')
      .update({
        price_change_percentage: analysis.price_change_percentage,
        price_impact_analysis: analysis.price_impact_analysis,
        confidence_score: analysis.confidence_score
      })
      .eq('id', stock_prediction_id);

    if (updateError) {
      console.error('Error updating stock prediction:', updateError);
      throw updateError;
    }

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
