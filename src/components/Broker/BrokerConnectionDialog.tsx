
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type BrokerConnection = Database["public"]["Tables"]["broker_connections"]["Row"];

interface BrokerConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean, wasSubmitted?: boolean) => void;
  connectionToEdit?: BrokerConnection | null;
}

const BrokerConnectionDialog = ({
  open,
  onOpenChange,
  connectionToEdit,
}: BrokerConnectionDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    broker_name: "",
    api_key: "",
    api_secret: "",
  });

  // Reset form when dialog opens/closes or connectionToEdit changes
  useEffect(() => {
    if (connectionToEdit) {
      setFormData({
        broker_name: connectionToEdit.broker_name,
        api_key: connectionToEdit.api_key,
        api_secret: connectionToEdit.api_secret,
      });
    } else {
      setFormData({
        broker_name: "",
        api_key: "",
        api_secret: "",
      });
    }
  }, [connectionToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("No authenticated session");
      }

      const userId = session.session.user.id;

      // Check if a connection already exists for this broker
      const { data: existingConnection, error: fetchError } = await supabase
        .from("broker_connections")
        .select("id")
        .eq("user_id", userId)
        .eq("broker_name", formData.broker_name)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") { // PGRST116 is "not found" error
        throw fetchError;
      }

      if (connectionToEdit) {
        // Update existing connection
        const { error } = await supabase
          .from("broker_connections")
          .update({
            ...formData,
            user_id: userId,
          })
          .eq("id", connectionToEdit.id);

        if (error) throw error;

        toast({
          title: "Broker connection updated",
          description: "Your broker connection has been updated successfully.",
        });
      } else if (existingConnection) {
        // Update the existing connection if one exists for this broker
        const { error } = await supabase
          .from("broker_connections")
          .update({
            ...formData,
            user_id: userId,
          })
          .eq("id", existingConnection.id);

        if (error) throw error;

        toast({
          title: "Broker connection updated",
          description: "Your existing broker connection has been updated.",
        });
      } else {
        // Create new connection
        const { error } = await supabase
          .from("broker_connections")
          .insert([
            {
              ...formData,
              user_id: userId,
            },
          ]);

        if (error) throw error;

        toast({
          title: "Broker connected successfully",
          description: "You can now start creating trading rules for this broker.",
        });
      }

      // Invalidate queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["broker-connections"] });
      
      // Close the dialog with wasSubmitted=true
      onOpenChange(false, true);
      
      setFormData({
        broker_name: "",
        api_key: "",
        api_secret: "",
      });
    } catch (error: any) {
      toast({
        title: connectionToEdit ? "Error updating broker" : "Error connecting broker",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => onOpenChange(newOpen)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {connectionToEdit ? "Edit Broker Connection" : "Connect Broker"}
          </DialogTitle>
          <DialogDescription>
            {connectionToEdit 
              ? "Update your broker connection details." 
              : "Connect your broker to enable automatic trading."}
          </DialogDescription>
        </DialogHeader>
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
              ? connectionToEdit
                ? "Updating..."
                : "Connecting..."
              : connectionToEdit
              ? "Update Broker"
              : "Connect Broker"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BrokerConnectionDialog;
