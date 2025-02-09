
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
  const colorClass = isPositive ? "text-green-500" : "text-red-500";
  const title = isPositive ? "Positive Impact" : "Negative Impact";
  const bgClass = isPositive ? "bg-green-500/5" : "bg-red-500/5";
  const borderClass = isPositive ? "border-green-500/10" : "border-red-500/10";

  return (
    <div className={`p-4 rounded-lg border ${borderClass} ${bgClass}`}>
      <div className={`flex items-center gap-2 mb-3 ${colorClass}`}>
        <Icon className="h-5 w-5" />
        <span className="font-semibold">{title}</span>
      </div>
      <div className="space-y-2">
        {stocks.map((stock, index) => (
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
