
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TrackingPreferences } from "@/types/event";

export const useUserPreferences = (userId: string | null) => {
  const [userPreferences, setUserPreferences] = useState<TrackingPreferences | null>(null);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", userId)
        .single();
      
      if (!error && data?.preferences) {
        const prefs = data.preferences as { 
          tracking?: { industries: string[]; companies: string[]; event_types: string[]; },
          filters?: { hideLowImpact: boolean; }
        };
        
        setUserPreferences({
          industries: prefs.tracking?.industries || [],
          companies: prefs.tracking?.companies || [],
          event_types: prefs.tracking?.event_types || [],
          filters: {
            hideLowImpact: Boolean(prefs.filters?.hideLowImpact)
          }
        });
      }
    };

    fetchUserPreferences();
  }, [userId]);

  return userPreferences;
};
