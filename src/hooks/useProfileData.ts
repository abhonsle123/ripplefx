
import { useState, useEffect } from "react";
import { Profile } from "@/components/profile/ProfileForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const defaultPreferences = {
  notifications: {
    email: {
      enabled: false,
      highSeverity: true,
      mediumSeverity: false,
      lowSeverity: false,
    },
    sms: {
      enabled: false,
      phoneNumber: null,
      highSeverity: false,
      mediumSeverity: false,
      lowSeverity: false,
    },
    dashboard: {
      notifyOnNewEvents: false,
    },
  },
  filters: {
    hideLowImpact: false,
  },
  tracking: {
    industries: [],
    companies: [],
    event_types: [],
  },
};

export const useProfileData = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, subscription_status")
        .eq("id", userId)
        .single();

      if (error) throw error;
      
      let parsedPreferences = defaultPreferences;
      
      if (data.preferences && typeof data.preferences === 'object' && !Array.isArray(data.preferences)) {
        const prefs = data.preferences as Record<string, any>;
        parsedPreferences = {
          notifications: {
            email: {
              enabled: Boolean(prefs.notifications?.email?.enabled ?? false),
              highSeverity: Boolean(prefs.notifications?.email?.highSeverity ?? true),
              mediumSeverity: Boolean(prefs.notifications?.email?.mediumSeverity ?? false),
              lowSeverity: Boolean(prefs.notifications?.email?.lowSeverity ?? false),
            },
            sms: {
              enabled: Boolean(prefs.notifications?.sms?.enabled ?? false),
              phoneNumber: prefs.notifications?.sms?.phoneNumber ?? null,
              highSeverity: Boolean(prefs.notifications?.sms?.highSeverity ?? false),
              mediumSeverity: Boolean(prefs.notifications?.sms?.mediumSeverity ?? false),
              lowSeverity: Boolean(prefs.notifications?.sms?.lowSeverity ?? false),
            },
            dashboard: {
              notifyOnNewEvents: Boolean(prefs.notifications?.dashboard?.notifyOnNewEvents ?? false),
            },
          },
          filters: {
            hideLowImpact: Boolean(prefs.filters?.hideLowImpact ?? false),
          },
          tracking: {
            industries: Array.isArray(prefs.tracking?.industries) ? prefs.tracking.industries : [],
            companies: Array.isArray(prefs.tracking?.companies) ? prefs.tracking.companies : [],
            event_types: Array.isArray(prefs.tracking?.event_types) ? prefs.tracking.event_types : [],
          },
        };
      }
      
      const transformedProfile: Profile = {
        id: data.id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        free_trial_used: data.free_trial_used || false,
        free_trial_started_at: data.free_trial_started_at,
        free_trial_ends_at: data.free_trial_ends_at,
        preferences: parsedPreferences,
      };
      
      setProfile(transformedProfile);
    } catch (error) {
      toast.error("Error loading profile");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading };
};
