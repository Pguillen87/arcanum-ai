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
      agent_integration_links: {
        Row: {
          agent_id: number
          created_at: string
          id: number
          is_active: boolean
          organization_integration_id: number
          role: Database["public"]["Enums"]["AgentIntegrationRole"]
          updated_at: string
        }
        Insert: {
          agent_id: number
          created_at?: string
          id?: number
          is_active?: boolean
          organization_integration_id: number
          role?: Database["public"]["Enums"]["AgentIntegrationRole"]
          updated_at: string
        }
        Update: {
          agent_id?: number
          created_at?: string
          id?: number
          is_active?: boolean
          organization_integration_id?: number
          role?: Database["public"]["Enums"]["AgentIntegrationRole"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_integration_links_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_integration_links_organization_integration_id_fkey"
            columns: ["organization_integration_id"]
            isOneToOne: false
            referencedRelation: "organization_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_root_compositions: {
        Row: {
          agent_id: number
          agent_root_id: number
          created_at: string
          id: number
          is_active: boolean
          priority: number
          updated_at: string
        }
        Insert: {
          agent_id: number
          agent_root_id: number
          created_at?: string
          id?: number
          is_active?: boolean
          priority?: number
          updated_at: string
        }
        Update: {
          agent_id?: number
          agent_root_id?: number
          created_at?: string
          id?: number
          is_active?: boolean
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_root_compositions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_root_compositions_agent_root_id_fkey"
            columns: ["agent_root_id"]
            isOneToOne: false
            referencedRelation: "agent_roots"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_roots: {
        Row: {
          agent_builder_workflow_id: string | null
          base_instructions: string | null
          category: string
          created_at: string
          created_by_user_id: number | null
          description: string | null
          id: number
          is_active: boolean
          name: string
          open_ai_assistant_id: string | null
          tools: Json | null
          updated_at: string
        }
        Insert: {
          agent_builder_workflow_id?: string | null
          base_instructions?: string | null
          category: string
          created_at?: string
          created_by_user_id?: number | null
          description?: string | null
          id?: number
          is_active?: boolean
          name: string
          open_ai_assistant_id?: string | null
          tools?: Json | null
          updated_at: string
        }
        Update: {
          agent_builder_workflow_id?: string | null
          base_instructions?: string | null
          category?: string
          created_at?: string
          created_by_user_id?: number | null
          description?: string | null
          id?: number
          is_active?: boolean
          name?: string
          open_ai_assistant_id?: string | null
          tools?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_roots_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tools: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: number
          is_active: boolean
          monthly_price: number
          name: string
          openai_tool_config: Json | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean
          monthly_price: number
          name: string
          openai_tool_config?: Json | null
          updated_at: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean
          monthly_price?: number
          name?: string
          openai_tool_config?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      agent_versions: {
        Row: {
          agent_id: number
          base_prompt: string | null
          configuration: Json | null
          created_at: string
          created_by_user_id: number | null
          id: number
          max_tokens: number | null
          temperature: number | null
          version_number: number
        }
        Insert: {
          agent_id: number
          base_prompt?: string | null
          configuration?: Json | null
          created_at?: string
          created_by_user_id?: number | null
          id?: number
          max_tokens?: number | null
          temperature?: number | null
          version_number: number
        }
        Update: {
          agent_id?: number
          base_prompt?: string | null
          configuration?: Json | null
          created_at?: string
          created_by_user_id?: number | null
          id?: number
          max_tokens?: number | null
          temperature?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_versions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_versions_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agent_type: Database["public"]["Enums"]["AgentType"]
          allowed_phone_number: string | null
          base_instructions: string | null
          created_at: string
          created_by_user_id: number | null
          current_version_id: number | null
          deleted_at: string | null
          description: string | null
          enabled_tools: Json | null
          evolution_instance_name: string | null
          id: number
          is_deleted: boolean
          name: string
          open_ai_assistant_id: string | null
          organization_id: number
          parameters: Json | null
          personality_config: Json | null
          selected_model_plan_id: number | null
          status: Database["public"]["Enums"]["AgentStatus"]
          temperature_indicator: number | null
          updated_at: string
        }
        Insert: {
          agent_type?: Database["public"]["Enums"]["AgentType"]
          allowed_phone_number?: string | null
          base_instructions?: string | null
          created_at?: string
          created_by_user_id?: number | null
          current_version_id?: number | null
          deleted_at?: string | null
          description?: string | null
          enabled_tools?: Json | null
          evolution_instance_name?: string | null
          id?: number
          is_deleted?: boolean
          name: string
          open_ai_assistant_id?: string | null
          organization_id: number
          parameters?: Json | null
          personality_config?: Json | null
          selected_model_plan_id?: number | null
          status?: Database["public"]["Enums"]["AgentStatus"]
          temperature_indicator?: number | null
          updated_at: string
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["AgentType"]
          allowed_phone_number?: string | null
          base_instructions?: string | null
          created_at?: string
          created_by_user_id?: number | null
          current_version_id?: number | null
          deleted_at?: string | null
          description?: string | null
          enabled_tools?: Json | null
          evolution_instance_name?: string | null
          id?: number
          is_deleted?: boolean
          name?: string
          open_ai_assistant_id?: string | null
          organization_id?: number
          parameters?: Json | null
          personality_config?: Json | null
          selected_model_plan_id?: number | null
          status?: Database["public"]["Enums"]["AgentStatus"]
          temperature_indicator?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "agents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_selected_model_plan_id_fkey"
            columns: ["selected_model_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["AuditActionType"] | null
          created_at: string
          details: Json | null
          id: number
          ip_address: string | null
          organization_id: number | null
          resource_id: number | null
          resource_type: string | null
          result: Database["public"]["Enums"]["AuditResult"] | null
          user_id: number | null
        }
        Insert: {
          action_type?: Database["public"]["Enums"]["AuditActionType"] | null
          created_at?: string
          details?: Json | null
          id?: number
          ip_address?: string | null
          organization_id?: number | null
          resource_id?: number | null
          resource_type?: string | null
          result?: Database["public"]["Enums"]["AuditResult"] | null
          user_id?: number | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["AuditActionType"] | null
          created_at?: string
          details?: Json | null
          id?: number
          ip_address?: string | null
          organization_id?: number | null
          resource_id?: number | null
          resource_type?: string | null
          result?: Database["public"]["Enums"]["AuditResult"] | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_threads: {
        Row: {
          agent_id: number
          created_at: string
          id: number
          instance_name: string
          last_message_at: string
          organization_id: number
          sender_number: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          agent_id: number
          created_at?: string
          id?: number
          instance_name: string
          last_message_at?: string
          organization_id: number
          sender_number: string
          thread_id: string
          updated_at: string
        }
        Update: {
          agent_id?: number
          created_at?: string
          id?: number
          instance_name?: string
          last_message_at?: string
          organization_id?: number
          sender_number?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "conversation_threads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usages: {
        Row: {
          commission_paid_at: string | null
          coupon_id: number
          discount_applied: number
          discounted_amount: number
          id: number
          is_upgrade: boolean
          organization_id: number
          original_amount: number
          parent_usage_id: number | null
          seller_commission_amount: number
          subscription_id: number
          subscription_period_months: number
          used_at: string
        }
        Insert: {
          commission_paid_at?: string | null
          coupon_id: number
          discount_applied: number
          discounted_amount: number
          id?: number
          is_upgrade?: boolean
          organization_id: number
          original_amount: number
          parent_usage_id?: number | null
          seller_commission_amount: number
          subscription_id: number
          subscription_period_months: number
          used_at?: string
        }
        Update: {
          commission_paid_at?: string | null
          coupon_id?: number
          discount_applied?: number
          discounted_amount?: number
          id?: number
          is_upgrade?: boolean
          organization_id?: number
          original_amount?: number
          parent_usage_id?: number | null
          seller_commission_amount?: number
          subscription_id?: number
          subscription_period_months?: number
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "coupon_usages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_parent_usage_id_fkey"
            columns: ["parent_usage_id"]
            isOneToOne: false
            referencedRelation: "coupon_usages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscription_billing"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by_user_id: number | null
          discount_percentage: number
          id: number
          seller_commission_percentage: number
          seller_id: number
          status: Database["public"]["Enums"]["CouponStatus"]
          updated_at: string
          usage_count: number
          usage_limit: number
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by_user_id?: number | null
          discount_percentage: number
          id?: number
          seller_commission_percentage: number
          seller_id: number
          status?: Database["public"]["Enums"]["CouponStatus"]
          updated_at: string
          usage_count?: number
          usage_limit?: number
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by_user_id?: number | null
          discount_percentage?: number
          id?: number
          seller_commission_percentage?: number
          seller_id?: number
          status?: Database["public"]["Enums"]["CouponStatus"]
          updated_at?: string
          usage_count?: number
          usage_limit?: number
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          agent_id: number | null
          content: string | null
          created_at: string
          created_by_user_id: number | null
          event_source: string | null
          event_type: Database["public"]["Enums"]["EventType"] | null
          id: number
          lead_id: number | null
          organization_id: number
          scheduled_for: string | null
          site_id: number | null
          status: Database["public"]["Enums"]["EventStatus"]
          updated_at: string
        }
        Insert: {
          agent_id?: number | null
          content?: string | null
          created_at?: string
          created_by_user_id?: number | null
          event_source?: string | null
          event_type?: Database["public"]["Enums"]["EventType"] | null
          id?: number
          lead_id?: number | null
          organization_id: number
          scheduled_for?: string | null
          site_id?: number | null
          status?: Database["public"]["Enums"]["EventStatus"]
          updated_at: string
        }
        Update: {
          agent_id?: number | null
          content?: string | null
          created_at?: string
          created_by_user_id?: number | null
          event_source?: string | null
          event_type?: Database["public"]["Enums"]["EventType"] | null
          id?: number
          lead_id?: number | null
          organization_id?: number
          scheduled_for?: string | null
          site_id?: number | null
          status?: Database["public"]["Enums"]["EventStatus"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      imports_exports: {
        Row: {
          created_at: string
          details: Json | null
          file_reference: string | null
          id: number
          operation_type: string | null
          organization_id: number
          resource_type: string | null
          status: string | null
          updated_at: string
          user_id: number | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          file_reference?: string | null
          id?: number
          operation_type?: string | null
          organization_id: number
          resource_type?: string | null
          status?: string | null
          updated_at: string
          user_id?: number | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          file_reference?: string | null
          id?: number
          operation_type?: string | null
          organization_id?: number
          resource_type?: string | null
          status?: string | null
          updated_at?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "imports_exports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "imports_exports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imports_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_types: {
        Row: {
          created_at: string
          description: string | null
          id: number
          key_identifier: string
          metadata_schema: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          key_identifier: string
          metadata_schema?: Json | null
          name: string
          updated_at: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          key_identifier?: string
          metadata_schema?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          agent_id: number | null
          content: string | null
          created_at: string
          created_by_user_id: number | null
          event_source: string | null
          event_type: Database["public"]["Enums"]["EventType"] | null
          id: number
          lead_id: number
          organization_id: number
          scheduled_for: string | null
          site_id: number | null
          status: Database["public"]["Enums"]["EventStatus"]
          updated_at: string
        }
        Insert: {
          agent_id?: number | null
          content?: string | null
          created_at?: string
          created_by_user_id?: number | null
          event_source?: string | null
          event_type?: Database["public"]["Enums"]["EventType"] | null
          id?: number
          lead_id: number
          organization_id: number
          scheduled_for?: string | null
          site_id?: number | null
          status?: Database["public"]["Enums"]["EventStatus"]
          updated_at: string
        }
        Update: {
          agent_id?: number | null
          content?: string | null
          created_at?: string
          created_by_user_id?: number | null
          event_source?: string | null
          event_type?: Database["public"]["Enums"]["EventType"] | null
          id?: number
          lead_id?: number
          organization_id?: number
          scheduled_for?: string | null
          site_id?: number | null
          status?: Database["public"]["Enums"]["EventStatus"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "lead_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_pipeline_history: {
        Row: {
          created_at: string
          entered_at: string
          estimated_value: number | null
          exited_at: string | null
          id: number
          lead_id: number
          moved_by_user_id: number | null
          pipeline_stage_id: number
          priority: number | null
        }
        Insert: {
          created_at?: string
          entered_at?: string
          estimated_value?: number | null
          exited_at?: string | null
          id?: number
          lead_id: number
          moved_by_user_id?: number | null
          pipeline_stage_id: number
          priority?: number | null
        }
        Update: {
          created_at?: string
          entered_at?: string
          estimated_value?: number | null
          exited_at?: string | null
          id?: number
          lead_id?: number
          moved_by_user_id?: number | null
          pipeline_stage_id?: number
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_pipeline_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_pipeline_history_moved_by_user_id_fkey"
            columns: ["moved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_pipeline_history_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_score_history: {
        Row: {
          changed_at: string
          changed_by_user_id: number | null
          id: number
          lead_id: number
          new_score: number | null
          old_score: number | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by_user_id?: number | null
          id?: number
          lead_id: number
          new_score?: number | null
          old_score?: number | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by_user_id?: number | null
          id?: number
          lead_id?: number
          new_score?: number | null
          old_score?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_score_history_changed_by_user_id_fkey"
            columns: ["changed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_score_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          created_at: string
          id: number
          lead_id: number
          tag_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          lead_id: number
          tag_id: number
        }
        Update: {
          created_at?: string
          id?: number
          lead_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          created_by_event_id: number | null
          current_score: number
          current_stage: Database["public"]["Enums"]["LeadStage"]
          deleted_at: string | null
          email: string | null
          id: number
          is_deleted: boolean
          last_contact_at: string | null
          name: string | null
          organization_id: number
          origin_details: Json | null
          origin_type: Database["public"]["Enums"]["LeadOriginType"] | null
          owner_user_id: number | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_event_id?: number | null
          current_score?: number
          current_stage?: Database["public"]["Enums"]["LeadStage"]
          deleted_at?: string | null
          email?: string | null
          id?: number
          is_deleted?: boolean
          last_contact_at?: string | null
          name?: string | null
          organization_id: number
          origin_details?: Json | null
          origin_type?: Database["public"]["Enums"]["LeadOriginType"] | null
          owner_user_id?: number | null
          phone?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          created_by_event_id?: number | null
          current_score?: number
          current_stage?: Database["public"]["Enums"]["LeadStage"]
          deleted_at?: string | null
          email?: string | null
          id?: number
          is_deleted?: boolean
          last_contact_at?: string | null
          name?: string | null
          organization_id?: number
          origin_details?: Json | null
          origin_type?: Database["public"]["Enums"]["LeadOriginType"] | null
          owner_user_id?: number | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_created_by_event_id_fkey"
            columns: ["created_by_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          created_at: string
          id: number
          metric_date: string | null
          metric_name: string
          metric_value: number | null
          organization_id: number
          related_entity_id: number | null
          related_entity_type: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          metric_date?: string | null
          metric_name: string
          metric_value?: number | null
          organization_id: number
          related_entity_id?: number | null
          related_entity_type?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          metric_date?: string | null
          metric_name?: string
          metric_value?: number | null
          organization_id?: number
          related_entity_id?: number | null
          related_entity_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_integrations: {
        Row: {
          configuration_metadata: Json | null
          created_at: string
          credentials: Json | null
          credentials_sensitive: boolean
          id: number
          integration_type_id: number
          last_test_at: string | null
          organization_id: number
          status: Database["public"]["Enums"]["IntegrationStatus"]
          title: string | null
          updated_at: string
        }
        Insert: {
          configuration_metadata?: Json | null
          created_at?: string
          credentials?: Json | null
          credentials_sensitive?: boolean
          id?: number
          integration_type_id: number
          last_test_at?: string | null
          organization_id: number
          status?: Database["public"]["Enums"]["IntegrationStatus"]
          title?: string | null
          updated_at: string
        }
        Update: {
          configuration_metadata?: Json | null
          created_at?: string
          credentials?: Json | null
          credentials_sensitive?: boolean
          id?: number
          integration_type_id?: number
          last_test_at?: string | null
          organization_id?: number
          status?: Database["public"]["Enums"]["IntegrationStatus"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_integrations_integration_type_id_fkey"
            columns: ["integration_type_id"]
            isOneToOne: false
            referencedRelation: "integration_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          created_at: string
          currency: string | null
          custom_limits: Json | null
          id: number
          notification_preferences: Json | null
          organization_id: number
          timezone: string | null
          updated_at: string
          webhook_tokens: Json | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          custom_limits?: Json | null
          id?: number
          notification_preferences?: Json | null
          organization_id: number
          timezone?: string | null
          updated_at: string
          webhook_tokens?: Json | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          custom_limits?: Json | null
          id?: number
          notification_preferences?: Json | null
          organization_id?: number
          timezone?: string | null
          updated_at?: string
          webhook_tokens?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_tool_subscriptions: {
        Row: {
          agent_id: number | null
          agent_tool_id: number
          cancelled_at: string | null
          id: number
          monthly_price: number
          organization_id: number
          status: Database["public"]["Enums"]["ToolSubscriptionStatus"]
          subscribed_at: string
        }
        Insert: {
          agent_id?: number | null
          agent_tool_id: number
          cancelled_at?: string | null
          id?: number
          monthly_price: number
          organization_id: number
          status?: Database["public"]["Enums"]["ToolSubscriptionStatus"]
          subscribed_at?: string
        }
        Update: {
          agent_id?: number | null
          agent_tool_id?: number
          cancelled_at?: string | null
          id?: number
          monthly_price?: number
          organization_id?: number
          status?: Database["public"]["Enums"]["ToolSubscriptionStatus"]
          subscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_tool_subscriptions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_tool_subscriptions_agent_tool_id_fkey"
            columns: ["agent_tool_id"]
            isOneToOne: false
            referencedRelation: "agent_tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_tool_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_tool_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string
          id: number
          organization_id: number
          role: Database["public"]["Enums"]["OrganizationUserRole"]
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          organization_id: number
          role?: Database["public"]["Enums"]["OrganizationUserRole"]
          updated_at: string
          user_id: number
        }
        Update: {
          created_at?: string
          id?: number
          organization_id?: number
          role?: Database["public"]["Enums"]["OrganizationUserRole"]
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          allowed_features: Json | null
          contact_email: string | null
          created_at: string
          id: number
          name: string
          organization_type: Database["public"]["Enums"]["OrganizationType"]
          plan_id: number | null
          slug: string
          status: Database["public"]["Enums"]["OrganizationStatus"]
          updated_at: string
        }
        Insert: {
          allowed_features?: Json | null
          contact_email?: string | null
          created_at?: string
          id?: number
          name: string
          organization_type?: Database["public"]["Enums"]["OrganizationType"]
          plan_id?: number | null
          slug: string
          status?: Database["public"]["Enums"]["OrganizationStatus"]
          updated_at: string
        }
        Update: {
          allowed_features?: Json | null
          contact_email?: string | null
          created_at?: string
          id?: number
          name?: string
          organization_type?: Database["public"]["Enums"]["OrganizationType"]
          plan_id?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["OrganizationStatus"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_final_stage: boolean
          name: string
          order_index: number
          pipeline_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_final_stage?: boolean
          name: string
          order_index?: number
          pipeline_id: number
          updated_at: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_final_stage?: boolean
          name?: string
          order_index?: number
          pipeline_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "sales_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          agent_type: Database["public"]["Enums"]["AgentType"] | null
          allowMultipleIntegrationTypes: boolean
          allowsRbm: boolean
          base_price: number | null
          code: Database["public"]["Enums"]["PlanCode"]
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          limitsJson: Json | null
          max_agents_allowed: number | null
          maxAgents: number | null
          maxIntegrations: number | null
          maxMessagesPerMonth: number | null
          model_capabilities: Json | null
          model_display_name: string | null
          model_name: string | null
          model_type: string | null
          name: string
          priceMonthly: number | null
          updated_at: string
        }
        Insert: {
          agent_type?: Database["public"]["Enums"]["AgentType"] | null
          allowMultipleIntegrationTypes?: boolean
          allowsRbm?: boolean
          base_price?: number | null
          code: Database["public"]["Enums"]["PlanCode"]
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          limitsJson?: Json | null
          max_agents_allowed?: number | null
          maxAgents?: number | null
          maxIntegrations?: number | null
          maxMessagesPerMonth?: number | null
          model_capabilities?: Json | null
          model_display_name?: string | null
          model_name?: string | null
          model_type?: string | null
          name: string
          priceMonthly?: number | null
          updated_at: string
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["AgentType"] | null
          allowMultipleIntegrationTypes?: boolean
          allowsRbm?: boolean
          base_price?: number | null
          code?: Database["public"]["Enums"]["PlanCode"]
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          limitsJson?: Json | null
          max_agents_allowed?: number | null
          maxAgents?: number | null
          maxIntegrations?: number | null
          maxMessagesPerMonth?: number | null
          model_capabilities?: Json | null
          model_display_name?: string | null
          model_name?: string | null
          model_type?: string | null
          name?: string
          priceMonthly?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      retention_policies: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          organization_id: number | null
          resource_type: string
          retention_days: number
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          organization_id?: number | null
          resource_type: string
          retention_days: number
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          organization_id?: number | null
          resource_type?: string
          retention_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "retention_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "retention_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_pipelines: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_default: boolean
          name: string | null
          organization_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_default?: boolean
          name?: string | null
          organization_id: number
          updated_at: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_default?: boolean
          name?: string | null
          organization_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_commissions: {
        Row: {
          commission_amount: number
          coupon_usage_id: number
          created_at: string
          id: number
          paid_at: string | null
          paid_week: string | null
          period_end: string
          period_start: string
          seller_id: number
          status: Database["public"]["Enums"]["CommissionStatus"]
          updated_at: string
        }
        Insert: {
          commission_amount: number
          coupon_usage_id: number
          created_at?: string
          id?: number
          paid_at?: string | null
          paid_week?: string | null
          period_end: string
          period_start: string
          seller_id: number
          status?: Database["public"]["Enums"]["CommissionStatus"]
          updated_at: string
        }
        Update: {
          commission_amount?: number
          coupon_usage_id?: number
          created_at?: string
          id?: number
          paid_at?: string | null
          paid_week?: string | null
          period_end?: string
          period_start?: string
          seller_id?: number
          status?: Database["public"]["Enums"]["CommissionStatus"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_commissions_coupon_usage_id_fkey"
            columns: ["coupon_usage_id"]
            isOneToOne: false
            referencedRelation: "coupon_usages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_agents: {
        Row: {
          agent_id: number
          created_at: string
          id: number
          is_active: boolean
          site_id: number
          updated_at: string
        }
        Insert: {
          agent_id: number
          created_at?: string
          id?: number
          is_active?: boolean
          site_id: number
          updated_at: string
        }
        Update: {
          agent_id?: number
          created_at?: string
          id?: number
          is_active?: boolean
          site_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_agents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string
          description: string | null
          domain_url: string | null
          id: number
          name: string | null
          organization_id: number
          status: Database["public"]["Enums"]["SiteStatus"]
          tracking_token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain_url?: string | null
          id?: number
          name?: string | null
          organization_id: number
          status?: Database["public"]["Enums"]["SiteStatus"]
          tracking_token?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain_url?: string | null
          id?: number
          name?: string | null
          organization_id?: number
          status?: Database["public"]["Enums"]["SiteStatus"]
          tracking_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_billing: {
        Row: {
          base_plan_price: number
          billing_period: string
          coupon_code: string | null
          coupon_id: number | null
          created_at: string
          discount_amount: number | null
          due_date: string
          id: number
          organization_id: number
          original_amount: number | null
          paid_at: string | null
          status: Database["public"]["Enums"]["BillingStatus"]
          tool_subscriptions_total: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          base_plan_price: number
          billing_period: string
          coupon_code?: string | null
          coupon_id?: number | null
          created_at?: string
          discount_amount?: number | null
          due_date: string
          id?: number
          organization_id: number
          original_amount?: number | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["BillingStatus"]
          tool_subscriptions_total: number
          total_amount: number
          updated_at: string
        }
        Update: {
          base_plan_price?: number
          billing_period?: string
          coupon_code?: string | null
          coupon_id?: number | null
          created_at?: string
          discount_amount?: number | null
          due_date?: string
          id?: number
          organization_id?: number
          original_amount?: number | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["BillingStatus"]
          tool_subscriptions_total?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_billing_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_billing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "subscription_billing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          organization_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          organization_id: number
          updated_at: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          organization_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "org_active_agent_counts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: number
          last_login_at: string | null
          name: string
          password_hash: string | null
          preferences: Json | null
          role: Database["public"]["Enums"]["UserRole"] | null
          status: Database["public"]["Enums"]["UserStatus"]
          updated_at: string
          user_type: Database["public"]["Enums"]["UserType"]
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          last_login_at?: string | null
          name: string
          password_hash?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["UserRole"] | null
          status?: Database["public"]["Enums"]["UserStatus"]
          updated_at: string
          user_type?: Database["public"]["Enums"]["UserType"]
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          last_login_at?: string | null
          name?: string
          password_hash?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["UserRole"] | null
          status?: Database["public"]["Enums"]["UserStatus"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["UserType"]
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      org_active_agent_counts: {
        Row: {
          active_agents: number | null
          organization_id: number | null
          organization_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      AgentIntegrationRole:
        | "primary"
        | "calendar"
        | "comms"
        | "fallback"
        | "other"
      AgentStatus: "active" | "inactive"
      AgentType: "PERSONAL" | "ENTERPRISE"
      AuditActionType:
        | "create"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "plan_change"
        | "integration_test"
      AuditResult: "success" | "failure"
      BillingStatus: "pending" | "paid" | "overdue" | "cancelled"
      CommissionStatus: "PENDING" | "PAID" | "CANCELLED"
      CouponStatus: "ACTIVE" | "INACTIVE"
      EventStatus: "pending" | "completed" | "cancelled"
      EventType:
        | "message"
        | "note"
        | "task"
        | "call"
        | "webhook_received"
        | "email"
      IntegrationStatus: "active" | "pending" | "error"
      LeadOriginType:
        | "site"
        | "agent"
        | "form"
        | "campaign"
        | "import"
        | "manual"
      LeadStage: "new" | "qualified" | "proposal" | "won" | "lost"
      OrganizationStatus: "active" | "suspended"
      OrganizationType: "PERSONAL" | "COMPANY"
      OrganizationUserRole: "owner" | "admin" | "member"
      PlanCode: "free" | "starter" | "business" | "enterprise"
      SiteStatus: "active" | "inactive"
      ToolSubscriptionStatus: "active" | "cancelled" | "paused"
      UserRole: "administrador" | "cliente"
      UserStatus: "active" | "inactive"
      UserType: "global_admin" | "organization_user" | "partner"
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
      AgentIntegrationRole: [
        "primary",
        "calendar",
        "comms",
        "fallback",
        "other",
      ],
      AgentStatus: ["active", "inactive"],
      AgentType: ["PERSONAL", "ENTERPRISE"],
      AuditActionType: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "plan_change",
        "integration_test",
      ],
      AuditResult: ["success", "failure"],
      BillingStatus: ["pending", "paid", "overdue", "cancelled"],
      CommissionStatus: ["PENDING", "PAID", "CANCELLED"],
      CouponStatus: ["ACTIVE", "INACTIVE"],
      EventStatus: ["pending", "completed", "cancelled"],
      EventType: [
        "message",
        "note",
        "task",
        "call",
        "webhook_received",
        "email",
      ],
      IntegrationStatus: ["active", "pending", "error"],
      LeadOriginType: ["site", "agent", "form", "campaign", "import", "manual"],
      LeadStage: ["new", "qualified", "proposal", "won", "lost"],
      OrganizationStatus: ["active", "suspended"],
      OrganizationType: ["PERSONAL", "COMPANY"],
      OrganizationUserRole: ["owner", "admin", "member"],
      PlanCode: ["free", "starter", "business", "enterprise"],
      SiteStatus: ["active", "inactive"],
      ToolSubscriptionStatus: ["active", "cancelled", "paused"],
      UserRole: ["administrador", "cliente"],
      UserStatus: ["active", "inactive"],
      UserType: ["global_admin", "organization_user", "partner"],
    },
  },
} as const
