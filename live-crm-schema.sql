


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."account_status" AS ENUM (
    'active',
    'archived'
);


ALTER TYPE "public"."account_status" OWNER TO "postgres";


CREATE TYPE "public"."account_type" AS ENUM (
    'cash',
    'bank',
    'mobile_money',
    'credit_card',
    'wallet',
    'other'
);


ALTER TYPE "public"."account_type" OWNER TO "postgres";


CREATE TYPE "public"."bill_frequency" AS ENUM (
    'weekly',
    'monthly',
    'quarterly',
    'yearly',
    'one_time'
);


ALTER TYPE "public"."bill_frequency" OWNER TO "postgres";


CREATE TYPE "public"."bill_status" AS ENUM (
    'active',
    'paid',
    'cancelled',
    'pending'
);


ALTER TYPE "public"."bill_status" OWNER TO "postgres";


CREATE TYPE "public"."debt_priority" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."debt_priority" OWNER TO "postgres";


CREATE TYPE "public"."debt_status" AS ENUM (
    'active',
    'paid',
    'defaulted',
    'archived'
);


ALTER TYPE "public"."debt_status" OWNER TO "postgres";


CREATE TYPE "public"."expected_status" AS ENUM (
    'pending',
    'received',
    'cancelled'
);


ALTER TYPE "public"."expected_status" OWNER TO "postgres";


CREATE TYPE "public"."goal_status" AS ENUM (
    'active',
    'achieved',
    'paused',
    'archived'
);


ALTER TYPE "public"."goal_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_status" AS ENUM (
    'posted',
    'pending',
    'void'
);


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'income',
    'expense',
    'transfer',
    'adjustment'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_default_accounts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.accounts (user_id, name, icon, type, currency, sort_order) VALUES
    (NEW.id, 'Cash', 'banknote', 'cash', 'KES', 1),
    (NEW.id, 'M-Pesa', 'smartphone', 'mobile_money', 'KES', 2),
    (NEW.id, 'I&M Bank', 'landmark', 'bank', 'KES', 3),
    (NEW.id, 'KCB Bank', 'landmark', 'bank', 'KES', 4),
    (NEW.id, 'SBM Bank', 'landmark', 'bank', 'KES', 5);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."seed_default_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."account_balances" AS
SELECT
    NULL::"uuid" AS "account_id",
    NULL::"uuid" AS "user_id",
    NULL::numeric AS "balance",
    NULL::numeric AS "money_in",
    NULL::numeric AS "money_out";


ALTER VIEW "public"."account_balances" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text" DEFAULT 'wallet'::"text" NOT NULL,
    "color" "text" DEFAULT 'primary'::"text" NOT NULL,
    "type" "public"."account_type" DEFAULT 'bank'::"public"."account_type" NOT NULL,
    "currency" "text" DEFAULT 'KES'::"text" NOT NULL,
    "opening_balance" numeric(18,2) DEFAULT 0 NOT NULL,
    "status" "public"."account_status" DEFAULT 'active'::"public"."account_status" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "lead_id" "uuid",
    "type" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text",
    "activity_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "lead_id" "uuid",
    "file_name" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "amount" numeric DEFAULT 0 NOT NULL,
    "frequency" "public"."bill_frequency" DEFAULT 'monthly'::"public"."bill_frequency" NOT NULL,
    "due_day" integer,
    "next_due_date" "date",
    "status" "public"."bill_status" DEFAULT 'active'::"public"."bill_status" NOT NULL,
    "account_id" "uuid",
    "auto_create_transaction" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "due_date" "date",
    "last_paid_at" timestamp with time zone,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."bills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "month" "date" NOT NULL,
    "amount" numeric(18,2) NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "budgets_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."budgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" DEFAULT 'person'::"text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "display_name" "text" NOT NULL,
    "company_name" "text",
    "email" "text",
    "phone" "text",
    "alternate_phone" "text",
    "website" "text",
    "industry" "text",
    "job_title" "text",
    "address" "text",
    "city" "text",
    "county" "text",
    "country" "text",
    "postal_code" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "source" "text",
    "avatar_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "source" "text",
    "status" "text" DEFAULT 'active'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."debts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "principal" numeric DEFAULT 0 NOT NULL,
    "interest_rate" numeric DEFAULT 0 NOT NULL,
    "minimum_payment" numeric DEFAULT 0 NOT NULL,
    "amount_paid" numeric DEFAULT 0 NOT NULL,
    "due_date" "date",
    "priority" "public"."debt_priority" DEFAULT 'medium'::"public"."debt_priority" NOT NULL,
    "status" "public"."debt_status" DEFAULT 'active'::"public"."debt_status" NOT NULL,
    "notes" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."debts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expected_money" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "expected_date" "date" NOT NULL,
    "source" "text" NOT NULL,
    "description" "text",
    "amount" numeric(18,2) NOT NULL,
    "probability" integer DEFAULT 100 NOT NULL,
    "status" "public"."expected_status" DEFAULT 'pending'::"public"."expected_status" NOT NULL,
    "account_id" "uuid",
    "received_transaction_id" "uuid",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "expected_money_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "expected_money_probability_check" CHECK ((("probability" >= 0) AND ("probability" <= 100)))
);


