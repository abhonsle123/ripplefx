
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
  const colorClass = isPositive ? "text-green-600" : "text-red-600";
  const hoverClass = isPositive ? "hover:bg-green-50" : "hover:bg-red-50";

  // Extract just the ticker symbol from any potential company name
  // Add null check and provide a fallback empty string
  const tickerSymbol = stock.symbol ? stock.symbol.split(' ')[0] : '';

  return (
    <div className="flex gap-2">
      <span className="text-sm text-muted-foreground w-6 pt-2">
        {index + (isPositive ? 1 : 4)}
      </span>
      <Button
        variant="outline"
        className={`flex-1 text-left justify-start text-xs ${hoverClass}`}
        onClick={() => onStockClick(stock, isPositive)}
      >
        <Icon className={`h-3 w-3 mr-2 ${colorClass}`} />
        {tickerSymbol}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isWatching || isProcessing}
        onClick={() => onWatchClick(stock, isPositive, index)}
        className="px-2"
      >
        <Eye className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
      </Button>
    </div>
  );
};

export default StockPredictionItem;
