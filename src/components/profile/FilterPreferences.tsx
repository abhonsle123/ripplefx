
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
            <p className="text-sm text-muted-foreground">
              The dashboard has been configured to automatically hide low impact events to focus on market-moving news only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
