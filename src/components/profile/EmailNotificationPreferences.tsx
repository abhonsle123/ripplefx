
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type EmailPreferences = {
  enabled: boolean;
  highSeverity: boolean;
  mediumSeverity: boolean;
  lowSeverity: boolean;
};

type DashboardPreferences = {
  notifyOnNewEvents: boolean;
};

type EmailNotificationPreferencesProps = {
  notificationEmail: string;
  preferences: EmailPreferences;
  dashboardPreferences?: DashboardPreferences;
  onEmailChange: (email: string) => void;
  onPreferenceChange: (field: string, value: boolean) => void;
  onDashboardPreferenceChange?: (field: string, value: boolean) => void;
};

export const EmailNotificationPreferences = ({
  notificationEmail,
  preferences,
  dashboardPreferences,
  onEmailChange,
  onPreferenceChange,
  onDashboardPreferenceChange,
}: EmailNotificationPreferencesProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Label htmlFor="notificationEmail">Notification Email</Label>
        <Input
          id="notificationEmail"
          type="email"
          value={notificationEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Email for notifications"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base">Email Notifications</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emailEnabled"
              checked={preferences.enabled}
              onCheckedChange={(checked) =>
                onPreferenceChange("enabled", checked as boolean)
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
                checked={preferences.highSeverity}
                onCheckedChange={(checked) =>
                  onPreferenceChange("highSeverity", checked as boolean)
                }
                disabled={!preferences.enabled}
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
                checked={preferences.mediumSeverity}
                onCheckedChange={(checked) =>
                  onPreferenceChange("mediumSeverity", checked as boolean)
                }
                disabled={!preferences.enabled}
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
                checked={preferences.lowSeverity}
                onCheckedChange={(checked) =>
                  onPreferenceChange("lowSeverity", checked as boolean)
                }
                disabled={!preferences.enabled}
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

      {dashboardPreferences !== undefined && onDashboardPreferenceChange && (
        <div className="space-y-4 border-t pt-4 mt-4">
          <Label className="text-base">Dashboard Notifications</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="dashboardNotifyOnNewEvents"
              checked={dashboardPreferences.notifyOnNewEvents}
              onCheckedChange={(checked) =>
                onDashboardPreferenceChange("notifyOnNewEvents", checked)
              }
            />
            <label
              htmlFor="dashboardNotifyOnNewEvents"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Always notify on new events
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
