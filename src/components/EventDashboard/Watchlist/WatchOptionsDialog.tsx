
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface WatchOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (investmentType: "FOLLOW_ONLY" | "INVEST_AND_FOLLOW", amount?: number) => void;
  symbol: string;
  isLoading?: boolean;
}

const WatchOptionsDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  symbol,
  isLoading = false 
}: WatchOptionsDialogProps) => {
  const [investmentType, setInvestmentType] = useState<"FOLLOW_ONLY" | "INVEST_AND_FOLLOW">("FOLLOW_ONLY");
  const [amount, setAmount] = useState<number>(100);

  const handleConfirm = () => {
    onConfirm(
      investmentType,
      investmentType === "INVEST_AND_FOLLOW" ? amount : undefined
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track {symbol}</DialogTitle>
          <DialogDescription>
            Choose how you would like to track this stock prediction.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup 
            value={investmentType} 
            onValueChange={(value) => setInvestmentType(value as "FOLLOW_ONLY" | "INVEST_AND_FOLLOW")}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="FOLLOW_ONLY" id="follow-only" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="follow-only" className="font-medium cursor-pointer">
                  Follow Only
                </Label>
                <p className="text-sm text-muted-foreground">
                  Track this stock prediction without investing.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="INVEST_AND_FOLLOW" id="invest-follow" />
              <div className="space-y-1 leading-none flex-1">
                <Label htmlFor="invest-follow" className="font-medium cursor-pointer">
                  Invest & Follow
                </Label>
                <p className="text-sm text-muted-foreground">
                  Track this stock prediction and invest through your connected broker.
                </p>
                {investmentType === "INVEST_AND_FOLLOW" && (
                  <div className="pt-3">
                    <Label htmlFor="invest-amount">Investment amount ($)</Label>
                    <Input
                      id="invest-amount"
                      type="number"
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(parseInt(e.target.value, 10))}
                      disabled={isLoading}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WatchOptionsDialog;
