
import { useEffect, useRef, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Event, UserPreferences } from "@/types/event";
import { Bell } from "lucide-react";

export const useRealtimeEvents = () => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  useEffect(() => {
    // Check user preferences for automatic notifications
    const checkUserPreferences = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", session.user.id)
        .single();

      // Safely handle the preferences object
      const preferences = data?.preferences as UserPreferences | null;
      
      if (preferences && 
          typeof preferences === 'object' &&
          preferences.notifications?.email?.enabled) {
        setNotificationsEnabled(true);
      }
    };

    checkUserPreferences();
  }, []);

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
            async (payload) => {
              if (!isSubscribed) return;
              
              // Invalidate query to refresh the data
              queryClient.invalidateQueries({ queryKey: ["events"] });
              
              // For new events, show a notification and potentially send emails
              if (payload.eventType === "INSERT") {
                const newEvent = payload.new as Event;
                console.log("New event received via realtime:", newEvent.title);
                
                // Show toast notification for the new event
                toast.info(
                  <div>
                    <div className="font-semibold">{newEvent.title}</div>
                    <div className="text-xs mt-1">{newEvent.severity} severity in {newEvent.country || 'Unknown location'}</div>
                  </div>, 
                  {
                    duration: 8000,
                    icon: <Bell className="h-5 w-5" />,
                    action: {
                      label: "Notify Users",
                      onClick: async () => {
                        try {
                          toast.info("Sending email notifications...");
                          await supabase.functions.invoke("send-event-notification", {
                            body: { eventId: newEvent.id, sendToAll: true }
                          });
                          toast.success("Email notifications sent successfully");
                        } catch (error) {
                          console.error("Error sending notifications:", error);
                          toast.error("Failed to send notifications");
                        }
                      }
                    }
                  }
                );
                
                // If user has enabled automatic notifications, send them automatically
                if (notificationsEnabled && (newEvent.severity === 'HIGH' || newEvent.severity === 'CRITICAL')) {
                  try {
                    console.log("Automatically sending notifications for high severity event");
                    await supabase.functions.invoke("send-event-notification", {
                      body: { eventId: newEvent.id, sendToAll: true }
                    });
                  } catch (error) {
                    console.error("Error auto-sending notifications:", error);
                  }
                }
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
  }, [queryClient, notificationsEnabled]);

  return null; // This hook just sets up side effects
};
