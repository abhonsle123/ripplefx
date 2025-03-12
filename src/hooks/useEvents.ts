
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Event, EventType, SeverityLevel } from "@/types/event";
import { useToast } from "@/components/ui/use-toast";

export const useEvents = (
  eventType: EventType | "ALL", 
  severity: SeverityLevel | "ALL", 
  searchTerm: string
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      // First get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Break down the complex query into simpler parts
      let query = supabase.from("events").select("*");

      if (session?.user.id) {
        // If user is logged in, show public events and their own events
        query = query.or(`is_public.eq.true,user_id.eq.${session.user.id}`);
      } else {
        // If no user is logged in, show only public events
        query = query.eq('is_public', true);
      }

      // Add order by at the end
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching events:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} events`);
      return data as Event[];
    },
    refetchInterval: 60000, // Refetch every minute
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

  // Function to trigger event refresh
  const refreshEvents = async () => {
    try {
      console.log("Manually refreshing events...");
      // Call our Supabase Edge Function to fetch the latest events
      const { error } = await supabase.functions.invoke('fetch-events');
      
      if (error) {
        console.error('Error invoking fetch-events:', error);
        toast({
          title: "Error Updating Events",
          description: "There was an error fetching the latest events. Please try again later.",
          variant: "destructive"
        });
      } else {
        // Refresh the events data in React Query
        queryClient.invalidateQueries({ queryKey: ["events"] });
        toast({
          title: "Events Updated",
          description: "The dashboard has been updated with the latest events",
        });
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error Updating Events",
        description: "Failed to refresh events. Please try again later.",
        variant: "destructive"
      });
    }
  };

  return {
    events,
    filteredEvents,
    isLoading,
    refreshEvents
  };
};
