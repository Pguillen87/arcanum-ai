export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          mimetype: string | null
          project_id: string
          size_bytes: number
          status: Database["public"]["Enums"]["asset_status"]
          storage_path: string
          type: Database["public"]["Enums"]["asset_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          mimetype?: string | null
          project_id: string
          size_bytes: number
          status?: Database["public"]["Enums"]["asset_status"]
          storage_path: string
          type: Database["public"]["Enums"]["asset_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          mimetype?: string | null
          project_id?: string
          size_bytes?: number
          status?: Database["public"]["Enums"]["asset_status"]
          storage_path?: string
          type?: Database["public"]["Enums"]["asset_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          reason: string
          ref_id: string | null
          ref_type: Database["public"]["Enums"]["credit_ref_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref_id?: string | null
          ref_type: Database["public"]["Enums"]["credit_ref_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref_id?: string | null
          ref_type?: Database["public"]["Enums"]["credit_ref_type"]
          user_id?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          event_id: string
          id: string
          metadata: Json | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          metadata?: Json | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          brand_voice: Json | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          brand_voice?: Json | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          brand_voice?: Json | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json | null
          plan_code: string
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          plan_code: string
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json | null
          plan_code?: string
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transcriptions: {
        Row: {
          asset_id: string
          created_at: string
          error: string | null
          id: string
          job_id: string | null
          language: string
          status: Database["public"]["Enums"]["transcription_status"]
          text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          error?: string | null
          id?: string
          job_id?: string | null
          language?: string
          status?: Database["public"]["Enums"]["transcription_status"]
          text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          error?: string | null
          id?: string
          job_id?: string | null
          language?: string
          status?: Database["public"]["Enums"]["transcription_status"]
          text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      transformations: {
        Row: {
          cost_credits: number | null
          created_at: string
          error: string | null
          id: string
          idempotency_key: string | null
          outputs: Json | null
          params: Json
          project_id: string
          source_asset_id: string | null
          status: Database["public"]["Enums"]["transformation_status"]
          type: Database["public"]["Enums"]["transformation_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_credits?: number | null
          created_at?: string
          error?: string | null
          id?: string
          idempotency_key?: string | null
          outputs?: Json | null
          params?: Json
          project_id: string
          source_asset_id?: string | null
          status?: Database["public"]["Enums"]["transformation_status"]
          type: Database["public"]["Enums"]["transformation_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_credits?: number | null
          created_at?: string
          error?: string | null
          id?: string
          idempotency_key?: string | null
          outputs?: Json | null
          params?: Json
          project_id?: string
          source_asset_id?: string | null
          status?: Database["public"]["Enums"]["transformation_status"]
          type?: Database["public"]["Enums"]["transformation_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transformations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transformations_source_asset_id_fkey"
            columns: ["source_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_old_completed_jobs: { Args: never; Returns: number }
      auth_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      cleanup_orphaned_data: { Args: never; Returns: undefined }
      dashboard_stats: { Args: never; Returns: Json }
      default_username: { Args: { _id: string }; Returns: string }
      delete_user_data: {
        Args: { user_id_to_delete: string }
        Returns: undefined
      }
      username_suggest: { Args: { base_name: string }; Returns: string }
    }
    Enums: {
      asset_status: "uploading" | "processing" | "ready" | "failed"
      asset_type: "text" | "audio" | "video"
      credit_ref_type:
        | "transformation"
        | "transcription"
        | "video_short"
        | "purchase"
        | "refund"
        | "bonus"
      payment_provider: "stripe" | "mp"
      payment_status:
        | "pending"
        | "approved"
        | "rejected"
        | "refunded"
        | "failed"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "paused"
      transcription_status: "queued" | "processing" | "completed" | "failed"
      transformation_status: "queued" | "processing" | "completed" | "failed"
      transformation_type:
        | "post"
        | "resumo"
        | "newsletter"
        | "roteiro"
        | "video_short"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      asset_status: ["uploading", "processing", "ready", "failed"],
      asset_type: ["text", "audio", "video"],
      credit_ref_type: [
        "transformation",
        "transcription",
        "video_short",
        "purchase",
        "refund",
        "bonus",
      ],
      payment_provider: ["stripe", "mp"],
      payment_status: ["pending", "approved", "rejected", "refunded", "failed"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "paused",
      ],
      transcription_status: ["queued", "processing", "completed", "failed"],
      transformation_status: ["queued", "processing", "completed", "failed"],
      transformation_type: [
        "post",
        "resumo",
        "newsletter",
        "roteiro",
        "video_short",
      ],
    },
  },
} as const
