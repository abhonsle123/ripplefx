
import { useEffect } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Event } from "@/types/event";

export const useRealtimeEvents = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      try {
        channel = supabase
          .channel("events-channel")
          .on(
            "postgres_changes",
            {
              event: "*", // Listen for all changes - INSERT, UPDATE, DELETE
              schema: "public",
              table: "events",
            },
            (payload) => {
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
            console.log("Realtime subscription status:", status);
          });
          
        console.log("Realtime events subscription set up successfully");
      } catch (error) {
        console.error("Error setting up realtime subscription:", error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        console.log("Removing realtime subscription");
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  return null; // This hook just sets up side effects
};
