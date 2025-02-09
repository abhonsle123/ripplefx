
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Eye, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface WatchlistProps {
  userId: string;
}

const Watchlist = ({ userId }: WatchlistProps) => {
  const { toast } = useToast();

  const { data: watches = [], isLoading } = useQuery({
    queryKey: ["stock-watches", userId],
    queryFn: async () => {
      const { data: watches, error } = await supabase
        .from('user_stock_watches')
        .select(`
          *,
          stock_prediction:stock_predictions!stock_prediction_id (
            *,
            event:events!event_id (
              title,
              description,
              event_type,
              severity
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'WATCHING')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return watches;
    },
  });

  const handleUnwatch = async (watchId: string) => {
    try {
      const { error } = await supabase
        .from('user_stock_watches')
        .update({ status: 'CANCELLED' })
        .eq('id', watchId);

      if (error) throw error;

      toast({
        title: "Stock Unwatched",
        description: "You will no longer receive updates for this stock.",
      });
    } catch (error) {
      console.error('Error unwatching stock:', error);
      toast({
        title: "Error",
        description: "Failed to unwatch stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (watches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          You haven't added any stocks to your watchlist yet.
          Click the eye icon on any stock prediction to start watching.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {watches.map((watch) => {
        const stock = watch.stock_prediction;
        const event = stock?.event;
        if (!stock || !event) return null;

        return (
          <div key={watch.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stock.is_positive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="font-medium">{stock.symbol}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnwatch(watch.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">{stock.rationale}</p>
            
            <div className="text-xs text-muted-foreground">
              From event: {event.title}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Watchlist;

