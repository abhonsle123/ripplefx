
import { useEffect, useRef, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Event, UserPreferences } from "@/types/event";
import { Bell } from "lucide-react";

const appBaseUrl = "https://ripplefx.app";

export const useRealtimeEvents = (notifyOnNewEvents = false) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  useEffect(() => {
    const checkUserPreferences = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", session.user.id)
        .single();

      const preferences = data?.preferences as UserPreferences | null;
      
      if (preferences && 
          typeof preferences === 'object') {
        // Check both standard notification settings and dashboard notification settings
        const emailNotificationsEnabled = preferences.notifications?.email?.enabled;
        const dashboardNotificationsEnabled = preferences.notifications?.dashboard?.notifyOnNewEvents;
        
        // Enable notifications if either email or dashboard notifications are enabled
        setNotificationsEnabled(Boolean(emailNotificationsEnabled || dashboardNotificationsEnabled || notifyOnNewEvents));
      } else {
        // If no preferences are set, use the current notifyOnNewEvents value
        setNotificationsEnabled(notifyOnNewEvents);
      }
    };

    checkUserPreferences();
  }, [notifyOnNewEvents]);

  useEffect(() => {
    let isSubscribed = true;
    
    const setupRealtimeSubscription = async () => {
      try {
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
        }
        
        const channel = supabase
          .channel("events-channel")
          .on(
            "postgres_changes",
            {
              event: "*", 
              schema: "public",
              table: "events",
            },
            async (payload) => {
              if (!isSubscribed) return;
              
              queryClient.invalidateQueries({ queryKey: ["events"] });
              
              if (payload.eventType === "INSERT") {
                const newEvent = payload.new as Event;
                console.log("New event received via realtime:", newEvent.title);
                
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
                
                // Send notifications if enabled via either preference
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
