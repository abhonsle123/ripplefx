
import type { Database } from "@/integrations/supabase/types";

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventType = Database["public"]["Enums"]["event_type"];
export type SeverityLevel = Database["public"]["Enums"]["severity_level"];

export interface UserPreferences {
  notifications?: {
    email?: {
      enabled: boolean;
      highSeverity: boolean;
      mediumSeverity: boolean;
      lowSeverity: boolean;
    };
    sms?: {
      enabled: boolean;
      phoneNumber: string | null;
      highSeverity: boolean;
      mediumSeverity: boolean;
      lowSeverity: boolean;
    };
  };
  filters?: {
    hideLowImpact: boolean;
  };
  tracking?: {
    industries: string[];
    companies: string[];
    event_types: string[];
  };
}

export interface TrackingPreferences {
  industries?: string[];
  companies?: string[];
  event_types?: string[];
  filters?: {
    hideLowImpact: boolean;
  };
}

export interface EconomicContext {
  state: string;
  interest_rates: string;
  inflation: string;
  unemployment: string;
  consumer_confidence: string;
  description: string;
}
