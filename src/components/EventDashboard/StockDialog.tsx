
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown } from "lucide-react";
import MarketSentimentScore from "./MarketSentimentScore";
import { useMarketSentiment } from "@/hooks/useMarketSentiment";

interface StockPrediction {
  symbol: string;
  rationale: string;
}

interface StockDialogProps {
  stock: StockPrediction;
  isPositive: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const StockDialog = ({ stock, isPositive, isOpen, onClose }: StockDialogProps) => {
  // Fetch market sentiment for this specific stock
  const { sentimentData, isLoading } = useMarketSentiment(stock.symbol, '');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            {stock.symbol}
          </DialogTitle>
        </DialogHeader>
        
        {sentimentData && !isLoading && (
          <MarketSentimentScore sentimentData={sentimentData} className="mt-2" />
        )}
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Analysis Rationale:</h4>
          <p className="text-sm text-muted-foreground">{stock.rationale}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockDialog;
