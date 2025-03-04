import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EventFilters from "@/components/EventDashboard/EventFilters";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { Event, EventType, SeverityLevel, TrackingPreferences } from "@/types/event";
import { useToast } from "@/components/ui/use-toast";
import DashboardHeader from "@/components/EventDashboard/DashboardHeader";
import DashboardContent from "@/components/EventDashboard/DashboardContent";
import { useSubscription } from "@/hooks/useSubscription";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");
  const [severity, setSeverity] = useState<SeverityLevel | "ALL">("ALL");
  const [view, setView] = useState<"grid" | "watchlist">("grid");
  const [isCreating, setIsCreating] = useState(false);
  const [userPreferences, setUserPreferences] = useState<TrackingPreferences | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { plan } = useSubscription(userId);

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

  // Set up real-time subscription
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel("events-channel")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "events",
          },
          (payload) => {
            const updatedEvent = payload.new as Event;
            // Only update the events list when an event is updated (not created)
            if (payload.eventType === "UPDATE" && events) {
              const updatedEvents = events.map((event) =>
                event.id === updatedEvent.id ? updatedEvent : event
              );
              // We don't setRealTimeEvents anymore, instead we invalidate the query
              // to get fresh data from the server
              queryClient.invalidateQueries({ queryKey: ["events"] });
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
  }, [events, queryClient]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <div className="container px-4 pt-24 pb-20">
        <div className="space-y-8 animate-fadeIn">
          <DashboardHeader
            isCreating={isCreating}
            onOpenChange={setIsCreating}
            view={view}
            onViewChange={(v) => {
              // Allow all users to access the watchlist view
              setView(v);
            }}
          />
          
          <div className="bg-card/40 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-accent/10 animate-slideUp [animation-delay:200ms]">
            <EventFilters
              eventType={eventType}
              setEventType={setEventType}
              severity={severity}
              setSeverity={setSeverity}
            />
          </div>

          <div className="animate-slideUp [animation-delay:400ms]">
            <DashboardContent
              view={view}
              isLoading={isLoading}
              events={events}
              userId={userId}
              userPreferences={userPreferences}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
