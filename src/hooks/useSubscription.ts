
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPlan, PLAN_FEATURES, SubscriptionFeatures } from "@/types/subscription";

export const useSubscription = (userId: string | null) => {
  const { data: plan = "free" as SubscriptionPlan, isLoading } = useQuery({
    queryKey: ["subscription", userId],
    queryFn: async (): Promise<SubscriptionPlan> => {
      if (!userId) return "free";

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
        return subscriptionData.plan as SubscriptionPlan;
      }

      // If no active subscription found, fall back to profile status
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status, email")
        .eq("id", userId)
        .single();

      console.log("Profile subscription status:", data, error);

      if (error || !data) {
        console.error("Error fetching subscription:", error);
        return "free";
      }

      // Development override for specific email
      if (data.email === "abhonsle747@gmail.com") {
        console.log("Development override: Setting premium plan for specific development user");
        return "premium";
      }

      // Validate that the returned subscription is a valid SubscriptionPlan
      const subscription = data.subscription_status as SubscriptionPlan;
      return ["free", "premium", "pro"].includes(subscription) ? subscription : "free";
    },
    enabled: !!userId,
    // Reduce caching time to ensure subscription changes are picked up quickly
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000 // Refetch every minute to ensure subscription is current
  });

  console.log("Current subscription plan:", plan);

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
  };
};
