
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BrokerFormData } from "./types";

interface BrokerConnectionFormProps {
  formData: BrokerFormData;
  setFormData: (data: BrokerFormData) => void;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isEditing: boolean;
}

const BrokerConnectionForm = ({
  formData,
  setFormData,
  isSubmitting,
  handleSubmit,
  isEditing,
}: BrokerConnectionFormProps) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="broker_name">Broker</Label>
        <Select
          value={formData.broker_name}
          onValueChange={(value) =>
            setFormData({ ...formData, broker_name: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a broker" />
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
          value={formData.api_key}
          onChange={(e) =>
            setFormData({ ...formData, api_key: e.target.value })
          }
          placeholder="Enter your API key"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="api_secret">API Secret</Label>
        <Input
          id="api_secret"
          type="password"
          value={formData.api_secret}
          onChange={(e) =>
            setFormData({ ...formData, api_secret: e.target.value })
          }
          placeholder="Enter your API secret"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? isEditing
            ? "Updating..."
            : "Connecting..."
          : isEditing
          ? "Update Broker"
          : "Connect Broker"}
      </Button>
    </form>
  );
};

export default BrokerConnectionForm;

