
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
    console.log("Starting notification processing...");
    
    // Get unprocessed notifications with related data
    const { data: notifications, error: fetchError } = await supabase
      .from("notification_queue")
      .select("*, events(*), profiles(*)")
      .eq("processed", false)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error fetching notifications:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${notifications?.length || 0} unprocessed notifications`);

    for (const notification of notifications || []) {
      const event = notification.events;
      const profile = notification.profiles;

      if (!event || !profile) {
        console.log("Missing event or profile data:", { event, profile });
        continue;
      }

      try {
        console.log(`Processing notification for event ${event.id} and profile ${profile.id}`);
        
        // Check notification preferences
        const preferences = profile.preferences?.notifications;
        if (!preferences) {
          console.log("No notification preferences found for profile:", profile.id);
          continue;
        }

        const emailEnabled = preferences.email?.enabled && 
                           preferences.email?.[`${event.severity.toLowerCase()}Severity`];
        const smsEnabled = preferences.sms?.enabled && 
                          preferences.sms?.[`${event.severity.toLowerCase()}Severity`];
        const phoneNumber = preferences.sms?.phoneNumber;

        console.log("Notification preferences:", {
          emailEnabled,
          smsEnabled,
          phoneNumber,
          severity: event.severity
        });

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
          }
        }

        // Send email notification if enabled
        if (emailEnabled && profile.email) {
          console.log("Sending email to:", profile.email);
          
          const emailContent = `
Dear ${profile.full_name || "Valued User"},

A ${event.severity} ${event.event_type} has occurred in ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown Location'}.

🔍 Event Details:
${event.description}

${stockImpactSection}

🏢 Affected Organizations:
${affectedOrganizations.map(org => `• ${org}`).join('\n')}

📊 Market Impact Analysis:
${event.impact_analysis?.market_impact || 'No market impact analysis available.'}

View full details and manage your watchlist: ${supabaseUrl}/dashboard

Stay informed,
The RippleEffect Team
`;

          await resend.emails.send({
            from: "RippleEffect <notifications@resend.dev>",
            to: [profile.email],
            subject: `🚨 ${event.severity} Alert: ${event.event_type} in ${event.country || 'Unknown Location'}`,
            html: emailContent.replace(/\n/g, '<br>'),
          });

          console.log("Email sent successfully to:", profile.email);
        }

        // Send SMS notification if enabled
        if (smsEnabled && phoneNumber) {
          console.log("Sending SMS to:", phoneNumber);
          
          const smsContent = `
🚨 ${event.severity} Alert: ${event.event_type} in ${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown Location'}

${event.description.slice(0, 100)}...${smsStockImpact}

View details: ${supabaseUrl}/dashboard`;

          await twilio.messages.create({
            body: smsContent,
            to: phoneNumber,
            from: twilioPhoneNumber,
          });

          console.log("SMS sent successfully to:", phoneNumber);
        }

        // Mark notification as processed
        const { error: updateError } = await supabase
          .from("notification_queue")
          .update({ processed: true })
          .eq("id", notification.id);

        if (updateError) {
          console.error("Error marking notification as processed:", updateError);
          throw updateError;
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        
        // Mark notification as processed with error
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
