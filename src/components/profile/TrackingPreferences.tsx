
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TrackingPreferencesProps {
  preferences: {
    industries: string[];
    companies: string[];
    event_types: string[];
  };
  onPreferenceChange: (
    type: "industries" | "companies" | "event_types",
    values: string[]
  ) => void;
}

export const TrackingPreferences = ({
  preferences,
  onPreferenceChange,
}: TrackingPreferencesProps) => {
  const [newIndustry, setNewIndustry] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEventType, setNewEventType] = useState<string>("");

  const addItem = (
    type: "industries" | "companies" | "event_types",
    value: string
  ) => {
    if (!value.trim()) return;
    const currentValues = preferences[type];
    if (!currentValues.includes(value)) {
      onPreferenceChange(type, [...currentValues, value.trim()]);
    }
    
    // Reset input
    switch (type) {
      case "industries":
        setNewIndustry("");
        break;
      case "companies":
        setNewCompany("");
        break;
      case "event_types":
        setNewEventType("");
        break;
    }
  };

  const removeItem = (
    type: "industries" | "companies" | "event_types",
    value: string
  ) => {
    const currentValues = preferences[type];
    onPreferenceChange(
      type,
      currentValues.filter((item) => item !== value)
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Tracking Preferences</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="industry">Track Industries</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="industry"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              placeholder="e.g., Technology, Healthcare"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem("industries", newIndustry);
                }
              }}
            />
            <Button
              type="button"
              onClick={() => addItem("industries", newIndustry)}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.industries.map((industry) => (
              <Badge
                key={industry}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {industry}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem("industries", industry)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="company">Track Companies</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="company"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="e.g., TSMC, Apple"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem("companies", newCompany);
                }
              }}
            />
            <Button
              type="button"
              onClick={() => addItem("companies", newCompany)}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.companies.map((company) => (
              <Badge
                key={company}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {company}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem("companies", company)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="event-type">Track Event Types</Label>
          <Select
            value={newEventType}
            onValueChange={(value) => {
              addItem("event_types", value);
              setNewEventType("");
            }}
          >
            <SelectTrigger id="event-type">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NATURAL_DISASTER">Natural Disaster</SelectItem>
              <SelectItem value="GEOPOLITICAL">Geopolitical</SelectItem>
              <SelectItem value="ECONOMIC">Economic</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2 mt-2">
            {preferences.event_types.map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {type.replace("_", " ").toLowerCase()}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeItem("event_types", type)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
