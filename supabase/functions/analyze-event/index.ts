
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function generateImpactAnalysis(event: any) {
  try {
    console.log("Generating impact analysis for event:", event);
    
    if (!event || typeof event !== 'object') {
      throw new Error('Invalid event object provided');
    }

    // Safely handle affected_organizations
    let affectedOrgsString = 'Unknown';
    if (event.affected_organizations) {
      if (Array.isArray(event.affected_organizations)) {
        affectedOrgsString = event.affected_organizations.join(', ');
      } else if (typeof event.affected_organizations === 'object' && event.affected_organizations !== null) {
        affectedOrgsString = Object.values(event.affected_organizations).filter(Boolean).join(', ');
      } else if (typeof event.affected_organizations === 'string') {
        affectedOrgsString = event.affected_organizations;
      }
    }
    
    const prompt = `Analyze this event and provide a market impact analysis in VALID JSON format without any markdown formatting:
    Event Type: ${event.event_type || 'Unknown'}
    Location: ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown'}
    Description: ${event.description || 'No description provided'}
    Affected Organizations: ${affectedOrgsString}
    Severity: ${event.severity || 'Unknown'}

    Return ONLY a JSON object with these exact fields (no explanation, no markdown, just the JSON):
    {
      "affected_sectors": string[],
      "market_impact": string,
      "supply_chain_impact": string,
      "market_sentiment": {"short_term": string, "long_term": string},
      "stock_predictions": {"positive": string[], "negative": string[]},
      "risk_level": "low" | "medium" | "high" | "critical"
    }`;

    if (!perplexityApiKey) {
      throw new Error('Perplexity API key is not configured');
    }

    console.log("Sending request to Perplexity with prompt:", prompt);

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
            content: 'You are a JSON-only response bot. Only return valid JSON objects without any markdown, explanation, or formatting. Your response must be a single, parseable JSON object.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        presence_penalty: 0,
        frequency_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Perplexity API error:", errorData);
      throw new Error(`Perplexity API error: ${errorData}`);
    }

    const data = await response.json();
    console.log("Raw Perplexity response:", data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from Perplexity");
    }

    let cleanContent = data.choices[0].message.content.trim();
    console.log("Content to parse:", cleanContent);

    try {
      const analysis = JSON.parse(cleanContent);
      console.log("Successfully parsed analysis:", analysis);

      // Validate required fields
      const requiredFields = ['affected_sectors', 'market_impact', 'supply_chain_impact', 'market_sentiment', 'stock_predictions', 'risk_level'];
      for (const field of requiredFields) {
        if (!(field in analysis)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Update the event with the impact analysis
      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          impact_analysis: analysis,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);

      if (updateError) {
        console.error("Error updating event:", updateError);
        throw updateError;
      }

      return analysis;
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      console.error("Content that failed to parse:", cleanContent);
      throw new Error(`Failed to parse analysis response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in generateImpactAnalysis:", error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received request body:", body);

    const { event_id } = body;
    
    if (!event_id) {
      throw new Error('event_id is required');
    }

    console.log("Processing event_id:", event_id);

    // Fetch event details
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (fetchError) {
      console.error("Error fetching event:", fetchError);
      throw fetchError;
    }

    if (!event) {
      throw new Error('Event not found');
    }

    console.log("Found event:", event);

    const analysis = await generateImpactAnalysis(event);

    // Queue a notification for high-impact events
    if (analysis.risk_level === 'high' || analysis.risk_level === 'critical') {
      const { error: notificationError } = await supabase
        .from('notification_queue')
        .insert([{ 
          event_id: event_id,
          processed: false
        }]);

      if (notificationError) {
        console.error("Error queueing notification:", notificationError);
        throw notificationError;
      }
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in analyze-event function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
