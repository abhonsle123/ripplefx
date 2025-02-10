
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { StockWatch } from "./types";

export const useWatchlist = (userId: string) => {
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
          investment_amount,
          investment_type,
          broker_connection_id,
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
    retry: 2,
    staleTime: 30000,
  });

  const getBrokerConnection = async () => {
    const { data: connection, error } = await supabase
      .from('broker_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      throw error;
    }
    return connection;
  };

  const addToWatchlist = async (
    stockPredictionId: string,
    investmentType: "FOLLOW_ONLY" | "INVEST_AND_FOLLOW",
    amount?: number
  ) => {
    try {
      let brokerConnectionId = null;
      
      if (investmentType === "INVEST_AND_FOLLOW") {
        const connection = await getBrokerConnection();
        if (!connection) {
          throw new Error("No active broker connection found. Please connect a broker first.");
        }
        brokerConnectionId = connection.id;
      }

      // Check for existing watch
      const { data: existingWatch, error: checkError } = await supabase
        .from('user_stock_watches')
        .select('id, status')
        .eq('user_id', userId)
        .eq('stock_prediction_id', stockPredictionId)
        .eq('status', 'WATCHING')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingWatch) {
        // If already watching, just update the investment details
        const { error: updateError } = await supabase
          .from('user_stock_watches')
          .update({
            investment_type: investmentType,
            investment_amount: amount,
            broker_connection_id: brokerConnectionId
          })
          .eq('id', existingWatch.id);

        if (updateError) throw updateError;
      } else {
        // Create new watch
        const { error } = await supabase
          .from('user_stock_watches')
          .insert([{
            user_id: userId,
            stock_prediction_id: stockPredictionId,
            status: "WATCHING",
            investment_type: investmentType,
            investment_amount: amount,
            broker_connection_id: brokerConnectionId
          }]);

        if (error) throw error;
      }

      // If investing, trigger the investment
      if (investmentType === "INVEST_AND_FOLLOW" && amount && brokerConnectionId) {
        const { data: investmentResult, error: investmentError } = await supabase.functions.invoke(
          'execute-trade',
          {
            body: {
              stockPredictionId,
              amount,
              brokerConnectionId,
              userId
            }
          }
        );

        if (investmentError) throw investmentError;

        toast({
          title: "Investment Initiated",
          description: "Your investment order has been placed successfully.",
        });
      }

      // Refresh the watchlist
      queryClient.invalidateQueries({ queryKey: ["stock-watches", userId] });

      toast({
        title: investmentType === "FOLLOW_ONLY" ? "Stock Added to Watchlist" : "Investment Started",
        description: investmentType === "FOLLOW_ONLY" 
          ? "You will now receive updates for this stock."
          : "Your investment has been initiated and the stock has been added to your watchlist.",
      });
    } catch (error: any) {
      console.error('Error in addToWatchlist:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const analyzePriceMutation = useMutation({
    mutationFn: async (stockPredictionId: string) => {
      console.log('Starting price analysis for prediction:', stockPredictionId);
      const { data, error } = await supabase.functions.invoke('analyze-stock-price', {
        body: { stock_prediction_id: stockPredictionId },
      });
      if (error) {
        console.error('Error in analyze-stock-price function:', error);
        throw error;
      }
      console.log('Analysis completed successfully:', data);
      return data;
    },
    onMutate: (stockPredictionId) => {
      console.log('Starting mutation for prediction:', stockPredictionId);
      toast({
        title: "Analyzing Stock",
        description: "Updating price prediction...",
      });
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

  return {
    watches,
    isLoading,
    analyzePriceMutation,
    handleUnwatch,
    addToWatchlist,
  };
};
