
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface FilterPreferencesProps {
  preferences: {
    hideLowImpact: boolean;
  };
  onPreferenceChange: (field: string, value: boolean) => void;
}

export const FilterPreferences = ({ 
  preferences, 
  onPreferenceChange 
}: FilterPreferencesProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard Filter Preferences</h2>
      
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="hide-low-impact" className="text-base">Hide low impact events</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, low impact events will not appear on your dashboard
            </p>
          </div>
          <Switch
            id="hide-low-impact"
            checked={preferences?.hideLowImpact || false}
            onCheckedChange={(checked) => onPreferenceChange("hideLowImpact", checked)}
          />
        </div>
      </div>
    </div>
  );
};
