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
          color: string
          created_at: string
          currency: string
          deleted_at: string | null
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
          color?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
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
          color?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
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
        Relationships: []
      }
      bills: {
        Row: {
          account_id: string | null
          amount: number
          auto_create_transaction: boolean
          category: string | null
          created_at: string
          deleted_at: string | null
          due_date: string
          frequency: Database["public"]["Enums"]["bill_frequency"]
          id: string
          last_paid_at: string | null
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["bill_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          auto_create_transaction?: boolean
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date: string
          frequency?: Database["public"]["Enums"]["bill_frequency"]
          id?: string
          last_paid_at?: string | null
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["bill_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_create_transaction?: boolean
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date?: string
          frequency?: Database["public"]["Enums"]["bill_frequency"]
          id?: string
          last_paid_at?: string | null
          name?: string
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
          category: string
          created_at: string
          deleted_at: string | null
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string
          id: string
          job_title: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
          sort_order: number
          source: string | null
          status: Database["public"]["Enums"]["contact_status"]
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          job_title?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          sort_order?: number
          source?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          sort_order?: number
          source?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[]
          updated_at?: string
          user_id?: string
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
      debts: {
        Row: {
          amount_paid: number
          category: string | null
          created_at: string
          deleted_at: string | null
          due_date: string | null
          id: string
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
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
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
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
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
        Relationships: []
      }
      dg_brands: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      dg_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string | null
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string | null
          sort_order?: number
          updated_at?: string
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
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          attributes?: Json
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          attributes?: Json
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          id: string
          name: string
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
          id?: string
          name: string
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
          id?: string
          name?: string
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
          id: string
          internal_notes: string | null
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["dg_payment_status"]
          placed_at: string
          shipping_address: string | null
          shipping_fee: number
          shipping_method: string | null
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
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["dg_payment_status"]
          placed_at?: string
          shipping_address?: string | null
          shipping_fee?: number
          shipping_method?: string | null
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
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["dg_payment_status"]
          placed_at?: string
          shipping_address?: string | null
          shipping_fee?: number
          shipping_method?: string | null
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
        ]
      }
      dg_product_variants: {
        Row: {
          barcode: string | null
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
          barcode?: string | null
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
          barcode?: string | null
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
          attributes: Json
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          cost_price: number
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          id: string
          images: string[]
          low_stock_threshold: number
          name: string
          price: number
          sale_price: number | null
          sku: string | null
          sort_order: number
          status: Database["public"]["Enums"]["dg_product_status"]
          stock_quantity: number
          supplier_id: string | null
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          attributes?: Json
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[]
          low_stock_threshold?: number
          name: string
          price?: number
          sale_price?: number | null
          sku?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["dg_product_status"]
          stock_quantity?: number
          supplier_id?: string | null
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          attributes?: Json
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          images?: string[]
          low_stock_threshold?: number
          name?: string
          price?: number
          sale_price?: number | null
          sku?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["dg_product_status"]
          stock_quantity?: number
          supplier_id?: string | null
          tags?: string[]
          updated_at?: string
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
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          lead_time_days: number
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          lead_time_days?: number
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          lead_time_days?: number
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dg_warehouses: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_default: boolean
          location: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          location?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          location?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expected_money: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          deleted_at: string | null
          description: string | null
          expected_date: string
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
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          expected_date: string
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
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          expected_date?: string
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
          contact_id: string | null
          created_at: string
          deleted_at: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          probability: number
          sort_order: number
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          title: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number
          sort_order?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          title: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number
          sort_order?: number
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          title?: string
          updated_at?: string
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
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          attachment_url: string | null
          category: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          occurred_at: string
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
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          occurred_at?: string
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
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          occurred_at?: string
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
      dg_is_published_store: { Args: { _user_id: string }; Returns: boolean }
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
      bill_frequency: "one_time" | "weekly" | "monthly"
      bill_status: "pending" | "paid"
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
      bill_frequency: ["one_time", "weekly", "monthly"],
      bill_status: ["pending", "paid"],
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
