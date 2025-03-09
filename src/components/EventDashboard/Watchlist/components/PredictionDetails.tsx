
import React from 'react';

interface PredictionDetailsProps {
  rationale: string;
  priceChangePercentage: number | null;
  confidenceScore: number | null;
}

const PredictionDetails = ({ 
  rationale, 
  priceChangePercentage, 
  confidenceScore 
}: PredictionDetailsProps) => {
  // Determine text color based on price change direction
  const priceChangeColor = priceChangePercentage
    ? priceChangePercentage > 0
      ? 'text-green-600'
      : 'text-red-600'
    : 'text-muted-foreground';

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Prediction Details</h3>
      <p className="text-sm">{rationale}</p>
      {priceChangePercentage !== null && (
        <div className="space-y-1">
          <p className={`text-sm font-medium ${priceChangeColor}`}>
            Expected Price Change: {priceChangePercentage > 0 ? '+' : ''}{priceChangePercentage.toFixed(2)}%
          </p>
          {confidenceScore !== null && (
            <p className="text-sm text-muted-foreground">
              Confidence: {(confidenceScore * 100).toFixed(1)}%
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionDetails;
