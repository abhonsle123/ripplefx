
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
  disabled?: boolean;
  planId?: "free" | "premium" | "pro";
}

const PricingCard = ({
  title,
  price,
  description,
  features,
  recommended = false,
  disabled = false,
  planId = "free",
}: PricingCardProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (disabled) return;

    setIsLoading(true);

    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirect to auth page with redirect back to pricing
        navigate('/auth?redirect=pricing');
        return;
      }

      // Free plan doesn't need checkout
      if (planId === "free") {
        toast.success("You are now on the Free plan!");
        return;
      }

      // Create checkout session for paid plans
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { plan: planId, userId: session.user.id },
      });

      if (error) {
        throw error;
      }

      // Redirect to Stripe Checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to start subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative p-8 rounded-xl transition-all duration-300 ${
        recommended
          ? "bg-card border-2 border-primary shadow-lg shadow-primary/20 scale-105"
          : "bg-accent hover:scale-102 shadow-lg hover:shadow-xl"
      } ${disabled ? "opacity-80" : ""} group hover:translate-y-[-4px]`}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full text-sm font-medium shadow-sm">
          Recommended
        </span>
      )}
      {disabled && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary px-4 py-1 rounded-full text-sm font-medium shadow-sm">
          Coming Soon
        </div>
      )}
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-4xl font-bold mb-2">{price}</p>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <div className="bg-primary/10 p-1 rounded-full">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button 
        className={`w-full transition-all duration-300 ${
          recommended ? "bg-primary hover:bg-primary/90 shadow-md" : "bg-transparent border border-primary/50 text-primary hover:bg-primary/10"
        }`}
        variant={recommended ? "default" : "outline"}
        disabled={disabled || isLoading}
        onClick={handleSubscribe}
      >
        {isLoading 
          ? "Processing..." 
          : disabled 
            ? "Coming Soon" 
            : "Get Started"}
      </Button>
    </div>
  );
};

export default PricingCard;
