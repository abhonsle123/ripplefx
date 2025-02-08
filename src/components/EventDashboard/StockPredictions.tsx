
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockPrediction {
  symbol: string;
  rationale: string;
}

interface StockPredictionsProps {
  positive?: StockPrediction[];
  negative?: StockPrediction[];
  onStockClick: (stock: StockPrediction, isPositive: boolean) => void;
}

const StockPredictions = ({ positive, negative, onStockClick }: StockPredictionsProps) => {
  return (
    <div className="flex gap-4 mt-2">
      {positive && (
        <div className="flex-1">
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Positive Impact</span>
          </div>
          <div className="mt-1 space-y-2">
            {positive.slice(0, 3).map((stock) => (
              <Button
                key={stock.symbol}
                variant="outline"
                className="w-full text-left justify-start text-xs hover:bg-green-50"
                onClick={() => onStockClick(stock, true)}
              >
                <TrendingUp className="h-3 w-3 mr-2 text-green-600" />
                {stock.symbol}
              </Button>
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
            {negative.slice(0, 3).map((stock) => (
              <Button
                key={stock.symbol}
                variant="outline"
                className="w-full text-left justify-start text-xs hover:bg-red-50"
                onClick={() => onStockClick(stock, false)}
              >
                <TrendingDown className="h-3 w-3 mr-2 text-red-600" />
                {stock.symbol}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPredictions;
