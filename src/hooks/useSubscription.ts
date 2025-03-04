
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPlan, PLAN_FEATURES } from "@/types/subscription";

export const useSubscription = (userId: string | null) => {
  const { data: plan = "free" as SubscriptionPlan, isLoading } = useQuery({
    queryKey: ["subscription", userId],
    queryFn: async (): Promise<SubscriptionPlan> => {
      if (!userId) return "free";

      // Fetch the user's subscription from the profiles table
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.error("Error fetching subscription:", error);
        return "free";
      }

      // Validate that the returned subscription is a valid SubscriptionPlan
      const subscription = data.subscription_status as SubscriptionPlan;
      return ["free", "premium", "pro"].includes(subscription) ? subscription : "free";
    },
    enabled: !!userId,
  });

  // Get the features available for the current plan
  const features = plan ? PLAN_FEATURES[plan] : PLAN_FEATURES.free;

  // Check if a specific feature is available in the current plan
  const hasFeature = (feature: keyof SubscriptionFeatures): boolean => {
    return features[feature];
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
