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
      admin_access_logs: {
        Row: {
          accessed_at: string | null
          admin_id: string | null
          id: string
          ip_address: string | null
        }
        Insert: {
          accessed_at?: string | null
          admin_id?: string | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          accessed_at?: string | null
          admin_id?: string | null
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_access_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          awarded_at: string | null
          badge_expiry_date: string
          badge_type: string
          contractor_id: string
          id: string
          review_count_last_6_months: number | null
        }
        Insert: {
          awarded_at?: string | null
          badge_expiry_date: string
          badge_type: string
          contractor_id: string
          id?: string
          review_count_last_6_months?: number | null
        }
        Update: {
          awarded_at?: string | null
          badge_expiry_date?: string
          badge_type?: string
          contractor_id?: string
          id?: string
          review_count_last_6_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "badges_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badges_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "badges_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_wallet: {
        Row: {
          balance_credits: number | null
          contractor_id: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          balance_credits?: number | null
          contractor_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          balance_credits?: number | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_wallet_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: true
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_wallet_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: true
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "contractor_wallet_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: true
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          badge_id: string | null
          bio: string | null
          business_name: string | null
          business_type: string | null
          business_verification_expiry_date: string | null
          categories: string[] | null
          category: string
          created_at: string | null
          director_ids: Json | null
          doc_business_reg: string | null
          doc_gra: string | null
          doc_id_back: string | null
          doc_id_card: string | null
          doc_id_front: string | null
          doc_nis: string | null
          doc_passport: string | null
          doc_profile: string | null
          facebook_page_url: string | null
          id: string
          id_verification_expiry_date: string | null
          id_verification_status: string | null
          is_business: boolean | null
          is_mock_data: boolean | null
          is_verified_business: boolean | null
          materials_supplied: Json | null
          other_trade_description: string | null
          payment_method_details: string | null
          payout_details: string | null
          portfolio_images: string[] | null
          profile_id: string
          rating: number | null
          region: string
          review_count: number | null
          secondary_trades: string[] | null
          tier: string | null
          tier_expires_at: string | null
          total_leads_unlocked: number | null
          trade_license_doc_url: string | null
          trade_license_expiry_date: string | null
          trade_license_number: string | null
          trade_license_status: string | null
          trial_shortlists_used: number | null
          trial_started_at: string | null
          verification_doc_url: string | null
          verification_status: string
          verified: boolean | null
          years_experience: number | null
        }
        Insert: {
          badge_id?: string | null
          bio?: string | null
          business_name?: string | null
          business_type?: string | null
          business_verification_expiry_date?: string | null
          categories?: string[] | null
          category: string
          created_at?: string | null
          director_ids?: Json | null
          doc_business_reg?: string | null
          doc_gra?: string | null
          doc_id_back?: string | null
          doc_id_card?: string | null
          doc_id_front?: string | null
          doc_nis?: string | null
          doc_passport?: string | null
          doc_profile?: string | null
          facebook_page_url?: string | null
          id?: string
          id_verification_expiry_date?: string | null
          id_verification_status?: string | null
          is_business?: boolean | null
          is_mock_data?: boolean | null
          is_verified_business?: boolean | null
          materials_supplied?: Json | null
          other_trade_description?: string | null
          payment_method_details?: string | null
          payout_details?: string | null
          portfolio_images?: string[] | null
          profile_id: string
          rating?: number | null
          region: string
          review_count?: number | null
          secondary_trades?: string[] | null
          tier?: string | null
          tier_expires_at?: string | null
          total_leads_unlocked?: number | null
          trade_license_doc_url?: string | null
          trade_license_expiry_date?: string | null
          trade_license_number?: string | null
          trade_license_status?: string | null
          trial_shortlists_used?: number | null
          trial_started_at?: string | null
          verification_doc_url?: string | null
          verification_status?: string
          verified?: boolean | null
          years_experience?: number | null
        }
        Update: {
          badge_id?: string | null
          bio?: string | null
          business_name?: string | null
          business_type?: string | null
          business_verification_expiry_date?: string | null
          categories?: string[] | null
          category?: string
          created_at?: string | null
          director_ids?: Json | null
          doc_business_reg?: string | null
          doc_gra?: string | null
          doc_id_back?: string | null
          doc_id_card?: string | null
          doc_id_front?: string | null
          doc_nis?: string | null
          doc_passport?: string | null
          doc_profile?: string | null
          facebook_page_url?: string | null
          id?: string
          id_verification_expiry_date?: string | null
          id_verification_status?: string | null
          is_business?: boolean | null
          is_mock_data?: boolean | null
          is_verified_business?: boolean | null
          materials_supplied?: Json | null
          other_trade_description?: string | null
          payment_method_details?: string | null
          payout_details?: string | null
          portfolio_images?: string[] | null
          profile_id?: string
          rating?: number | null
          region?: string
          review_count?: number | null
          secondary_trades?: string[] | null
          tier?: string | null
          tier_expires_at?: string | null
          total_leads_unlocked?: number | null
          trade_license_doc_url?: string | null
          trade_license_expiry_date?: string | null
          trade_license_number?: string | null
          trade_license_status?: string | null
          trial_shortlists_used?: number | null
          trial_started_at?: string | null
          verification_doc_url?: string | null
          verification_status?: string
          verified?: boolean | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_users: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          profile_data: Json | null
          user_type: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          profile_data?: Json | null
          user_type?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          profile_data?: Json | null
          user_type?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          contractor_id: string
          created_at: string | null
          experience_message: string | null
          id: string
          interest_message: string | null
          is_demo: boolean | null
          job_id: string
          status: string
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          experience_message?: string | null
          id?: string
          interest_message?: string | null
          is_demo?: boolean | null
          job_id: string
          status?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          experience_message?: string | null
          id?: string
          interest_message?: string | null
          is_demo?: boolean | null
          job_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "job_applications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: string
          created_at: string | null
          description: string | null
          homeowner_id: string
          id: string
          is_demo: boolean | null
          is_mock_data: boolean | null
          location: string | null
          region: string
          status: string | null
          title: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          homeowner_id: string
          id?: string
          is_demo?: boolean | null
          is_mock_data?: boolean | null
          location?: string | null
          region: string
          status?: string | null
          title: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          homeowner_id?: string
          id?: string
          is_demo?: boolean | null
          is_mock_data?: boolean | null
          location?: string | null
          region?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_disputes: {
        Row: {
          admin_notes: string | null
          application_id: string | null
          contractor_id: string | null
          created_at: string | null
          id: string
          is_auto_refunded: boolean | null
          reason: string
          resolved_at: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          application_id?: string | null
          contractor_id?: string | null
          created_at?: string | null
          id?: string
          is_auto_refunded?: boolean | null
          reason: string
          resolved_at?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          application_id?: string | null
          contractor_id?: string | null
          created_at?: string | null
          id?: string
          is_auto_refunded?: boolean | null
          reason?: string
          resolved_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_disputes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_disputes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_disputes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_disputes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "lead_disputes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          contractor_id: string
          cost_gyd: number
          homeowner_phone: string
          id: string
          job_id: string
          unlocked_at: string | null
        }
        Insert: {
          contractor_id: string
          cost_gyd: number
          homeowner_phone: string
          id?: string
          job_id: string
          unlocked_at?: string | null
        }
        Update: {
          contractor_id?: string
          cost_gyd?: number
          homeowner_phone?: string
          id?: string
          job_id?: string
          unlocked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "leads_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          agreement_id: string | null
          amount_gyd: number
          contractor_confirmed_paid_at: string | null
          contractor_id: string | null
          created_at: string | null
          homeowner_approved_at: string | null
          homeowner_id: string | null
          id: string
          job_id: string | null
          payment_method_details: string | null
          phase_name: string
          receipt_url: string | null
          status: string | null
        }
        Insert: {
          agreement_id?: string | null
          amount_gyd: number
          contractor_confirmed_paid_at?: string | null
          contractor_id?: string | null
          created_at?: string | null
          homeowner_approved_at?: string | null
          homeowner_id?: string | null
          id?: string
          job_id?: string | null
          payment_method_details?: string | null
          phase_name: string
          receipt_url?: string | null
          status?: string | null
        }
        Update: {
          agreement_id?: string | null
          amount_gyd?: number
          contractor_confirmed_paid_at?: string | null
          contractor_id?: string | null
          created_at?: string | null
          homeowner_approved_at?: string | null
          homeowner_id?: string | null
          id?: string
          job_id?: string | null
          payment_method_details?: string | null
          phase_name?: string
          receipt_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "project_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "milestones_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_broadcast: boolean | null
          is_read: boolean
          message: string
          sender_name: string | null
          sender_type: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean
          message?: string
          sender_name?: string | null
          sender_type?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_broadcast?: boolean | null
          is_read?: boolean
          message?: string
          sender_name?: string | null
          sender_type?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepted_policy_version: number | null
          avatar_url: string | null
          created_at: string | null
          deleted_at: string | null
          full_name: string
          id: string
          is_admin: boolean | null
          is_mock_data: boolean | null
          is_project_owner: boolean | null
          is_tradesperson: boolean | null
          location: string | null
          phone: string | null
          region: string
          reliable_payer_points: number | null
          role: string
          trustworthy_pro_points: number | null
        }
        Insert: {
          accepted_policy_version?: number | null
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          full_name: string
          id: string
          is_admin?: boolean | null
          is_mock_data?: boolean | null
          is_project_owner?: boolean | null
          is_tradesperson?: boolean | null
          location?: string | null
          phone?: string | null
          region: string
          reliable_payer_points?: number | null
          role: string
          trustworthy_pro_points?: number | null
        }
        Update: {
          accepted_policy_version?: number | null
          avatar_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          full_name?: string
          id?: string
          is_admin?: boolean | null
          is_mock_data?: boolean | null
          is_project_owner?: boolean | null
          is_tradesperson?: boolean | null
          location?: string | null
          phone?: string | null
          region?: string
          reliable_payer_points?: number | null
          role?: string
          trustworthy_pro_points?: number | null
        }
        Relationships: []
      }
      project_agreements: {
        Row: {
          accepted_at: string | null
          contractor_id: string | null
          created_at: string | null
          homeowner_id: string | null
          id: string
          job_id: string | null
          quote_id: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          contractor_id?: string | null
          created_at?: string | null
          homeowner_id?: string | null
          id?: string
          job_id?: string | null
          quote_id?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          contractor_id?: string | null
          created_at?: string | null
          homeowner_id?: string | null
          id?: string
          job_id?: string | null
          quote_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_agreements_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_agreements_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "project_agreements_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_agreements_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_agreements_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_agreements_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          contractor_id: string | null
          created_at: string | null
          estimated_timeline: string
          id: string
          is_demo: boolean | null
          job_id: string | null
          proposed_price: number
          quote_document_url: string | null
          status: string | null
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string | null
          estimated_timeline: string
          id?: string
          is_demo?: boolean | null
          job_id?: string | null
          proposed_price: number
          quote_document_url?: string | null
          status?: string | null
        }
        Update: {
          contractor_id?: string | null
          created_at?: string | null
          estimated_timeline?: string
          id?: string
          is_demo?: boolean | null
          job_id?: string | null
          proposed_price?: number
          quote_document_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "quotes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          contractor_id: string
          created_at: string | null
          id: string
          is_mock_data: boolean | null
          job_id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          contractor_id: string
          created_at?: string | null
          id?: string
          is_mock_data?: boolean | null
          job_id: string
          rating: number
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          contractor_id?: string
          created_at?: string | null
          id?: string
          is_mock_data?: boolean | null
          job_id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "reviews_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlists: {
        Row: {
          contractor_id: string
          created_at: string | null
          homeowner_id: string
          id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          homeowner_id: string
          id?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          homeowner_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlists_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "shortlists_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlists_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          created_at: string | null
          description: string
          id: string
          is_mock_data: boolean | null
          location: string | null
          name: string
          project_type: string | null
          rating: number | null
          testimonial_comment: string | null
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          created_at?: string | null
          description: string
          id?: string
          is_mock_data?: boolean | null
          location?: string | null
          name: string
          project_type?: string | null
          rating?: number | null
          testimonial_comment?: string | null
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          created_at?: string | null
          description?: string
          id?: string
          is_mock_data?: boolean | null
          location?: string | null
          name?: string
          project_type?: string | null
          rating?: number | null
          testimonial_comment?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          is_mock_data: boolean | null
          name: string
          rating: number
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_mock_data?: boolean | null
          name: string
          rating: number
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_mock_data?: boolean | null
          name?: string
          rating?: number
          user_id?: string | null
        }
        Relationships: []
      }
      verification_logs: {
        Row: {
          confidence_scores: Json | null
          created_at: string | null
          cross_check_results: Json | null
          document_type: string
          extracted_fields: Json | null
          id: string
          user_id: string | null
          verification_id: string | null
        }
        Insert: {
          confidence_scores?: Json | null
          created_at?: string | null
          cross_check_results?: Json | null
          document_type: string
          extracted_fields?: Json | null
          id?: string
          user_id?: string | null
          verification_id?: string | null
        }
        Update: {
          confidence_scores?: Json | null
          created_at?: string | null
          cross_check_results?: Json | null
          document_type?: string
          extracted_fields?: Json | null
          id?: string
          user_id?: string | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          admin_notes: string | null
          confidence: number | null
          created_at: string | null
          cross_check_results: Json | null
          document_type: string | null
          document_url: string | null
          errors: string[] | null
          extracted_data: Json | null
          filename: string | null
          id: string
          log_url: string | null
          original_filename: string | null
          source: string | null
          status: string | null
          user_id: string | null
          warnings: string[] | null
        }
        Insert: {
          admin_notes?: string | null
          confidence?: number | null
          created_at?: string | null
          cross_check_results?: Json | null
          document_type?: string | null
          document_url?: string | null
          errors?: string[] | null
          extracted_data?: Json | null
          filename?: string | null
          id?: string
          log_url?: string | null
          original_filename?: string | null
          source?: string | null
          status?: string | null
          user_id?: string | null
          warnings?: string[] | null
        }
        Update: {
          admin_notes?: string | null
          confidence?: number | null
          created_at?: string | null
          cross_check_results?: Json | null
          document_type?: string | null
          document_url?: string | null
          errors?: string[] | null
          extracted_data?: Json | null
          filename?: string | null
          id?: string
          log_url?: string | null
          original_filename?: string | null
          source?: string | null
          status?: string | null
          user_id?: string | null
          warnings?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          admin_notes: string | null
          amount_credits: number
          amount_gyd: number
          contractor_id: string
          created_at: string | null
          id: string
          mmg_number_used: string | null
          mmg_transaction_id: string | null
          related_quote_id: string | null
          screenshot_url: string | null
          status: string | null
          transaction_type: string
        }
        Insert: {
          admin_notes?: string | null
          amount_credits: number
          amount_gyd: number
          contractor_id: string
          created_at?: string | null
          id?: string
          mmg_number_used?: string | null
          mmg_transaction_id?: string | null
          related_quote_id?: string | null
          screenshot_url?: string | null
          status?: string | null
          transaction_type: string
        }
        Update: {
          admin_notes?: string | null
          amount_credits?: number
          amount_gyd?: number
          contractor_id?: string
          created_at?: string | null
          id?: string
          mmg_number_used?: string | null
          mmg_transaction_id?: string | null
          related_quote_id?: string | null
          screenshot_url?: string | null
          status?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "wallet_transactions_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_related_quote_id_fkey"
            columns: ["related_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      category_contractor_counts: {
        Row: {
          category: string | null
          mock_contractors: number | null
          real_contractors: number | null
          total_contractors: number | null
        }
        Relationships: []
      }
      contractor_ranking: {
        Row: {
          average_rating: number | null
          category: string | null
          id: string | null
          profile_id: string | null
          region: string | null
          tier: string | null
          tier_rank: number | null
          total_reviews: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_stats: {
        Row: {
          average_rating: number | null
          contractor_id: string | null
          total_reviews: number | null
        }
        Relationships: []
      }
      job_applications_with_details: {
        Row: {
          application_status: string | null
          applied_at: string | null
          avatar_url: string | null
          average_rating: number | null
          category: string | null
          contractor_id: string | null
          cover_letter: string | null
          doc_id_card: string | null
          doc_passport: string | null
          estimated_timeline: string | null
          full_name: string | null
          id: string | null
          id_verification_status: string | null
          job_id: string | null
          job_status: string | null
          job_title: string | null
          owner_id: string | null
          phone: string | null
          profile_id: string | null
          proposed_price: number | null
          quote_document_url: string | null
          quote_status: string | null
          quote_submitted_at: string | null
          request_message: string | null
          tier: string | null
          total_reviews: number | null
          verification_status: string | null
          years_experience: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_ranking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_stats"
            referencedColumns: ["contractor_id"]
          },
          {
            foreignKeyName: "job_applications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_homeowner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      region_contractor_counts: {
        Row: {
          mock_contractors: number | null
          real_contractors: number | null
          region: string | null
          total_contractors: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