ALTER TABLE "public"."expected_money" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_contributions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "account_id" "uuid",
    "amount" numeric NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."goal_contributions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text" DEFAULT 'target'::"text" NOT NULL,
    "category" "text",
    "target_amount" numeric DEFAULT 0 NOT NULL,
    "target_date" "date",
    "status" "public"."goal_status" DEFAULT 'active'::"public"."goal_status" NOT NULL,
    "notes" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."goal_progress" WITH ("security_invoker"='true') AS
 SELECT "g"."id" AS "goal_id",
    "g"."user_id",
    COALESCE("sum"("c"."amount") FILTER (WHERE ("c"."deleted_at" IS NULL)), (0)::numeric) AS "current_amount"
   FROM ("public"."goals" "g"
     LEFT JOIN "public"."goal_contributions" "c" ON (("c"."goal_id" = "g"."id")))
  GROUP BY "g"."id", "g"."user_id";


ALTER VIEW "public"."goal_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "customer_id" "uuid",
    "title" "text" NOT NULL,
    "stage" "text" DEFAULT 'new'::"text",
    "value" numeric DEFAULT 0,
    "probability" numeric DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "contact_id" "uuid",
    "company" "text",
    "source" "text",
    "status" "text" DEFAULT 'open'::"text",
    "estimated_value" numeric(14,2) DEFAULT 0,
    "expected_close_date" "date",
    "assigned_to" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "lead_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contact_id" "uuid",
    "lead_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "account_id" "uuid" NOT NULL,
    "transfer_account_id" "uuid",
    "category" "text",
    "source" "text",
    "description" "text",
    "reference" "text",
    "amount" numeric(18,2) NOT NULL,
    "attachment_url" "text",
    "status" "public"."transaction_status" DEFAULT 'posted'::"public"."transaction_status" NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transactions_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bills"
    ADD CONSTRAINT "bills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_user_id_category_month_key" UNIQUE ("user_id", "category", "month");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."debts"
    ADD CONSTRAINT "debts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expected_money"
    ADD CONSTRAINT "expected_money_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goal_contributions"
    ADD CONSTRAINT "goal_contributions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "accounts_user_idx" ON "public"."accounts" USING "btree" ("user_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_activities_contact" ON "public"."activities" USING "btree" ("contact_id");



CREATE INDEX "idx_contacts_user_id" ON "public"."contacts" USING "btree" ("user_id");



CREATE INDEX "idx_leads_contact" ON "public"."leads" USING "btree" ("contact_id");



CREATE INDEX "idx_leads_contact_id" ON "public"."leads" USING "btree" ("contact_id");



CREATE INDEX "idx_leads_stage" ON "public"."leads" USING "btree" ("stage");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_leads_user" ON "public"."leads" USING "btree" ("user_id");



CREATE INDEX "idx_notes_contact" ON "public"."notes" USING "btree" ("contact_id");



CREATE INDEX "idx_tasks_contact" ON "public"."tasks" USING "btree" ("contact_id");



