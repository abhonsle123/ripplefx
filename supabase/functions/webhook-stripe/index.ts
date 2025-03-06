
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import Stripe from "https://esm.sh/stripe@12.5.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeKey, {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get the Stripe signature from the request headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found in request headers");
    }

    // Get the raw request body
    const body = await req.text();
    
    // Verify the event is from Stripe using the webhook secret
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`Webhook signature verified successfully for event: ${event.type}`);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Processing Stripe event: ${event.type}`);
    
    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // Extract user ID and plan from metadata
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        
        if (userId && planId) {
          // Update user subscription status in Supabase
          await supabase
            .from('profiles')
            .update({
              subscription_status: planId,
              stripe_subscription_id: session.subscription,
            })
            .eq('id', userId);
          
          console.log(`Updated subscription for user ${userId} to ${planId}`);
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        // Find the user associated with this subscription
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id);
        
        if (error) {
          console.error('Error fetching profiles:', error);
        } else if (profiles.length > 0) {
          const status = subscription.status === 'active' ? 
            (subscription.items.data[0].price.product.metadata?.plan_id || 'premium') : 
            'free';
          
          // Update subscription status
          await supabase
            .from('profiles')
            .update({ subscription_status: status })
            .eq('stripe_subscription_id', subscription.id);
          
          console.log(`Updated subscription status to ${status} for subscription ${subscription.id}`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        // Find the user associated with this subscription
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id);
        
        if (error) {
          console.error('Error fetching profiles:', error);
        } else if (profiles.length > 0) {
          // Reset subscription status to free
          await supabase
            .from('profiles')
            .update({ 
              subscription_status: 'free',
              stripe_subscription_id: null
            })
            .eq('stripe_subscription_id', subscription.id);
          
          console.log(`Subscription ${subscription.id} was canceled, user reverted to free plan`);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
