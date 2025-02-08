
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ImpactAnalysisProps {
  analysis: {
    affected_sectors: string[];
    stock_predictions?: {
      positive?: string[];
      negative?: string[];
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
  const formatConfidence = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
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
                <ul className="text-xs mt-1 list-disc list-inside">
                  {analysis.stock_predictions.positive.slice(0, 3).map((stock: string) => (
                    <li key={stock}>{stock}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.stock_predictions.negative && (
              <div className="flex-1">
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="font-medium">Negative Impact</span>
                </div>
                <ul className="text-xs mt-1 list-disc list-inside">
                  {analysis.stock_predictions.negative.slice(0, 3).map((stock: string) => (
                    <li key={stock}>{stock}</li>
                  ))}
                </ul>
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
    </div>
  );
};

export default ImpactAnalysis;
