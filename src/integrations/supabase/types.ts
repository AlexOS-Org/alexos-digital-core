export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          color: string;
          created_at: string;
          currency: string;
          deleted_at: string | null;
          icon: string;
          id: string;
          name: string;
          opening_balance: number;
          sort_order: number;
          status: Database["public"]["Enums"]["account_status"];
          type: Database["public"]["Enums"]["account_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          currency?: string;
          deleted_at?: string | null;
          icon?: string;
          id?: string;
          name: string;
          opening_balance?: number;
          sort_order?: number;
          status?: Database["public"]["Enums"]["account_status"];
          type?: Database["public"]["Enums"]["account_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          currency?: string;
          deleted_at?: string | null;
          icon?: string;
          id?: string;
          name?: string;
          opening_balance?: number;
          sort_order?: number;
          status?: Database["public"]["Enums"]["account_status"];
          type?: Database["public"]["Enums"]["account_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          activity_date: string;
          completed: boolean;
          contact_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          lead_id: string | null;
          subject: string;
          type: string;
          user_id: string;
        };
        Insert: {
          activity_date?: string;
          completed?: boolean;
          contact_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          lead_id?: string | null;
          subject: string;
          type: string;
          user_id: string;
        };
        Update: {
          activity_date?: string;
          completed?: boolean;
          contact_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          lead_id?: string | null;
          subject?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      attachments: {
        Row: {
          contact_id: string | null;
          created_at: string;
          file_name: string;
          file_size: number | null;
          file_url: string;
          id: string;
          lead_id: string | null;
          user_id: string;
        };
        Insert: {
          contact_id?: string | null;
          created_at?: string;
          file_name: string;
          file_size?: number | null;
          file_url: string;
          id?: string;
          lead_id?: string | null;
          user_id: string;
        };
        Update: {
          contact_id?: string | null;
          created_at?: string;
          file_name?: string;
          file_size?: number | null;
          file_url?: string;
          id?: string;
          lead_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      bills: {
        Row: {
          account_id: string | null;
          amount: number;
          auto_create_transaction: boolean | null;
          category: string | null;
          created_at: string;
          deleted_at: string | null;
          due_date: string | null;
          due_day: number | null;
          frequency: Database["public"]["Enums"]["bill_frequency"];
          id: string;
          last_paid_at: string | null;
          name: string;
          next_due_date: string | null;
          notes: string | null;
          status: Database["public"]["Enums"]["bill_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount?: number;
          auto_create_transaction?: boolean | null;
          category?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          due_date?: string | null;
          due_day?: number | null;
          frequency?: Database["public"]["Enums"]["bill_frequency"];
          id?: string;
          last_paid_at?: string | null;
          name: string;
          next_due_date?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["bill_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          auto_create_transaction?: boolean | null;
          category?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          due_date?: string | null;
          due_day?: number | null;
          frequency?: Database["public"]["Enums"]["bill_frequency"];
          id?: string;
          last_paid_at?: string | null;
          name?: string;
          next_due_date?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["bill_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          month: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          month: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          month?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          address: string | null;
          alternate_phone: string | null;
          avatar_url: string | null;
          city: string | null;
          company_name: string | null;
          country: string | null;
          county: string | null;
          created_at: string;
          display_name: string;
          email: string | null;
          first_name: string | null;
          id: string;
          industry: string | null;
          job_title: string | null;
          last_name: string | null;
          notes: string | null;
          phone: string | null;
          postal_code: string | null;
          source: string | null;
          status: string;
          type: string;
          updated_at: string;
          user_id: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          alternate_phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          company_name?: string | null;
          country?: string | null;
          county?: string | null;
          created_at?: string;
          display_name: string;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          industry?: string | null;
          job_title?: string | null;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          source?: string | null;
          status?: string;
          type?: string;
          updated_at?: string;
          user_id: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          alternate_phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          company_name?: string | null;
          country?: string | null;
          county?: string | null;
          created_at?: string;
          display_name?: string;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          industry?: string | null;
          job_title?: string | null;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          source?: string | null;
          status?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          source: string | null;
          status: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          source?: string | null;
          status?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          source?: string | null;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      debts: {
        Row: {
          amount_paid: number;
          category: string | null;
          created_at: string;
          deleted_at: string | null;
          due_date: string | null;
          id: string;
          interest_rate: number;
          minimum_payment: number;
          name: string;
          notes: string | null;
          principal: number;
          priority: Database["public"]["Enums"]["debt_priority"];
          sort_order: number;
          status: Database["public"]["Enums"]["debt_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_paid?: number;
          category?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          due_date?: string | null;
          id?: string;
          interest_rate?: number;
          minimum_payment?: number;
          name: string;
          notes?: string | null;
          principal?: number;
          priority?: Database["public"]["Enums"]["debt_priority"];
          sort_order?: number;
          status?: Database["public"]["Enums"]["debt_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_paid?: number;
          category?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          due_date?: string | null;
          id?: string;
          interest_rate?: number;
          minimum_payment?: number;
          name?: string;
          notes?: string | null;
          principal?: number;
          priority?: Database["public"]["Enums"]["debt_priority"];
          sort_order?: number;
          status?: Database["public"]["Enums"]["debt_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      expected_money: {
        Row: {
          account_id: string | null;
          amount: number;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          expected_date: string;
          id: string;
          probability: number;
          received_transaction_id: string | null;
          source: string;
          status: Database["public"]["Enums"]["expected_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          expected_date: string;
          id?: string;
          probability?: number;
          received_transaction_id?: string | null;
          source: string;
          status?: Database["public"]["Enums"]["expected_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          expected_date?: string;
          id?: string;
          probability?: number;
          received_transaction_id?: string | null;
          source?: string;
          status?: Database["public"]["Enums"]["expected_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expected_money_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "account_balances";
            referencedColumns: ["account_id"];
          },
          {
            foreignKeyName: "expected_money_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expected_money_received_transaction_id_fkey";
            columns: ["received_transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      goal_contributions: {
        Row: {
          account_id: string | null;
          amount: number;
          created_at: string;
          deleted_at: string | null;
          goal_id: string;
          id: string;
          note: string | null;
          occurred_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          created_at?: string;
          deleted_at?: string | null;
          goal_id: string;
          id?: string;
          note?: string | null;
          occurred_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          created_at?: string;
          deleted_at?: string | null;
          goal_id?: string;
          id?: string;
          note?: string | null;
          occurred_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goal_progress";
            referencedColumns: ["goal_id"];
          },
          {
            foreignKeyName: "goal_contributions_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          category: string | null;
          created_at: string;
          deleted_at: string | null;
          icon: string;
          id: string;
          name: string;
          notes: string | null;
          sort_order: number;
          status: Database["public"]["Enums"]["goal_status"];
          target_amount: number;
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          icon?: string;
          id?: string;
          name: string;
          notes?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["goal_status"];
          target_amount?: number;
          target_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          icon?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          sort_order?: number;
          status?: Database["public"]["Enums"]["goal_status"];
          target_amount?: number;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          contact_id: string | null;
          created_at: string | null;
          customer_id: string | null;
          id: string;
          notes: string | null;
          probability: number | null;
          stage: string | null;
          title: string;
          user_id: string;
          value: number | null;
        };
        Insert: {
          contact_id?: string | null;
          created_at?: string | null;
          customer_id?: string | null;
          id?: string;
          notes?: string | null;
          probability?: number | null;
          stage?: string | null;
          title: string;
          user_id: string;
          value?: number | null;
        };
        Update: {
          contact_id?: string | null;
          created_at?: string | null;
          customer_id?: string | null;
          id?: string;
          notes?: string | null;
          probability?: number | null;
          stage?: string | null;
          title?: string;
          user_id?: string;
          value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          contact_id: string | null;
          content: string;
          created_at: string;
          id: string;
          lead_id: string | null;
          user_id: string;
        };
        Insert: {
          contact_id?: string | null;
          content: string;
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          user_id: string;
        };
        Update: {
          contact_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          completed_at: string | null;
          contact_id: string | null;
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          lead_id: string | null;
          priority: string | null;
          status: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          lead_id?: string | null;
          priority?: string | null;
          status?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          lead_id?: string | null;
          priority?: string | null;
          status?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          account_id: string;
          amount: number;
          attachment_url: string | null;
          category: string | null;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          id: string;
          occurred_at: string;
          reference: string | null;
          source: string | null;
          status: Database["public"]["Enums"]["transaction_status"];
          transfer_account_id: string | null;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id: string;
          amount: number;
          attachment_url?: string | null;
          category?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          occurred_at?: string;
          reference?: string | null;
          source?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"];
          transfer_account_id?: string | null;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string;
          amount?: number;
          attachment_url?: string | null;
          category?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          id?: string;
          occurred_at?: string;
          reference?: string | null;
          source?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"];
          transfer_account_id?: string | null;
          type?: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "account_balances";
            referencedColumns: ["account_id"];
          },
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_transfer_account_id_fkey";
            columns: ["transfer_account_id"];
            isOneToOne: false;
            referencedRelation: "account_balances";
            referencedColumns: ["account_id"];
          },
          {
            foreignKeyName: "transactions_transfer_account_id_fkey";
            columns: ["transfer_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      account_balances: {
        Row: {
          account_id: string | null;
          balance: number | null;
          money_in: number | null;
          money_out: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      goal_progress: {
        Row: {
          current_amount: number | null;
          goal_id: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      account_status: "active" | "archived";
      account_type: "cash" | "bank" | "mobile_money" | "credit_card" | "wallet" | "other";
      bill_frequency: "weekly" | "monthly" | "quarterly" | "yearly" | "one_time";
      bill_status: "active" | "paid" | "cancelled" | "pending";
      debt_priority: "low" | "medium" | "high";
      debt_status: "active" | "paid" | "defaulted" | "archived";
      expected_status: "pending" | "received" | "cancelled";
      goal_status: "active" | "achieved" | "paused" | "archived";
      transaction_status: "posted" | "pending" | "void";
      transaction_type: "income" | "expense" | "transfer" | "adjustment";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["active", "archived"],
      account_type: ["cash", "bank", "mobile_money", "credit_card", "wallet", "other"],
      bill_frequency: ["weekly", "monthly", "quarterly", "yearly", "one_time"],
      bill_status: ["active", "paid", "cancelled", "pending"],
      debt_priority: ["low", "medium", "high"],
      debt_status: ["active", "paid", "defaulted", "archived"],
      expected_status: ["pending", "received", "cancelled"],
      goal_status: ["active", "achieved", "paused", "archived"],
      transaction_status: ["posted", "pending", "void"],
      transaction_type: ["income", "expense", "transfer", "adjustment"],
    },
  },
} as const;
