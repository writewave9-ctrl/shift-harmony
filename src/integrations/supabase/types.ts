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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          id: string
          is_proximity_based: boolean | null
          manual_override_by: string | null
          override_notes: string | null
          override_timestamp: string | null
          shift_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          is_proximity_based?: boolean | null
          manual_override_by?: string | null
          override_notes?: string | null
          override_timestamp?: string | null
          shift_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          is_proximity_based?: boolean | null
          manual_override_by?: string | null
          override_notes?: string | null
          override_timestamp?: string | null
          shift_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_manual_override_by_fkey"
            columns: ["manual_override_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_settings: {
        Row: {
          availability_type: Database["public"]["Enums"]["availability_type"]
          created_at: string
          day_of_week: number | null
          end_time: string | null
          id: string
          notes: string | null
          specific_date: string | null
          start_time: string | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          availability_type?: Database["public"]["Enums"]["availability_type"]
          created_at?: string
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          specific_date?: string | null
          start_time?: string | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          availability_type?: Database["public"]["Enums"]["availability_type"]
          created_at?: string
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          specific_date?: string | null
          start_time?: string | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_settings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_off_requests: {
        Row: {
          created_at: string
          custom_reason: string | null
          id: string
          reason: Database["public"]["Enums"]["call_off_reason"]
          shift_id: string
          status: Database["public"]["Enums"]["swap_request_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          custom_reason?: string | null
          id?: string
          reason: Database["public"]["Enums"]["call_off_reason"]
          shift_id: string
          status?: Database["public"]["Enums"]["swap_request_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          custom_reason?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["call_off_reason"]
          shift_id?: string
          status?: Database["public"]["Enums"]["swap_request_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_off_requests_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_off_requests_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          read: boolean
          related_shift_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          read?: boolean
          related_shift_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          read?: boolean
          related_shift_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_shift_id_fkey"
            columns: ["related_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: Database["public"]["Enums"]["org_plan"]
          plan_started_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: Database["public"]["Enums"]["org_plan"]
          plan_started_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["org_plan"]
          plan_started_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_team_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          organization_id: string | null
          phone: string | null
          position: string | null
          reliability_score: number | null
          team_id: string | null
          updated_at: string
          user_id: string
          weekly_hours_target: number | null
          willingness_for_extra:
            | Database["public"]["Enums"]["willingness_level"]
            | null
        }
        Insert: {
          active_team_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          reliability_score?: number | null
          team_id?: string | null
          updated_at?: string
          user_id: string
          weekly_hours_target?: number | null
          willingness_for_extra?:
            | Database["public"]["Enums"]["willingness_level"]
            | null
        }
        Update: {
          active_team_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          reliability_score?: number | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
          weekly_hours_target?: number | null
          willingness_for_extra?:
            | Database["public"]["Enums"]["willingness_level"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_team_id_fkey"
            columns: ["active_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          last_seen_at: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shift_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          shift_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          shift_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_messages_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_reminders_sent: {
        Row: {
          created_at: string
          id: string
          reminder_for: string
          shift_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminder_for: string
          shift_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reminder_for?: string
          shift_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_reminders_sent_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shift_id: string
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_id: string
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shift_id?: string
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requests_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requests_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          check_in_radius_meters: number | null
          created_at: string
          created_by: string | null
          days_of_week: number[] | null
          end_time: string
          id: string
          is_active: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          notes: string | null
          position: string
          start_time: string
          team_id: string
          updated_at: string
        }
        Insert: {
          check_in_radius_meters?: number | null
          created_at?: string
          created_by?: string | null
          days_of_week?: number[] | null
          end_time: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          notes?: string | null
          position: string
          start_time: string
          team_id: string
          updated_at?: string
        }
        Update: {
          check_in_radius_meters?: number | null
          created_at?: string
          created_by?: string | null
          days_of_week?: number[] | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          notes?: string | null
          position?: string
          start_time?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          assigned_worker_id: string | null
          check_in_radius_meters: number | null
          created_at: string
          date: string
          end_time: string
          id: string
          is_vacant: boolean
          latitude: number | null
          location: string
          longitude: number | null
          notes: string | null
          position: string
          start_time: string
          status: Database["public"]["Enums"]["shift_status"]
          team_id: string
          updated_at: string
        }
        Insert: {
          assigned_worker_id?: string | null
          check_in_radius_meters?: number | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          is_vacant?: boolean
          latitude?: number | null
          location: string
          longitude?: number | null
          notes?: string | null
          position: string
          start_time: string
          status?: Database["public"]["Enums"]["shift_status"]
          team_id: string
          updated_at?: string
        }
        Update: {
          assigned_worker_id?: string | null
          check_in_radius_meters?: number | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          is_vacant?: boolean
          latitude?: number | null
          location?: string
          longitude?: number | null
          notes?: string | null
          position?: string
          start_time?: string
          status?: Database["public"]["Enums"]["shift_status"]
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          body: string
          created_at: string
          id: string
          opened_by: string
          organization_id: string
          priority: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          opened_by: string
          organization_id: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          opened_by?: string
          organization_id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      swap_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          is_open_to_all: boolean | null
          reason: string
          requested_worker_id: string | null
          requester_id: string
          shift_id: string
          status: Database["public"]["Enums"]["swap_request_status"]
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          is_open_to_all?: boolean | null
          reason: string
          requested_worker_id?: string | null
          requester_id: string
          shift_id: string
          status?: Database["public"]["Enums"]["swap_request_status"]
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          is_open_to_all?: boolean | null
          reason?: string
          requested_worker_id?: string | null
          requester_id?: string
          shift_id?: string
          status?: Database["public"]["Enums"]["swap_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "swap_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_requested_worker_id_fkey"
            columns: ["requested_worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          status: string
          team_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          status?: string
          team_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          status?: string
          team_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          joined_at: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_settings: {
        Row: {
          allow_worker_shift_requests: boolean | null
          auto_approve_swaps: boolean | null
          created_at: string
          default_check_in_radius_meters: number | null
          id: string
          notification_attendance_alerts: boolean | null
          notification_shift_reminder_hours: number | null
          notification_swap_requests: boolean | null
          team_id: string
          updated_at: string
        }
        Insert: {
          allow_worker_shift_requests?: boolean | null
          auto_approve_swaps?: boolean | null
          created_at?: string
          default_check_in_radius_meters?: number | null
          id?: string
          notification_attendance_alerts?: boolean | null
          notification_shift_reminder_hours?: number | null
          notification_swap_requests?: boolean | null
          team_id: string
          updated_at?: string
        }
        Update: {
          allow_worker_shift_requests?: boolean | null
          auto_approve_swaps?: boolean | null
          created_at?: string
          default_check_in_radius_meters?: number | null
          id?: string
          notification_attendance_alerts?: boolean | null
          notification_shift_reminder_hours?: number | null
          notification_swap_requests?: boolean | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      enqueue_due_shift_reminders: { Args: never; Returns: number }
      get_org_plan: {
        Args: { _org_id: string }
        Returns: Database["public"]["Enums"]["org_plan"]
      }
      get_org_worker_count: { Args: { _org_id: string }; Returns: number }
      get_profile_id: { Args: { _user_id: string }; Returns: string }
      get_team_member_directory: {
        Args: never
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          role_position: string
        }[]
      }
      get_user_active_team: { Args: { _user_id: string }; Returns: string }
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      get_user_team: { Args: { _user_id: string }; Returns: string }
      get_user_teams: {
        Args: { _user_id: string }
        Returns: {
          is_active_team: boolean
          joined_at: string
          team_id: string
          team_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_member_of_team: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "worker"
      attendance_status:
        | "present"
        | "late"
        | "not_checked_in"
        | "manually_approved"
        | "absent"
      availability_type: "blocked" | "preferred"
      call_off_reason:
        | "sick"
        | "family_emergency"
        | "transportation"
        | "personal"
        | "other"
      org_plan: "starter" | "pro" | "enterprise"
      shift_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      swap_request_status: "pending" | "approved" | "declined" | "expired"
      willingness_level: "low" | "medium" | "high"
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
      app_role: ["admin", "manager", "worker"],
      attendance_status: [
        "present",
        "late",
        "not_checked_in",
        "manually_approved",
        "absent",
      ],
      availability_type: ["blocked", "preferred"],
      call_off_reason: [
        "sick",
        "family_emergency",
        "transportation",
        "personal",
        "other",
      ],
      org_plan: ["starter", "pro", "enterprise"],
      shift_status: ["scheduled", "in_progress", "completed", "cancelled"],
      swap_request_status: ["pending", "approved", "declined", "expired"],
      willingness_level: ["low", "medium", "high"],
    },
  },
} as const
