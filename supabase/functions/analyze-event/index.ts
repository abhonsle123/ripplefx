
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { generateAnalysis } from "./perplexityService.ts";
import { queueNotificationForHighImpactEvent } from "./notificationService.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const analysis = await generateAnalysis(event);

    // Store stock predictions
    if (analysis.stock_predictions) {
      const predictions = [
        ...(analysis.stock_predictions.positive || []).map(pred => ({
          event_id,
          symbol: pred.symbol,
          rationale: pred.rationale,
          is_positive: true,
          target_price: null // To be implemented in future enhancement
        })),
        ...(analysis.stock_predictions.negative || []).map(pred => ({
          event_id,
          symbol: pred.symbol,
          rationale: pred.rationale,
          is_positive: false,
          target_price: null // To be implemented in future enhancement
        }))
      ];

      if (predictions.length > 0) {
        const { error: predictionError } = await supabase
          .from('stock_predictions')
          .insert(predictions);

        if (predictionError) {
          console.error("Error storing predictions:", predictionError);
          throw predictionError;
        }
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

    // Queue notification if needed
    await queueNotificationForHighImpactEvent(event_id, analysis.risk_level);

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
