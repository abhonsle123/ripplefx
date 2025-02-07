
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import EventCard from "@/components/EventDashboard/EventCard";
import EventFilters from "@/components/EventDashboard/EventFilters";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [realTimeEvents, setRealTimeEvents] = useState<Event[]>([]);

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

  // Combine fetched and real-time events
  const allEvents = [...realTimeEvents, ...(events || [])];

  return (
    <div className="container px-4 pt-24 pb-20">
      <h1 className="text-3xl font-bold mb-8">Event Dashboard</h1>
      
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
