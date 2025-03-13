
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { BasicProfileInfo } from "./BasicProfileInfo";
import { EmailNotificationPreferences } from "./EmailNotificationPreferences";
import { SMSNotificationPreferences } from "./SMSNotificationPreferences";
import { TrackingPreferences } from "./TrackingPreferences";
import { FreeTrialStatus } from "./FreeTrialStatus";
import { FilterPreferences } from "./FilterPreferences";

export type Profile = {
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
    filters: {
      hideLowImpact: boolean;
    };
    tracking: {
      industries: string[];
      companies: string[];
      event_types: string[];
    };
  };
};

interface ProfileFormProps {
  profile: Profile;
}

export const ProfileForm = ({ profile: initialProfile }: ProfileFormProps) => {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [notificationEmail, setNotificationEmail] = useState(initialProfile.email || "");
  const [updating, setUpdating] = useState(false);

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

  const updateFilterPreference = (field: string, value: boolean) => {
    if (!profile) return;

    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        filters: {
          ...profile.preferences.filters,
          [field]: value,
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

  return (
    <form onSubmit={updateProfile} className="space-y-6 mt-6">
      <FreeTrialStatus status={profile} />

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

      <FilterPreferences 
        preferences={profile.preferences.filters}
        onPreferenceChange={updateFilterPreference}
      />

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
  );
};
