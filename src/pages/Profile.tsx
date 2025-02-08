import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
      
      // Safely parse preferences data
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

  return (
    <div className="container px-4 pt-24 pb-20">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-6">
          <form onSubmit={updateProfile} className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="email">Account Email (Login)</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile?.username || ""}
                onChange={(e) =>
                  setProfile(profile ? { ...profile, username: e.target.value } : null)
                }
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile?.full_name || ""}
                onChange={(e) =>
                  setProfile(profile ? { ...profile, full_name: e.target.value } : null)
                }
              />
            </div>

            <Separator className="my-6" />

            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="space-y-4">
                  <Label htmlFor="notificationEmail">Notification Email</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="Email for notifications"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Email Notifications</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emailEnabled"
                        checked={profile?.preferences.notifications.email.enabled}
                        onCheckedChange={(checked) =>
                          updateNotificationPreference("email", "enabled", checked as boolean)
                        }
                      />
                      <label
                        htmlFor="emailEnabled"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enable email notifications
                      </label>
                    </div>

                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="emailHighSeverity"
                          checked={profile?.preferences.notifications.email.highSeverity}
                          onCheckedChange={(checked) =>
                            updateNotificationPreference("email", "highSeverity", checked as boolean)
                          }
                          disabled={!profile?.preferences.notifications.email.enabled}
                        />
                        <label
                          htmlFor="emailHighSeverity"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          High severity events
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="emailMediumSeverity"
                          checked={profile?.preferences.notifications.email.mediumSeverity}
                          onCheckedChange={(checked) =>
                            updateNotificationPreference("email", "mediumSeverity", checked as boolean)
                          }
                          disabled={!profile?.preferences.notifications.email.enabled}
                        />
                        <label
                          htmlFor="emailMediumSeverity"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Medium severity events
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="emailLowSeverity"
                          checked={profile?.preferences.notifications.email.lowSeverity}
                          onCheckedChange={(checked) =>
                            updateNotificationPreference("email", "lowSeverity", checked as boolean)
                          }
                          disabled={!profile?.preferences.notifications.email.enabled}
                        />
                        <label
                          htmlFor="emailLowSeverity"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Low severity events
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base">SMS Notifications</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="smsEnabled"
                        checked={profile?.preferences.notifications.sms.enabled}
                        onCheckedChange={(checked) =>
                          updateNotificationPreference("sms", "enabled", checked as boolean)
                        }
                      />
                      <label
                        htmlFor="smsEnabled"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enable SMS notifications
                      </label>
                    </div>

                    <div className="ml-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={profile?.preferences.notifications.sms.phoneNumber || ""}
                          onChange={(e) =>
                            updateNotificationPreference("sms", "phoneNumber", e.target.value)
                          }
                          placeholder="+1234567890"
                          disabled={!profile?.preferences.notifications.sms.enabled}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="smsHighSeverity"
                          checked={profile?.preferences.notifications.sms.highSeverity}
                          onCheckedChange={(checked) =>
                            updateNotificationPreference("sms", "highSeverity", checked as boolean)
                          }
                          disabled={!profile?.preferences.notifications.sms.enabled}
                        />
                        <label
                          htmlFor="smsHighSeverity"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          High severity events
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="smsMediumSeverity"
                          checked={profile?.preferences.notifications.sms.mediumSeverity}
                          onCheckedChange={(checked) =>
                            updateNotificationPreference("sms", "mediumSeverity", checked as boolean)
                          }
                          disabled={!profile?.preferences.notifications.sms.enabled}
                        />
                        <label
                          htmlFor="smsMediumSeverity"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Medium severity events
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="smsLowSeverity"
                          checked={profile?.preferences.notifications.sms.lowSeverity}
                          onCheckedChange={(checked) =>
                            updateNotificationPreference("sms", "lowSeverity", checked as boolean)
                          }
                          disabled={!profile?.preferences.notifications.sms.enabled}
                        />
                        <label
                          htmlFor="smsLowSeverity"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Low severity events
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
