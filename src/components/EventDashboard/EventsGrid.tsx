
import type { Database } from "@/integrations/supabase/types";
import EventCard from "./EventCard";

type Event = Database["public"]["Tables"]["events"]["Row"];

interface EventsGridProps {
  events: Event[];
  userPreferences: {
    industries?: string[];
    companies?: string[];
    event_types?: string[];
  } | null;
}

const EventsGrid = ({ events, userPreferences }: EventsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard 
          key={event.id} 
          event={event}
          userPreferences={userPreferences}
        />
      ))}
    </div>
  );
};

export default EventsGrid;
