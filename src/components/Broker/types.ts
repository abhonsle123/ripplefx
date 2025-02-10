
import type { Database } from "@/integrations/supabase/types";

export type BrokerConnection = Database["public"]["Tables"]["broker_connections"]["Row"];

export interface BrokerConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionToEdit?: BrokerConnection | null;
}

export interface BrokerFormData {
  broker_name: string;
  api_key: string;
  api_secret: string;
}

