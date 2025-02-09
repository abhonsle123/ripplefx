
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Eye, TrendingUp, TrendingDown, Calendar, Building2, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface WatchlistProps {
  userId: string;
}

interface PriceImpactAnalysis {
  summary: string;
  factors: string[];
  risks: string[];
}

interface StockPrediction {
  id: string;
  symbol: string;
  rationale: string;
  is_positive: boolean;
  target_price: number | null;
  price_change_percentage: number | null;
  price_impact_analysis: PriceImpactAnalysis | null;
  confidence_score: number | null;
  last_analysis_date: string | null;
  event: {
    id: string;
    title: string;
    description: string;
    event_type: string;
    severity: string;
    created_at: string;
    affected_organizations: string[] | Record<string, string> | null;
  };
}

interface StockWatch {
  id: string;
  created_at: string;
  status: string;
  entry_price: number | null;
  stock_prediction: StockPrediction;
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
          id,
          created_at,
          status,
          entry_price,
          stock_prediction:stock_predictions!stock_prediction_id (
            id,
            symbol,
            rationale,
            is_positive,
            target_price,
            price_change_percentage,
            price_impact_analysis,
            confidence_score,
            last_analysis_date,
            event:events!stock_predictions_event_id_fkey (
              id,
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

      if (error) {
        console.error('Error fetching watches:', error);
        throw error;
      }
      
      // Transform the data to ensure proper typing of JSON fields
      const typedWatches = watches?.map(watch => ({
        ...watch,
        stock_prediction: {
          ...watch.stock_prediction,
          price_impact_analysis: watch.stock_prediction.price_impact_analysis 
            ? {
                summary: String((watch.stock_prediction.price_impact_analysis as any).summary || ''),
                factors: Array.isArray((watch.stock_prediction.price_impact_analysis as any).factors) 
                  ? (watch.stock_prediction.price_impact_analysis as any).factors 
                  : [],
                risks: Array.isArray((watch.stock_prediction.price_impact_analysis as any).risks)
                  ? (watch.stock_prediction.price_impact_analysis as any).risks
                  : []
              }
            : null
        }
      })) as StockWatch[];
      
      return typedWatches;
    },
  });

  const analyzePriceMutation = useMutation({
    mutationFn: async (stockPredictionId: string) => {
      const response = await fetch('/api/analyze-stock-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_prediction_id: stockPredictionId }),
      });
      if (!response.ok) throw new Error('Failed to analyze stock price');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-watches", userId] });
      toast({
        title: "Analysis Updated",
        description: "The stock price prediction has been updated.",
      });
    },
    onError: (error) => {
      console.error('Error analyzing stock:', error);
      toast({
        title: "Error",
        description: "Failed to analyze stock price. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUnwatch = async (watchId: string) => {
    try {
      const { error } = await supabase
        .from('user_stock_watches')
        .update({ status: 'CANCELLED' })
        .eq('id', watchId);

      if (error) throw error;

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

        const priceChangeColor = stock.price_change_percentage
          ? stock.price_change_percentage > 0
            ? 'text-green-600'
            : 'text-red-600'
          : 'text-muted-foreground';

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
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => analyzePriceMutation.mutate(stock.id)}
                  disabled={analyzePriceMutation.isPending}
                  className="hover:bg-blue-100 hover:text-blue-600"
                >
                  <RefreshCw className={`h-4 w-4 ${analyzePriceMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnwatch(watch.id)}
                  className="hover:bg-red-100 hover:text-red-600"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Prediction Details</h3>
                  <p className="text-sm">{stock.rationale}</p>
                  {stock.price_change_percentage && (
                    <div className="space-y-1">
                      <p className={`text-sm font-medium ${priceChangeColor}`}>
                        Expected Price Change: {stock.price_change_percentage > 0 ? '+' : ''}{stock.price_change_percentage.toFixed(2)}%
                      </p>
                      {stock.confidence_score && (
                        <p className="text-sm text-muted-foreground">
                          Confidence: {(stock.confidence_score * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Event Information</h3>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-sm">{event.description}</p>
                  {stock.price_impact_analysis && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">{stock.price_impact_analysis.summary}</p>
                      {stock.price_impact_analysis.factors && (
                        <ul className="text-sm list-disc list-inside">
                          {stock.price_impact_analysis.factors.slice(0, 2).map((factor, i) => (
                            <li key={i} className="text-muted-foreground">{factor}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
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

