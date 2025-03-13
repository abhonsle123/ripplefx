
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { StockPrediction } from "./StockPredictions";

export const useStockWatch = (eventId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [watchingStocks, setWatchingStocks] = useState<string[]>([]);
  const [processingStocks, setProcessingStocks] = useState<string[]>([]);

  const handleWatchStock = async (stock: StockPrediction, isPositive: boolean, index: number) => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      if (!session?.user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to watch stocks.",
          variant: "destructive",
        });
        return;
      }

      // Validate required stock data
      if (!stock.symbol || !stock.rationale) {
        toast({
          title: "Invalid Stock Data",
          description: "Stock symbol and rationale are required.",
          variant: "destructive",
        });
        return;
      }

      setProcessingStocks(prev => [...prev, stock.symbol]);

      const { data: prediction, error: fetchError } = await supabase
        .from('stock_predictions')
        .select('id')
        .eq('event_id', eventId)
        .eq('symbol', stock.symbol)
        .eq('is_positive', isPositive)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let predictionId;
      
      if (!prediction) {
        const { data: newPrediction, error: insertError } = await supabase
          .from('stock_predictions')
          .insert([{
            event_id: eventId,
            symbol: stock.symbol,
            rationale: stock.rationale,
            is_positive: isPositive
          }])
          .select('id')
          .single();

        if (insertError) {
          console.error('Error inserting prediction:', insertError);
          throw insertError;
        }
        predictionId = newPrediction.id;
      } else {
        predictionId = prediction.id;
      }

      const { data: existingWatch, error: watchCheckError } = await supabase
        .from('user_stock_watches')
        .select('id, status')
        .eq('stock_prediction_id', predictionId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (watchCheckError) throw watchCheckError;

      if (existingWatch) {
        if (existingWatch.status === 'WATCHING') {
          toast({
            title: "Already Watching",
            description: `You are already watching ${stock.symbol} for this event.`,
          });
          return;
        }

        const { error: updateError } = await supabase
          .from('user_stock_watches')
          .update({ status: 'WATCHING' })
          .eq('id', existingWatch.id);

        if (updateError) throw updateError;
      } else {
        const { error: createError } = await supabase
          .from('user_stock_watches')
          .insert([{ 
            stock_prediction_id: predictionId,
            user_id: session.user.id,
            status: 'WATCHING'
          }]);

        if (createError) throw createError;
      }

      // Update the local state
      setWatchingStocks(prev => [...prev, stock.symbol]);
      
      // Invalidate the watchlist query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["stock-watches", session.user.id] });
      
      toast({
        title: "Stock Watch Added",
        description: `You are now following ${stock.symbol}. You'll receive updates about its movement.`,
      });

    } catch (error) {
      console.error('Error watching stock:', error);
      toast({
        title: "Error",
        description: "Failed to watch stock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingStocks(prev => prev.filter(symbol => symbol !== stock.symbol));
    }
  };

  return {
    watchingStocks,
    processingStocks,
    handleWatchStock
  };
};
