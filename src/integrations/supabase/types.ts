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
          created_at: string
          description: string | null
          event_type: string
          financial_relevance_score: number | null
          id: string
          location: string | null
          raw_data: Json | null
          severity: number | null
          source: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          financial_relevance_score?: number | null
          id?: string
          location?: string | null
          raw_data?: Json | null
          severity?: number | null
          source?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          financial_relevance_score?: number | null
          id?: string
          location?: string | null
          raw_data?: Json | null
          severity?: number | null
          source?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          content: string
          created_at: string
          error: string | null
          event_id: string
          id: string
          notification_type: string
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          channel: string
          content: string
          created_at?: string
          error?: string | null
          event_id: string
          id?: string
          notification_type: string
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          error?: string | null
          event_id?: string
          id?: string
          notification_type?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          accuracy_rating: number | null
          comments: string | null
          created_at: string
          event_id: string
          id: string
          relevance_rating: number | null
          user_id: string
        }
        Insert: {
          accuracy_rating?: number | null
          comments?: string | null
          created_at?: string
          event_id: string
          id?: string
          relevance_rating?: number | null
          user_id: string
        }
        Update: {
          accuracy_rating?: number | null
          comments?: string | null
          created_at?: string
          event_id?: string
          id?: string
          relevance_rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          event_types: string[] | null
          id: string
          industries: string[] | null
          min_financial_relevance: number | null
          min_severity: number | null
          notification_channels:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          notification_frequency: string | null
          phone_number: string | null
          regions: string[] | null
          stocks: string[] | null
          user_id: string
          verified_phone: boolean | null
        }
        Insert: {
          created_at?: string
          event_types?: string[] | null
          id?: string
          industries?: string[] | null
          min_financial_relevance?: number | null
          min_severity?: number | null
          notification_channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          notification_frequency?: string | null
          phone_number?: string | null
          regions?: string[] | null
          stocks?: string[] | null
          user_id: string
          verified_phone?: boolean | null
        }
        Update: {
          created_at?: string
          event_types?: string[] | null
          id?: string
          industries?: string[] | null
          min_financial_relevance?: number | null
          min_severity?: number | null
          notification_channels?:
            | Database["public"]["Enums"]["notification_channel"][]
            | null
          notification_frequency?: string | null
          phone_number?: string | null
          regions?: string[] | null
          stocks?: string[] | null
          user_id?: string
          verified_phone?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_valid_phone: {
        Args: {
          phone: string
        }
        Returns: boolean
      }
    }
    Enums: {
      notification_channel: "email" | "sms"
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
