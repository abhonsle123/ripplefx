
import type { Event, TrackingPreferences } from "@/types/event";
import EventCard from "./EventCard";

interface EventsGridProps {
  events: Event[];
  userPreferences: TrackingPreferences | null;
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
