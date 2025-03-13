
import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { formatDistance } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Profile } from "./ProfileForm";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionManagementProps {
  profile: Profile;
}

export const SubscriptionManagement = ({ profile }: SubscriptionManagementProps) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const { plan, onFreeTrial, freeTrialEndsAt } = useSubscription(profile.id);
  
  const isSubscribed = plan !== "free";
  const showFreeTrial = onFreeTrial && freeTrialEndsAt;
  
  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("You must be logged in to cancel your subscription");
      }
      
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ userId: profile.id }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel subscription");
      }
      
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully. You'll still have access until the end of your current billing period.",
      });
      
      // Close the dialog
      setDialogOpen(false);
      
      // We'll force a page reload to refresh all data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setCancellingSubscription(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Subscription Management</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Current Plan:</h3>
                <Badge variant={plan === "free" ? "outline" : "default"} className="capitalize">
                  {plan}
                </Badge>
                {showFreeTrial && (
                  <Badge variant="secondary">
                    Trial
                  </Badge>
                )}
              </div>
              
              {showFreeTrial && (
                <p className="text-sm text-muted-foreground mt-2">
                  Your free trial ends {formatDistance(new Date(freeTrialEndsAt), new Date(), { addSuffix: true })}
                </p>
              )}
              
              {isSubscribed && !onFreeTrial && (
                <p className="text-sm text-muted-foreground mt-2">
                  Your subscription will continue until you cancel it.
                </p>
              )}
              
              {!isSubscribed && profile.free_trial_used && (
                <p className="text-sm text-muted-foreground mt-2">
                  You've already used your free trial.
                </p>
              )}
            </div>
            
            {isSubscribed && (
              <Button 
                variant="destructive" 
                onClick={() => setDialogOpen(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
          
          {isSubscribed && (
            <div className="text-sm text-muted-foreground border-t pt-4">
              <p className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                If you cancel your subscription, you'll still have access to premium features until the end of your current billing period.
              </p>
            </div>
          )}
          
          {!isSubscribed && (
            <div className="text-sm text-muted-foreground flex items-center gap-2 border-t pt-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>You are currently on the free plan. Visit the pricing page to upgrade your subscription.</span>
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll still have access to premium features until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={cancellingSubscription}
            >
              Keep Subscription
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={cancellingSubscription}
            >
              {cancellingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
