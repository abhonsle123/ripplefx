
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RefreshEventsFunction = (forceRefresh?: boolean) => Promise<void>;

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

  const refreshEvents: RefreshEventsFunction = async (forceRefresh = false) => {
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