CREATE INDEX "tx_account_idx" ON "public"."transactions" USING "btree" ("account_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "tx_user_time_idx" ON "public"."transactions" USING "btree" ("user_id", "occurred_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE OR REPLACE VIEW "public"."account_balances" WITH ("security_invoker"='true') AS
 SELECT "a"."id" AS "account_id",
    "a"."user_id",
    ("a"."opening_balance" + COALESCE("sum"(
        CASE
            WHEN (("t"."type" = 'income'::"public"."transaction_type") AND ("t"."account_id" = "a"."id")) THEN "t"."amount"
            WHEN (("t"."type" = 'expense'::"public"."transaction_type") AND ("t"."account_id" = "a"."id")) THEN (- "t"."amount")
            WHEN (("t"."type" = 'transfer'::"public"."transaction_type") AND ("t"."account_id" = "a"."id")) THEN (- "t"."amount")
            WHEN (("t"."type" = 'transfer'::"public"."transaction_type") AND ("t"."transfer_account_id" = "a"."id")) THEN "t"."amount"
            WHEN (("t"."type" = 'adjustment'::"public"."transaction_type") AND ("t"."account_id" = "a"."id")) THEN "t"."amount"
            ELSE (0)::numeric
        END), (0)::numeric)) AS "balance",
    COALESCE("sum"(
        CASE
            WHEN (("t"."type" = 'income'::"public"."transaction_type") AND ("t"."account_id" = "a"."id")) THEN "t"."amount"
            WHEN (("t"."type" = 'transfer'::"public"."transaction_type") AND ("t"."transfer_account_id" = "a"."id")) THEN "t"."amount"
            ELSE (0)::numeric
        END), (0)::numeric) AS "money_in",
    COALESCE("sum"(
        CASE
            WHEN (("t"."type" = 'expense'::"public"."transaction_type") AND ("t"."account_id" = "a"."id")) THEN "t"."amount"
            WHEN (("t"."type" = 'transfer'::"public"."transaction_type") AND ("t"."account_id" = "a"."id")) THEN "t"."amount"
            ELSE (0)::numeric
        END), (0)::numeric) AS "money_out"
   FROM ("public"."accounts" "a"
     LEFT JOIN "public"."transactions" "t" ON ((("t"."user_id" = "a"."user_id") AND ("t"."deleted_at" IS NULL) AND ("t"."status" = 'posted'::"public"."transaction_status") AND (("t"."account_id" = "a"."id") OR ("t"."transfer_account_id" = "a"."id")))))
  WHERE ("a"."deleted_at" IS NULL)
  GROUP BY "a"."id";



CREATE OR REPLACE TRIGGER "accounts_updated" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "budgets_updated" BEFORE UPDATE ON "public"."budgets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "expected_updated" BEFORE UPDATE ON "public"."expected_money" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_bills_updated" BEFORE UPDATE ON "public"."bills" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_debts_updated" BEFORE UPDATE ON "public"."debts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_goals_updated" BEFORE UPDATE ON "public"."goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "tx_updated" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expected_money"
    ADD CONSTRAINT "expected_money_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expected_money"
    ADD CONSTRAINT "expected_money_received_transaction_id_fkey" FOREIGN KEY ("received_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expected_money"
    ADD CONSTRAINT "expected_money_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_contributions"
    ADD CONSTRAINT "goal_contributions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_transfer_account_id_fkey" FOREIGN KEY ("transfer_account_id") REFERENCES "public"."accounts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete their own transactions" ON "public"."transactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own transactions" ON "public"."transactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own contacts" ON "public"."contacts" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own customers" ON "public"."customers" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own leads" ON "public"."leads" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_all" ON "public"."activities" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attachments_all" ON "public"."attachments" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."bills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts_all" ON "public"."contacts" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."debts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expected_money" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goal_contributions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_all" ON "public"."leads" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notes_all" ON "public"."notes" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own accounts" ON "public"."accounts" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own bills" ON "public"."bills" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own budgets" ON "public"."budgets" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own debts" ON "public"."debts" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own expected_money" ON "public"."expected_money" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own goal contributions" ON "public"."goal_contributions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own goals" ON "public"."goals" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own transactions" ON "public"."transactions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_all" ON "public"."tasks" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."seed_default_accounts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."seed_default_accounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."account_balances" TO "anon";
GRANT ALL ON TABLE "public"."account_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."account_balances" TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."attachments" TO "anon";
GRANT ALL ON TABLE "public"."attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."attachments" TO "service_role";



GRANT ALL ON TABLE "public"."bills" TO "anon";
GRANT ALL ON TABLE "public"."bills" TO "authenticated";
GRANT ALL ON TABLE "public"."bills" TO "service_role";



GRANT ALL ON TABLE "public"."budgets" TO "anon";
GRANT ALL ON TABLE "public"."budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."budgets" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."debts" TO "anon";
GRANT ALL ON TABLE "public"."debts" TO "authenticated";
GRANT ALL ON TABLE "public"."debts" TO "service_role";



GRANT ALL ON TABLE "public"."expected_money" TO "anon";
GRANT ALL ON TABLE "public"."expected_money" TO "authenticated";
GRANT ALL ON TABLE "public"."expected_money" TO "service_role";



GRANT ALL ON TABLE "public"."goal_contributions" TO "anon";
GRANT ALL ON TABLE "public"."goal_contributions" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_contributions" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."goal_progress" TO "anon";
GRANT ALL ON TABLE "public"."goal_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_progress" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







