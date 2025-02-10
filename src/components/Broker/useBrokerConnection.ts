
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BrokerConnection, BrokerFormData } from "./types";

export const useBrokerConnection = (
  connectionToEdit: BrokerConnection | null | undefined,
  open: boolean,
  onOpenChange: (open: boolean) => void
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BrokerFormData>({
    broker_name: "",
    api_key: "",
    api_secret: "",
  });

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

      const { data: existingConnection, error: fetchError } = await supabase
        .from("broker_connections")
        .select("id")
        .eq("user_id", userId)
        .eq("broker_name", formData.broker_name)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (connectionToEdit) {
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

      queryClient.invalidateQueries({ queryKey: ["broker-connections"] });
      onOpenChange(false);
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

  return {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit,
  };
};

