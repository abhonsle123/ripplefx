
import { Tabs, TabsContent } from "@/components/ui/tabs";
import type { Event, TrackingPreferences } from "@/types/event";
import EventsGrid from "./EventsGrid";
import Watchlist from "./Watchlist";
import NotLoggedInState from "./EmptyState/NotLoggedInState";
import LoadingState from "./EmptyState/LoadingState";
import NoResultsState from "./EmptyState/NoResultsState";
import ContentContainer from "./ContentContainer";

interface DashboardContentProps {
  view: "grid" | "watchlist";
  isLoading: boolean;
  events: Event[];
  userId: string | null;
  userPreferences: TrackingPreferences | null;
  filteredEvents: Event[];
  searchTerm: string;
  eventType: string;
  severity: string;
}

const DashboardContent = ({ 
  view, 
  isLoading, 
  events, 
  userId, 
  userPreferences,
  filteredEvents,
  searchTerm,
  eventType,
  severity
}: DashboardContentProps) => {
  if (!userId) {
    return <NotLoggedInState />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <ContentContainer>
      <Tabs defaultValue={view} value={view}>
        <TabsContent value="grid" className="mt-0">
          <EventsGrid 
            events={filteredEvents}
            userPreferences={userPreferences}
          />
          {filteredEvents.length === 0 && !isLoading && <NoResultsState />}
        </TabsContent>
        <TabsContent value="watchlist" className="mt-0">
          {userId && (
            <Watchlist 
              userId={userId} 
              searchTerm={searchTerm}
              eventType={eventType}
              severity={severity}
            />
          )}
        </TabsContent>
      </Tabs>
    </ContentContainer>
  );
};

export default DashboardContent;
