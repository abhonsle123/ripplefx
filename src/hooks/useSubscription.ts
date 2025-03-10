
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPlan, PLAN_FEATURES, SubscriptionFeatures } from "@/types/subscription";

export const useSubscription = (userId: string | null) => {
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ["subscription", userId],
    queryFn: async () => {
      if (!userId) return { plan: "free" as SubscriptionPlan, onFreeTrial: false, freeTrialEndsAt: null };

      console.log("Fetching subscription for user:", userId);

      // First check in the subscriptions table for active subscriptions
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      console.log("Subscription data from subscriptions table:", subscriptionData, subscriptionError);

      if (subscriptionData && !subscriptionError) {
        return { 
          plan: subscriptionData.plan as SubscriptionPlan,
          onFreeTrial: false,
          freeTrialEndsAt: null 
        };
      }

      // If no active subscription found, check for free trial status
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status, email, free_trial_used, free_trial_started_at, free_trial_ends_at")
        .eq("id", userId)
        .single();

      console.log("Profile subscription status and free trial info:", data, error);

      if (error || !data) {
        console.error("Error fetching subscription:", error);
        return { plan: "free" as SubscriptionPlan, onFreeTrial: false, freeTrialEndsAt: null };
      }

      // Development override for specific email
      if (data.email === "abhonsle747@gmail.com") {
        console.log("Development override: Setting premium plan for specific development user");
        return { 
          plan: "premium" as SubscriptionPlan,
          onFreeTrial: false,
          freeTrialEndsAt: null 
        };
      }

      // Check if user is on free trial
      const now = new Date();
      const onFreeTrial = data.free_trial_started_at && data.free_trial_ends_at && 
                         new Date(data.free_trial_ends_at) > now && !data.free_trial_used;
      
      // If on free trial, return premium plan
      if (onFreeTrial) {
        return { 
          plan: "premium" as SubscriptionPlan, 
          onFreeTrial: true,
          freeTrialEndsAt: data.free_trial_ends_at
        };
      }

      // Validate that the returned subscription is a valid SubscriptionPlan
      const subscription = data.subscription_status as SubscriptionPlan;
      return { 
        plan: ["free", "premium", "pro"].includes(subscription) ? subscription : "free",
        onFreeTrial: false,
        freeTrialEndsAt: null
      };
    },
    enabled: !!userId,
    // Reduce caching time to ensure subscription changes are picked up quickly
    staleTime: 5 * 1000, // 5 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000 // Refetch every 30 seconds to ensure subscription is current
  });

  const plan = subscriptionData?.plan || "free";
  const onFreeTrial = subscriptionData?.onFreeTrial || false;
  const freeTrialEndsAt = subscriptionData?.freeTrialEndsAt;

  console.log("Current subscription plan:", plan, "On free trial:", onFreeTrial);

  // Get the features available for the current plan
  const features = plan ? PLAN_FEATURES[plan] : PLAN_FEATURES.free;

  // Check if a specific feature is available in the current plan
  const hasFeature = (feature: keyof SubscriptionFeatures): boolean => {
    // Convert the value to boolean explicitly to avoid type issues
    return Boolean(features[feature]);
  };

  // Check if watchlist limit has been reached
  const canAddToWatchlist = (currentCount: number): boolean => {
    return currentCount < features.maxWatchlistItems;
  };

  return {
    plan,
    isLoading,
    features,
    hasFeature,
    canAddToWatchlist,
    onFreeTrial,
    freeTrialEndsAt
  };
};
