export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      broker_connections: {
        Row: {
          api_key: string
          api_secret: string
          broker_name: string
          created_at: string
          id: string
          is_active: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          api_secret: string
          broker_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          api_secret?: string
          broker_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          affected_organizations: Json | null
          city: string | null
          country: string | null
          created_at: string | null
          description: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          impact_analysis: Json | null
          latitude: number | null
          longitude: number | null
          severity: Database["public"]["Enums"]["severity_level"]
          source_api: string | null
          source_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_organizations?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          impact_analysis?: Json | null
          latitude?: number | null
          longitude?: number | null
          severity: Database["public"]["Enums"]["severity_level"]
          source_api?: string | null
          source_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_organizations?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          impact_analysis?: Json | null
          latitude?: number | null
          longitude?: number | null
          severity?: Database["public"]["Enums"]["severity_level"]
          source_api?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          created_at: string | null
          error: string | null
          event_id: string | null
          id: string
          processed: boolean | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_id?: string | null
          id?: string
          processed?: boolean | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_id?: string | null
          id?: string
          processed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          preferences: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          tracking_preferences: Json | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          preferences?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          tracking_preferences?: Json | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          preferences?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          tracking_preferences?: Json | null
          username?: string | null
        }
        Relationships: []
      }
      stock_predictions: {
        Row: {
          confidence_score: number | null
          created_at: string
          event_id: string | null
          id: string
          is_positive: boolean
          last_analysis_date: string | null
          price_change_percentage: number | null
          price_impact_analysis: Json | null
          rationale: string
          symbol: string
          target_price: number | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_positive: boolean
          last_analysis_date?: string | null
          price_change_percentage?: number | null
          price_impact_analysis?: Json | null
          rationale: string
          symbol: string
          target_price?: number | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_positive?: boolean
          last_analysis_date?: string | null
          price_change_percentage?: number | null
          price_impact_analysis?: Json | null
          rationale?: string
          symbol?: string
          target_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_predictions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_executions: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: string
          price: number
          quantity: number
          rule_id: string | null
          status: string
          stock_price: number | null
          stock_symbol: string
          trade_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: string
          price: number
          quantity: number
          rule_id?: string | null
          status: string
          stock_price?: number | null
          stock_symbol: string
          trade_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: string
          price?: number
          quantity?: number
          rule_id?: string | null
          status?: string
          stock_price?: number | null
          stock_symbol?: string
          trade_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "trading_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_executions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_rules: {
        Row: {
          created_at: string
          entry_condition: string
          exit_condition: string
          id: string
          is_active: boolean | null
          max_position_size: number
          stock_symbol: string
          stop_loss_percentage: number | null
          take_profit_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_condition: string
          exit_condition: string
          id?: string
          is_active?: boolean | null
          max_position_size: number
          stock_symbol: string
          stop_loss_percentage?: number | null
          take_profit_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_condition?: string
          exit_condition?: string
          id?: string
          is_active?: boolean | null
          max_position_size?: number
          stock_symbol?: string
          stop_loss_percentage?: number | null
          take_profit_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stock_watches: {
        Row: {
          broker_connection_id: string | null
          created_at: string
          entry_price: number | null
          id: string
          initial_price: number | null
          investment_amount: number | null
          investment_type: string | null
          last_price_check: string | null
          status: Database["public"]["Enums"]["stock_watch_status"] | null
          stock_prediction_id: string | null
          stop_order_id: string | null
          stop_price: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          broker_connection_id?: string | null
          created_at?: string
          entry_price?: number | null
          id?: string
          initial_price?: number | null
          investment_amount?: number | null
          investment_type?: string | null
          last_price_check?: string | null
          status?: Database["public"]["Enums"]["stock_watch_status"] | null
          stock_prediction_id?: string | null
          stop_order_id?: string | null
          stop_price?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          broker_connection_id?: string | null
          created_at?: string
          entry_price?: number | null
          id?: string
          initial_price?: number | null
          investment_amount?: number | null
          investment_type?: string | null
          last_price_check?: string | null
          status?: Database["public"]["Enums"]["stock_watch_status"] | null
          stock_prediction_id?: string | null
          stop_order_id?: string | null
          stop_price?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stock_watches_broker_connection_id_fkey"
            columns: ["broker_connection_id"]
            isOneToOne: false
            referencedRelation: "broker_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stock_watches_stock_prediction_id_fkey"
            columns: ["stock_prediction_id"]
            isOneToOne: false
            referencedRelation: "stock_predictions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_type: "NATURAL_DISASTER" | "GEOPOLITICAL" | "ECONOMIC" | "OTHER"
      severity_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
      stock_watch_status: "WATCHING" | "SOLD" | "CANCELLED" | "INVESTING"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
