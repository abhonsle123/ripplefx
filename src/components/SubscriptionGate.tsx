
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LockIcon, ArrowRight } from "lucide-react";
import { SubscriptionPlan } from "@/types/subscription";

interface SubscriptionGateProps {
  requiredPlan: SubscriptionPlan;
  userPlan: SubscriptionPlan;
  featureName: string;
  description?: string;
  children: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  requiredPlan,
  userPlan,
  featureName,
  description,
  children,
}) => {
  const navigate = useNavigate();
  
  // Plans have an order: free < premium < pro
  const planOrder: Record<SubscriptionPlan, number> = {
    free: 0,
    premium: 1,
    pro: 2,
  };
  
  const hasAccess = planOrder[userPlan] >= planOrder[requiredPlan];

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
        Upgrade Plan
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default SubscriptionGate;
