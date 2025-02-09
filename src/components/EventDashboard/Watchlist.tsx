
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Eye, TrendingUp, TrendingDown, Calendar, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface WatchlistProps {
  userId: string;
}

const Watchlist = ({ userId }: WatchlistProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
              severity,
              created_at,
              affected_organizations
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

      // Invalidate and refetch the watches query
      queryClient.invalidateQueries({ queryKey: ["stock-watches", userId] });

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
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
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
    <div className="space-y-6">
      {watches.map((watch) => {
        const stock = watch.stock_prediction;
        const event = stock?.event;
        if (!stock || !event) return null;

        const affectedOrgs = event.affected_organizations 
          ? (typeof event.affected_organizations === 'object' 
              ? Object.values(event.affected_organizations) 
              : Array.isArray(event.affected_organizations) 
                ? event.affected_organizations 
                : []
            ).join(', ')
          : 'No organizations listed';

        return (
          <Card key={watch.id} className="border-l-4 hover:shadow-lg transition-shadow duration-200"
                style={{ borderLeftColor: stock.is_positive ? '#22c55e' : '#ef4444' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                {stock.is_positive ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
                {stock.symbol}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnwatch(watch.id)}
                className="hover:bg-red-100 hover:text-red-600"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Prediction Details</h3>
                  <p className="text-sm">{stock.rationale}</p>
                  {stock.target_price && (
                    <p className="text-sm font-medium">
                      Target Price: ${stock.target_price}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Event Information</h3>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-sm">{event.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Added on {format(new Date(watch.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>Affected: {affectedOrgs}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowRight className="h-4 w-4" />
                  <span>Event Type: {event.event_type}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Watchlist;
