
import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  CircleCheck, 
  CircleX,
  Info
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { MarketSentimentScore } from "@/types/marketSentiment";
import { getSentimentColor, getSentimentLabel } from "@/utils/marketSentiment";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface MarketSentimentScoreProps {
  sentimentData: MarketSentimentScore;
  className?: string;
}

const MarketSentimentScore = ({ sentimentData, className }: MarketSentimentScoreProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const colorClass = getSentimentColor(sentimentData.score);
  const label = getSentimentLabel(sentimentData.score);
  
  const lastUpdatedDate = new Date(sentimentData.lastUpdated);
  const formattedDate = format(lastUpdatedDate, "MMM d, yyyy 'at' h:mm a");
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">Market Sentiment Score</h4>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
              <Info className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-xs">
            <p>Market Sentiment Score (MSS) aggregates predictions from financial APIs and RippleEffect AI to provide a confidence rating about this stock's direction.</p>
            <p className="mt-2">The score (0-100%) represents the percentage of sources predicting a positive outcome.</p>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="bg-card/50 border rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className={cn(
                "font-mono text-xl font-bold flex items-center",
                colorClass
              )}
            >
              {sentimentData.score}%
            </div>
            <span className={cn("text-sm font-medium", colorClass)}>
              {label}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDetails(!showDetails)}
            className="h-7 px-2"
          >
            {showDetails ? (
              <ChevronUp className="h-4 w-4 mr-1" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-1" />
            )}
            {showDetails ? "Hide" : "Show"} sources
          </Button>
        </div>
        
        {showDetails && sentimentData.predictions.length > 0 && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {sentimentData.predictions.map((prediction, index) => (
              <div key={`${prediction.source}-${index}`} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {prediction.isPositive ? (
                    <CircleCheck className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <CircleX className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className="font-medium">{prediction.source}</span>
                </div>
                <span className="text-muted-foreground">
                  {prediction.isPositive ? "Bullish" : "Bearish"}
                </span>
              </div>
            ))}
            
            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              Last updated: {formattedDate}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketSentimentScore;
