
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import EventFilters from "@/components/EventDashboard/EventFilters";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/integrations/supabase/types";
import CreateEventDialog from "@/components/EventDashboard/CreateEventDialog";
import EventAnalytics from "@/components/EventDashboard/EventAnalytics";
import EventsGrid from "@/components/EventDashboard/EventsGrid";

type Event = Database["public"]["Tables"]["events"]["Row"];
type EventType = Database["public"]["Enums"]["event_type"];
type SeverityLevel = Database["public"]["Enums"]["severity_level"];

interface UserPreferences {
  notifications?: {
    email?: {
      enabled: boolean;
      highSeverity: boolean;
      mediumSeverity: boolean;
      lowSeverity: boolean;
    };
    sms?: {
      enabled: boolean;
      phoneNumber: string | null;
      highSeverity: boolean;
      mediumSeverity: boolean;
      lowSeverity: boolean;
    };
  };
  tracking?: {
    industries: string[];
    companies: string[];
    event_types: string[];
  };
}

interface TrackingPreferences {
  industries?: string[];
  companies?: string[];
  event_types?: string[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");
  const [severity, setSeverity] = useState<SeverityLevel | "ALL">("ALL");
  const [realTimeEvents, setRealTimeEvents] = useState<Event[]>([]);
  const [view, setView] = useState<"grid" | "analytics">("grid");
  const [isCreating, setIsCreating] = useState(false);
  const [userPreferences, setUserPreferences] = useState<TrackingPreferences | null>(null);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
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
            event: "*",
            schema: "public",
            table: "events",
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setRealTimeEvents((current) => [
                payload.new as Event,
                ...current,
              ]);
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
  }, []);

  // Add this useEffect to fetch user preferences
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
          const prefs = data.preferences as UserPreferences;
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

  // Combine fetched and real-time events
  const allEvents = [...realTimeEvents, ...(events || [])];

  return (
    <div className="container px-4 pt-24 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">Event Dashboard</h1>
        <div className="flex items-center gap-4">
          <CreateEventDialog
            isOpen={isCreating}
            onOpenChange={setIsCreating}
          />
          <Tabs defaultValue={view} onValueChange={(v) => setView(v as "grid" | "analytics")}>
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <EventFilters
        eventType={eventType}
        setEventType={setEventType}
        severity={severity}
        setSeverity={setSeverity}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : (
        <Tabs defaultValue={view}>
          <TabsContent value="grid">
            <EventsGrid 
              events={allEvents}
              userPreferences={userPreferences}
            />
          </TabsContent>
          <TabsContent value="analytics">
            <EventAnalytics events={allEvents} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Dashboard;
