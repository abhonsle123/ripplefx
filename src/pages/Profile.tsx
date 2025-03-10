
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BasicProfileInfo } from "@/components/profile/BasicProfileInfo";
import { EmailNotificationPreferences } from "@/components/profile/EmailNotificationPreferences";
import { SMSNotificationPreferences } from "@/components/profile/SMSNotificationPreferences";
import { TrackingPreferences } from "@/components/profile/TrackingPreferences";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

type Profile = {
  id: string;
  username: string | null;
  email: string | null;
  full_name: string | null;
  free_trial_used: boolean;
  free_trial_started_at: string | null;
  free_trial_ends_at: string | null;
  preferences: {
    notifications: {
      email: {
        enabled: boolean;
        highSeverity: boolean;
        mediumSeverity: boolean;
        lowSeverity: boolean;
      };
      sms: {
        enabled: boolean;
        phoneNumber: string | null;
        highSeverity: boolean;
        mediumSeverity: boolean;
        lowSeverity: boolean;
      };
    };
    tracking: {
      industries: string[];
      companies: string[];
      event_types: string[];
    };
  };
};

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
  },
  tracking: {
    industries: [],
    companies: [],
    event_types: [],
  },
};

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notificationEmail, setNotificationEmail] = useState("");

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
      setNotificationEmail(data.email || "");
    } catch (error) {
      toast.error("Error loading profile");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username,
          full_name: profile.full_name,
          email: notificationEmail,
          preferences: profile.preferences,
        })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Error updating profile");
      console.error("Error:", error);
    } finally {
      setUpdating(false);
    }
  };

  const updateNotificationPreference = (
    channel: "email" | "sms",
    field: string,
    value: boolean | string
  ) => {
    if (!profile) return;

    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        notifications: {
          ...profile.preferences.notifications,
          [channel]: {
            ...profile.preferences.notifications[channel],
            [field]: value,
          },
        },
      },
    });
  };

  const updateTrackingPreference = (
    type: "industries" | "companies" | "event_types",
    values: string[]
  ) => {
    if (!profile) return;

    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        tracking: {
          ...profile.preferences.tracking,
          [type]: values,
        },
      },
    });
  };

  const getFreeTrialStatus = () => {
    if (!profile) return null;
    
    if (profile.free_trial_started_at && profile.free_trial_ends_at) {
      const now = new Date();
      const endDate = new Date(profile.free_trial_ends_at);
      
      if (endDate > now && !profile.free_trial_used) {
        return (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-semibold text-green-700 flex items-center">
              <Badge variant="default" className="mr-2 bg-green-500">Active</Badge>
              Premium Free Trial
            </h3>
            <p className="text-sm text-green-600 mt-1">
              Your free trial ends {formatDistanceToNow(endDate, { addSuffix: true })}
            </p>
          </div>
        );
      } else {
        return (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
              <Badge variant="outline" className="mr-2">Expired</Badge>
              Free Trial
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Your free trial has ended. Upgrade to Premium to continue enjoying premium features.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => navigate("/pricing")}
            >
              View Plans
            </Button>
          </div>
        );
      }
    } else if (profile.free_trial_used) {
      return (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <Badge variant="outline" className="mr-2">Used</Badge>
            Free Trial
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            You've already used your free trial. Upgrade to Premium to enjoy premium features.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => navigate("/pricing")}
          >
            View Plans
          </Button>
        </div>
      );
    }
    
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-semibold text-blue-700 flex items-center">
          <Badge variant="secondary" className="mr-2 bg-blue-200 text-blue-700">Available</Badge>
          Free Premium Trial
        </h3>
        <p className="text-sm text-blue-600 mt-1">
          You're eligible for a 7-day free trial of our Premium plan!
        </p>
        <Button 
          size="sm" 
          className="mt-2" 
          onClick={() => navigate("/pricing")}
        >
          Start Free Trial
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container px-4 pt-24 pb-20">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-6">
          {getFreeTrialStatus()}
          
          <form onSubmit={updateProfile} className="space-y-6 mt-6">
            <BasicProfileInfo
              email={profile.email}
              username={profile.username}
              fullName={profile.full_name}
              onUsernameChange={(username) => setProfile({ ...profile, username })}
              onFullNameChange={(full_name) => setProfile({ ...profile, full_name })}
            />

            <Separator className="my-6" />

            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
              
              <EmailNotificationPreferences
                notificationEmail={notificationEmail}
                preferences={profile.preferences.notifications.email}
                onEmailChange={setNotificationEmail}
                onPreferenceChange={(field, value) =>
                  updateNotificationPreference("email", field, value)
                }
              />

              <SMSNotificationPreferences
                preferences={profile.preferences.notifications.sms}
                onPreferenceChange={(field, value) =>
                  updateNotificationPreference("sms", field, value)
                }
              />
            </div>

            <Separator className="my-6" />

            <TrackingPreferences
              preferences={profile.preferences.tracking}
              onPreferenceChange={updateTrackingPreference}
            />

            <Button type="submit" disabled={updating} className="w-full">
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
