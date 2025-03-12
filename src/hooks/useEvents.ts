
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Fetch events with improved error handling
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
        
        // Update last refreshed timestamp on successful fetch
        setLastRefreshed(new Date());
        console.log(`Successfully fetched ${data?.length || 0} events from database`);
        return data as Event[];
      } catch (error) {
        console.error("Error in queryFn:", error);
        throw error;
      }
    },
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      errorHandler: (error: any) => {
        console.error("Query error:", error);
        // We don't show toasts for automatic query errors to avoid spamming
      }
    }
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

  // Function to format the time since last refresh
  const getTimeSinceLastRefresh = (): string => {
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshed.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins === 1) {
      return '1 minute ago';
    } else {
      return `${diffMins} minutes ago`;
    }
  };

  // Function to trigger event refresh with improved error handling
  const refreshEvents = async () => {
    try {
      console.log("Starting manual refresh of events...");
      
      // First try to refetch events from the database
      await refetch();
      
      // Then call our Supabase Edge Function to fetch new events from external APIs
      const { error } = await supabase.functions.invoke('fetch-events', {
        body: { source: 'manual-refresh' }
      });
      
      if (error) {
        console.error('Error invoking fetch-events:', error);
        toast({
          variant: "destructive",
          description: "Failed to update events. Please try again later.",
        });
        return;
      }

      // Wait a moment for the database to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refetch the events after successful API fetch
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      
      // Update last refreshed timestamp
      setLastRefreshed(new Date());
      
      console.log("Manual refresh completed successfully");
    } catch (error) {
      console.error('Error in refreshEvents:', error);
      toast({
        variant: "destructive",
        description: "Failed to refresh events. Please try again later.",
      });
    }
  };

  return {
    events,
    filteredEvents,
    isLoading,
    refreshEvents,
    lastRefreshed,
    timeSinceLastRefresh: getTimeSinceLastRefresh()
  };
};
