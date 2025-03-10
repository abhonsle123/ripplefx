
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: { "X-Client-Info": "supabase-webhook-stripe" },
  },
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature provided" }), { status: 400 });
  }

  try {
    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (error) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed` }), { status: 400 });
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const planName = session.metadata?.plan;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const isFreeTrial = session.metadata?.is_free_trial === "true";

        if (!userId || !planName || !customerId || !subscriptionId) {
          console.error("Missing required metadata in checkout session");
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Update or create subscription in database
        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: subscription.status,
            plan: planName,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });

        if (error) {
          console.error("Error updating subscription in database:", error);
        }

        // Mark free trial as used if they're signing up with a trial
        if (isFreeTrial) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              free_trial_used: true,
            })
            .eq("id", userId);

          if (profileError) {
            console.error("Error updating free trial status:", profileError);
          }
        }

        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object;
        const metadata = subscription.metadata || {};
        const userId = metadata.supabase_user_id;
        
        if (!userId) {
          console.error("Missing supabase_user_id in subscription metadata");
          break;
        }
        
        // Check if this is a trial subscription
        const status = subscription.status;
        const hasTrialEnd = subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000);
        
        if (status === 'trialing' && hasTrialEnd) {
          console.log(`User ${userId} started a subscription trial`);
          
          // Update profile to mark free trial as started and used
          const { error } = await supabase
            .from("profiles")
            .update({
              free_trial_started_at: new Date().toISOString(),
              free_trial_used: true,
              free_trial_ends_at: new Date(subscription.trial_end * 1000).toISOString(),
            })
            .eq("id", userId);
            
          if (error) {
            console.error("Error updating free trial status:", error);
          }
        }
        
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        
        // Get subscription from database
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (subError || !subData) {
          console.error("Subscription not found in database:", subError);
          break;
        }

        // Update subscription status
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Error updating subscription status:", error);
        }

        // If transitioning from trial to active, update free trial info
        if (subscription.status === 'active' && subscription.trial_end && 
            subscription.trial_end < Math.floor(Date.now() / 1000)) {
          console.log(`User ${subData.user_id} trial has ended and subscription is now active`);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        
        // Get subscription from database
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (subError || !subData) {
          console.error("Subscription not found in database:", subError);
          break;
        }

        // Update subscription status to canceled
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            plan: "free",
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Error updating subscription status:", error);
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        // If this is for a subscription and the subscription was previously trialing,
        // it means the trial has converted to a paid subscription
        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          
          // If the subscription was on trial before (checking metadata)
          if (subscription.metadata && subscription.metadata.had_trial === 'true') {
            console.log(`Trial has converted to paid subscription for ${subscription.id}`);
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
