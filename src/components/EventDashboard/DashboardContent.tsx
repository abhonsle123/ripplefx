
import { Tabs, TabsContent } from "@/components/ui/tabs";
import type { Event, TrackingPreferences } from "@/types/event";
import EventsGrid from "./EventsGrid";
import Watchlist from "./Watchlist";

interface DashboardContentProps {
  view: "grid" | "watchlist";
  isLoading: boolean;
  events: Event[];
  userId: string | null;
  userPreferences: TrackingPreferences | null;
}

const DashboardContent = ({ 
  view, 
  isLoading, 
  events, 
  userId, 
  userPreferences 
}: DashboardContentProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue={view}>
      <TabsContent value="grid">
        <EventsGrid 
          events={events}
          userPreferences={userPreferences}
        />
      </TabsContent>
      <TabsContent value="watchlist">
        {userId && <Watchlist userId={userId} />}
      </TabsContent>
    </Tabs>
  );
};

export default DashboardContent;
