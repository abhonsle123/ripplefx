
import PricingCard from "@/components/PricingCard";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface PricingSectionProps {
  onSubscribe?: (planId: string) => void;
}

const PricingSection = ({ onSubscribe }: PricingSectionProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  
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
      price: "Coming Soon",
      description: "Complete solution for professional traders",
      features: [
        "Instant event notifications",
        "Unlimited stocks in watchlist",
        "Advanced AI analytics",
        "Custom alert rules",
        "24/7 priority support",
        "API access",
      ],
      disabled: true,
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
              onSubscribe={() => onSubscribe && onSubscribe(plan.planId)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingSection;
