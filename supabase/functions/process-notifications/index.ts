
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { Resend } from "npm:resend@2.0.0";
import { Twilio } from "npm:twilio@4.23.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const twilio = new Twilio(
  Deno.env.get("TWILIO_ACCOUNT_SID")!,
  Deno.env.get("TWILIO_AUTH_TOKEN")!
);
const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER")!;

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
        // Check notification preferences
        const preferences = profile.preferences?.notifications;
        const emailEnabled = preferences?.email?.enabled && 
                           preferences?.email?.[`${event.severity.toLowerCase()}Severity`];
        const smsEnabled = preferences?.sms?.enabled && 
                          preferences?.sms?.[`${event.severity.toLowerCase()}Severity`];
        const phoneNumber = preferences?.sms?.phoneNumber;

        const affectedOrganizations = Array.isArray(event.affected_organizations) 
          ? event.affected_organizations 
          : typeof event.affected_organizations === 'object'
            ? Object.values(event.affected_organizations)
            : [];

        // Format stock impact notifications
        let stockImpactSection = '';
        let smsStockImpact = '';
        if (event.impact_analysis?.stock_predictions) {
          const { positive = [], negative = [] } = event.impact_analysis.stock_predictions;
          
          if (positive.length > 0 || negative.length > 0) {
            stockImpactSection = `
🎯 Significant Stock Impact Predictions:

📈 Positive Impact:
${positive.slice(0, 5).map(stock => `${stock.symbol}: ${stock.rationale}`).join('\n')}

📉 Negative Impact:
${negative.slice(0, 5).map(stock => `${stock.symbol}: ${stock.rationale}`).join('\n')}
`;

            smsStockImpact = `
Stocks Affected:
📈 ${positive.slice(0, 3).map(s => s.symbol).join(', ')}
📉 ${negative.slice(0, 3).map(s => s.symbol).join(', ')}`;

            // Process individual stock notifications
            if (emailEnabled) {
              await processStockEmails(positive, negative, event, profile, affectedOrganizations);
            }
          }
        }

        // Format market analysis section
        let marketAnalysis = '';
        if (event.impact_analysis) {
          const analysis = event.impact_analysis;
          marketAnalysis = `
📊 Market Impact Analysis:
${analysis.market_impact}

${stockImpactSection}

🔄 Supply Chain Impact:
${analysis.supply_chain_impact}

📊 Market Sentiment:
- Short Term: ${analysis.market_sentiment?.short_term}
- Long Term: ${analysis.market_sentiment?.long_term}
`;
        }

        // Send email notification if enabled
        if (emailEnabled) {
          await sendEmailNotification(event, profile, affectedOrganizations, marketAnalysis);
          console.log(`Email notification sent to ${profile.email} for event ${event.id}`);
        }

        // Send SMS notification if enabled
        if (smsEnabled && phoneNumber) {
          const smsContent = `
🚨 ${event.severity} Alert: ${event.event_type} in ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown'}

Impact: ${event.impact_analysis?.market_impact?.slice(0, 100)}...
${smsStockImpact}

View details: ${supabaseUrl}/dashboard`;

          await twilio.messages.create({
            body: smsContent,
            to: phoneNumber,
            from: twilioPhoneNumber,
          });
          
          console.log(`SMS notification sent to ${phoneNumber} for event ${event.id}`);
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

async function processStockEmails(positive: any[], negative: any[], event: any, profile: any, affectedOrganizations: any[]) {
  [...positive, ...negative].forEach(async (stock) => {
    try {
      const stockEmailContent = `
Dear ${profile.full_name || "Valued User"},

A significant market event has been detected that may impact ${stock.symbol}.

🔍 Event Details:
Type: ${event.event_type}
Location: ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown Location'}
Severity: ${event.severity}
Time: ${new Date(event.created_at || '').toUTCString()}

📊 Stock Impact Analysis:
${stock.rationale}

🎯 Affected Sectors:
${affectedOrganizations.map(org => `• ${org}`).join('\n')}

For a full breakdown and real-time updates, visit your RippleEffect Dashboard: ${supabaseUrl}/dashboard

Stay informed,
The RippleEffect Team
      `;

      await resend.emails.send({
        from: "RippleEffect <notifications@resend.dev>",
        to: [profile.email || ''],
        subject: `🚨 Stock Alert: ${stock.symbol} Impacted by ${event.event_type} in ${event.country || 'Unknown Location'}`,
        html: stockEmailContent.replace(/\n/g, '<br>'),
      });

      console.log(`Stock impact email sent to ${profile.email} for ${stock.symbol}`);
    } catch (error) {
      console.error(`Error sending stock impact email for ${stock.symbol}:`, error);
    }
  });
}

async function sendEmailNotification(event: any, profile: any, affectedOrganizations: any[], marketAnalysis: string) {
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
