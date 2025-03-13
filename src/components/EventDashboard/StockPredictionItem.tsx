
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StockPrediction } from "./StockPredictions";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface StockPredictionItemProps {
  stock: StockPrediction;
  index: number;
  isPositive: boolean;
  isWatching: boolean;
  isProcessing: boolean;
  onStockClick: (stock: StockPrediction, isPositive: boolean) => void;
  onWatchClick: (stock: StockPrediction, isPositive: boolean, index: number) => void;
}

const StockPredictionItem = ({
  stock,
  index,
  isPositive,
  isWatching,
  isProcessing,
  onStockClick,
  onWatchClick,
}: StockPredictionItemProps) => {
  const colorClass = isPositive ? "text-green-600" : "text-red-600";
  const bgColorClass = isPositive ? "bg-green-100" : "bg-red-100";
  const expectedDirection = isPositive ? "+" : "-";
  const [localWatching, setLocalWatching] = useState(isWatching);
  const [localProcessing, setLocalProcessing] = useState(isProcessing);
  
  // Update local state when props change
  if (localWatching !== isWatching && !localProcessing) {
    setLocalWatching(isWatching);
  }
  
  if (localProcessing !== isProcessing) {
    setLocalProcessing(isProcessing);
  }

  const handleWatchClick = () => {
    if (localProcessing) return;
    
    // Optimistic UI update
    if (!localWatching) {
      setLocalWatching(true);
      setLocalProcessing(true);
    }
    
    onWatchClick(stock, isPositive, index);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 rounded border transition-all duration-200",
        localWatching
          ? "border-primary/40 bg-primary/5"
          : "border-muted hover:border-muted-foreground/30"
      )}
    >
      <div
        className="flex-1 cursor-pointer"
        onClick={() => onStockClick(stock, isPositive)}
      >
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs font-bold",
              colorClass,
              bgColorClass,
              "border-0"
            )}
          >
            {stock.symbol}
          </Badge>
          <span className={cn("text-xs", colorClass)}>
            {expectedDirection}
          </span>
        </div>
      </div>
      <Button
        onClick={handleWatchClick}
        size="sm"
        variant="ghost"
        className={cn(
          "h-7 w-7 p-0",
          localWatching && "text-primary"
        )}
        disabled={localProcessing}
      >
        {localProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : localWatching ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default StockPredictionItem;
