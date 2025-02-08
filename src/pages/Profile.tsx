
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

type Profile = {
  id: string;
  username: string | null;
  email: string | null;
  full_name: string | null;
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
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      
      let parsedPreferences = defaultPreferences;
      
      if (data.preferences && typeof data.preferences === 'object' && !Array.isArray(data.preferences)) {
        const prefs = data.preferences as Record<string, any>;
        if (prefs.notifications) {
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
          };
        }
      }
      
      const transformedProfile: Profile = {
        id: data.id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
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
          <form onSubmit={updateProfile} className="space-y-6">
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
