
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Initialize Resend with API key from environment variable
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message }: ContactFormData = await req.json();

    // Log the incoming request data
    console.log("Contact form submission:", { name, email, message });

    // Validate input data
    if (!name || !email || !message) {
      throw new Error("Missing required fields");
    }

    // Send the message to the site owner
    const notificationResult = await resend.emails.send({
      from: "RippleEffect <onboarding@resend.dev>",
      to: "abhonsle747@gmail.com", 
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    console.log("Notification email sent:", notificationResult);

    try {
      // For domain verification reasons with Resend, we need to use a verified sender
      // But we'll make it clear who the confirmation is for
      console.log(`Attempting to send confirmation email on behalf of: ${email}`);
      
      const confirmationResult = await resend.emails.send({
        from: "RippleEffect <onboarding@resend.dev>",
        to: email, // Send to the submitter's email
        reply_to: "abhonsle747@gmail.com", // Site owner's email for replies
        subject: "We've received your message",
        html: `
          <h1>Thank you for contacting us, ${name}!</h1>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p>For your records, here's a copy of your message:</p>
          <p>${message.replace(/\n/g, "<br/>")}</p>
          <p>Best regards,<br>The RippleEffect Team</p>
        `,
      });

      console.log("Confirmation email status:", confirmationResult);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Emails sent successfully",
          notificationId: notificationResult.id,
          confirmationId: confirmationResult?.id,
          details: {
            notification: notificationResult,
            confirmation: confirmationResult
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } catch (confirmError: any) {
      console.error("Error sending confirmation email:", confirmError);
      
      // Return partial success - we at least got the notification email sent
      return new Response(
        JSON.stringify({
          success: true,
          message: "Notification sent but failed to send confirmation email",
          error: confirmError.message,
          notificationId: notificationResult.id,
        }),
        {
          status: 207, // Partial success
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send email" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        },
      }
    );
  }
};

// Start the server
serve(handler);
