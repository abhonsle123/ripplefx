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
          tracking_preferences?: Json | null
          username?: string | null
        }
        Relationships: []
      }
      stock_predictions: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          is_positive: boolean
          rationale: string
          symbol: string
          target_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          is_positive: boolean
          rationale: string
          symbol: string
          target_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          is_positive?: boolean
          rationale?: string
          symbol?: string
          target_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_predictions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stock_watches: {
        Row: {
          created_at: string
          entry_price: number | null
          id: string
          status: Database["public"]["Enums"]["stock_watch_status"] | null
          stock_prediction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entry_price?: number | null
          id?: string
          status?: Database["public"]["Enums"]["stock_watch_status"] | null
          stock_prediction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entry_price?: number | null
          id?: string
          status?: Database["public"]["Enums"]["stock_watch_status"] | null
          stock_prediction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
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
      stock_watch_status: "WATCHING" | "SOLD" | "CANCELLED"
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
