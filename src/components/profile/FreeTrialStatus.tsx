
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FreeTrialStatus = {
  free_trial_used: boolean;
  free_trial_started_at: string | null;
  free_trial_ends_at: string | null;
};

interface FreeTrialStatusProps {
  status: FreeTrialStatus;
}

export const FreeTrialStatus = ({ status }: FreeTrialStatusProps) => {
  const navigate = useNavigate();
  
  if (status.free_trial_started_at && status.free_trial_ends_at) {
    const now = new Date();
    const endDate = new Date(status.free_trial_ends_at);
    
    if (endDate > now && !status.free_trial_used) {
      return (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-700 flex items-center">
            <Badge variant="default" className="mr-2 bg-green-500">Active</Badge>
            Premium Free Trial
          </h3>
          <p className="text-sm text-green-600 mt-1">
            Your free trial ends {formatDistanceToNow(endDate, { addSuffix: true })}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Your payment method will be automatically charged when the trial ends unless you cancel.
          </p>
        </div>
      );
    } else {
      return (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <Badge variant="outline" className="mr-2">Expired</Badge>
            Free Trial
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Your free trial has ended. If you provided payment information, your subscription has been activated.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => navigate("/pricing")}
          >
            View Plans
          </Button>
        </div>
      );
    }
  } else if (status.free_trial_used) {
    return (
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
          <Badge variant="outline" className="mr-2">Used</Badge>
          Free Trial
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          You've already used your free trial. Check your subscription status or upgrade to Premium to enjoy premium features.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={() => navigate("/pricing")}
        >
          View Plans
        </Button>
      </div>
    );
  }
  
  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h3 className="text-lg font-semibold text-blue-700 flex items-center">
        <Badge variant="secondary" className="mr-2 bg-blue-200 text-blue-700">Available</Badge>
        Free Premium Trial
      </h3>
      <p className="text-sm text-blue-600 mt-1">
        You're eligible for a 7-day free trial of our Premium plan!
      </p>
      <p className="text-xs text-blue-600 mt-1">
        Payment information will be required, but you won't be charged until your trial ends.
      </p>
      <Button 
        size="sm" 
        className="mt-2" 
        onClick={() => navigate("/pricing")}
      >
        Start Free Trial
      </Button>
    </div>
  );
};
