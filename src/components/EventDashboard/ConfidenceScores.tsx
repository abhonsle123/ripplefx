
import { formatConfidence, getConfidenceColor } from "./utils/formatters";

interface ConfidenceScoresProps {
  scores: {
    overall_prediction: number;
    sector_impact: number;
    market_direction: number;
  };
}

const ConfidenceScores = ({ scores }: ConfidenceScoresProps) => {
  return (
    <div className="mt-4 border-t pt-4">
      <h5 className="text-sm font-medium mb-2">Prediction Confidence</h5>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="block text-muted-foreground">Overall</span>
          <span className={getConfidenceColor(scores.overall_prediction)}>
            {formatConfidence(scores.overall_prediction)}
          </span>
        </div>
        <div>
          <span className="block text-muted-foreground">Sector Impact</span>
          <span className={getConfidenceColor(scores.sector_impact)}>
            {formatConfidence(scores.sector_impact)}
          </span>
        </div>
        <div>
          <span className="block text-muted-foreground">Market Direction</span>
          <span className={getConfidenceColor(scores.market_direction)}>
            {formatConfidence(scores.market_direction)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceScores;
