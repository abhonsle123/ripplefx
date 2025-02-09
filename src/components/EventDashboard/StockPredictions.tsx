
import { useStockWatch } from "./useStockWatch";
import StockPredictionColumn from "./StockPredictionColumn";

export interface StockPrediction {
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
  const { watchingStocks, processingStocks, handleWatchStock } = useStockWatch(eventId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      {positive && (
        <StockPredictionColumn
          isPositive={true}
          stocks={positive}
          watchingStocks={watchingStocks}
          processingStocks={processingStocks}
          onStockClick={onStockClick}
          onWatchClick={handleWatchStock}
        />
      )}
      
      {negative && (
        <StockPredictionColumn
          isPositive={false}
          stocks={negative}
          watchingStocks={watchingStocks}
          processingStocks={processingStocks}
          onStockClick={onStockClick}
          onWatchClick={handleWatchStock}
        />
      )}
    </div>
  );
};

export default StockPredictions;
