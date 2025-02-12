
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

interface InvestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number) => Promise<void>;
  symbol: string;
  isLoading?: boolean;
}

const InvestDialog = ({ isOpen, onOpenChange, onConfirm, symbol, isLoading }: InvestDialogProps) => {
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    try {
      await onConfirm(numAmount);
      onOpenChange(false);
      setAmount("");
      setError("");
    } catch (err) {
      // Error is handled by the parent component
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invest in {symbol}</DialogTitle>
          <DialogDescription>
            Enter the amount you want to invest in {symbol}. This will execute a market buy order through your connected broker.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Investment Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-10"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Processing..." : "Invest Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvestDialog;
