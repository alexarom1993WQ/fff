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
      activities: {
        Row: {
          activity_type: string
          created_at: string | null
          details: string
          id: string
          member_id: string | null
          member_image: string | null
          member_name: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          details: string
          id?: string
          member_id?: string | null
          member_image?: string | null
          member_name?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          details?: string
          id?: string
          member_id?: string | null
          member_image?: string | null
          member_name?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          attendance_time: string
          created_at: string | null
          id: string
          member_id: string
          member_image: string | null
          member_name: string
          notes: string | null
          session_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendance_date?: string
          attendance_time?: string
          created_at?: string | null
          id?: string
          member_id: string
          member_image?: string | null
          member_name: string
          notes?: string | null
          session_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendance_date?: string
          attendance_time?: string
          created_at?: string | null
          id?: string
          member_id?: string
          member_image?: string | null
          member_name?: string
          notes?: string | null
          session_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          image_url: string | null
          last_attendance: string | null
          membership_end_date: string | null
          membership_start_date: string | null
          membership_status: string | null
          membership_type: string | null
          name: string
          note: string | null
          payment_status: string | null
          phone_number: string | null
          sessions_remaining: number | null
          subscription_price: number | null
          subscription_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          last_attendance?: string | null
          membership_end_date?: string | null
          membership_start_date?: string | null
          membership_status?: string | null
          membership_type?: string | null
          name: string
          note?: string | null
          payment_status?: string | null
          phone_number?: string | null
          sessions_remaining?: number | null
          subscription_price?: number | null
          subscription_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          last_attendance?: string | null
          membership_end_date?: string | null
          membership_start_date?: string | null
          membership_status?: string | null
          membership_type?: string | null
          name?: string
          note?: string | null
          payment_status?: string | null
          phone_number?: string | null
          sessions_remaining?: number | null
          subscription_price?: number | null
          subscription_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      non_subscribed_customers: {
        Row: {
          created_at: string | null
          customer_name: string
          email: string | null
          id: string
          last_visit_date: string | null
          notes: string | null
          phone_number: string | null
          total_amount_paid: number
          total_sessions: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_name?: string
          email?: string | null
          id?: string
          last_visit_date?: string | null
          notes?: string | null
          phone_number?: string | null
          total_amount_paid?: number
          total_sessions?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          email?: string | null
          id?: string
          last_visit_date?: string | null
          notes?: string | null
          phone_number?: string | null
          total_amount_paid?: number
          total_sessions?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          date: string | null
          id: string
          invoice_number: string | null
          member_id: string | null
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          status: string | null
          subscription_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date?: string | null
          id?: string
          invoice_number?: string | null
          member_id?: string | null
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string | null
          subscription_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string | null
          id?: string
          invoice_number?: string | null
          member_id?: string | null
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string | null
          subscription_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          member_id: string
          member_name: string
          notes: string | null
          payment_status: string
          price: number | null
          remaining_sessions: number
          start_date: string
          status: string
          subscription_type: string
          total_sessions: number
          updated_at: string | null
          used_sessions: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          member_id: string
          member_name: string
          notes?: string | null
          payment_status?: string
          price?: number | null
          remaining_sessions?: number
          start_date: string
          status?: string
          subscription_type: string
          total_sessions?: number
          updated_at?: string | null
          used_sessions?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          member_id?: string
          member_name?: string
          notes?: string | null
          payment_status?: string
          price?: number | null
          remaining_sessions?: number
          start_date?: string
          status?: string
          subscription_type?: string
          total_sessions?: number
          updated_at?: string | null
          used_sessions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          picture: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          picture?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          picture?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      weekly_attendance: {
        Row: {
          attendance_days: string[] | null
          created_at: string | null
          id: string
          member_id: string
          member_image: string | null
          member_name: string
          notes: string | null
          total_days_attended: number
          updated_at: string | null
          user_id: string
          week_end_date: string
          week_number: number
          week_start_date: string
          year: number
        }
        Insert: {
          attendance_days?: string[] | null
          created_at?: string | null
          id?: string
          member_id: string
          member_image?: string | null
          member_name: string
          notes?: string | null
          total_days_attended?: number
          updated_at?: string | null
          user_id: string
          week_end_date: string
          week_number: number
          week_start_date: string
          year: number
        }
        Update: {
          attendance_days?: string[] | null
          created_at?: string | null
          id?: string
          member_id?: string
          member_image?: string | null
          member_name?: string
          notes?: string | null
          total_days_attended?: number
          updated_at?: string | null
          user_id?: string
          week_end_date?: string
          week_number?: number
          week_start_date?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_attendance_stats: {
        Args: { p_user_id: string; p_start_date?: string; p_end_date?: string }
        Returns: {
          total_attendance: number
          unique_members: number
          avg_daily_attendance: number
        }[]
      }
      get_member_session_summary: {
        Args: { p_user_id: string; p_member_id: string }
        Returns: {
          total_sessions: number
          used_sessions: number
          remaining_sessions: number
          status: string
          last_attendance_date: string
        }[]
      }
      get_member_weekly_history: {
        Args: { p_user_id: string; p_member_id: string; p_limit?: number }
        Returns: {
          week_start_date: string
          week_end_date: string
          year: number
          week_number: number
          total_days_attended: number
          attendance_days: string[]
          attendance_percentage: number
        }[]
      }
      get_non_subscribed_stats: {
        Args: { p_user_id: string; p_start_date?: string; p_end_date?: string }
        Returns: {
          total_customers: number
          total_sessions: number
          total_revenue: number
          avg_sessions_per_customer: number
        }[]
      }
      get_weekly_attendance_summary: {
        Args: { p_user_id: string; p_year?: number; p_week?: number }
        Returns: {
          member_id: string
          member_name: string
          member_image: string
          week_start_date: string
          week_end_date: string
          total_days_attended: number
          attendance_days: string[]
          attendance_percentage: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
