
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@13.9.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    console.error("Missing stripe-signature header");
    return new Response(JSON.stringify({ error: "Missing signature" }), { 
      status: 400 
    });
  }
  
  try {
    const body = await req.text();
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    
    console.log(`Webhook received: ${event.type}`);
    
    // Handle various webhook events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }
    }
    
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }),
      { status: 400 }
    );
  }
});

async function handleCheckoutSessionCompleted(session) {
  console.log("Processing checkout session completed:", session);
  
  // Extract user ID from metadata
  const userId = session.metadata?.userId || session.client_reference_id;
  const planId = session.metadata?.planId;
  
  if (!userId) {
    console.error("No user ID found in session");
    return;
  }
  
  try {
    // Update user's subscription status
    const { error } = await supabase
      .from("profiles")
      .update({ 
        subscription_status: planId || "premium",
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription
      })
      .eq("id", userId);
    
    if (error) {
      console.error("Error updating user subscription:", error);
    } else {
      console.log(`Successfully updated subscription for user ${userId} to ${planId || "premium"}`);
    }
  } catch (err) {
    console.error("Error in handleCheckoutSessionCompleted:", err);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log("Processing subscription updated:", subscription);
  
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .single();
    
    if (error || !data) {
      console.error("Error finding user for subscription:", error);
      return;
    }
    
    // Map Stripe's status to our subscription status
    let subscriptionStatus = "free";
    if (subscription.status === "active") {
      // Determine plan based on price
      if (subscription.items.data[0].plan.id === "price_1Ow4JWLvThIIf0dH6mFiujZ9") {
        subscriptionStatus = "premium";
      } else if (subscription.items.data[0].plan.id === "price_1Ow4JxLvThIIf0dHs7vRvBzF") {
        subscriptionStatus = "pro";
      }
    }
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        subscription_status: subscriptionStatus
      })
      .eq("id", data.id);
    
    if (updateError) {
      console.error("Error updating subscription status:", updateError);
    } else {
      console.log(`Updated subscription status to ${subscriptionStatus} for user ${data.id}`);
    }
  } catch (err) {
    console.error("Error in handleSubscriptionUpdated:", err);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log("Processing subscription deleted:", subscription);
  
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .single();
    
    if (error || !data) {
      console.error("Error finding user for subscription:", error);
      return;
    }
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        subscription_status: "free"
      })
      .eq("id", data.id);
    
    if (updateError) {
      console.error("Error resetting subscription status:", updateError);
    } else {
      console.log(`Reset subscription status to free for user ${data.id}`);
    }
  } catch (err) {
    console.error("Error in handleSubscriptionDeleted:", err);
  }
}
