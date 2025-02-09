
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StockPrediction {
  symbol: string;
  rationale: string;
}

interface StockPredictionsProps {
  eventId: string;
  positive?: StockPrediction[];
  negative?: StockPrediction[];
  onStockClick: (stock: StockPrediction, isPositive: boolean) => void;
}

const StockPredictions = ({ eventId, positive, negative, onStockClick }: StockPredictionsProps) => {
  const { toast } = useToast();
  const [watchingStocks, setWatchingStocks] = useState<string[]>([]);

  const handleWatchStock = async (stock: StockPrediction, isPositive: boolean, index: number) => {
    try {
      // First get the current user
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

      console.log('Watching stock with params:', { 
        eventId, 
        symbol: stock.symbol, 
        isPositive,
        userId: session.user.id 
      });

      // Get the stock prediction ID
      const { data: predictions, error: fetchError } = await supabase
        .from('stock_predictions')
        .select('id')
        .eq('event_id', eventId)
        .eq('symbol', stock.symbol)
        .eq('is_positive', isPositive)
        .single();

      if (fetchError) {
        console.error('Error fetching prediction:', fetchError);
        throw fetchError;
      }

      if (!predictions) {
        console.error('No prediction found for:', { eventId, symbol: stock.symbol, isPositive });
        
        // Let's log the current predictions in the database for debugging
        const { data: allPredictions, error: debugError } = await supabase
          .from('stock_predictions')
          .select('*')
          .eq('event_id', eventId);
          
        console.log('All predictions for this event:', allPredictions);
        if (debugError) console.error('Debug query error:', debugError);
        
        throw new Error('Stock prediction not found');
      }

      console.log('Found prediction:', predictions);

      // Create a watch for this stock
      const { error: watchError } = await supabase
        .from('user_stock_watches')
        .insert([{ 
          stock_prediction_id: predictions.id,
          user_id: session.user.id,
          status: 'WATCHING'
        }]);

      if (watchError) {
        console.error('Error creating watch:', watchError);
        throw watchError;
      }

      setWatchingStocks(prev => [...prev, stock.symbol]);
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
    }
  };

  return (
    <div className="flex gap-4 mt-2">
      {positive && (
        <div className="flex-1">
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Positive Impact</span>
          </div>
          <div className="mt-1 space-y-2">
            {positive.slice(0, 3).map((stock, index) => (
              <div key={`${stock.symbol}-${index}`} className="flex gap-2">
                <span className="text-sm text-muted-foreground w-6 pt-2">
                  {index + 1}
                </span>
                <Button
                  variant="outline"
                  className="flex-1 text-left justify-start text-xs hover:bg-green-50"
                  onClick={() => onStockClick(stock, true)}
                >
                  <TrendingUp className="h-3 w-3 mr-2 text-green-600" />
                  {stock.symbol}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={watchingStocks.includes(stock.symbol)}
                  onClick={() => handleWatchStock(stock, true, index)}
                  className="px-2"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {negative && (
        <div className="flex-1">
          <div className="flex items-center gap-1 text-sm text-red-600">
            <TrendingDown className="h-4 w-4" />
            <span className="font-medium">Negative Impact</span>
          </div>
          <div className="mt-1 space-y-2">
            {negative.slice(0, 3).map((stock, index) => (
              <div key={`${stock.symbol}-${index}`} className="flex gap-2">
                <span className="text-sm text-muted-foreground w-6 pt-2">
                  {index + 4}
                </span>
                <Button
                  variant="outline"
                  className="flex-1 text-left justify-start text-xs hover:bg-red-50"
                  onClick={() => onStockClick(stock, false)}
                >
                  <TrendingDown className="h-3 w-3 mr-2 text-red-600" />
                  {stock.symbol}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={watchingStocks.includes(stock.symbol)}
                  onClick={() => handleWatchStock(stock, false, index)}
                  className="px-2"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPredictions;
