
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, FilterX, Filter } from "lucide-react";
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
  const handleReset = () => {
    setEventType("ALL");
    setSeverity("ALL");
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-medium">Event Filters</h2>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-full sm:w-[180px] border-accent/20 bg-card/50 hover:bg-card/60 transition-colors">
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
            <SelectTrigger className="w-full sm:w-[180px] border-accent/20 bg-card/50 hover:bg-card/60 transition-colors">
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

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="whitespace-nowrap border-accent/20 hover:bg-accent/10 transition-colors w-full sm:w-auto flex items-center gap-1"
          >
            <FilterX className="h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventFilters;
