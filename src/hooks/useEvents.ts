
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
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      try {
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
          console.error("Error fetching events from database:", error);
          throw error;
        }
        
        console.log(`Fetched ${data?.length || 0} events from database`);
        return data as Event[];
      } catch (error) {
        console.error("Error in queryFn:", error);
        throw error;
      }
    },
    refetchInterval: 60000, // Refetch every minute
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return (events || []).filter(event => {
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
      
      // First try to refetch events from the database
      await refetch();
      
      // Then call our Supabase Edge Function to fetch new events from external APIs
      const { error } = await supabase.functions.invoke('fetch-events', {
        body: { source: 'manual-refresh' },
        timeout: 30000 // Increase timeout to 30 seconds for API fetch operations
      });
      
      if (error) {
        console.error('Error invoking fetch-events:', error);
        toast({
          title: "Error Updating Events",
          description: "There was an error fetching the latest events. Please try again later.",
          variant: "destructive"
        });
        return;
      }
      
      // Refetch the events after successful API fetch
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      
      toast({
        title: "Events Updated",
        description: "The dashboard has been updated with the latest events",
      });
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
