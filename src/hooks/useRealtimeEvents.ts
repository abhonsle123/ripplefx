
import { useEffect, useRef } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Event } from "@/types/event";

export const useRealtimeEvents = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    
    const setupRealtimeSubscription = async () => {
      try {
        // Clean up any existing subscription to prevent duplicates
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
        }
        
        // Set up new subscription
        const channel = supabase
          .channel("events-channel")
          .on(
            "postgres_changes",
            {
              event: "*", // Listen for all changes - INSERT, UPDATE, DELETE
              schema: "public",
              table: "events",
            },
            (payload) => {
              if (!isSubscribed) return;
              
              // Invalidate query to refresh the data
              queryClient.invalidateQueries({ queryKey: ["events"] });
              
              // Log new events but don't show notifications
              if (payload.eventType === "INSERT") {
                const newEvent = payload.new as Event;
                console.log("New event received via realtime:", newEvent.title);
              }
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("Realtime subscription active");
            } else {
              console.log("Realtime subscription status:", status);
            }
          });
          
        channelRef.current = channel;
        console.log("Realtime events subscription set up successfully");
      } catch (error) {
        console.error("Error setting up realtime subscription:", error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      isSubscribed = false;
      if (channelRef.current) {
        console.log("Removing realtime subscription");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient]);

  return null; // This hook just sets up side effects
};
