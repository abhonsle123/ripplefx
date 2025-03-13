
import { useState, useCallback, useEffect } from "react";
import type { EventType, SeverityLevel } from "@/types/event";
import DashboardHeader from "@/components/EventDashboard/DashboardHeader";
import EventFilters from "@/components/EventDashboard/EventFilters";
import DashboardContent from "@/components/EventDashboard/DashboardContent";
import DashboardContainer from "@/components/EventDashboard/DashboardContainer";
import { useEvents } from "@/hooks/useEvents";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useAuthentication } from "@/hooks/useAuthentication";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Info, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Dashboard = () => {
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");
  const [severity, setSeverity] = useState<SeverityLevel | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [view, setView] = useState<"grid" | "watchlist">("grid");
  const [isCreating, setIsCreating] = useState(false);
  
  const { userId } = useAuthentication();
  const userPreferences = useUserPreferences(userId);
  const { plan, isLoading: subscriptionLoading } = useSubscription(userId);
  const { 
    events, 
    filteredEvents, 
    isLoading, 
    refreshEvents, 
    isRefreshingManually,
    timeSinceLastRefresh 
  } = useEvents(eventType, severity, searchTerm);
  
  useRealtimeEvents();
  
  const refreshEventsCallback = useCallback(async () => {
    // Only call the refresh function if we're not already refreshing
    if (!isRefreshingManually) {
      await refreshEvents();
    }
  }, [refreshEvents, isRefreshingManually]);
  
  // Set up auto refresh with 120 seconds interval
  useAutoRefresh(refreshEventsCallback, 120);

  // Normal refresh - just get latest events
  const handleRefresh = () => {
    if (!isRefreshingManually) {
      refreshEvents();
    }
  };
  
  // Force refresh - clean DB and get new events
  const handleForceRefresh = () => {
    if (!isRefreshingManually) {
      toast.info("Force refreshing news...", { id: "force-refresh" });
      refreshEvents(true);
    }
  };

  useEffect(() => {
    if (!subscriptionLoading && plan && (plan === "premium" || plan === "pro")) {
      console.log("Dashboard - Current subscription plan:", plan, "for user:", userId);
      toast.success(`You are on the ${plan} plan`, {
        id: "subscription-status",
        duration: 3000
      });
    }
  }, [plan, subscriptionLoading, userId]);

  return (
    <DashboardContainer>
      <DashboardHeader
        isCreating={isCreating}
        onOpenChange={setIsCreating}
        view={view}
        onViewChange={(v) => {
          setView(v);
        }}
      />
      
      <div className="flex justify-between items-center text-xs text-muted-foreground mb-2 px-2">
        <div className="flex items-center gap-1">
          <Info size={12} />
          <span>Last updated: {timeSinceLastRefresh}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshingManually}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {isRefreshingManually ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={12} />
                <span>Refresh now</span>
              </>
            )}
          </button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleForceRefresh}
                  disabled={isRefreshingManually}
                  className="text-xs text-orange-500 hover:underline flex items-center gap-1"
                >
                  <AlertCircle size={12} />
                  <span>Force refresh</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear old news and fetch fresh content</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="bg-card/40 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-accent/10 animate-slideUp [animation-delay:200ms]">
        <EventFilters
          eventType={eventType}
          setEventType={setEventType}
          severity={severity}
          setSeverity={setSeverity}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>

      <div className="animate-slideUp [animation-delay:400ms]">
        <DashboardContent
          view={view}
          isLoading={isLoading}
          events={events}
          userId={userId}
          userPreferences={userPreferences}
          filteredEvents={filteredEvents}
          searchTerm={searchTerm}
          eventType={eventType}
          severity={severity}
        />
      </div>
    </DashboardContainer>
  );
};

export default Dashboard;
