import React from 'react';
import { Badge } from "@/components/ui/badge";

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
  // Remove the old priceChangeColor logic since we're using white text
  
  // Determine confidence level text
  const getConfidenceLevel = (score: number | null) => {
    if (score === null) return 'Unknown';
    if (score >= 0.8) return 'High';
    if (score >= 0.65) return 'Moderate';
    if (score >= 0.5) return 'Fair';
    return 'Low';
  };

  // Get badge variant based on confidence
  const getConfidenceBadgeVariant = (score: number | null) => {
    if (score === null) return 'secondary';
    if (score >= 0.8) return 'default';
    if (score >= 0.65) return 'outline';
    return 'secondary';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Prediction Details</h3>
      <p className="text-sm">{rationale}</p>
      
      {priceChangePercentage !== null && (
        <div className="space-y-2 mt-2">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Expected Price Change:</span>
            <Badge 
              variant={priceChangePercentage > 0 ? "default" : "destructive"} 
              className="text-xs font-bold text-white"
            >
              {priceChangePercentage > 0 ? '+' : ''}{Math.abs(priceChangePercentage).toFixed(2)}%
            </Badge>
          </div>
          
          {confidenceScore !== null && (
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">Prediction Confidence:</span>
              <Badge 
                variant={getConfidenceBadgeVariant(confidenceScore)} 
                className="text-xs"
              >
                {getConfidenceLevel(confidenceScore)} ({(confidenceScore * 100).toFixed(0)}%)
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionDetails;
