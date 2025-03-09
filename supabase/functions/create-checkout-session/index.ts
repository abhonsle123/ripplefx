
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:5173";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, userId } = await req.json();
    
    // Validate plan
    if (!["premium", "pro"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan selected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is authenticated
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get or create customer
    const { data: existingCustomers } = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${userId}'`,
    });

    let customerId;
    if (existingCustomers && existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
    } else {
      // Get user email from Supabase
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();
      
      if (userError || !userData) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create a new customer
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;
    }

    // IMPORTANT: You need to replace these with your actual Stripe price IDs
    // These IDs should match the products you've created in your Stripe dashboard
    const priceId = plan === "premium" 
      ? "price_REPLACE_WITH_YOUR_PREMIUM_PRICE_ID" // Replace with your Premium monthly price ID
      : "price_REPLACE_WITH_YOUR_PRO_PRICE_ID";    // Replace with your Pro monthly price ID

    console.log(`Creating checkout session for plan: ${plan}, price ID: ${priceId}`);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${siteUrl}/dashboard?success=true`,
      cancel_url: `${siteUrl}/?canceled=true`,
      metadata: {
        supabase_user_id: userId,
        plan: plan,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
