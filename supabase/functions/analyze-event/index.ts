
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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
    
    const prompt = `Analyze this event and provide market impact analysis:
    Event Type: ${event.event_type || 'Unknown'}
    Location: ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown'}
    Description: ${event.description || 'No description provided'}
    Affected Organizations: ${Array.isArray(event.affected_organizations) 
      ? event.affected_organizations.join(', ') 
      : typeof event.affected_organizations === 'object'
        ? Object.values(event.affected_organizations).join(', ')
        : event.affected_organizations || 'Unknown'}
    Severity: ${event.severity || 'Unknown'}

    Please provide a detailed analysis including:
    1. Key affected sectors and businesses
    2. Potential market movements and stock price impacts
    3. Supply chain implications
    4. Short-term and long-term market sentiment
    Format the response as a JSON object with these fields: 
    {
      "affected_sectors": string[],
      "market_impact": string,
      "supply_chain_impact": string,
      "market_sentiment": {"short_term": string, "long_term": string},
      "stock_predictions": {"positive": string[], "negative": string[]},
      "risk_level": "low" | "medium" | "high" | "critical"
    }`;

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log("Sending request to OpenAI with prompt:", prompt);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a financial analyst expert that provides market impact analysis for global events. Always provide detailed, well-researched analysis in the specified JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    console.log("OpenAI response:", data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from OpenAI");
    }

    const analysis = JSON.parse(data.choices[0].message.content);
    console.log("Parsed analysis:", analysis);

    // Update the event with the impact analysis
    const { error: updateError } = await supabase
      .from('events')
      .update({ 
        impact_analysis: analysis
      })
      .eq('id', event.id);

    if (updateError) {
      console.error("Error updating event:", updateError);
      throw updateError;
    }

    return analysis;
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

