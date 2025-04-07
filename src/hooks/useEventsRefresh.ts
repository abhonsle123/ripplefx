
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RefreshEventsFunction = (forceRefresh?: boolean, notifyOnNew?: boolean) => Promise<void>;

/**
 * Custom hook for handling event refresh logic
 */
export const useEventsRefresh = (refetch: () => Promise<any>): {
  refreshEvents: RefreshEventsFunction;
  isRefreshingManually: boolean;
  lastRefreshed: Date;
  refreshInProgress: React.MutableRefObject<boolean>;
} => {
  const queryClient = useQueryClient();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshingManually, setIsRefreshingManually] = useState(false);
  const refreshInProgress = useRef(false);
  const previousEventCount = useRef<number | null>(null);

  const refreshEvents: RefreshEventsFunction = async (forceRefresh = false, notifyOnNew = false) => {
    try {
      if (refreshInProgress.current || isRefreshingManually) {
        console.log("Refresh already in progress, skipping this request");
        return;
      }
      
      refreshInProgress.current = true;
      setIsRefreshingManually(true);
      console.log("Starting manual refresh of events...");
      
      // Get current event count before refresh
      let currentEventCount = 0;
      if (notifyOnNew) {
        const { data: currentEvents, error: currentError } = await supabase
          .from("events")
          .select("id", { count: "exact" });
          
        if (!currentError) {
          currentEventCount = currentEvents.length;
          console.log(`Current event count before refresh: ${currentEventCount}`);
        }
      }
      
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
          console.log("Edge function failed, but continuing with local refresh");
        } else {
          console.log("Edge function completed successfully:", data);
        }
      } catch (functionError) {
        console.error('Exception invoking fetch-events:', functionError);
        console.log("Edge function failed with exception, but continuing with local refresh");
      }

      // Always invalidate queries to refresh data, even if the edge function failed
      await new Promise(resolve => setTimeout(resolve, 1000));
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      
      // After refresh, check if we got new events and notify about them
      if (notifyOnNew && previousEventCount.current !== null) {
        const { data: newEvents, error: newError } = await supabase
          .from("events")
          .select("id")
          .order("created_at", { ascending: false });
          
        if (!newError && newEvents) {
          const newEventCount = newEvents.length;
          const addedCount = newEventCount - currentEventCount;
          
          if (addedCount > 0) {
            console.log(`${addedCount} new events found, sending notifications...`);
            
            // Send notifications for the newest events
            const newEventIds = newEvents.slice(0, addedCount).map(e => e.id);
            
            for (const eventId of newEventIds) {
              try {
                await supabase.functions.invoke("send-event-notification", {
                  body: { eventId, sendToAll: true }
                });
                console.log(`Notification sent for event ID: ${eventId}`);
              } catch (notifyError) {
                console.error(`Failed to send notification for event ${eventId}:`, notifyError);
              }
            }
          }
        }
      }
      
      // Update the previous event count for next refresh
      const { count } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true });
        
      previousEventCount.current = count || 0;
      
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
    refreshEvents,
    isRefreshingManually,
    lastRefreshed,
    refreshInProgress
  };
};
