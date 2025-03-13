import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Event, EventType, SeverityLevel } from "@/types/event";
import { toast } from "sonner";

export const useEvents = (
  eventType: EventType | "ALL", 
  severity: SeverityLevel | "ALL", 
  searchTerm: string
) => {
  const queryClient = useQueryClient();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshingManually, setIsRefreshingManually] = useState(false);
  const errorNotificationShown = useRef(false);
  const refreshInProgress = useRef(false);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        let query = supabase.from("events").select("*");

        if (session?.user.id) {
          query = query.or(`is_public.eq.true,user_id.eq.${session.user.id}`);
        } else {
          query = query.eq('is_public', true);
        }

        query = query.order("created_at", { ascending: false });

        const { data, error } = await query;
        if (error) {
          console.error("Error fetching events from database:", error);
          throw error;
        }
        
        errorNotificationShown.current = false;
        setLastRefreshed(new Date());
        console.log(`Successfully fetched ${data?.length || 0} events from database`);
        return data as Event[];
      } catch (error) {
        console.error("Error in queryFn:", error);
        throw error;
      }
    },
    refetchInterval: 120000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      errorHandler: (error: any) => {
        console.error("Query error:", error);
      }
    }
  });

  const filteredEvents = useMemo(() => {
    return (events || []).filter(event => {
      if (eventType !== "ALL" && event.event_type !== eventType) {
        return false;
      }
      
      if (severity !== "ALL" && event.severity !== severity) {
        return false;
      }
      
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        
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

  const refreshEvents = async (forceRefresh = false) => {
    try {
      if (refreshInProgress.current || isRefreshingManually) {
        console.log("Refresh already in progress, skipping this request");
        return;
      }
      
      refreshInProgress.current = true;
      setIsRefreshingManually(true);
      console.log("Starting manual refresh of events...");
      
      // First refresh the events we already have
      await refetch();
      setLastRefreshed(new Date());
      
      // Then try to fetch new events from the edge function
      try {
        console.log("Calling fetch-events edge function...");
        const { data, error } = await supabase.functions.invoke('fetch-events', {
          body: { 
            source: 'manual-refresh',
            forceRefresh: forceRefresh
          }
        });
        
        if (error) {
          console.error('Error invoking fetch-events:', error);
          // Continue with the process even if the edge function fails
          console.log("Edge function failed, but continuing with local refresh");
        } else {
          console.log("Edge function completed successfully:", data);
        }
      } catch (functionError) {
        console.error('Exception invoking fetch-events:', functionError);
        // Continue with the process even if the edge function fails
        console.log("Edge function failed with exception, but continuing with local refresh");
      }

      // Always invalidate queries to refresh data, even if the edge function failed
      await new Promise(resolve => setTimeout(resolve, 1000));
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      
      errorNotificationShown.current = false;
      console.log("Manual refresh completed successfully");
      toast.success("Events updated successfully", {
        id: "refresh-success",
      });
    } catch (error) {
      console.error('Error in refreshEvents:', error);
      toast.error("Failed to refresh events. Please try again later.", {
        id: "refresh-error",
      });
    } finally {
      setIsRefreshingManually(false);
      refreshInProgress.current = false;
    }
  };

  return {
    events,
    filteredEvents,
    isLoading,
    refreshEvents,
    isRefreshingManually,
    lastRefreshed,
    timeSinceLastRefresh: getTimeSinceLastRefresh()
  };
};
