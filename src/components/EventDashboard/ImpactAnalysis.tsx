
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StockDialog from "./StockDialog";
import StockPredictions from "./StockPredictions";
import ConfidenceScores from "./ConfidenceScores";
import { getConfidenceColor, formatConfidence } from "./utils/formatters";

interface StockPrediction {
  symbol: string;
  rationale: string;
}

interface ImpactAnalysisProps {
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

const ImpactAnalysis = ({ analysis }: ImpactAnalysisProps) => {
  const [selectedStock, setSelectedStock] = useState<StockPrediction | null>(null);
  const [isPositive, setIsPositive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStockClick = (stock: StockPrediction, positive: boolean) => {
    setSelectedStock(stock);
    setIsPositive(positive);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mt-4 space-y-2 border-t pt-4">
      <Button 
        variant="ghost" 
        className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg"
        onClick={handleExpand}
      >
        <h4 className="font-semibold text-sm">Market Impact Analysis</h4>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
      
      {isExpanded && (
        <div className="space-y-4">
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
        </div>
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
