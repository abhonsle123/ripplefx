
import { TrendingUp, TrendingDown } from "lucide-react";
import StockPredictionItem from "./StockPredictionItem";
import type { StockPrediction } from "./StockPredictions";

interface StockPredictionColumnProps {
  isPositive: boolean;
  stocks: StockPrediction[];
  watchingStocks: string[];
  processingStocks: string[];
  onStockClick: (stock: StockPrediction, isPositive: boolean) => void;
  onWatchClick: (stock: StockPrediction, isPositive: boolean, index: number) => void;
}

const StockPredictionColumn = ({
  isPositive,
  stocks,
  watchingStocks,
  processingStocks,
  onStockClick,
  onWatchClick,
}: StockPredictionColumnProps) => {
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";
  const title = isPositive ? "Positive Impact" : "Negative Impact";

  return (
    <div className="flex-1">
      <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
        <Icon className="h-4 w-4" />
        <span className="font-medium">{title}</span>
      </div>
      <div className="mt-1 space-y-2">
        {stocks.slice(0, 3).map((stock, index) => (
          <StockPredictionItem
            key={`${stock.symbol}-${index}`}
            stock={stock}
            index={index}
            isPositive={isPositive}
            isWatching={watchingStocks.includes(stock.symbol)}
            isProcessing={processingStocks.includes(stock.symbol)}
            onStockClick={onStockClick}
            onWatchClick={onWatchClick}
          />
        ))}
      </div>
    </div>
  );
};

export default StockPredictionColumn;
