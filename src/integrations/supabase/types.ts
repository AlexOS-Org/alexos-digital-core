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
      accounts: {
        Row: {
          business_id: string | null
          business_name: string | null
          color: string
          created_at: string
          currency: string
          deleted_at: string | null
          financial_scope: string
          icon: string
          id: string
          name: string
          opening_balance: number
          sort_order: number
          status: Database["public"]["Enums"]["account_status"]
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          business_name?: string | null
          color?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          financial_scope?: string
          icon?: string
          id?: string
          name: string
          opening_balance?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["account_status"]
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          business_name?: string | null
          color?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          financial_scope?: string
          icon?: string
          id?: string
          name?: string
          opening_balance?: number
          sort_order?: number
          status?: Database["public"]["Enums"]["account_status"]
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_date: string
          completed: boolean
          contact_id: string | null
          created_at: string
          description: string | null
          id: string
          lead_id: string | null
          subject: string
          type: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          completed?: boolean
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          subject: string
          type: string
          user_id: string
        }
        Update: {
          activity_date?: string
          completed?: boolean
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          subject?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          brief: string | null
          business_id: string | null
          business_name: string | null
          campaign_id: string | null
          channel: string
          created_at: string
          cta: string | null
          description: string | null
          headline: string | null
          id: string
          image_idea: string | null
          primary_text: string | null
          source: string
          status: string
          user_id: string
        }
        Insert: {
          brief?: string | null
          business_id?: string | null
          business_name?: string | null
          campaign_id?: string | null
          channel?: string
          created_at?: string
          cta?: string | null
          description?: string | null
          headline?: string | null
          id?: string
          image_idea?: string | null
          primary_text?: string | null
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          brief?: string | null
          business_id?: string | null
          business_name?: string | null
          campaign_id?: string | null
          channel?: string
          created_at?: string
          cta?: string | null
          description?: string | null
          headline?: string | null
          id?: string
          image_idea?: string | null
          primary_text?: string | null
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: string
          business_id: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
          valuation_date: string
          value: number
        }
        Insert: {
          asset_type: string
          business_id?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valuation_date?: string
          value?: number
        }
        Update: {
          asset_type?: string
          business_id?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valuation_date?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          contact_id: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          lead_id: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          lead_id?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          lead_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          account_id: string | null
          amount: number
          auto_create_transaction: boolean | null
          category: string | null
          created_at: string
          deleted_at: string | null
          due_date: string | null
          due_day: number | null
          frequency: Database["public"]["Enums"]["bill_frequency"]
          id: string
          last_paid_at: string | null
          name: string
          next_due_date: string | null
          notes: string | null
          status: Database["public"]["Enums"]["bill_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          auto_create_transaction?: boolean | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date?: string | null
          due_day?: number | null
          frequency?: Database["public"]["Enums"]["bill_frequency"]
          id?: string
          last_paid_at?: string | null
          name: string
          next_due_date?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_create_transaction?: boolean | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date?: string | null
          due_day?: number | null
          frequency?: Database["public"]["Enums"]["bill_frequency"]
          id?: string
          last_paid_at?: string | null
          name?: string
          next_due_date?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          business_id: string | null
          business_name: string | null
          category: string
          created_at: string
          deleted_at: string | null
          financial_scope: string
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          business_id?: string | null
          business_name?: string | null
          category: string
          created_at?: string
          deleted_at?: string | null
          financial_scope?: string
          id?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          business_name?: string | null
          category?: string
          created_at?: string
          deleted_at?: string | null
          financial_scope?: string
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_type: string | null
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_type?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_type?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          alternate_phone: string | null
          avatar_url: string | null
          city: string | null
          company: string | null
          company_name: string | null
          country: string | null
          county: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          email: string | null
          first_name: string
          id: string
          industry: string | null
          job_title: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          sort_order: number
          source: string | null
          status: Database["public"]["Enums"]["contact_status"]
          tags: string[]
          type: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          alternate_phone?: string | null
          avatar_url?: string | null
          city?: string | null
          company?: string | null
          company_name?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          email?: string | null
          first_name: string
          id?: string
          industry?: string | null
          job_title?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          sort_order?: number
          source?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[]
          type?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          alternate_phone?: string | null
          avatar_url?: string | null
          city?: string | null
          company?: string | null
          company_name?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          email?: string | null
          first_name?: string
          id?: string
          industry?: string | null
          job_title?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          sort_order?: number
          source?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[]
          type?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          body: string | null
          contact_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          occurred_at: string
          subject: string
          type: Database["public"]["Enums"]["crm_activity_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          occurred_at?: string
          subject: string
          type?: Database["public"]["Enums"]["crm_activity_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          occurred_at?: string
          subject?: string
          type?: Database["public"]["Enums"]["crm_activity_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_attachments: {
        Row: {
          contact_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          mime_type: string | null
          name: string
          size_bytes: number | null
          url: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          url: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_attachments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_attachments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          body: string
          contact_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          contact_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string
          due_date: string | null
          id: string
          lead_id: string | null
          status: Database["public"]["Enums"]["crm_task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: Database["public"]["Enums"]["crm_task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: Database["public"]["Enums"]["crm_task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          amount_paid: number
          business_id: string | null
          business_name: string | null
          category: string | null
          created_at: string
          deleted_at: string | null
          disbursement_account_id: string | null
          due_date: string | null
          financial_scope: string
          id: string
          interest_paid: number
          interest_rate: number
          minimum_payment: number
          name: string
          notes: string | null
          principal: number
          priority: Database["public"]["Enums"]["debt_priority"]
          sort_order: number
          status: Database["public"]["Enums"]["debt_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          business_id?: string | null
          business_name?: string | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          disbursement_account_id?: string | null
          due_date?: string | null
          financial_scope?: string
          id?: string
          interest_paid?: number
          interest_rate?: number
          minimum_payment?: number
          name: string
          notes?: string | null
          principal?: number
          priority?: Database["public"]["Enums"]["debt_priority"]
          sort_order?: number
          status?: Database["public"]["Enums"]["debt_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          business_id?: string | null
          business_name?: string | null
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          disbursement_account_id?: string | null
          due_date?: string | null
          financial_scope?: string
          id?: string
          interest_paid?: number
          interest_rate?: number
          minimum_payment?: number
          name?: string
          notes?: string | null
          principal?: number
          priority?: Database["public"]["Enums"]["debt_priority"]
          sort_order?: number
          status?: Database["public"]["Enums"]["debt_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_disbursement_account_id_fkey"
            columns: ["disbursement_account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "debts_disbursement_account_id_fkey"
            columns: ["disbursement_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_brands: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          notes: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      dg_cart_sessions: {
        Row: {
          cart_json: Json
          consent_at: string
          converted_at: string | null
          created_at: string
          currency: string
          email: string
          expires_at: string
          first_name: string | null
          follow_up_claimed_at: string | null
          follow_up_sent_at: string | null
          id: string
          last_error: string | null
          phone: string | null
          session_token_hash: string
          status: string
          store_slug: string
          storefront_id: string
          subtotal: number
          updated_at: string
        }
        Insert: {
          cart_json?: Json
          consent_at: string
          converted_at?: string | null
          created_at?: string
          currency?: string
          email: string
          expires_at?: string
          first_name?: string | null
          follow_up_claimed_at?: string | null
          follow_up_sent_at?: string | null
          id?: string
          last_error?: string | null
          phone?: string | null
          session_token_hash: string
          status?: string
          store_slug: string
          storefront_id: string
          subtotal?: number
          updated_at?: string
        }
        Update: {
          cart_json?: Json
          consent_at?: string
          converted_at?: string | null
          created_at?: string
          currency?: string
          email?: string
          expires_at?: string
          first_name?: string | null
          follow_up_claimed_at?: string | null
          follow_up_sent_at?: string | null
          id?: string
          last_error?: string | null
          phone?: string | null
          session_token_hash?: string
          status?: string
          store_slug?: string
          storefront_id?: string
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_cart_sessions_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "dg_storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_categories: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "dg_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_customers: {
        Row: {
          address: string | null
          attributes: Json
          city: string | null
          country: string | null
          county: string | null
          created_at: string
          deleted_at: string | null
          delivery_details: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          tags: string[]
          town: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          attributes?: Json
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          deleted_at?: string | null
          delivery_details?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[]
          town?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          attributes?: Json
          city?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          deleted_at?: string | null
          delivery_details?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[]
          town?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dg_funnel_steps: {
        Row: {
          body: string | null
          created_at: string
          discount_type: string
          discount_value: number
          enabled: boolean
          funnel_id: string
          id: string
          position: number
          product_id: string | null
          step_type: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          enabled?: boolean
          funnel_id: string
          id?: string
          position: number
          product_id?: string | null
          step_type: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          discount_type?: string
          discount_value?: number
          enabled?: boolean
          funnel_id?: string
          id?: string
          position?: number
          product_id?: string | null
          step_type?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_funnel_steps_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "dg_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_funnel_steps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dg_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_funnels: {
        Row: {
          created_at: string
          id: string
          landing_path: string | null
          name: string
          product_id: string
          slug: string
          status: string
          storefront_id: string
          thank_you_body: string | null
          thank_you_heading: string | null
          traffic_source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          landing_path?: string | null
          name: string
          product_id: string
          slug: string
          status?: string
          storefront_id: string
          thank_you_body?: string | null
          thank_you_heading?: string | null
          traffic_source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          landing_path?: string | null
          name?: string
          product_id?: string
          slug?: string
          status?: string
          storefront_id?: string
          thank_you_body?: string | null
          thank_you_heading?: string | null
          traffic_source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_funnels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dg_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_funnels_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "dg_storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_order_attribution: {
        Row: {
          ad: string | null
          ad_id: string | null
          ad_set: string | null
          ad_set_id: string | null
          campaign: string | null
          campaign_id: string | null
          created_at: string
          creative: string | null
          creative_id: string | null
          destination_url: string | null
          funnel_id: string | null
          id: string
          landing_page: string | null
          medium: string | null
          order_id: string
          source: string | null
          user_id: string
        }
        Insert: {
          ad?: string | null
          ad_id?: string | null
          ad_set?: string | null
          ad_set_id?: string | null
          campaign?: string | null
          campaign_id?: string | null
          created_at?: string
          creative?: string | null
          creative_id?: string | null
          destination_url?: string | null
          funnel_id?: string | null
          id?: string
          landing_page?: string | null
          medium?: string | null
          order_id: string
          source?: string | null
          user_id: string
        }
        Update: {
          ad?: string | null
          ad_id?: string | null
          ad_set?: string | null
          ad_set_id?: string | null
          campaign?: string | null
          campaign_id?: string | null
          created_at?: string
          creative?: string | null
          creative_id?: string | null
          destination_url?: string | null
          funnel_id?: string | null
          id?: string
          landing_page?: string | null
          medium?: string | null
          order_id?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_order_attribution_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "dg_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_order_attribution_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "dg_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_order_events: {
        Row: {
          body: string | null
          created_at: string
          id: string
          occurred_at: string
          order_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          occurred_at?: string
          order_id: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          occurred_at?: string
          order_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "dg_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_order_items: {
        Row: {
          created_at: string
          discount: number
          funnel_step_id: string | null
          id: string
          name: string
          offer_role: string
          order_id: string
          product_id: string | null
          quantity: number
          sku: string | null
          total: number
          unit_cost: number
          unit_price: number
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          discount?: number
          funnel_step_id?: string | null
          id?: string
          name: string
          offer_role?: string
          order_id: string
          product_id?: string | null
          quantity?: number
          sku?: string | null
          total?: number
          unit_cost?: number
          unit_price?: number
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          discount?: number
          funnel_step_id?: string | null
          id?: string
          name?: string
          offer_role?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          sku?: string | null
          total?: number
          unit_cost?: number
          unit_price?: number
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dg_order_items_funnel_step_id_fkey"
            columns: ["funnel_step_id"]
            isOneToOne: false
            referencedRelation: "dg_funnel_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "dg_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dg_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "dg_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_orders: {
        Row: {
          channel: string
          created_at: string
          currency: string
          customer_id: string | null
          deleted_at: string | null
          delivered_at: string | null
          discount: number
          funnel_id: string | null
          id: string
          internal_notes: string | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["dg_payment_status"]
          placed_at: string
          shipping_address: string | null
          shipping_address_details: string | null
          shipping_country: string | null
          shipping_county: string | null
          shipping_fee: number
          shipping_method: string | null
          shipping_town: string | null
          shipping_zone: string | null
          status: Database["public"]["Enums"]["dg_order_status"]
          subtotal: number
          tax: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          discount?: number
          funnel_id?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["dg_payment_status"]
          placed_at?: string
          shipping_address?: string | null
          shipping_address_details?: string | null
          shipping_country?: string | null
          shipping_county?: string | null
          shipping_fee?: number
          shipping_method?: string | null
          shipping_town?: string | null
          shipping_zone?: string | null
          status?: Database["public"]["Enums"]["dg_order_status"]
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          deleted_at?: string | null
          delivered_at?: string | null
          discount?: number
          funnel_id?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["dg_payment_status"]
          placed_at?: string
          shipping_address?: string | null
          shipping_address_details?: string | null
          shipping_country?: string | null
          shipping_county?: string | null
          shipping_fee?: number
          shipping_method?: string | null
          shipping_town?: string | null
          shipping_zone?: string | null
          status?: Database["public"]["Enums"]["dg_order_status"]
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "dg_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_orders_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "dg_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_product_evidence: {
        Row: {
          confidence: string
          created_at: string
          historical: boolean
          id: string
          metadata: Json
          observed_attributes: Json
          observed_currency: string
          observed_price: number | null
          product_id: string | null
          raw_excerpt: string | null
          reconciliation_status: string
          source_date: string | null
          source_id: string | null
          source_label: string
          source_type: string
          source_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          historical?: boolean
          id?: string
          metadata?: Json
          observed_attributes?: Json
          observed_currency?: string
          observed_price?: number | null
          product_id?: string | null
          raw_excerpt?: string | null
          reconciliation_status?: string
          source_date?: string | null
          source_id?: string | null
          source_label: string
          source_type: string
          source_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: string
          created_at?: string
          historical?: boolean
          id?: string
          metadata?: Json
          observed_attributes?: Json
          observed_currency?: string
          observed_price?: number | null
          product_id?: string | null
          raw_excerpt?: string | null
          reconciliation_status?: string
          source_date?: string | null
          source_id?: string | null
          source_label?: string
          source_type?: string
          source_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_product_evidence_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dg_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_product_variants: {
        Row: {
          availability_confirmed: boolean
          barcode: string | null
          color: string | null
          cost_price: number | null
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string | null
          name: string
          options: Json
          price: number | null
          product_id: string
          sale_price: number | null
          sku: string | null
          sort_order: number
          stock_quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_confirmed?: boolean
          barcode?: string | null
          color?: string | null
          cost_price?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          options?: Json
          price?: number | null
          product_id: string
          sale_price?: number | null
          sku?: string | null
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_confirmed?: boolean
          barcode?: string | null
          color?: string | null
          cost_price?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          options?: Json
          price?: number | null
          product_id?: string
          sale_price?: number | null
          sku?: string | null
          sort_order?: number
          stock_quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dg_products"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_products: {
        Row: {
          attributes: Json | null
          availability_confirmed: boolean
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          id: string
          image_alt_text: string | null
          images: string[] | null
          low_stock_threshold: number | null
          name: string
          price: number | null
          sale_price: number | null
          seo_description: string | null
          seo_keywords: string[]
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string | null
          status: Database["public"]["Enums"]["dg_product_status"] | null
          stock_quantity: number | null
          supplier_id: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attributes?: Json | null
          availability_confirmed?: boolean
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_alt_text?: string | null
          images?: string[] | null
          low_stock_threshold?: number | null
          name: string
          price?: number | null
          sale_price?: number | null
          seo_description?: string | null
          seo_keywords?: string[]
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["dg_product_status"] | null
          stock_quantity?: number | null
          supplier_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attributes?: Json | null
          availability_confirmed?: boolean
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_alt_text?: string | null
          images?: string[] | null
          low_stock_threshold?: number | null
          name?: string
          price?: number | null
          sale_price?: number | null
          seo_description?: string | null
          seo_keywords?: string[]
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["dg_product_status"] | null
          stock_quantity?: number | null
          supplier_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dg_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "dg_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "dg_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "dg_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_stock_movements: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          occurred_at: string
          product_id: string | null
          quantity: number
          reference: string | null
          type: Database["public"]["Enums"]["dg_stock_movement_type"]
          unit_cost: number | null
          user_id: string
          variant_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          product_id?: string | null
          quantity: number
          reference?: string | null
          type?: Database["public"]["Enums"]["dg_stock_movement_type"]
          unit_cost?: number | null
          user_id: string
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          product_id?: string | null
          quantity?: number
          reference?: string | null
          type?: Database["public"]["Enums"]["dg_stock_movement_type"]
          unit_cost?: number | null
          user_id?: string
          variant_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dg_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dg_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_stock_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "dg_product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dg_stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "dg_warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      dg_storefronts: {
        Row: {
          announcement: string | null
          created_at: string
          currency: string
          flat_shipping_fee: number
          free_shipping_threshold: number
          hero_headline: string | null
          hero_image_url: string | null
          hero_subheadline: string | null
          id: string
          logo_url: string | null
          name: string
          published: boolean
          slug: string
          support_email: string | null
          support_phone: string | null
          tagline: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          announcement?: string | null
          created_at?: string
          currency?: string
          flat_shipping_fee?: number
          free_shipping_threshold?: number
          hero_headline?: string | null
          hero_image_url?: string | null
          hero_subheadline?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          published?: boolean
          slug: string
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          announcement?: string | null
          created_at?: string
          currency?: string
          flat_shipping_fee?: number
          free_shipping_threshold?: number
          hero_headline?: string | null
          hero_image_url?: string | null
          hero_subheadline?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          published?: boolean
          slug?: string
          support_email?: string | null
          support_phone?: string | null
          tagline?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      dg_suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          lead_time_days: number | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          lead_time_days?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          lead_time_days?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dg_warehouses: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          is_default: boolean | null
          location: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_default?: boolean | null
          location?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_default?: boolean | null
          location?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expected_money: {
        Row: {
          account_id: string | null
          amount: number
          business_id: string | null
          business_name: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          expected_date: string
          financial_scope: string
          id: string
          probability: number
          received_transaction_id: string | null
          source: string
          status: Database["public"]["Enums"]["expected_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          business_id?: string | null
          business_name?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          expected_date: string
          financial_scope?: string
          id?: string
          probability?: number
          received_transaction_id?: string | null
          source: string
          status?: Database["public"]["Enums"]["expected_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          business_id?: string | null
          business_name?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          expected_date?: string
          financial_scope?: string
          id?: string
          probability?: number
          received_transaction_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["expected_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expected_money_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "expected_money_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expected_money_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expected_money_received_transaction_id_fkey"
            columns: ["received_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          deleted_at: string | null
          goal_id: string
          id: string
          note: string | null
          occurred_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          deleted_at?: string | null
          goal_id: string
          id?: string
          note?: string | null
          occurred_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          deleted_at?: string | null
          goal_id?: string
          id?: string
          note?: string | null
          occurred_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goal_progress"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          created_at: string
          deleted_at: string | null
          icon: string
          id: string
          name: string
          notes: string | null
          sort_order: number
          status: Database["public"]["Enums"]["goal_status"]
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          icon?: string
          id?: string
          name: string
          notes?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          icon?: string
          id?: string
          name?: string
          notes?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_stage_history: {
        Row: {
          changed_at: string
          from_stage: Database["public"]["Enums"]["lead_stage"] | null
          id: string
          lead_id: string
          to_stage: Database["public"]["Enums"]["lead_stage"]
          user_id: string
        }
        Insert: {
          changed_at?: string
          from_stage?: Database["public"]["Enums"]["lead_stage"] | null
          id?: string
          lead_id: string
          to_stage: Database["public"]["Enums"]["lead_stage"]
          user_id: string
        }
        Update: {
          changed_at?: string
          from_stage?: Database["public"]["Enums"]["lead_stage"] | null
          id?: string
          lead_id?: string
          to_stage?: Database["public"]["Enums"]["lead_stage"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          contact_id: string | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          notes: string | null
          probability: number
          sort_order: number
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"] | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number
          sort_order?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"] | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          value?: number
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          contact_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number
          sort_order?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"] | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          business_id: string | null
          business_name: string | null
          channel: string
          clicks: number
          created_at: string
          daily_budget: number | null
          end_date: string | null
          financial_scope: string
          id: string
          impressions: number
          name: string
          notes: string | null
          objective: string | null
          result_type: string | null
          results: number
          revenue: number
          start_date: string | null
          status: string
          total_spend: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          business_name?: string | null
          channel?: string
          clicks?: number
          created_at?: string
          daily_budget?: number | null
          end_date?: string | null
          financial_scope?: string
          id?: string
          impressions?: number
          name: string
          notes?: string | null
          objective?: string | null
          result_type?: string | null
          results?: number
          revenue?: number
          start_date?: string | null
          status?: string
          total_spend?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          business_name?: string | null
          channel?: string
          clicks?: number
          created_at?: string
          daily_budget?: number | null
          end_date?: string | null
          financial_scope?: string
          id?: string
          impressions?: number
          name?: string
          notes?: string | null
          objective?: string | null
          result_type?: string | null
          results?: number
          revenue?: number
          start_date?: string | null
          status?: string
          total_spend?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          contact_id: string | null
          content: string
          created_at: string
          id: string
          lead_id: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          content: string
          created_at?: string
          id?: string
          lead_id?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          content?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          attachment_url: string | null
          business_id: string | null
          business_name: string | null
          category: string | null
          created_at: string
          debt_id: string | null
          deleted_at: string | null
          description: string | null
          expense_type: string | null
          financial_scope: string
          flow_type: string
          id: string
          income_type: string | null
          interest_amount: number
          marketing_campaign_id: string | null
          occurred_at: string
          principal_amount: number
          reference: string | null
          source: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transfer_account_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          attachment_url?: string | null
          business_id?: string | null
          business_name?: string | null
          category?: string | null
          created_at?: string
          debt_id?: string | null
          deleted_at?: string | null
          description?: string | null
          expense_type?: string | null
          financial_scope?: string
          flow_type?: string
          id?: string
          income_type?: string | null
          interest_amount?: number
          marketing_campaign_id?: string | null
          occurred_at?: string
          principal_amount?: number
          reference?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transfer_account_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          attachment_url?: string | null
          business_id?: string | null
          business_name?: string | null
          category?: string | null
          created_at?: string
          debt_id?: string | null
          deleted_at?: string | null
          description?: string | null
          expense_type?: string | null
          financial_scope?: string
          flow_type?: string
          id?: string
          income_type?: string | null
          interest_amount?: number
          marketing_campaign_id?: string | null
          occurred_at?: string
          principal_amount?: number
          reference?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transfer_account_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_marketing_campaign_id_fkey"
            columns: ["marketing_campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_account_id_fkey"
            columns: ["transfer_account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transactions_transfer_account_id_fkey"
            columns: ["transfer_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      web_vitals_events: {
        Row: {
          connection_type: string
          created_at: string
          device_class: string
          id: string
          load_mode: string
          metric_name: string
          metric_rating: string
          metric_value: number
          release_sha: string
          route: string
          user_id: string
        }
        Insert: {
          connection_type: string
          created_at?: string
          device_class: string
          id?: string
          load_mode: string
          metric_name: string
          metric_rating: string
          metric_value: number
          release_sha: string
          route: string
          user_id: string
        }
        Update: {
          connection_type?: string
          created_at?: string
          device_class?: string
          id?: string
          load_mode?: string
          metric_name?: string
          metric_rating?: string
          metric_value?: number
          release_sha?: string
          route?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      account_balances: {
        Row: {
          account_id: string | null
          balance: number | null
          money_in: number | null
          money_out: number | null
          user_id: string | null
        }
        Relationships: []
      }
      business_financial_summary: {
        Row: {
          business_id: string | null
          expenses: number | null
          income: number | null
          month: string | null
          operating_profit: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_progress: {
        Row: {
          current_amount: number | null
          goal_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      dg_create_guest_order: {
        Args: {
          p_address: string
          p_attribution?: Json
          p_city: string
          p_country: string
          p_county: string
          p_delivery_details: string
          p_email: string
          p_first_name: string
          p_funnel_id?: string
          p_items: Json
          p_last_name: string
          p_notes: string
          p_payment_method: string
          p_phone: string
          p_store_slug: string
          p_town: string
        }
        Returns: Json
      }
      dg_update_admin_order: {
        Args: {
          p_customer?: Json
          p_internal_notes?: string
          p_notes?: string
          p_order_id: string
          p_payment_method?: string
          p_payment_status: Database["public"]["Enums"]["dg_payment_status"]
          p_shipping_address?: string
          p_shipping_address_details?: string
          p_shipping_country?: string
          p_shipping_county?: string
          p_shipping_method?: string
          p_shipping_town?: string
          p_shipping_zone?: string
          p_status: Database["public"]["Enums"]["dg_order_status"]
          p_tracking_number?: string
        }
        Returns: Json
      }
      dg_is_published_store: { Args: { _user_id: string }; Returns: boolean }
      dg_reserve_stock: {
        Args: { p_product_id: string; p_qty: number }
        Returns: boolean
      }
      dg_reserve_variant_stock: {
        Args: { p_product_id: string; p_qty: number; p_variant_id: string }
        Returns: boolean
      }
      dg_seed_default_categories: {
        Args: { _user_id: string }
        Returns: undefined
      }
      next_order_number: { Args: never; Returns: string }
    }
    Enums: {
      account_status: "active" | "archived"
      account_type:
        | "cash"
        | "bank"
        | "mobile_money"
        | "credit_card"
        | "wallet"
        | "other"
      bill_frequency: "weekly" | "monthly" | "quarterly" | "yearly" | "one_time"
      bill_status: "active" | "paid" | "cancelled" | "pending"
      contact_status: "lead" | "active" | "inactive" | "archived"
      crm_activity_type: "call" | "email" | "meeting" | "note" | "other"
      crm_task_status: "pending" | "done"
      debt_priority: "low" | "medium" | "high"
      debt_status: "active" | "paid" | "defaulted" | "archived"
      dg_order_status:
        | "new"
        | "processing"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
      dg_payment_status: "unpaid" | "partial" | "paid" | "refunded"
      dg_product_status: "draft" | "active" | "archived" | "out_of_stock"
      dg_stock_movement_type:
        | "purchase"
        | "sale"
        | "adjustment"
        | "transfer_in"
        | "transfer_out"
        | "return"
        | "damage"
      expected_status: "pending" | "received" | "cancelled"
      goal_status: "active" | "achieved" | "paused" | "archived"
      lead_stage:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
      transaction_status: "posted" | "pending" | "void"
      transaction_type: "income" | "expense" | "transfer" | "adjustment"
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
      account_status: ["active", "archived"],
      account_type: [
        "cash",
        "bank",
        "mobile_money",
        "credit_card",
        "wallet",
        "other",
      ],
      bill_frequency: ["weekly", "monthly", "quarterly", "yearly", "one_time"],
      bill_status: ["active", "paid", "cancelled", "pending"],
      contact_status: ["lead", "active", "inactive", "archived"],
      crm_activity_type: ["call", "email", "meeting", "note", "other"],
      crm_task_status: ["pending", "done"],
      debt_priority: ["low", "medium", "high"],
      debt_status: ["active", "paid", "defaulted", "archived"],
      dg_order_status: [
        "new",
        "processing",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      dg_payment_status: ["unpaid", "partial", "paid", "refunded"],
      dg_product_status: ["draft", "active", "archived", "out_of_stock"],
      dg_stock_movement_type: [
        "purchase",
        "sale",
        "adjustment",
        "transfer_in",
        "transfer_out",
        "return",
        "damage",
      ],
      expected_status: ["pending", "received", "cancelled"],
      goal_status: ["active", "achieved", "paused", "archived"],
      lead_stage: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      transaction_status: ["posted", "pending", "void"],
      transaction_type: ["income", "expense", "transfer", "adjustment"],
    },
  },
} as const
