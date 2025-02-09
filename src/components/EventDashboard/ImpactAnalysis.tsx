
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import StockDialog from "./StockDialog";
import StockPredictions from "./StockPredictions";
import ConfidenceScores from "./ConfidenceScores";
import { getConfidenceColor, formatConfidence } from "./utils/formatters";

interface StockPrediction {
  symbol: string;
  rationale: string;
}

interface ImpactAnalysisProps {
  eventId: string;
  analysis: {
    affected_sectors: string[];
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
