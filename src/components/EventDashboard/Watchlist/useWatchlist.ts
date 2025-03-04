
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { StockWatch } from "./types";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  fetchUserWatches, 
  unwatchStock, 
  createStockWatch 
} from "./utils/watchApi";
import { 
  getBrokerConnection, 
  executeTrade, 
  analyzeStockPrice 
} from "./utils/brokerApi";

export const useWatchlist = (userId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canAddToWatchlist, plan } = useSubscription(userId);

  const { data: watches = [], isLoading } = useQuery({
    queryKey: ["stock-watches", userId],
    queryFn: () => fetchUserWatches(userId),
    retry: 2,
    staleTime: 30000,
  });

  const addToWatchlist = async (
    stockPredictionId: string,
    investmentType: "FOLLOW_ONLY" | "INVEST_AND_FOLLOW",
    amount?: number
  ) => {
    // Check if the user is at their watchlist limit
    const activeWatches = watches.filter(w => w.status === "WATCHING").length;
    
    if (!canAddToWatchlist(activeWatches)) {
      toast({
        title: "Watchlist Limit Reached",
        description: `Your ${plan} plan allows a maximum of ${activeWatches} stocks in your watchlist. Please upgrade to add more.`,
        variant: "destructive",
      });
      return;
    }

    let brokerConnectionId = null;
    
    if (investmentType === "INVEST_AND_FOLLOW") {
      const connection = await getBrokerConnection(userId);
      brokerConnectionId = connection.id;
    }

    await createStockWatch(
      userId, 
      stockPredictionId, 
      investmentType, 
      brokerConnectionId, 
      amount
    );

    // If investing, trigger the investment
    if (investmentType === "INVEST_AND_FOLLOW" && amount && brokerConnectionId) {
      toast({
        title: "Investment Initiated",
        description: "Your investment order has been placed.",
      });
    }
  };

  const analyzePriceMutation = useMutation({
    mutationFn: (stockPredictionId: string) => analyzeStockPrice(stockPredictionId),
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
      await unwatchStock(watchId);
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

  const handleInvest = async (watchId: string, amount: number) => {
    try {
      console.log('Starting investment process for watch ID:', watchId);
      
      // Get the watch details
      const watch = watches.find(w => w.id === watchId);
      if (!watch) {
        throw new Error('Watch not found');
      }

      // Get the active broker connection
      const connection = await getBrokerConnection(userId);
      
      // Execute the trade
      const response = await executeTrade(
        watch.stock_prediction.id, 
        amount, 
        connection.id, 
        userId
      );

      queryClient.invalidateQueries({ queryKey: ["stock-watches", userId] });

      toast({
        title: "Investment Successful",
        description: `Your investment in ${watch.stock_prediction.symbol} has been placed successfully.`,
      });

      return response;
    } catch (error: any) {
      console.error('Error investing in stock:', error);
      toast({
        title: "Investment Failed",
        description: error.message || "Failed to place investment. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    watches,
    isLoading,
    analyzePriceMutation,
    handleUnwatch,
    handleInvest,
    addToWatchlist,
  };
};
