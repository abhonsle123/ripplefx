
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";
import type { StockPrediction } from "./StockPredictions";

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
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? "text-green-500" : "text-red-500";
  const hoverClass = isPositive 
    ? "hover:bg-green-500/10 group-hover:bg-green-500/10" 
    : "hover:bg-red-500/10 group-hover:bg-red-500/10";

  return (
    <div className="flex items-center gap-2 group">
      <Button
        variant="ghost"
        className={`flex-1 justify-start text-sm font-medium ${hoverClass} h-9`}
        onClick={() => onStockClick(stock, isPositive)}
      >
        <span className="text-muted-foreground mr-2 w-4">
          {index + (isPositive ? 1 : 4)}
        </span>
        <Icon className={`h-4 w-4 mr-2 ${colorClass}`} />
        {stock.symbol}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isWatching || isProcessing}
        onClick={() => onWatchClick(stock, isPositive, index)}
        className={`px-2 h-9 ${hoverClass}`}
      >
        <Eye className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
      </Button>
    </div>
  );
};

export default StockPredictionItem;
