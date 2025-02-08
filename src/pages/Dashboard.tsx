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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import type { Database } from "@/integrations/supabase/types";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [eventType, setEventType] = useState<EventType | "ALL">("ALL");
  const [severity, setSeverity] = useState<SeverityLevel | "ALL">("ALL");
  const [realTimeEvents, setRealTimeEvents] = useState<Event[]>([]);
  const [view, setView] = useState<"grid" | "analytics">("grid");
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    event_type: "NATURAL_DISASTER" as EventType,
    severity: "LOW" as SeverityLevel,
    city: "",
    country: "",
  });
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

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

  const handleCreateEvent = async () => {
    try {
      const { error } = await supabase.from("events").insert([newEvent]);
      
      if (error) throw error;

      toast({
        title: "Event created successfully",
        description: "The new event has been added to the dashboard.",
      });

      setIsCreating(false);
      setNewEvent({
        title: "",
        description: "",
        event_type: "NATURAL_DISASTER",
        severity: "LOW",
        city: "",
        country: "",
      });
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error creating event",
        description: "There was an error creating the event. Please try again.",
        variant: "destructive",
      });
    }
  };

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
            setUserPreferences(prefs.tracking);
          }
        }
      }
    };

    fetchUserPreferences();
  }, []);

  return (
    <div className="container px-4 pt-24 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">Event Dashboard</h1>
        <div className="flex items-center gap-4">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>Create New Event</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Describe the event"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event-type">Event Type</Label>
                  <Select
                    value={newEvent.event_type}
                    onValueChange={(value: EventType) => setNewEvent({ ...newEvent, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NATURAL_DISASTER">Natural Disaster</SelectItem>
                      <SelectItem value="GEOPOLITICAL">Geopolitical</SelectItem>
                      <SelectItem value="ECONOMIC">Economic</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={newEvent.severity}
                    onValueChange={(value: SeverityLevel) => setNewEvent({ ...newEvent, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newEvent.city}
                    onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={newEvent.country}
                    onChange={(e) => setNewEvent({ ...newEvent, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
                <Button onClick={handleCreateEvent} className="mt-2">
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event}
                  userPreferences={userPreferences}
                />
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
        </Tabs>
      )}
    </div>
  );
};

export default Dashboard;
