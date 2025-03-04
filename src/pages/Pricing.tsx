
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AVAILABLE_PLANS } from "@/types/subscription";
import PricingSection from "@/components/landing/PricingSection";

const Pricing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast("Please login first", {
        description: "You need to be logged in to subscribe to a plan",
      });
      navigate("/auth");
      return;
    }

    if (!AVAILABLE_PLANS[planId as keyof typeof AVAILABLE_PLANS]) {
      toast("Plan not available", {
        description: "This plan is not available for subscription yet.",
      });
      return;
    }

    if (planId === "free") {
      toast("Already on Free plan", {
        description: "You are already on the free plan.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planId,
          userId: user.id,
          returnUrl: `${window.location.origin}/pricing`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast("Subscription Error", {
        description: error.message || "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if this is a redirect from Stripe
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      toast("Subscription successful!", {
        description: "Your subscription was processed successfully. Welcome to Premium!",
      });
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (query.get("canceled")) {
      toast("Subscription canceled", {
        description: "Your subscription process was canceled.",
      });
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="pt-16">
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <PricingSection onSubscribe={handleSubscribe} />
      )}
    </div>
  );
};

export default Pricing;
