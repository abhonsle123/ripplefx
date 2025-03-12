
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
import { Info } from "lucide-react";

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
    timeSinceLastRefresh 
  } = useEvents(eventType, severity, searchTerm);
  
  // Set up realtime subscriptions for events
  useRealtimeEvents();
  
  // Set up auto refresh for events every 2 minutes
  const refreshEventsCallback = useCallback(refreshEvents, [refreshEvents]);
  useAutoRefresh(refreshEventsCallback, 120);

  // Log subscription status when it changes
  useEffect(() => {
    if (!subscriptionLoading) {
      console.log("Dashboard - Current subscription plan:", plan, "for user:", userId);
      if (plan === "premium" || plan === "pro") {
        toast.success(`You are on the ${plan} plan`, {
          id: "subscription-status",
          duration: 3000
        });
      }
    }
  }, [plan, subscriptionLoading, userId]);

  return (
    <DashboardContainer>
      <DashboardHeader
        isCreating={isCreating}
        onOpenChange={setIsCreating}
        view={view}
        onViewChange={(v) => {
          // Allow all users to access the watchlist view
          setView(v);
        }}
      />
      
      <div className="flex justify-between items-center text-xs text-muted-foreground mb-2 px-2">
        <div className="flex items-center gap-1">
          <Info size={12} />
          <span>Last updated: {timeSinceLastRefresh}</span>
        </div>
        <button 
          onClick={refreshEvents} 
          className="text-xs text-primary hover:underline"
        >
          Refresh now
        </button>
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
