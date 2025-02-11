
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface WatchOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (investmentType: "FOLLOW_ONLY" | "INVEST_AND_FOLLOW", amount?: number) => void;
  symbol: string;
}

const WatchOptionsDialog = ({ isOpen, onClose, onConfirm, symbol }: WatchOptionsDialogProps) => {
  const { toast } = useToast();
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<"FOLLOW_ONLY" | "INVEST_AND_FOLLOW">("FOLLOW_ONLY");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      
      if (selectedOption === "INVEST_AND_FOLLOW" && !investmentAmount) {
        toast({
          title: "Investment amount required",
          description: "Please enter an investment amount to proceed.",
          variant: "destructive",
        });
        return;
      }

      const amount = selectedOption === "INVEST_AND_FOLLOW" ? Number(investmentAmount) : undefined;
      
      if (amount && amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a positive investment amount.",
          variant: "destructive",
        });
        return;
      }

      await onConfirm(selectedOption, amount);
      toast({
        title: selectedOption === "FOLLOW_ONLY" ? "Stock Added to Watchlist" : "Investment Initiated",
        description: selectedOption === "FOLLOW_ONLY" 
          ? "You will now receive updates for this stock."
          : "Your investment order is being processed.",
      });
      
      setInvestmentAmount("");
      setSelectedOption("FOLLOW_ONLY");
      onClose();
    } catch (error) {
      console.error('Error confirming watch option:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Watch {symbol}</DialogTitle>
          <DialogDescription>
            Choose how you want to track this stock prediction
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <Button
              variant={selectedOption === "FOLLOW_ONLY" ? "default" : "outline"}
              className="w-full"
              onClick={() => setSelectedOption("FOLLOW_ONLY")}
              disabled={isSubmitting}
            >
              Follow Only
            </Button>
            <Button
              variant={selectedOption === "INVEST_AND_FOLLOW" ? "default" : "outline"}
              className="w-full"
              onClick={() => setSelectedOption("INVEST_AND_FOLLOW")}
              disabled={isSubmitting}
            >
              Invest and Follow
            </Button>
          </div>
          {selectedOption === "INVEST_AND_FOLLOW" && (
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Investment Amount ($)
              </label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder="Enter investment amount"
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isSubmitting || (selectedOption === "INVEST_AND_FOLLOW" && !investmentAmount)}
          >
            {isSubmitting ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WatchOptionsDialog;
