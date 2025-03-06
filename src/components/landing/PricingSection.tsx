
import PricingCard from "@/components/PricingCard";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PricingSectionProps {
  onSubscribe?: (planId: string) => void;
}

const PricingSection = ({ onSubscribe }: PricingSectionProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const { plan: currentPlan } = useSubscription(userId);

  const handleSubscribe = async (planId: string) => {
    if (!userId) {
      toast("Please login first", {
        description: "You need to sign in to subscribe to a plan",
      });
      navigate("/auth");
      return;
    }

    if (planId === "free") {
      toast("Already on Free plan", {
        description: "You are already on the free plan.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke("create-checkout-session", {
        body: {
          planId,
          userId,
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
      setIsLoading(false);
    }
  };

  const plans = [
    {
      title: "Basic",
      price: "Free",
      description: "Essential alerts for individual investors",
      features: [
        "Basic event notifications",
        "3 stocks in watchlist",
        "Daily market summary",
        "Email alerts",
      ],
      planId: "free"
    },
    {
      title: "Premium",
      price: "$25/mo",
      description: "Advanced insights for active traders",
      features: [
        "Real-time event notifications",
        "15 stocks in watchlist",
        "AI-powered stock analysis",
        "SMS & Email alerts",
        "Priority support",
      ],
      recommended: true,
      planId: "premium"
    },
    {
      title: "Pro",
      price: "$49/mo",
      description: "Complete solution for professional traders",
      features: [
        "Instant event notifications",
        "Unlimited stocks in watchlist",
        "Advanced AI analytics",
        "Custom alert rules",
        "24/7 priority support",
        "API access",
      ],
      disabled: false,
      planId: "pro"
    },
  ];

  return (
    <div id="pricing-section" className="container px-4 py-20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl transform -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
      
      <h2 className="text-3xl font-bold text-center mb-16 text-foreground relative">
        Choose Your <span className="text-primary">Plan</span>
      </h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`transform transition-all duration-500 hover:z-10 ${
              index === 0 ? "animate-slideUp" : 
              index === 1 ? "animate-slideUp [animation-delay:150ms]" : 
              "animate-slideUp [animation-delay:300ms]"
            }`}
          >
            <PricingCard 
              {...plan} 
              current={currentPlan === plan.planId}
              onSubscribe={() => isLoading ? null : (onSubscribe ? onSubscribe(plan.planId) : handleSubscribe(plan.planId))}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingSection;
