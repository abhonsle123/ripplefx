
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

interface WatchOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (investmentType: "FOLLOW_ONLY" | "INVEST_AND_FOLLOW", amount?: number) => void;
  symbol: string;
}

const WatchOptionsDialog = ({ isOpen, onClose, onConfirm, symbol }: WatchOptionsDialogProps) => {
  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<"FOLLOW_ONLY" | "INVEST_AND_FOLLOW">("FOLLOW_ONLY");

  const handleConfirm = () => {
    if (selectedOption === "INVEST_AND_FOLLOW" && !investmentAmount) {
      return;
    }
    onConfirm(selectedOption, selectedOption === "INVEST_AND_FOLLOW" ? Number(investmentAmount) : undefined);
    onClose();
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
            >
              Follow Only
            </Button>
            <Button
              variant={selectedOption === "INVEST_AND_FOLLOW" ? "default" : "outline"}
              className="w-full"
              onClick={() => setSelectedOption("INVEST_AND_FOLLOW")}
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
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedOption === "INVEST_AND_FOLLOW" && !investmentAmount}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WatchOptionsDialog;
