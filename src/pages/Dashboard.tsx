
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import EventFilters from "@/components/EventDashboard/EventFilters";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { Event, EventType, SeverityLevel, TrackingPreferences } from "@/types/event";
import { useToast } from "@/components/ui/use-toast";
import DashboardHeader from "@/components/EventDashboard/DashboardHeader";
import DashboardContent from "@/components/EventDashboard/DashboardContent";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");
  const [severity, setSeverity] = useState<SeverityLevel | "ALL">("ALL");
  const [realTimeEvents, setRealTimeEvents] = useState<Event[]>([]);
  const [view, setView] = useState<"grid" | "watchlist">("grid");
  const [isCreating, setIsCreating] = useState(false);
  const [userPreferences, setUserPreferences] = useState<TrackingPreferences | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", eventType, severity],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (eventType !== "ALL") {
        query = query.eq("event_type", eventType);
      }
      if (severity !== "ALL") {
        query = query.eq("severity", severity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
  });

  // Set up real-time subscription and analysis
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel("events-channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "events",
          },
          async (payload) => {
            if (payload.eventType === "INSERT") {
              const newEvent = payload.new as Event;
              
              try {
                const { data: analysis, error: analysisError } = await supabase.functions.invoke('analyze-event', {
                  body: { event_id: newEvent.id }
                });
                
                if (analysisError) {
                  console.error("Analysis error:", analysisError);
                  toast({
                    title: "Analysis Error",
                    description: "There was an error analyzing the event. Please try again.",
                    variant: "destructive",
                  });
                } else {
                  const updatedEvent = {
                    ...newEvent,
                    impact_analysis: analysis,
                  };
                  setRealTimeEvents((current) => [updatedEvent, ...current]);
                  
                  toast({
                    title: "New Event Added",
                    description: "Event analysis completed successfully.",
                  });
                }
              } catch (error) {
                console.error("Error processing event:", error);
                setRealTimeEvents((current) => [newEvent, ...current]);
              }
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast]);

  // Fetch user preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("id", session.user.id)
          .single();
        
        if (!error && data?.preferences) {
          const prefs = data.preferences as { tracking?: { industries: string[]; companies: string[]; event_types: string[]; } };
          if (prefs.tracking) {
            setUserPreferences({
              industries: prefs.tracking.industries,
              companies: prefs.tracking.companies,
              event_types: prefs.tracking.event_types,
            });
          }
        }
      }
    };

    fetchUserPreferences();
  }, []);

  const allEvents = [...realTimeEvents, ...(events || [])];

  return (
    <div className="container px-4 pt-24 pb-20">
      <DashboardHeader
        isCreating={isCreating}
        onOpenChange={setIsCreating}
        view={view}
        onViewChange={(v) => setView(v)}
      />
      
      <EventFilters
        eventType={eventType}
        setEventType={setEventType}
        severity={severity}
        setSeverity={setSeverity}
      />

      <DashboardContent
        view={view}
        isLoading={isLoading}
        events={allEvents}
        userId={userId}
        userPreferences={userPreferences}
      />
    </div>
  );
};

export default Dashboard;
