
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { StockWatch } from "./types";
import type { UseMutationResult } from "@tanstack/react-query";
import WatchOptionsDialog from "./WatchOptionsDialog";
import InvestDialog from "./InvestDialog";
import { useToast } from "@/components/ui/use-toast";
import WatchCardHeader from "./components/WatchCardHeader";
import PredictionDetails from "./components/PredictionDetails";
import EventInformation from "./components/EventInformation";
import CardFooter from "./components/CardFooter";

interface WatchCardProps {
  watch: StockWatch;
  analyzePriceMutation: UseMutationResult<any, Error, string>;
  onUnwatch: (watchId: string) => void;
  onInvest?: (watchId: string, amount: number) => Promise<void>;
  userId?: string | null;
}

const WatchCard = ({ watch, analyzePriceMutation, onUnwatch, onInvest, userId }: WatchCardProps) => {
  const [showWatchOptions, setShowWatchOptions] = useState(false);
  const [showInvestDialog, setShowInvestDialog] = useState(false);
  const [isInvesting, setIsInvesting] = useState(false);
  const { toast } = useToast();
  const stock = watch.stock_prediction;
  const event = stock.event;

  const handleInvest = async (amount: number) => {
    if (!onInvest) return;
    
    setIsInvesting(true);
    try {
      await onInvest(watch.id, amount);
      toast({
        title: "Investment Initiated",
        description: `Your investment in ${stock.symbol} has been initiated.`,
      });
    } catch (error: any) {
      console.error('Investment error:', error);
    } finally {
      setIsInvesting(false);
    }
  };

  return (
    <>
      <Card 
        className="border-l-4 hover:shadow-lg transition-shadow duration-200"
        style={{ borderLeftColor: stock.is_positive ? '#22c55e' : '#ef4444' }}
      >
        <WatchCardHeader 
          symbol={stock.symbol}
          isPositive={stock.is_positive}
          onUnwatch={() => onUnwatch(watch.id)}
          onInvestClick={() => setShowInvestDialog(true)}
          analyzePriceMutation={analyzePriceMutation}
          stockId={stock.id}
          userId={userId || null}
          onInvest={!!onInvest}
          isInvesting={isInvesting}
        />
        
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PredictionDetails 
              rationale={stock.rationale}
              priceChangePercentage={stock.price_change_percentage}
              confidenceScore={stock.confidence_score}
            />
            
            <EventInformation 
              title={event.title}
              description={event.description}
              priceImpactAnalysis={stock.price_impact_analysis}
            />
          </div>

          <CardFooter 
            createdAt={watch.created_at}
            affectedOrganizations={event.affected_organizations}
            eventType={event.event_type}
          />
        </CardContent>
      </Card>

      <WatchOptionsDialog
        isOpen={showWatchOptions}
        onClose={() => setShowWatchOptions(false)}
        onConfirm={(investmentType, amount) => {
          // Handle investment logic here
        }}
        symbol={stock.symbol}
      />

      <InvestDialog
        isOpen={showInvestDialog}
        onOpenChange={setShowInvestDialog}
        onConfirm={handleInvest}
        symbol={stock.symbol}
        isLoading={isInvesting}
      />
    </>
  );
};

export default WatchCard;
