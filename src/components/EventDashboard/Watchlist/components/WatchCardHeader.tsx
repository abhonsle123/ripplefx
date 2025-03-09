
import React from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Eye, PiggyBank } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionGate from "@/components/SubscriptionGate";
import { UseMutationResult } from "@tanstack/react-query";

interface WatchCardHeaderProps {
  symbol: string;
  isPositive: boolean;
  onUnwatch: () => void;
  onInvestClick: () => void;
  analyzePriceMutation: UseMutationResult<any, Error, string>;
  stockId: string;
  userId: string | null;
  onInvest?: boolean;
  isInvesting: boolean;
}

const WatchCardHeader = ({
  symbol,
  isPositive,
  onUnwatch,
  onInvestClick,
  analyzePriceMutation,
  stockId,
  userId,
  onInvest,
  isInvesting
}: WatchCardHeaderProps) => {
  const { plan, hasFeature } = useSubscription(userId || null);
  console.log("WatchCardHeader - Current user plan:", plan, "userId:", userId);

  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-2xl font-bold flex items-center gap-2">
        {isPositive ? (
          <TrendingUp className="h-6 w-6 text-green-600" />
        ) : (
          <TrendingDown className="h-6 w-6 text-red-600" />
        )}
        {symbol}
      </CardTitle>
      <div className="flex gap-2">
        {isPositive && onInvest && (
          <SubscriptionGate
            requiredPlan="premium"
            userPlan={plan}
            featureName="Investment"
            description="Upgrade to Premium or Pro to invest in stocks directly."
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onInvestClick}
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
                analyzePriceMutation.mutate(stockId);
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
          onClick={onUnwatch}
          className="hover:bg-red-100 hover:text-red-600"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
  );
};

export default WatchCardHeader;
