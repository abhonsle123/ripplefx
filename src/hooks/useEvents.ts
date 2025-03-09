
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
      
      if (!session?.user.id) {
        // If no user is logged in, return an empty array
        return [];
      }

      // Check if the user has created any events
      const { count, error: countError } = await supabase
        .from("events")
        .select("*", { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      if (countError) {
        console.error("Error checking user events:", countError);
        return [];
      }

      // Determine if user has created any events
      const hasCreatedEvents = count && count > 0;
      
      // Break down the complex query into simpler parts
      let query = supabase.from("events").select("*");

      // For users who have created events, show public events and their own events
      // For new users who haven't created events yet, only show their own events (which will be none)
      if (hasCreatedEvents) {
        query = query.or(`is_public.eq.true,user_id.eq.${session.user.id}`);
      } else {
        query = query.eq('user_id', session.user.id);
      }

      // Add order by at the end
      query = query.order("created_at", { ascending: false });

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

  // Function to trigger event refresh
  const refreshEvents = async () => {
    try {
      // Call our Supabase Edge Function to fetch the latest events
      const { error } = await supabase.functions.invoke('fetch-events');
      
      if (error) {
        console.error('Error invoking fetch-events:', error);
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
    }
  };

  return {
    events,
    filteredEvents,
    isLoading,
    refreshEvents
  };
};
