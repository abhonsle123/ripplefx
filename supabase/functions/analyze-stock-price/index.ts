
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

    // Build enhanced prompt with domain-specific knowledge
    const prompt = buildStockAnalysisPrompt(prediction, event, sectorInfo);
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
            content: 'You are a financial analyst with extensive experience in event-driven price analysis and quantitative modeling. Your predictions maintain consistency with initial directional assessments while providing detailed, data-driven magnitude estimates based on historical precedents and statistical analysis. Always respond with only a valid JSON object, no markdown formatting or additional text.'
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

// Function to build enhanced prompt with domain-specific knowledge
function buildStockAnalysisPrompt(prediction: any, event: any, sectorInfo: string): string {
  // Determine event type-specific guidance
  let eventTypeGuidance = '';
  switch(event.event_type) {
    case 'NATURAL_DISASTER':
      eventTypeGuidance = `
      For natural disasters:
      - Insurance companies typically experience negative pressure due to expected claims
      - Construction and building materials companies often see positive momentum for rebuilding
      - Utilities may face short-term disruptions but long-term infrastructure investment
      - Emergency response and disaster recovery companies typically benefit
      - Local banks may face loan defaults but could benefit from reconstruction loans
      - Supply chain disruptions in the region may impact manufacturing and retail`;
      break;
    case 'GEOPOLITICAL':
      eventTypeGuidance = `
      For geopolitical events:
      - Defense contractors often benefit from increased tensions and military spending
      - Energy companies are sensitive to supply disruptions, especially in oil-producing regions
      - Safe haven assets like gold mining companies may see increased demand
      - Currency volatility impacts multinational corporations with exposure to affected regions
      - Sanctions and trade restrictions can severely impact companies with regional dependencies
      - Security and cybersecurity firms may benefit from increased threat perception`;
      break;
    case 'ECONOMIC':
      eventTypeGuidance = `
      For economic events:
      - Banking and financial institutions are highly sensitive to interest rate changes and economic policy
      - Cyclical sectors (consumer discretionary, industrials) react strongly to economic outlook changes
      - Dividend stocks and utilities may outperform during economic uncertainty
      - Growth stocks are typically more vulnerable to economic downturns
      - REITs and real estate companies are sensitive to interest rate expectations
      - Retail and consumer staples provide insights into consumer confidence and spending power`;
      break;
    default:
      eventTypeGuidance = `
      For this type of event:
      - Consider direct revenue exposure to affected markets/regions
      - Evaluate supply chain dependencies and potential disruptions
      - Assess competitive landscape changes resulting from the event
      - Consider regulatory and compliance implications
      - Factor in public perception and brand impact`;
  }

  // Define sector-specific guidance based on affected sectors
  let sectorSpecificGuidance = '';
  if (event.impact_analysis?.affected_sectors) {
    const sectors = event.impact_analysis.affected_sectors;
    
    if (sectors.includes('Technology')) {
      sectorSpecificGuidance += `
      Technology sector considerations:
      - Component shortages impact hardware manufacturers differently based on inventory levels
      - Cloud service providers generally have more resilient business models
      - Enterprise software companies are less affected by short-term disruptions
      - Semiconductor demand fluctuations affect chip manufacturers throughout the supply chain
      - Historical technology sector volatility is 20% higher than broader market indices`;
    }
    
    if (sectors.includes('Energy')) {
      sectorSpecificGuidance += `
      Energy sector considerations:
      - Oil price sensitivity varies significantly between upstream, midstream, and downstream companies
      - Renewable energy companies typically have different risk profiles than traditional energy
      - Seasonal factors dramatically affect energy demand and price movements
      - Regional disruptions impact global energy markets with typical 3-5 day lag effects
      - Energy companies with diversified operations show 40% less volatility during crises`;
    }
    
    if (sectors.includes('Healthcare')) {
      sectorSpecificGuidance += `
      Healthcare sector considerations:
      - Pharmaceutical companies typically show defensive characteristics during market downturns
      - Medical device manufacturers may face supply chain challenges during disruptions
      - Healthcare providers can be geographically limited in impact scope
      - Biotechnology stocks typically maintain higher volatility across market conditions
      - Healthcare sector historically declines 40% less than broader market during crises`;
    }
    
    if (sectors.includes('Finance')) {
      sectorSpecificGuidance += `
      Financial sector considerations:
      - Banking stocks show high correlation (0.85+) with interest rate expectations
      - Insurance companies typically price in disaster impacts within 3-5 trading days
      - Financial institutions with higher leverage (>10:1) show amplified price movements
      - Regional banks have 2.5x higher sensitivity to local economic conditions than national banks
      - Historical financial sector recovery periods average 1.6x longer than broader market`;
    }
  }

  // Build the complete prompt with enhanced domain knowledge
  return `Analyze the stock price impact for ${prediction.symbol} based on this event:

Event: ${event.title}
Description: ${event.description}
Type: ${event.event_type}
Severity: ${event.severity}
${sectorInfo}

Current Prediction: ${prediction.is_positive ? 'POSITIVE' : 'NEGATIVE'} impact expected
Rationale from initial analysis: ${prediction.rationale}

${eventTypeGuidance}

${sectorSpecificGuidance}

Historical market reaction benchmarks:
- Small-cap stocks typically show 1.3x the volatility of large caps during similar events
- Sector rotation typically accelerates by 35% during the first week after significant events
- Trading volumes increase by average of 47% following unexpected market-moving events
- Initial price movements are often exaggerated by 30-40% compared to ultimate impact
- High beta stocks (>1.5) typically magnify market movements by 40-60% during volatility spikes
- Stocks with high institutional ownership (>70%) typically show more orderly price movements
- Short-term price impact usually peaks within 2-5 trading days for this type of event

IMPORTANT REQUIREMENTS:
1. This stock has already been predicted to have a ${prediction.is_positive ? 'POSITIVE' : 'NEGATIVE'} impact. 
   Your analysis MUST maintain this same directional bias (${prediction.is_positive ? 'positive' : 'negative'}).
2. Provide a highly specific price change percentage based on historical performance of similar stocks during comparable events.
3. Analyze similar historical events to establish precedent for your prediction.
4. Consider the company's market capitalization, beta, and sector when determining magnitude of price movement.
5. For your confidence score, be realistic but not overly cautious (values between 0.6-0.8 are typical).
6. Factor in typical volatility patterns for this type of stock during similar market conditions.
7. Consider earnings season timing and its potential amplification or dampening effects.
8. Assess current market sentiment and technical indicators for this stock.

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
}
