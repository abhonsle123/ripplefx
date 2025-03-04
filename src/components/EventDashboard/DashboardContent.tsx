
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
  if (!userId) {
    return (
      <div className="text-center py-12 bg-card/30 backdrop-blur-sm rounded-xl p-8 border border-accent/10 shadow-lg">
        <p className="text-muted-foreground">
          Please sign in to view your dashboard content.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-accent/10 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-muted/60 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/30 backdrop-blur-sm rounded-xl p-6 border border-accent/10 shadow-md">
      <Tabs defaultValue={view} value={view}>
        <TabsContent value="grid" className="mt-0">
          <EventsGrid 
            events={events}
            userPreferences={userPreferences}
          />
        </TabsContent>
        <TabsContent value="watchlist" className="mt-0">
          {userId && <Watchlist userId={userId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardContent;
