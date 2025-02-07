
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type EventType = Database["public"]["Enums"]["event_type"];
type SeverityLevel = Database["public"]["Enums"]["severity_level"];

interface EventFiltersProps {
  eventType: EventType | "ALL";
  setEventType: (type: EventType | "ALL") => void;
  severity: SeverityLevel | "ALL";
  setSeverity: (severity: SeverityLevel | "ALL") => void;
}

const EventFilters = ({
  eventType,
  setEventType,
  severity,
  setSeverity,
}: EventFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Select value={eventType} onValueChange={setEventType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Event Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          <SelectItem value="NATURAL_DISASTER">Natural Disaster</SelectItem>
          <SelectItem value="GEOPOLITICAL">Geopolitical</SelectItem>
          <SelectItem value="ECONOMIC">Economic</SelectItem>
          <SelectItem value="OTHER">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select value={severity} onValueChange={setSeverity}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Severities</SelectItem>
          <SelectItem value="CRITICAL">Critical</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default EventFilters;
