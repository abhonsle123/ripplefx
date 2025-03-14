
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface BrokerConnectionFormProps {
  onSubmit: (formData: {
    broker_name: string;
    api_key: string;
    api_secret: string;
  }) => Promise<boolean>;
  isSaving: boolean;
}

const BrokerConnectionForm = ({ onSubmit, isSaving }: BrokerConnectionFormProps) => {
  const [formData, setFormData] = useState({
    broker_name: "alpaca_paper",
    api_key: "",
    api_secret: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, broker_name: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      // Reset form
      setFormData({
        broker_name: "alpaca_paper",
        api_key: "",
        api_secret: "",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Broker Connection</CardTitle>
        <CardDescription>
          Connect your brokerage account to enable trading directly from RippleEffect
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="broker_name">Broker</Label>
            <Select 
              value={formData.broker_name} 
              onValueChange={handleSelectChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select broker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alpaca_paper">Alpaca (Paper Trading)</SelectItem>
                <SelectItem value="alpaca_live">Alpaca (Live Trading)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              name="api_key"
              value={formData.api_key}
              onChange={handleInputChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              You can find your API key in your Alpaca dashboard
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_secret">API Secret</Label>
            <Input
              id="api_secret"
              name="api_secret"
              type="password"
              value={formData.api_secret}
              onChange={handleInputChange}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Broker'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default BrokerConnectionForm;
