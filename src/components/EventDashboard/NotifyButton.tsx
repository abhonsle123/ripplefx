
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NotifyButtonProps {
  eventId: string;
  severity: string;
}

export const NotifyButton = ({ eventId, severity }: NotifyButtonProps) => {
  const [isNotifying, setIsNotifying] = useState(false);

  const handleNotify = async () => {
    try {
      setIsNotifying(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in to send notifications");
        return;
      }
      
      toast.info("Sending notifications...");
      
      const { data, error } = await supabase.functions.invoke("send-event-notification", {
        body: { eventId }
      });
      
      if (error) throw error;
      
      toast.success(data.message || "Notifications sent successfully");
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error("Failed to send notifications");
    } finally {
      setIsNotifying(false);
    }
  };

  // Show different button styles based on severity
  const getSeverityColor = () => {
    switch (severity) {
      case "HIGH":
        return "bg-orange-500 hover:bg-orange-600";
      case "CRITICAL":
        return "bg-red-500 hover:bg-red-600";
      default:
        return ""; // Use default button color for other severities
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${getSeverityColor()} transition-colors`}
            onClick={handleNotify}
            disabled={isNotifying}
          >
            <Bell className="h-4 w-4 mr-1" />
            {isNotifying ? "Sending..." : "Notify"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Send notifications about this event</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
