
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import EventCard from "@/components/EventDashboard/EventCard";
import EventFilters from "@/components/EventDashboard/EventFilters";
import { RealtimeChannel } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];
type EventType = Database["public"]["Enums"]["event_type"];
type SeverityLevel = Database["public"]["Enums"]["severity_level"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");
  const [severity, setSeverity] = useState<SeverityLevel | "ALL">("ALL");
  const [realTimeEvents, setRealTimeEvents] = useState<Event[]>([]);
  const [view, setView] = useState<"grid" | "analytics">("grid");

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

  // Prepare data for analytics
  const analyticsData = allEvents.reduce((acc, event) => {
    const type = event.event_type;
    const existing = acc.find(item => item.type === type);
    if (existing) {
      existing.count += 1;
      existing[event.severity.toLowerCase()] = (existing[event.severity.toLowerCase()] || 0) + 1;
    } else {
      acc.push({
        type,
        count: 1,
        [event.severity.toLowerCase()]: 1
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <div className="container px-4 pt-24 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">Event Dashboard</h1>
        <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "analytics")}>
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </Tabs>
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
        <Tabs.Root value={view}>
          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="analytics">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Events by Type and Severity</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="critical" stackId="a" fill="#ef4444" />
                    <Bar dataKey="high" stackId="a" fill="#f97316" />
                    <Bar dataKey="medium" stackId="a" fill="#eab308" />
                    <Bar dataKey="low" stackId="a" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
        </Tabs.Root>
      )}
    </div>
  );
};

export default Dashboard;
