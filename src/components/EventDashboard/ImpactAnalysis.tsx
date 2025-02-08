
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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

interface StockDialogProps {
  stock: StockPrediction;
  isPositive: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const StockDialog = ({ stock, isPositive, isOpen, onClose }: StockDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-5 w-5 text-green-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600" />
          )}
          {stock.symbol}
        </DialogTitle>
      </DialogHeader>
      <div className="mt-4">
        <h4 className="font-medium mb-2">Analysis Rationale:</h4>
        <p className="text-sm text-muted-foreground">{stock.rationale}</p>
      </div>
    </DialogContent>
  </Dialog>
);

const ImpactAnalysis = ({ analysis }: ImpactAnalysisProps) => {
  const [selectedStock, setSelectedStock] = useState<StockPrediction | null>(null);
  const [isPositive, setIsPositive] = useState(false);

  const formatConfidence = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

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
          <div className="flex gap-4 mt-2">
            {analysis.stock_predictions.positive && (
              <div className="flex-1">
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Positive Impact</span>
                </div>
                <div className="mt-1 space-y-2">
                  {analysis.stock_predictions.positive.slice(0, 3).map((stock: StockPrediction) => (
                    <Button
                      key={stock.symbol}
                      variant="outline"
                      className="w-full text-left justify-start text-xs hover:bg-green-50"
                      onClick={() => handleStockClick(stock, true)}
                    >
                      <TrendingUp className="h-3 w-3 mr-2 text-green-600" />
                      {stock.symbol}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.stock_predictions.negative && (
              <div className="flex-1">
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="font-medium">Negative Impact</span>
                </div>
                <div className="mt-1 space-y-2">
                  {analysis.stock_predictions.negative.slice(0, 3).map((stock: StockPrediction) => (
                    <Button
                      key={stock.symbol}
                      variant="outline"
                      className="w-full text-left justify-start text-xs hover:bg-red-50"
                      onClick={() => handleStockClick(stock, false)}
                    >
                      <TrendingDown className="h-3 w-3 mr-2 text-red-600" />
                      {stock.symbol}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {analysis.stock_predictions.confidence_scores && (
            <div className="mt-4 border-t pt-4">
              <h5 className="text-sm font-medium mb-2">Prediction Confidence</h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="block text-muted-foreground">Overall</span>
                  <span className={getConfidenceColor(analysis.stock_predictions.confidence_scores.overall_prediction)}>
                    {formatConfidence(analysis.stock_predictions.confidence_scores.overall_prediction)}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Sector Impact</span>
                  <span className={getConfidenceColor(analysis.stock_predictions.confidence_scores.sector_impact)}>
                    {formatConfidence(analysis.stock_predictions.confidence_scores.sector_impact)}
                  </span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Market Direction</span>
                  <span className={getConfidenceColor(analysis.stock_predictions.confidence_scores.market_direction)}>
                    {formatConfidence(analysis.stock_predictions.confidence_scores.market_direction)}
                  </span>
                </div>
              </div>
            </div>
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

