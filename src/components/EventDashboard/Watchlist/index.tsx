
import { useWatchlist } from "./useWatchlist";
import WatchCard from "./WatchCard";
import EmptyState from "./EmptyState";
import LoadingState from "./LoadingState";
import type { WatchlistProps } from "./types";
import { useMemo } from "react";

interface ExtendedWatchlistProps extends WatchlistProps {
  searchTerm?: string;
  eventType?: string;
  severity?: string;
}

const Watchlist = ({ 
  userId, 
  searchTerm = "", 
  eventType = "ALL", 
  severity = "ALL" 
}: ExtendedWatchlistProps) => {
  const { 
    watches, 
    isLoading, 
    analyzePriceMutation, 
    handleUnwatch,
    handleInvest
  } = useWatchlist(userId);

  // Filter watches based on search term and other filters
  const filteredWatches = useMemo(() => {
    return watches.filter(watch => {
      // Apply event type filter
      if (eventType !== "ALL" && watch.stock_prediction.event.event_type !== eventType) {
        return false;
      }
      
      // Apply severity filter
      if (severity !== "ALL" && watch.stock_prediction.event.severity !== severity) {
        return false;
      }
      
      // Apply search term filter
      if (searchTerm && searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        
        // Search in title, description, symbol, and rationale
        const titleMatch = watch.stock_prediction.event.title?.toLowerCase().includes(searchLower) || false;
        const descriptionMatch = watch.stock_prediction.event.description?.toLowerCase().includes(searchLower) || false;
        const symbolMatch = watch.stock_prediction.symbol?.toLowerCase().includes(searchLower) || false;
        const rationaleMatch = watch.stock_prediction.rationale?.toLowerCase().includes(searchLower) || false;
        
        if (!titleMatch && !descriptionMatch && !symbolMatch && !rationaleMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [watches, eventType, severity, searchTerm]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (watches.length === 0) {
    return <EmptyState />;
  }

  // Show empty state if there are watches but none match the filters
  if (filteredWatches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No watched stocks match your current filters.</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters to see more results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredWatches.map((watch) => (
        <WatchCard
          key={watch.id}
          watch={watch}
          analyzePriceMutation={analyzePriceMutation}
          onUnwatch={handleUnwatch}
          onInvest={handleInvest}
        />
      ))}
    </div>
  );
};

export default Watchlist;
