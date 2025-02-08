
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function processNotificationQueue() {
  try {
    // Get unprocessed notifications
    const { data: notifications, error: fetchError } = await supabase
      .from("notification_queue")
      .select("*, events(*), profiles(*)")
      .eq("processed", false)
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    for (const notification of notifications || []) {
      const event = notification.events;
      const profile = notification.profiles;

      if (!event || !profile) continue;

      try {
        // Check if user has email notifications enabled for this severity
        const preferences = profile.preferences?.notifications;
        const emailEnabled = preferences?.email?.enabled && 
                           preferences?.email?.[`${event.severity.toLowerCase()}Severity`];

        if (emailEnabled) {
          // Format the email content
          const affectedOrganizations = Array.isArray(event.affected_organizations) 
            ? event.affected_organizations 
            : typeof event.affected_organizations === 'object'
              ? Object.values(event.affected_organizations)
              : [];

          // Format the market impact analysis section
          let marketAnalysis = '';
          if (event.impact_analysis) {
            const analysis = event.impact_analysis;
            marketAnalysis = `
📊 Market Impact Analysis:
${analysis.market_impact}

📈 Positive Stock Impact:
${analysis.stock_predictions?.positive?.slice(0, 5).join('\n') || 'None identified'}

📉 Negative Stock Impact:
${analysis.stock_predictions?.negative?.slice(0, 5).join('\n') || 'None identified'}

🔄 Supply Chain Impact:
${analysis.supply_chain_impact}

📊 Market Sentiment:
- Short Term: ${analysis.market_sentiment?.short_term}
- Long Term: ${analysis.market_sentiment?.long_term}
`;
          }

          const emailContent = `
Dear ${profile.full_name || "Valued User"},

A ${event.severity} ${event.event_type} has just occurred in ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown Location'} at ${new Date(event.created_at || '').toUTCString()}. The event has been classified as ${event.severity}, with expected disruptions to affected sectors.

🔍 Affected Sectors:
${affectedOrganizations.map(org => `• ${org}`).join('\n')}

${marketAnalysis}

For a full breakdown and real-time updates, visit your RippleEffect Dashboard: ${supabaseUrl}/dashboard

Stay informed,
The RippleEffect Team
          `;

          await resend.emails.send({
            from: "RippleEffect <notifications@resend.dev>",
            to: [profile.email || ''],
            subject: `🚨 Market Alert: ${event.event_type} in ${event.country || 'Unknown Location'} – Significant Market Impact Expected`,
            html: emailContent.replace(/\n/g, '<br>'),
          });

          console.log(`Email notification sent to ${profile.email} for event ${event.id}`);
        }

        // Mark notification as processed
        const { error: updateError } = await supabase
          .from("notification_queue")
          .update({ processed: true })
          .eq("id", notification.id);

        if (updateError) throw updateError;

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        await supabase
          .from("notification_queue")
          .update({ 
            error: error.message,
            processed: true 
          })
          .eq("id", notification.id);
      }
    }

  } catch (error) {
    console.error("Error in processNotificationQueue:", error);
  }
}

const handler = async (_req: Request): Promise<Response> => {
  try {
    // Handle CORS preflight requests
    if (_req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    await processNotificationQueue();
    
    return new Response(JSON.stringify({ status: "Notifications processed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in handler:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

serve(handler);
