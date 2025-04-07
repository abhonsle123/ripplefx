
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

interface EventNotificationRequest {
  eventId: string;
  userId?: string;
  sendToAll?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, userId, sendToAll = false }: EventNotificationRequest = await req.json();
    
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    console.log(`Processing notification request for event ${eventId}`);

    // Fetch the event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError) {
      console.error("Error fetching event:", eventError);
      throw new Error(`Failed to fetch event: ${eventError.message}`);
    }

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`);
    }

    console.log(`Event found: ${event.title}, severity: ${event.severity}`);

    // Define our query for fetching users to notify
    let profilesQuery = supabase.from("profiles").select("*");

    // If sendToAll is false and userId is provided, only send to that specific user
    if (!sendToAll && userId) {
      profilesQuery = profilesQuery.eq("id", userId);
    } else {
      // Otherwise, send to all users who have email notifications enabled
      profilesQuery = profilesQuery.filter("preferences->notifications->email->enabled", "eq", true);

      // Apply severity filters based on user preferences
      if (event.severity === "HIGH") {
        profilesQuery = profilesQuery.filter("preferences->notifications->email->highSeverity", "eq", true);
      } else if (event.severity === "MEDIUM") {
        profilesQuery = profilesQuery.filter("preferences->notifications->email->mediumSeverity", "eq", true);
      } else if (event.severity === "LOW") {
        profilesQuery = profilesQuery.filter("preferences->notifications->email->lowSeverity", "eq", true);
      }
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    console.log(`Found ${profiles?.length || 0} users to notify`);

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format the affected organizations for the email
    const affectedOrganizations = Array.isArray(event.affected_organizations) 
      ? event.affected_organizations 
      : typeof event.affected_organizations === 'object'
        ? Object.values(event.affected_organizations)
        : [];

    // Format stock impact notifications if available
    let stockImpactSection = '';
    if (event.impact_analysis?.stock_predictions) {
      const { positive = [], negative = [] } = event.impact_analysis.stock_predictions;
      
      if (positive.length > 0 || negative.length > 0) {
        stockImpactSection = `
<h3>Significant Stock Impact Predictions:</h3>

<h4>📈 Positive Impact:</h4>
<ul>
${positive.slice(0, 3).map(stock => `<li><strong>${stock.symbol}</strong>: ${stock.rationale}</li>`).join('')}
</ul>

<h4>📉 Negative Impact:</h4>
<ul>
${negative.slice(0, 3).map(stock => `<li><strong>${stock.symbol}</strong>: ${stock.rationale}</li>`).join('')}
</ul>
`;
      }
    }

    // Send emails to each user
    const emailPromises = profiles.map(async (profile) => {
      if (!profile.email) {
        console.log(`User ${profile.id} has no email address`);
        return null;
      }

      console.log(`Sending email to ${profile.email}`);

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
    .header-${event.severity.toLowerCase()} { 
      background-color: ${event.severity === 'CRITICAL' ? '#d9534f' : 
                        event.severity === 'HIGH' ? '#f0ad4e' : 
                        event.severity === 'MEDIUM' ? '#5bc0de' : '#5cb85c'}; 
      color: white; 
    }
    .content { padding: 20px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    .severity-high { color: #f0ad4e; }
    .severity-medium { color: #5bc0de; }
    .severity-critical { color: #d9534f; font-weight: bold; }
    .severity-low { color: #5cb85c; }
    .button { display: inline-block; padding: 10px 20px; background-color: #0d6efd; color: white; 
              text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .summary { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #0d6efd; margin: 15px 0; }
    .location { font-style: italic; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header header-${event.severity.toLowerCase()}">
      <h1>Event Alert: ${event.event_type}</h1>
    </div>
    <div class="content">
      <p>Dear ${profile.full_name || "Valued User"},</p>
      
      <p>A <span class="severity-${event.severity.toLowerCase()}">${event.severity} severity</span> 
         ${event.event_type} event has occurred in 
         <span class="location">${event.city ? `${event.city}, ` : ''}${event.country || 'Unknown Location'}</span>.</p>
      
      <div class="summary">
        <h2>${event.title}</h2>
        <p>${event.description}</p>
      </div>
      
      ${stockImpactSection}
      
      ${affectedOrganizations.length > 0 ? `
      <h3>Affected Organizations:</h3>
      <ul>
        ${affectedOrganizations.slice(0, 5).map(org => `<li>${org}</li>`).join('')}
      </ul>
      ` : ''}
      
      ${event.impact_analysis?.market_impact ? `
      <h3>Market Impact Analysis:</h3>
      <p>${event.impact_analysis.market_impact}</p>
      ` : ''}
      
      <a href="${supabaseUrl}/dashboard" class="button">View Full Details on Dashboard</a>
      
      <p>Stay informed,<br>The RippleEffect Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to you because you've enabled event notifications. 
      You can manage your notification preferences in your profile settings.</p>
    </div>
  </div>
</body>
</html>
      `;

      try {
        const emailResult = await resend.emails.send({
          from: "RippleEffect <notifications@resend.dev>",
          to: [profile.email],
          subject: `🚨 ${event.severity} Alert: ${event.title}`,
          html: emailHtml,
        });

        console.log(`Email sent to ${profile.email}, ID: ${emailResult.id}`);
        return emailResult;
      } catch (emailError) {
        console.error(`Error sending email to ${profile.email}:`, emailError);
        return null;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`Successfully sent ${successCount} out of ${profiles.length} emails`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications processed. Sent ${successCount} out of ${profiles.length} emails.`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-event-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
