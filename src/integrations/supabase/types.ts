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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      farmer_profiles: {
        Row: {
          cooperative: string | null
          county: string | null
          created_at: string
          crops: string[] | null
          date_of_birth: string | null
          disability_details: string | null
          farm_size_acres: number | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          has_disability: boolean | null
          household_size: number | null
          id: string
          is_youth: boolean | null
          livestock: string[] | null
          mobile_money_provider: string | null
          national_id: string | null
          sub_county: string | null
          updated_at: string
          ward: string | null
        }
        Insert: {
          cooperative?: string | null
          county?: string | null
          created_at?: string
          crops?: string[] | null
          date_of_birth?: string | null
          disability_details?: string | null
          farm_size_acres?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          has_disability?: boolean | null
          household_size?: number | null
          id: string
          is_youth?: boolean | null
          livestock?: string[] | null
          mobile_money_provider?: string | null
          national_id?: string | null
          sub_county?: string | null
          updated_at?: string
          ward?: string | null
        }
        Update: {
          cooperative?: string | null
          county?: string | null
          created_at?: string
          crops?: string[] | null
          date_of_birth?: string | null
          disability_details?: string | null
          farm_size_acres?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          has_disability?: boolean | null
          household_size?: number | null
          id?: string
          is_youth?: boolean | null
          livestock?: string[] | null
          mobile_money_provider?: string | null
          national_id?: string | null
          sub_county?: string | null
          updated_at?: string
          ward?: string | null
        }
        Relationships: []
      }
      lender_profiles: {
        Row: {
          branch: string | null
          contact_person: string | null
          created_at: string
          id: string
          institution_name: string
          institution_size: string | null
          institution_type: Database["public"]["Enums"]["institution_type"]
          regulatory_license: string | null
          staff_role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          branch?: string | null
          contact_person?: string | null
          created_at?: string
          id: string
          institution_name: string
          institution_size?: string | null
          institution_type?: Database["public"]["Enums"]["institution_type"]
          regulatory_license?: string | null
          staff_role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          branch?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          institution_name?: string
          institution_size?: string | null
          institution_type?: Database["public"]["Enums"]["institution_type"]
          regulatory_license?: string | null
          staff_role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      loan_applications: {
        Row: {
          ai_confidence: number | null
          ai_recommendation: string | null
          amount_kes: number
          climate_risk_snapshot: string | null
          created_at: string
          farmer_id: string
          id: string
          lender_id: string | null
          purpose: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          top_negative_factors: string[] | null
          top_positive_factors: string[] | null
          trust_score_snapshot: number | null
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_recommendation?: string | null
          amount_kes: number
          climate_risk_snapshot?: string | null
          created_at?: string
          farmer_id: string
          id?: string
          lender_id?: string | null
          purpose?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number
          top_negative_factors?: string[] | null
          top_positive_factors?: string[] | null
          trust_score_snapshot?: number | null
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_recommendation?: string | null
          amount_kes?: number
          climate_risk_snapshot?: string | null
          created_at?: string
          farmer_id?: string
          id?: string
          lender_id?: string | null
          purpose?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number
          top_negative_factors?: string[] | null
          top_positive_factors?: string[] | null
          trust_score_snapshot?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_contact_method: string | null
          preferred_language: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trust_scores: {
        Row: {
          climate_risk: string
          components: Json | null
          computed_at: string
          credit_readiness: number
          farmer_id: string
          id: string
          loan_eligibility_kes: number | null
          recommendations: string[] | null
          score: number
          top_negative_factors: string[] | null
          top_positive_factors: string[] | null
        }
        Insert: {
          climate_risk?: string
          components?: Json | null
          computed_at?: string
          credit_readiness?: number
          farmer_id: string
          id?: string
          loan_eligibility_kes?: number | null
          recommendations?: string[] | null
          score: number
          top_negative_factors?: string[] | null
          top_positive_factors?: string[] | null
        }
        Update: {
          climate_risk?: string
          components?: Json | null
          computed_at?: string
          credit_readiness?: number
          farmer_id?: string
          id?: string
          loan_eligibility_kes?: number | null
          recommendations?: string[] | null
          score?: number
          top_negative_factors?: string[] | null
          top_positive_factors?: string[] | null
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_lender_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "farmer"
        | "loan_officer"
        | "credit_manager"
        | "institution_admin"
        | "system_admin"
      gender_type: "male" | "female" | "non_binary" | "prefer_not_to_say"
      institution_type:
        | "bank"
        | "sacco"
        | "mfi"
        | "cooperative"
        | "ngo"
        | "government"
      loan_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "disbursed"
        | "repaid"
        | "defaulted"
      notification_type:
        | "rain_alert"
        | "loan_approval"
        | "loan_rejection"
        | "repayment_reminder"
        | "training"
        | "insurance"
        | "recommendation"
        | "system"
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
      app_role: [
        "farmer",
        "loan_officer",
        "credit_manager",
        "institution_admin",
        "system_admin",
      ],
      gender_type: ["male", "female", "non_binary", "prefer_not_to_say"],
      institution_type: [
        "bank",
        "sacco",
        "mfi",
        "cooperative",
        "ngo",
        "government",
      ],
      loan_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "disbursed",
        "repaid",
        "defaulted",
      ],
      notification_type: [
        "rain_alert",
        "loan_approval",
        "loan_rejection",
        "repayment_reminder",
        "training",
        "insurance",
        "recommendation",
        "system",
      ],
    },
  },
} as const
