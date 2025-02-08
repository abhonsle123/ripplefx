
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type SMSPreferences = {
  enabled: boolean;
  phoneNumber: string | null;
  highSeverity: boolean;
  mediumSeverity: boolean;
  lowSeverity: boolean;
};

type SMSNotificationPreferencesProps = {
  preferences: SMSPreferences;
  onPreferenceChange: (field: string, value: boolean | string) => void;
};

export const SMSNotificationPreferences = ({
  preferences,
  onPreferenceChange,
}: SMSNotificationPreferencesProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-base">SMS Notifications</Label>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="smsEnabled"
            checked={preferences.enabled}
            onCheckedChange={(checked) =>
              onPreferenceChange("enabled", checked as boolean)
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
              value={preferences.phoneNumber || ""}
              onChange={(e) =>
                onPreferenceChange("phoneNumber", e.target.value)
              }
              placeholder="+1234567890"
              disabled={!preferences.enabled}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="smsHighSeverity"
              checked={preferences.highSeverity}
              onCheckedChange={(checked) =>
                onPreferenceChange("highSeverity", checked as boolean)
              }
              disabled={!preferences.enabled}
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
              checked={preferences.mediumSeverity}
              onCheckedChange={(checked) =>
                onPreferenceChange("mediumSeverity", checked as boolean)
              }
              disabled={!preferences.enabled}
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
              checked={preferences.lowSeverity}
              onCheckedChange={(checked) =>
                onPreferenceChange("lowSeverity", checked as boolean)
              }
              disabled={!preferences.enabled}
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
  );
};
