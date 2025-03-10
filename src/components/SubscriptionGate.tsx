
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LockIcon, ArrowRight } from "lucide-react";
import { SubscriptionPlan } from "@/types/subscription";
import { useEffect } from "react";

interface SubscriptionGateProps {
  requiredPlan: SubscriptionPlan;
  userPlan: SubscriptionPlan;
  featureName: string;
  description?: string;
  children: React.ReactNode;
  onFreeTrial?: boolean;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  requiredPlan,
  userPlan,
  featureName,
  description,
  children,
  onFreeTrial = false,
}) => {
  const navigate = useNavigate();
  
  // Plans have an order: free < premium < pro
  const planOrder: Record<SubscriptionPlan, number> = {
    free: 0,
    premium: 1,
    pro: 2,
  };
  
  // Check if user has access to the required plan
  // A user with premium plan should have access to premium features
  // A user with pro plan should have access to both premium and pro features
  const hasAccess = planOrder[userPlan] >= planOrder[requiredPlan];

  // Log subscription gate evaluation
  useEffect(() => {
    console.log(
      `SubscriptionGate - Feature: ${featureName}, Required plan: ${requiredPlan}, User plan: ${userPlan}, Has access: ${hasAccess}, On free trial: ${onFreeTrial}`
    );
  }, [featureName, requiredPlan, userPlan, hasAccess, onFreeTrial]);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-lg border border-dashed border-primary/20 bg-secondary/30 p-6 text-center shadow-sm backdrop-blur">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <LockIcon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-medium">{featureName} Requires {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} Plan</h3>
      {description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
      <Button
        onClick={() => navigate("/pricing")} 
        className="mt-2"
      >
        {onFreeTrial ? "Start Free Trial" : "Upgrade Plan"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default SubscriptionGate;
