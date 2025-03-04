
import { useEffect, useState, useMemo } from "react";
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
  const [searchTerm, setSearchTerm] = useState<string>("");
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
    queryKey: ["events"],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
  });

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Apply event type filter
      if (eventType !== "ALL" && event.event_type !== eventType) {
        return false;
      }
      
      // Apply severity filter
      if (severity !== "ALL" && event.severity !== severity) {
        return false;
      }
      
      // Apply search term filter
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        
        // Search in title and description
        const titleMatch = event.title?.toLowerCase().includes(searchLower) || false;
        const descriptionMatch = event.description?.toLowerCase().includes(searchLower) || false;
        const countryMatch = event.country?.toLowerCase().includes(searchLower) || false;
        const cityMatch = event.city?.toLowerCase().includes(searchLower) || false;
        
        if (!titleMatch && !descriptionMatch && !countryMatch && !cityMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [events, eventType, severity, searchTerm]);

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container px-4 pt-24 pb-20 relative z-10">
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
