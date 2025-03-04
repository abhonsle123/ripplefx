import { format } from "date-fns";
import { Eye, TrendingUp, TrendingDown, Calendar, Building2, ArrowRight, RefreshCw, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StockWatch } from "./types";
import type { UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";
import WatchOptionsDialog from "./WatchOptionsDialog";
import InvestDialog from "./InvestDialog";
import { useToast } from "@/components/ui/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionGate from "@/components/SubscriptionGate";

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
  const { plan, hasFeature } = useSubscription(userId || null);

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
      // Error will be handled by the parent component
      console.error('Investment error:', error);
    } finally {
      setIsInvesting(false);
    }
  };

  const affectedOrgs = event.affected_organizations 
    ? (typeof event.affected_organizations === 'object' 
        ? Object.values(event.affected_organizations) 
        : Array.isArray(event.affected_organizations) 
          ? event.affected_organizations 
          : []
      ).join(', ')
    : 'No organizations listed';

  const priceChangeColor = stock.price_change_percentage
    ? stock.price_change_percentage > 0
      ? 'text-green-600'
      : 'text-red-600'
    : 'text-muted-foreground';

  return (
    <>
      <Card 
        className="border-l-4 hover:shadow-lg transition-shadow duration-200"
        style={{ borderLeftColor: stock.is_positive ? '#22c55e' : '#ef4444' }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            {stock.is_positive ? (
              <TrendingUp className="h-6 w-6 text-green-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600" />
            )}
            {stock.symbol}
          </CardTitle>
          <div className="flex gap-2">
            {stock.is_positive && onInvest && (
              <SubscriptionGate
                requiredPlan="premium"
                userPlan={plan}
                featureName="Investment"
                description="Upgrade to Premium or Pro to invest in stocks directly."
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInvestDialog(true)}
                  className="hover:bg-green-100 hover:text-green-600"
                  disabled={isInvesting}
                >
                  <PiggyBank className="h-4 w-4 mr-1" />
                  Invest
                </Button>
              </SubscriptionGate>
            )}
            <SubscriptionGate
              requiredPlan="premium"
              userPlan={plan}
              featureName="AI Analysis"
              description="Upgrade to Premium or Pro to refresh AI analysis."
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!analyzePriceMutation.isPending) {
                    analyzePriceMutation.mutate(stock.id);
                  }
                }}
                disabled={analyzePriceMutation.isPending}
                className="hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title={analyzePriceMutation.isPending ? "Analysis in progress..." : "Refresh analysis"}
              >
                <RefreshCw className={`h-4 w-4 ${analyzePriceMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </SubscriptionGate>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUnwatch(watch.id)}
              className="hover:bg-red-100 hover:text-red-600"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Prediction Details</h3>
              <p className="text-sm">{stock.rationale}</p>
              {stock.price_change_percentage && (
                <div className="space-y-1">
                  <p className={`text-sm font-medium ${priceChangeColor}`}>
                    Expected Price Change: {stock.price_change_percentage > 0 ? '+' : ''}{stock.price_change_percentage.toFixed(2)}%
                  </p>
                  {stock.confidence_score && (
                    <p className="text-sm text-muted-foreground">
                      Confidence: {(stock.confidence_score * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Event Information</h3>
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-sm">{event.description}</p>
              {stock.price_impact_analysis && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm">{stock.price_impact_analysis.summary}</p>
                  {stock.price_impact_analysis.factors && (
                    <ul className="text-sm list-disc list-inside">
                      {stock.price_impact_analysis.factors.slice(0, 2).map((factor, i) => (
                        <li key={i} className="text-muted-foreground">{factor}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Added on {format(new Date(watch.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span>Affected: {affectedOrgs}</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowRight className="h-4 w-4" />
              <span>Event Type: {event.event_type}</span>
            </div>
          </div>
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
