
import { useWatchlist } from "./useWatchlist";
import WatchCard from "./WatchCard";
import EmptyState from "./EmptyState";
import LoadingState from "./LoadingState";
import type { WatchlistProps } from "./types";

const Watchlist = ({ userId }: WatchlistProps) => {
  const { watches, isLoading, analyzePriceMutation, handleUnwatch } = useWatchlist(userId);

  if (isLoading) {
    return <LoadingState />;
  }

  if (watches.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {watches.map((watch) => (
        <WatchCard
          key={watch.id}
          watch={watch}
          analyzePriceMutation={analyzePriceMutation}
          onUnwatch={handleUnwatch}
        />
      ))}
    </div>
  );
};

export default Watchlist;
