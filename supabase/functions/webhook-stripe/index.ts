
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  {
    global: {
      headers: { "X-Client-Info": "supabase-webhook-stripe" },
    },
  }
);

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
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
