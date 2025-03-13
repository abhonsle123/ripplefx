
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Event } from "@/types/event";

/**
 * Custom hook for querying events from the database with filtering
 */
export const useEventsQuery = (
  severity: string,
  errorNotificationShown: React.MutableRefObject<boolean>
) => {
  return useQuery({
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

        // Always filter out LOW severity events regardless of user preferences
        query = query.not('severity', 'eq', 'LOW');

        // Apply additional severity filter at the database level if needed
        if (severity !== "ALL") {
          // No need to handle LOW severity case since it's already filtered out
          if (severity === "MEDIUM") {
            query = query.in("severity", ["MEDIUM", "HIGH", "CRITICAL"]);
          } else if (severity === "HIGH") {
            query = query.in("severity", ["HIGH", "CRITICAL"]);
          } else if (severity === "CRITICAL") {
            query = query.eq("severity", "CRITICAL");
          }
        }

        query = query.order("created_at", { ascending: false });

        const { data, error } = await query;
        if (error) {
          console.error("Error fetching events from database:", error);
          throw error;
        }
        
        errorNotificationShown.current = false;
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
};
