
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import StockDialog from "./StockDialog";
import StockPredictions from "./StockPredictions";
import ConfidenceScores from "./ConfidenceScores";
import { getConfidenceColor, formatConfidence } from "./utils/formatters";
import { AlertCircle } from "lucide-react";

interface StockPrediction {
  symbol: string;
  rationale: string;
}

interface EconomicContext {
  state: string;
  interest_rates: string;
  inflation: string;
  unemployment: string;
  consumer_confidence: string;
  description: string;
}

interface ImpactAnalysisProps {
  eventId: string;
  analysis: {
    affected_sectors: string[];
    economic_context?: EconomicContext;
    stock_predictions?: {
      positive?: StockPrediction[];
      negative?: StockPrediction[];
      confidence_scores?: {
        overall_prediction: number;
        sector_impact: number;
        market_direction: number;
      };
    };
    analysis_metadata?: {
      data_quality_score: number;
    };
  };
}

const ImpactAnalysis = ({ eventId, analysis }: ImpactAnalysisProps) => {
  const [selectedStock, setSelectedStock] = useState<StockPrediction | null>(null);
  const [isPositive, setIsPositive] = useState(false);

  const handleStockClick = (stock: StockPrediction, positive: boolean) => {
    setSelectedStock(stock);
    setIsPositive(positive);
  };

  return (
    <div className="mt-4 space-y-2 border-t pt-4">
      <h4 className="font-semibold text-sm mb-2">Market Impact Analysis</h4>
      
      {analysis.economic_context && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="font-medium text-amber-800">Economic Context</h5>
              <p className="text-amber-700 mt-1">{analysis.economic_context.description}</p>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 font-medium">Economic State:</span>
                  <span className="font-medium capitalize">{analysis.economic_context.state}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 font-medium">Interest Rates:</span>
                  <span className="font-medium capitalize">{analysis.economic_context.interest_rates}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 font-medium">Inflation:</span>
                  <span className="font-medium capitalize">{analysis.economic_context.inflation}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 font-medium">Unemployment:</span>
                  <span className="font-medium capitalize">{analysis.economic_context.unemployment}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {analysis.affected_sectors && (
        <div className="text-sm">
          <span className="font-medium">Affected Sectors:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {analysis.affected_sectors.map((sector: string) => (
              <Badge key={sector} variant="secondary" className="text-xs">
                {sector}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {analysis.stock_predictions && (
        <>
          <StockPredictions
            eventId={eventId}
            positive={analysis.stock_predictions.positive}
            negative={analysis.stock_predictions.negative}
            onStockClick={handleStockClick}
          />

          {analysis.stock_predictions.confidence_scores && (
            <ConfidenceScores scores={analysis.stock_predictions.confidence_scores} />
          )}

          {analysis.analysis_metadata && (
            <div className="mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Data Quality Score:</span>
                <span className={getConfidenceColor(analysis.analysis_metadata.data_quality_score)}>
                  {formatConfidence(analysis.analysis_metadata.data_quality_score)}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {selectedStock && (
        <StockDialog
          stock={selectedStock}
          isPositive={isPositive}
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
};

export default ImpactAnalysis;
