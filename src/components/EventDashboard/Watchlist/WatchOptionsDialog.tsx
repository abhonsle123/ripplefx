
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface WatchOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (investmentType: "FOLLOW_ONLY" | "INVEST_AND_FOLLOW", amount?: number) => void;
  symbol: string;
}

const WatchOptionsDialog = ({ isOpen, onClose, onConfirm, symbol }: WatchOptionsDialogProps) => {
  const [investmentType, setInvestmentType] = useState<"FOLLOW_ONLY" | "INVEST_AND_FOLLOW">("FOLLOW_ONLY");
  const [amount, setAmount] = useState<number>(100);

  const handleConfirm = () => {
    onConfirm(
      investmentType, 
      investmentType === "INVEST_AND_FOLLOW" ? amount : undefined
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Watch {symbol}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup 
            value={investmentType} 
            onValueChange={(value) => setInvestmentType(value as "FOLLOW_ONLY" | "INVEST_AND_FOLLOW")}
          >
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="FOLLOW_ONLY" id="follow" />
              <Label htmlFor="follow">Follow only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="INVEST_AND_FOLLOW" id="invest" />
              <Label htmlFor="invest">Invest and follow</Label>
            </div>
          </RadioGroup>

          {investmentType === "INVEST_AND_FOLLOW" && (
            <div className="space-y-2">
              <Label htmlFor="amount">Investment amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value, 10))}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WatchOptionsDialog;
