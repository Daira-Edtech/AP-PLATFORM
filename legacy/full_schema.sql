


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."flag_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."flag_priority" OWNER TO "postgres";


CREATE TYPE "public"."flag_status" AS ENUM (
    'raised',
    'acknowledged',
    'in_progress',
    'resolved',
    'escalated'
);


ALTER TYPE "public"."flag_status" OWNER TO "postgres";


CREATE TYPE "public"."risk_level" AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE "public"."risk_level" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'aww',
    'supervisor',
    'cdpo',
    'district_officer',
    'commissioner',
    'system_admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_awc_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT awc_id FROM profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_awc_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_district_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT district_id FROM profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_district_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_mandal_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT mandal_id FROM profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_mandal_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_escalate_flags"() RETURNS TABLE("escalated_count" integer, "to_cdpo" integer, "to_district" integer, "to_state" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_cdpo INT := 0;
  v_district INT := 0;
  v_state INT := 0;
BEGIN
  -- 7 days unresolved → CDPO
  UPDATE flags SET status = 'escalated', escalated_to = 'cdpo', escalated_at = now()
  WHERE status IN ('raised', 'acknowledged') AND escalated_to IS NULL
    AND created_at < now() - INTERVAL '7 days';
  GET DIAGNOSTICS v_cdpo = ROW_COUNT;

  -- 14 days → District
  UPDATE flags SET escalated_to = 'district', escalated_at = now()
  WHERE status = 'escalated' AND escalated_to = 'cdpo'
    AND created_at < now() - INTERVAL '14 days';
  GET DIAGNOSTICS v_district = ROW_COUNT;

  -- 21 days → State
  UPDATE flags SET escalated_to = 'state', escalated_at = now()
  WHERE status = 'escalated' AND escalated_to = 'district'
    AND created_at < now() - INTERVAL '21 days';
  GET DIAGNOSTICS v_state = ROW_COUNT;

  RETURN QUERY SELECT v_cdpo + v_district + v_state, v_cdpo, v_district, v_state;
END;
$$;


ALTER FUNCTION "public"."auto_escalate_flags"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."awc_ids_in_district"("d_id" "uuid") RETURNS "uuid"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT ARRAY(SELECT id FROM awcs WHERE mandal_id = ANY(mandal_ids_in_district(d_id)));
$$;


ALTER FUNCTION "public"."awc_ids_in_district"("d_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."awc_ids_in_mandal"("m_id" "uuid") RETURNS "uuid"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT ARRAY(SELECT id FROM awcs WHERE mandal_id = m_id);
$$;


ALTER FUNCTION "public"."awc_ids_in_mandal"("m_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."child_age_months"("child_dob" "date") RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, child_dob))::INT * 12
       + EXTRACT(MONTH FROM age(CURRENT_DATE, child_dob))::INT;
$$;


ALTER FUNCTION "public"."child_age_months"("child_dob" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_session_scores"("p_session_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
  v_composite DECIMAL;
BEGIN
  -- Calculate per-domain scores
  SELECT jsonb_object_agg(domain, domain_score) INTO v_result
  FROM (
    SELECT
      q.domain,
      ROUND(
        100.0 * SUM(CASE
          WHEN qr.response = 'yes' THEN q.weight
          WHEN qr.response = 'sometimes' THEN q.weight * 0.5
          ELSE 0
        END) / NULLIF(SUM(q.weight), 0)
      , 1) AS domain_score
    FROM questionnaire_responses qr
    JOIN questions q ON q.id = qr.question_id
    WHERE qr.session_id = p_session_id
      AND qr.response != 'skipped'
    GROUP BY q.domain
  ) sub;

  -- Compute composite (average of domains)
  SELECT ROUND(AVG(val::NUMERIC), 1) INTO v_composite
  FROM jsonb_each_text(v_result) AS t(key, val);

  -- Update session
  UPDATE questionnaire_sessions SET
    domain_scores = v_result,
    composite_score = v_composite,
    status = 'complete',
    completed_at = now(),
    questions_answered = (SELECT COUNT(*) FROM questionnaire_responses WHERE session_id = p_session_id AND response != 'skipped')
  WHERE id = p_session_id;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."compute_session_scores"("p_session_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_number" integer NOT NULL,
    "text_en" "text" NOT NULL,
    "text_te" "text",
    "domain" "text" NOT NULL,
    "age_min_months" integer NOT NULL,
    "age_max_months" integer NOT NULL,
    "weight" numeric(3,2) DEFAULT 1.00,
    "is_critical" boolean DEFAULT false,
    "illustration_url" "text",
    "audio_url_te" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "questions_domain_check" CHECK (("domain" = ANY (ARRAY['GM'::"text", 'FM'::"text", 'LC'::"text", 'COG'::"text", 'SE'::"text"])))
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_questions_for_child"("p_child_id" "uuid") RETURNS SETOF "public"."questions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_age INT;
BEGIN
  SELECT child_age_months(dob) INTO v_age FROM children WHERE id = p_child_id;
  RETURN QUERY
    SELECT * FROM questions
    WHERE v_age BETWEEN age_min_months AND age_max_months
    ORDER BY domain, question_number;
END;
$$;


ALTER FUNCTION "public"."get_questions_for_child"("p_child_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_risk_distribution"("p_level" "text", "p_entity_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_awc_ids UUID[];
  v_result JSONB;
BEGIN
  IF p_level = 'awc' THEN
    v_awc_ids := ARRAY[p_entity_id];
  ELSIF p_level = 'mandal' THEN
    v_awc_ids := awc_ids_in_mandal(p_entity_id);
  ELSIF p_level = 'district' THEN
    v_awc_ids := awc_ids_in_district(p_entity_id);
  ELSE
    SELECT ARRAY(SELECT id FROM awcs) INTO v_awc_ids;  -- State level
  END IF;

  SELECT jsonb_build_object(
    'total', COUNT(*),
    'low', COUNT(*) FILTER (WHERE current_risk_level = 'low'),
    'medium', COUNT(*) FILTER (WHERE current_risk_level = 'medium'),
    'high', COUNT(*) FILTER (WHERE current_risk_level = 'high'),
    'critical', COUNT(*) FILTER (WHERE current_risk_level = 'critical'),
    'unscreened', COUNT(*) FILTER (WHERE current_risk_level IS NULL)
  ) INTO v_result
  FROM children
  WHERE awc_id = ANY(v_awc_ids) AND is_active = true;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_risk_distribution"("p_level" "text", "p_entity_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.phone,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'aww'::user_role
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mandal_ids_in_district"("d_id" "uuid") RETURNS "uuid"[]
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT ARRAY(SELECT id FROM mandals WHERE district_id = d_id);
$$;


ALTER FUNCTION "public"."mandal_ids_in_district"("d_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_child_risk"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE children SET
    current_risk_level = NEW.risk_level,
    last_screening_date = NEW.assessed_at::DATE,
    updated_at = now()
  WHERE id = NEW.child_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_child_risk"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title_en" "text" NOT NULL,
    "title_te" "text",
    "description_en" "text" NOT NULL,
    "description_te" "text",
    "domain" "text" NOT NULL,
    "age_min_months" integer NOT NULL,
    "age_max_months" integer NOT NULL,
    "difficulty" "text" DEFAULT 'easy'::"text",
    "materials_needed" "text",
    "duration_minutes" integer DEFAULT 10,
    "illustration_url" "text",
    "audio_url_te" "text",
    "video_url" "text",
    "tags" "text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "activities_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['easy'::"text", 'moderate'::"text", 'advanced'::"text"]))),
    CONSTRAINT "activities_domain_check" CHECK (("domain" = ANY (ARRAY['GM'::"text", 'FM'::"text", 'LC'::"text", 'COG'::"text", 'SE'::"text"])))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "assessment_id" "uuid",
    "week_number" integer,
    "priority" integer DEFAULT 1,
    "reason" "text",
    "status" "text" DEFAULT 'recommended'::"text",
    "completed_at" timestamp with time zone,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "activity_recommendations_status_check" CHECK (("status" = ANY (ARRAY['recommended'::"text", 'shared_with_parent'::"text", 'attempted'::"text", 'completed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."activity_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text",
    "child_id" "uuid",
    "awc_id" "uuid",
    "target_roles" "public"."user_role"[],
    "target_user_id" "uuid",
    "message" "text" NOT NULL,
    "action_url" "text",
    "is_read" boolean DEFAULT false,
    "acknowledged_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "alerts_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "session_id" "uuid",
    "composite_score" numeric(5,2),
    "domain_scores" "jsonb" NOT NULL,
    "risk_level" "public"."risk_level" NOT NULL,
    "confidence" numeric(3,2),
    "predicted_risk_3mo" "public"."risk_level",
    "predicted_risk_6mo" "public"."risk_level",
    "trajectory" "text",
    "condition_flags" "jsonb",
    "explainability" "jsonb",
    "previous_assessment_id" "uuid",
    "assessed_by" "text" DEFAULT 'ai_questionnaire_v1'::"text",
    "assessed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "assessments_trajectory_check" CHECK (("trajectory" = ANY (ARRAY['improving'::"text", 'stable'::"text", 'declining'::"text", 'new'::"text"])))
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" bigint NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "user_role" "public"."user_role",
    "action" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "text",
    "details" "jsonb",
    "ip_address" "inet",
    "purpose" "text" NOT NULL
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audit_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_log_id_seq" OWNED BY "public"."audit_log"."id";



CREATE TABLE IF NOT EXISTS "public"."awcs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "panchayat_id" "uuid",
    "sector_id" "uuid" NOT NULL,
    "mandal_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "village_name" "text",
    "target_children" integer DEFAULT 40,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."awcs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."caregiver_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "relationship" "text",
    "preferred_language" "text" DEFAULT 'te'::"text",
    "literacy_level" "text",
    "whatsapp_enabled" boolean DEFAULT false,
    "sms_consent" boolean DEFAULT false,
    "nudge_frequency" "text" DEFAULT 'weekly'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "caregiver_profiles_literacy_level_check" CHECK (("literacy_level" = ANY (ARRAY['none'::"text", 'basic'::"text", 'functional'::"text", 'fluent'::"text"]))),
    CONSTRAINT "caregiver_profiles_nudge_frequency_check" CHECK (("nudge_frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'biweekly'::"text", 'none'::"text"]))),
    CONSTRAINT "caregiver_profiles_relationship_check" CHECK (("relationship" = ANY (ARRAY['mother'::"text", 'father'::"text", 'grandmother'::"text", 'grandfather'::"text", 'guardian'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."caregiver_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."children" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "dob" "date" NOT NULL,
    "gender" "text",
    "mother_name" "text",
    "mother_phone" "text",
    "father_name" "text",
    "father_phone" "text",
    "guardian_name" "text",
    "address" "text",
    "village" "text",
    "panchayat_name" "text",
    "photo_url" "text",
    "awc_id" "uuid" NOT NULL,
    "registration_mode" "text" DEFAULT 'manual'::"text",
    "registration_audio_url" "text",
    "consent_obtained" boolean DEFAULT false,
    "consent_date" "date",
    "consent_type" "text" DEFAULT 'verbal'::"text",
    "current_risk_level" "public"."risk_level",
    "last_screening_date" "date",
    "is_active" boolean DEFAULT true,
    "registered_by" "uuid",
    "registered_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "parent_aadhaar" character(12),
    "parent_aadhaar_of" "text",
    "pincode" "text",
    "district" "text",
    "state" "text",
    CONSTRAINT "children_consent_type_check" CHECK (("consent_type" = ANY (ARRAY['verbal'::"text", 'digital_signature'::"text", 'written'::"text"]))),
    CONSTRAINT "children_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text"]))),
    CONSTRAINT "children_parent_aadhaar_check" CHECK (("parent_aadhaar" ~ '^\d{12}$'::"text")),
    CONSTRAINT "children_parent_aadhaar_of_check" CHECK (("parent_aadhaar_of" = ANY (ARRAY['mother'::"text", 'father'::"text", 'guardian'::"text"]))),
    CONSTRAINT "children_registration_mode_check" CHECK (("registration_mode" = ANY (ARRAY['manual'::"text", 'omr'::"text", 'voice'::"text"])))
);


ALTER TABLE "public"."children" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."districts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "state_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."districts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "raised_by" "uuid" NOT NULL,
    "priority" "public"."flag_priority" DEFAULT 'medium'::"public"."flag_priority" NOT NULL,
    "status" "public"."flag_status" DEFAULT 'raised'::"public"."flag_status",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text",
    "related_observation_id" "uuid",
    "related_session_id" "uuid",
    "assigned_to" "uuid",
    "acknowledged_at" timestamp with time zone,
    "acknowledged_by" "uuid",
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "resolution_notes" "text",
    "escalated_to" "text",
    "escalated_at" timestamp with time zone,
    "auto_escalation_due" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "flags_category_check" CHECK (("category" = ANY (ARRAY['developmental_concern'::"text", 'health_issue'::"text", 'nutrition'::"text", 'behavioral'::"text", 'urgent_medical'::"text", 'attendance'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interventions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "assessment_id" "uuid",
    "intervention_type" "text" NOT NULL,
    "description" "text",
    "target_domains" "text"[],
    "assigned_to" "uuid",
    "status" "text" DEFAULT 'planned'::"text",
    "start_date" "date",
    "end_date" "date",
    "progress_notes" "jsonb" DEFAULT '[]'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "interventions_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."interventions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "level" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "period" "text" NOT NULL,
    "metrics" "jsonb" NOT NULL,
    "computed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."kpi_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mandals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "district_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mandals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nudge_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "caregiver_id" "uuid" NOT NULL,
    "child_id" "uuid" NOT NULL,
    "activity_id" "uuid",
    "channel" "text" NOT NULL,
    "message_text" "text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text",
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "nudge_log_channel_check" CHECK (("channel" = ANY (ARRAY['whatsapp'::"text", 'sms'::"text", 'in_app'::"text"]))),
    CONSTRAINT "nudge_log_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'sent'::"text", 'delivered'::"text", 'read'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."nudge_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."observations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "aww_user_id" "uuid" NOT NULL,
    "visit_date" "date" DEFAULT CURRENT_DATE,
    "observation_text" "text" NOT NULL,
    "voice_note_url" "text",
    "category" "text",
    "auto_tags" "text"[],
    "sentiment" "text",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "observations_category_check" CHECK (("category" = ANY (ARRAY['developmental'::"text", 'behavioral'::"text", 'physical'::"text", 'nutritional'::"text", 'social'::"text", 'other'::"text"]))),
    CONSTRAINT "observations_sentiment_check" CHECK (("sentiment" = ANY (ARRAY['positive'::"text", 'neutral'::"text", 'concern'::"text"])))
);


ALTER TABLE "public"."observations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."panchayats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sector_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."panchayats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prenatal_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "gestational_age_weeks" integer,
    "birth_weight_grams" integer,
    "delivery_type" "text",
    "birth_place" "text",
    "apgar_1min" integer,
    "apgar_5min" integer,
    "nicu_stay" boolean DEFAULT false,
    "nicu_days" integer DEFAULT 0,
    "birth_complications" "jsonb" DEFAULT '[]'::"jsonb",
    "maternal_conditions" "jsonb" DEFAULT '[]'::"jsonb",
    "neonatal_jaundice" boolean DEFAULT false,
    "congenital_conditions" "text",
    "family_history" "jsonb" DEFAULT '{}'::"jsonb",
    "developmental_concerns" "text",
    "input_mode" "text" DEFAULT 'manual'::"text",
    "taken_by" "uuid",
    "taken_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "prenatal_history_birth_place_check" CHECK (("birth_place" = ANY (ARRAY['hospital'::"text", 'home'::"text", 'phc'::"text", 'other'::"text"]))),
    CONSTRAINT "prenatal_history_delivery_type_check" CHECK (("delivery_type" = ANY (ARRAY['normal'::"text", 'c_section'::"text", 'assisted'::"text", 'emergency'::"text"]))),
    CONSTRAINT "prenatal_history_input_mode_check" CHECK (("input_mode" = ANY (ARRAY['manual'::"text", 'omr'::"text", 'voice'::"text"])))
);


ALTER TABLE "public"."prenatal_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "role" "public"."user_role" DEFAULT 'aww'::"public"."user_role" NOT NULL,
    "awc_id" "uuid",
    "mandal_id" "uuid",
    "district_id" "uuid",
    "state_id" "uuid",
    "is_active" boolean DEFAULT true,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaire_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "response" "text",
    "omr_confidence" numeric(3,2),
    "needs_review" boolean DEFAULT false,
    "voice_audio_url" "text",
    "answered_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "questionnaire_responses_response_check" CHECK (("response" = ANY (ARRAY['yes'::"text", 'sometimes'::"text", 'no'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."questionnaire_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaire_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "session_type" "text" DEFAULT 'initial_checklist'::"text",
    "input_mode" "text" DEFAULT 'digital'::"text",
    "omr_scan_url" "text",
    "omr_confidence" numeric(3,2),
    "questions_total" integer,
    "questions_answered" integer,
    "domain_scores" "jsonb",
    "composite_score" numeric(5,2),
    "risk_level" "public"."risk_level",
    "risk_confidence" numeric(3,2),
    "deviation_flags" "jsonb",
    "ai_version" "text" DEFAULT 'rule_v1'::"text",
    "conducted_by" "uuid",
    "status" "text" DEFAULT 'in_progress'::"text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "questionnaire_sessions_input_mode_check" CHECK (("input_mode" = ANY (ARRAY['digital'::"text", 'omr_scan'::"text", 'voice'::"text"]))),
    CONSTRAINT "questionnaire_sessions_session_type_check" CHECK (("session_type" = ANY (ARRAY['initial_checklist'::"text", 'follow_up'::"text", 'milestone_check'::"text"]))),
    CONSTRAINT "questionnaire_sessions_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'complete'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."questionnaire_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "assessment_id" "uuid",
    "referral_type" "text" NOT NULL,
    "urgency" "text" DEFAULT 'routine'::"text",
    "status" "text" DEFAULT 'generated'::"text",
    "facility_name" "text",
    "facility_type" "text",
    "specialist_notes" "text",
    "appointment_date" "date",
    "outcome_notes" "text",
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "referrals_status_check" CHECK (("status" = ANY (ARRAY['generated'::"text", 'sent'::"text", 'scheduled'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "referrals_urgency_check" CHECK (("urgency" = ANY (ARRAY['routine'::"text", 'priority'::"text", 'urgent'::"text", 'emergency'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sectors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mandal_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sectors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visit_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "aww_user_id" "uuid" NOT NULL,
    "child_id" "uuid",
    "visit_date" "date" NOT NULL,
    "visit_time" time without time zone,
    "visit_type" "text",
    "purpose" "text",
    "recommended_activities" "jsonb" DEFAULT '[]'::"jsonb",
    "checklist" "jsonb" DEFAULT '[]'::"jsonb",
    "status" "text" DEFAULT 'planned'::"text",
    "notes" "text",
    "activity_completion" "jsonb",
    "completed_at" timestamp with time zone,
    "is_auto_generated" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "visit_plans_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text", 'missed'::"text"]))),
    CONSTRAINT "visit_plans_visit_type_check" CHECK (("visit_type" = ANY (ARRAY['home_visit'::"text", 'follow_up'::"text", 'activity_session'::"text", 'referral_follow_up'::"text", 'general'::"text", 'awc_session'::"text"])))
);


ALTER TABLE "public"."visit_plans" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_recommendations"
    ADD CONSTRAINT "activity_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."awcs"
    ADD CONSTRAINT "awcs_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."awcs"
    ADD CONSTRAINT "awcs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."caregiver_profiles"
    ADD CONSTRAINT "caregiver_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."children"
    ADD CONSTRAINT "children_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."districts"
    ADD CONSTRAINT "districts_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."districts"
    ADD CONSTRAINT "districts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flags"
    ADD CONSTRAINT "flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interventions"
    ADD CONSTRAINT "interventions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_cache"
    ADD CONSTRAINT "kpi_cache_level_entity_id_period_key" UNIQUE ("level", "entity_id", "period");



ALTER TABLE ONLY "public"."kpi_cache"
    ADD CONSTRAINT "kpi_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mandals"
    ADD CONSTRAINT "mandals_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."mandals"
    ADD CONSTRAINT "mandals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nudge_log"
    ADD CONSTRAINT "nudge_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."observations"
    ADD CONSTRAINT "observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."panchayats"
    ADD CONSTRAINT "panchayats_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."panchayats"
    ADD CONSTRAINT "panchayats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prenatal_history"
    ADD CONSTRAINT "prenatal_history_child_id_key" UNIQUE ("child_id");



ALTER TABLE ONLY "public"."prenatal_history"
    ADD CONSTRAINT "prenatal_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_session_id_question_id_key" UNIQUE ("session_id", "question_id");



ALTER TABLE ONLY "public"."questionnaire_sessions"
    ADD CONSTRAINT "questionnaire_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_question_number_key" UNIQUE ("question_number");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sectors"
    ADD CONSTRAINT "sectors_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."sectors"
    ADD CONSTRAINT "sectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."states"
    ADD CONSTRAINT "states_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."states"
    ADD CONSTRAINT "states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visit_plans"
    ADD CONSTRAINT "visit_plans_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activities_domain" ON "public"."activities" USING "btree" ("domain");



CREATE INDEX "idx_activity_recs_child" ON "public"."activity_recommendations" USING "btree" ("child_id");



CREATE INDEX "idx_alerts_target" ON "public"."alerts" USING "btree" ("target_user_id");



CREATE INDEX "idx_alerts_unread" ON "public"."alerts" USING "btree" ("is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_assessments_child" ON "public"."assessments" USING "btree" ("child_id");



CREATE INDEX "idx_assessments_risk" ON "public"."assessments" USING "btree" ("risk_level");



CREATE INDEX "idx_audit_time" ON "public"."audit_log" USING "btree" ("timestamp");



CREATE INDEX "idx_audit_user" ON "public"."audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_awcs_mandal" ON "public"."awcs" USING "btree" ("mandal_id");



CREATE INDEX "idx_awcs_sector" ON "public"."awcs" USING "btree" ("sector_id");



CREATE INDEX "idx_children_active" ON "public"."children" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_children_awc" ON "public"."children" USING "btree" ("awc_id");



CREATE INDEX "idx_children_dob" ON "public"."children" USING "btree" ("dob");



CREATE INDEX "idx_children_risk" ON "public"."children" USING "btree" ("current_risk_level");



CREATE INDEX "idx_districts_state" ON "public"."districts" USING "btree" ("state_id");



CREATE INDEX "idx_flags_assigned" ON "public"."flags" USING "btree" ("assigned_to");



CREATE INDEX "idx_flags_child" ON "public"."flags" USING "btree" ("child_id");



CREATE INDEX "idx_flags_priority" ON "public"."flags" USING "btree" ("priority");



CREATE INDEX "idx_flags_status" ON "public"."flags" USING "btree" ("status");



CREATE INDEX "idx_kpi_level" ON "public"."kpi_cache" USING "btree" ("level", "entity_id");



CREATE INDEX "idx_mandals_district" ON "public"."mandals" USING "btree" ("district_id");



CREATE INDEX "idx_observations_child" ON "public"."observations" USING "btree" ("child_id");



CREATE INDEX "idx_panchayats_sector" ON "public"."panchayats" USING "btree" ("sector_id");



CREATE INDEX "idx_profiles_awc" ON "public"."profiles" USING "btree" ("awc_id");



CREATE INDEX "idx_profiles_district" ON "public"."profiles" USING "btree" ("district_id");



CREATE INDEX "idx_profiles_mandal" ON "public"."profiles" USING "btree" ("mandal_id");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_qresponses_session" ON "public"."questionnaire_responses" USING "btree" ("session_id");



CREATE INDEX "idx_qsessions_child" ON "public"."questionnaire_sessions" USING "btree" ("child_id");



CREATE INDEX "idx_qsessions_status" ON "public"."questionnaire_sessions" USING "btree" ("status");



CREATE INDEX "idx_referrals_child" ON "public"."referrals" USING "btree" ("child_id");



CREATE INDEX "idx_referrals_status" ON "public"."referrals" USING "btree" ("status");



CREATE INDEX "idx_sectors_mandal" ON "public"."sectors" USING "btree" ("mandal_id");



CREATE INDEX "idx_visits_aww" ON "public"."visit_plans" USING "btree" ("aww_user_id");



CREATE INDEX "idx_visits_child" ON "public"."visit_plans" USING "btree" ("child_id");



CREATE INDEX "idx_visits_date" ON "public"."visit_plans" USING "btree" ("visit_date");



CREATE OR REPLACE TRIGGER "on_assessment_created" AFTER INSERT ON "public"."assessments" FOR EACH ROW EXECUTE FUNCTION "public"."update_child_risk"();



ALTER TABLE ONLY "public"."activity_recommendations"
    ADD CONSTRAINT "activity_recommendations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id");



ALTER TABLE ONLY "public"."activity_recommendations"
    ADD CONSTRAINT "activity_recommendations_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id");



ALTER TABLE ONLY "public"."activity_recommendations"
    ADD CONSTRAINT "activity_recommendations_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_awc_id_fkey" FOREIGN KEY ("awc_id") REFERENCES "public"."awcs"("id");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_previous_assessment_id_fkey" FOREIGN KEY ("previous_assessment_id") REFERENCES "public"."assessments"("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."questionnaire_sessions"("id");



ALTER TABLE ONLY "public"."awcs"
    ADD CONSTRAINT "awcs_mandal_id_fkey" FOREIGN KEY ("mandal_id") REFERENCES "public"."mandals"("id");



ALTER TABLE ONLY "public"."awcs"
    ADD CONSTRAINT "awcs_panchayat_id_fkey" FOREIGN KEY ("panchayat_id") REFERENCES "public"."panchayats"("id");



ALTER TABLE ONLY "public"."awcs"
    ADD CONSTRAINT "awcs_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."caregiver_profiles"
    ADD CONSTRAINT "caregiver_profiles_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."children"
    ADD CONSTRAINT "children_awc_id_fkey" FOREIGN KEY ("awc_id") REFERENCES "public"."awcs"("id");



ALTER TABLE ONLY "public"."children"
    ADD CONSTRAINT "children_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."districts"
    ADD CONSTRAINT "districts_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flags"
    ADD CONSTRAINT "flags_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."flags"
    ADD CONSTRAINT "flags_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."flags"
    ADD CONSTRAINT "flags_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flags"
    ADD CONSTRAINT "flags_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."flags"
    ADD CONSTRAINT "flags_related_observation_id_fkey" FOREIGN KEY ("related_observation_id") REFERENCES "public"."observations"("id");



ALTER TABLE ONLY "public"."flags"
    ADD CONSTRAINT "flags_related_session_id_fkey" FOREIGN KEY ("related_session_id") REFERENCES "public"."questionnaire_sessions"("id");



ALTER TABLE ONLY "public"."flags"
    ADD CONSTRAINT "flags_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."interventions"
    ADD CONSTRAINT "interventions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id");



ALTER TABLE ONLY "public"."interventions"
    ADD CONSTRAINT "interventions_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."interventions"
    ADD CONSTRAINT "interventions_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interventions"
    ADD CONSTRAINT "interventions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."mandals"
    ADD CONSTRAINT "mandals_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nudge_log"
    ADD CONSTRAINT "nudge_log_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id");



ALTER TABLE ONLY "public"."nudge_log"
    ADD CONSTRAINT "nudge_log_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "public"."caregiver_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nudge_log"
    ADD CONSTRAINT "nudge_log_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id");



ALTER TABLE ONLY "public"."observations"
    ADD CONSTRAINT "observations_aww_user_id_fkey" FOREIGN KEY ("aww_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."observations"
    ADD CONSTRAINT "observations_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."panchayats"
    ADD CONSTRAINT "panchayats_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prenatal_history"
    ADD CONSTRAINT "prenatal_history_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prenatal_history"
    ADD CONSTRAINT "prenatal_history_taken_by_fkey" FOREIGN KEY ("taken_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_awc_id_fkey" FOREIGN KEY ("awc_id") REFERENCES "public"."awcs"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_mandal_id_fkey" FOREIGN KEY ("mandal_id") REFERENCES "public"."mandals"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id");



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id");



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."questionnaire_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_sessions"
    ADD CONSTRAINT "questionnaire_sessions_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_sessions"
    ADD CONSTRAINT "questionnaire_sessions_conducted_by_fkey" FOREIGN KEY ("conducted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."sectors"
    ADD CONSTRAINT "sectors_mandal_id_fkey" FOREIGN KEY ("mandal_id") REFERENCES "public"."mandals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_plans"
    ADD CONSTRAINT "visit_plans_aww_user_id_fkey" FOREIGN KEY ("aww_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."visit_plans"
    ADD CONSTRAINT "visit_plans_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id");



CREATE POLICY "AWW creates" ON "public"."flags" FOR INSERT WITH CHECK (("raised_by" = "auth"."uid"()));



CREATE POLICY "AWW insert" ON "public"."children" FOR INSERT WITH CHECK (("awc_id" = "public"."auth_awc_id"()));



CREATE POLICY "AWW manages caregivers" ON "public"."caregiver_profiles" USING (("child_id" IN ( SELECT "children"."id"
   FROM "public"."children"
  WHERE ("children"."awc_id" = "public"."auth_awc_id"()))));



CREATE POLICY "AWW manages prenatal history" ON "public"."prenatal_history" USING (("child_id" IN ( SELECT "children"."id"
   FROM "public"."children"
  WHERE ("children"."awc_id" = "public"."auth_awc_id"())))) WITH CHECK (("child_id" IN ( SELECT "children"."id"
   FROM "public"."children"
  WHERE ("children"."awc_id" = "public"."auth_awc_id"()))));



CREATE POLICY "AWW own awc" ON "public"."children" FOR SELECT USING (("awc_id" = "public"."auth_awc_id"()));



CREATE POLICY "AWW own observations" ON "public"."observations" USING (("aww_user_id" = "auth"."uid"()));



CREATE POLICY "AWW own sessions" ON "public"."questionnaire_sessions" USING (("child_id" IN ( SELECT "children"."id"
   FROM "public"."children"
  WHERE ("children"."awc_id" = "public"."auth_awc_id"()))));



CREATE POLICY "AWW own visits" ON "public"."visit_plans" USING (("aww_user_id" = "auth"."uid"()));



CREATE POLICY "AWW reads own" ON "public"."assessments" FOR SELECT USING (("child_id" IN ( SELECT "children"."id"
   FROM "public"."children"
  WHERE ("children"."awc_id" = "public"."auth_awc_id"()))));



CREATE POLICY "AWW sees own" ON "public"."flags" FOR SELECT USING (("raised_by" = "auth"."uid"()));



CREATE POLICY "AWW sees recs" ON "public"."activity_recommendations" FOR SELECT USING (("child_id" IN ( SELECT "children"."id"
   FROM "public"."children"
  WHERE ("children"."awc_id" = "public"."auth_awc_id"()))));



CREATE POLICY "AWW update" ON "public"."children" FOR UPDATE USING (("awc_id" = "public"."auth_awc_id"()));



CREATE POLICY "AWW updates recs" ON "public"."activity_recommendations" FOR UPDATE USING (("child_id" IN ( SELECT "children"."id"
   FROM "public"."children"
  WHERE ("children"."awc_id" = "public"."auth_awc_id"()))));



CREATE POLICY "Admin children" ON "public"."children" USING (("public"."auth_role"() = 'system_admin'::"public"."user_role"));



CREATE POLICY "Admin full access" ON "public"."profiles" USING (("public"."auth_role"() = 'system_admin'::"public"."user_role"));



CREATE POLICY "Admin manage" ON "public"."questions" USING (("public"."auth_role"() = 'system_admin'::"public"."user_role"));



CREATE POLICY "Admin manages activities" ON "public"."activities" USING (("public"."auth_role"() = 'system_admin'::"public"."user_role"));



CREATE POLICY "Admin reads audit" ON "public"."audit_log" FOR SELECT USING (("public"."auth_role"() = 'system_admin'::"public"."user_role"));



CREATE POLICY "Append only" ON "public"."audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Assigned manages" ON "public"."interventions" USING ((("assigned_to" = "auth"."uid"()) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "CDPO district children" ON "public"."children" FOR SELECT USING ((("public"."auth_role"() = 'cdpo'::"public"."user_role") AND ("awc_id" = ANY ("public"."awc_ids_in_district"("public"."auth_district_id"())))));



CREATE POLICY "CDPO sees district" ON "public"."profiles" FOR SELECT USING ((("public"."auth_role"() = 'cdpo'::"public"."user_role") AND (("mandal_id" = ANY ("public"."mandal_ids_in_district"("public"."auth_district_id"()))) OR ("awc_id" = ANY ("public"."awc_ids_in_district"("public"."auth_district_id"()))))));



CREATE POLICY "Commissioner all children" ON "public"."children" FOR SELECT USING (("public"."auth_role"() = 'commissioner'::"public"."user_role"));



CREATE POLICY "Commissioner sees all" ON "public"."profiles" FOR SELECT USING (("public"."auth_role"() = 'commissioner'::"public"."user_role"));



CREATE POLICY "Conductor manages" ON "public"."questionnaire_responses" USING (("session_id" IN ( SELECT "questionnaire_sessions"."id"
   FROM "public"."questionnaire_sessions"
  WHERE ("questionnaire_sessions"."conducted_by" = "auth"."uid"()))));



CREATE POLICY "Creator manages" ON "public"."referrals" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "District children" ON "public"."children" FOR SELECT USING ((("public"."auth_role"() = 'district_officer'::"public"."user_role") AND ("awc_id" = ANY ("public"."awc_ids_in_district"("public"."auth_district_id"())))));



CREATE POLICY "District officer sees district" ON "public"."profiles" FOR SELECT USING ((("public"."auth_role"() = 'district_officer'::"public"."user_role") AND ("district_id" = "public"."auth_district_id"())));



CREATE POLICY "Everyone reads activities" ON "public"."activities" FOR SELECT USING (true);



CREATE POLICY "Own profile" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Public read" ON "public"."questions" FOR SELECT USING (true);



CREATE POLICY "Read KPI" ON "public"."kpi_cache" FOR SELECT USING (true);



CREATE POLICY "Supervisor manages mandal flags" ON "public"."flags" USING ((("public"."auth_role"() = 'supervisor'::"public"."user_role") AND ("child_id" IN ( SELECT "children"."id"
   FROM "public"."children"
  WHERE ("children"."awc_id" = ANY ("public"."awc_ids_in_mandal"("public"."auth_mandal_id"())))))));



CREATE POLICY "Supervisor mandal" ON "public"."children" FOR SELECT USING ((("public"."auth_role"() = 'supervisor'::"public"."user_role") AND ("awc_id" = ANY ("public"."awc_ids_in_mandal"("public"."auth_mandal_id"())))));



CREATE POLICY "Supervisor sees mandal" ON "public"."profiles" FOR SELECT USING ((("public"."auth_role"() = 'supervisor'::"public"."user_role") AND ("awc_id" = ANY ("public"."awc_ids_in_mandal"("public"."auth_mandal_id"())))));



CREATE POLICY "Supervisor sessions" ON "public"."questionnaire_sessions" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['supervisor'::"public"."user_role", 'cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "System creates alerts" ON "public"."alerts" FOR INSERT WITH CHECK (true);



CREATE POLICY "System creates recs" ON "public"."activity_recommendations" FOR INSERT WITH CHECK (true);



CREATE POLICY "System inserts assessments" ON "public"."assessments" FOR INSERT WITH CHECK (true);



CREATE POLICY "System manages nudges" ON "public"."nudge_log" USING (true);



CREATE POLICY "System writes KPI" ON "public"."kpi_cache" USING (true);



CREATE POLICY "Upper reads assessments" ON "public"."assessments" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['supervisor'::"public"."user_role", 'cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "Upper reads caregivers" ON "public"."caregiver_profiles" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['supervisor'::"public"."user_role", 'cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "Upper reads flags" ON "public"."flags" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "Upper reads interventions" ON "public"."interventions" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['supervisor'::"public"."user_role", 'cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "Upper reads obs" ON "public"."observations" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['supervisor'::"public"."user_role", 'cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "Upper reads prenatal history" ON "public"."prenatal_history" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['supervisor'::"public"."user_role", 'cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "Upper reads recs" ON "public"."activity_recommendations" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['supervisor'::"public"."user_role", 'cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "Upper reads referrals" ON "public"."referrals" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['supervisor'::"public"."user_role", 'cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "Upper reads responses" ON "public"."questionnaire_responses" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['supervisor'::"public"."user_role", 'cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "Upper reads visits" ON "public"."visit_plans" FOR SELECT USING (("public"."auth_role"() = ANY (ARRAY['supervisor'::"public"."user_role", 'cdpo'::"public"."user_role", 'district_officer'::"public"."user_role", 'commissioner'::"public"."user_role", 'system_admin'::"public"."user_role"])));



CREATE POLICY "User ack alerts" ON "public"."alerts" FOR UPDATE USING (("target_user_id" = "auth"."uid"()));



CREATE POLICY "User own alerts" ON "public"."alerts" FOR SELECT USING ((("target_user_id" = "auth"."uid"()) OR ("public"."auth_role"() = ANY ("target_roles"))));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "aww_insert_children" ON "public"."children" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."caregiver_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."children" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interventions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nudge_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."observations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prenatal_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questionnaire_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questionnaire_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."visit_plans" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."auth_awc_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_awc_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_awc_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_district_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_district_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_district_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_mandal_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_mandal_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_mandal_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_escalate_flags"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_escalate_flags"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_escalate_flags"() TO "service_role";



GRANT ALL ON FUNCTION "public"."awc_ids_in_district"("d_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."awc_ids_in_district"("d_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."awc_ids_in_district"("d_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."awc_ids_in_mandal"("m_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."awc_ids_in_mandal"("m_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."awc_ids_in_mandal"("m_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."child_age_months"("child_dob" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."child_age_months"("child_dob" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."child_age_months"("child_dob" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_session_scores"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."compute_session_scores"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_session_scores"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_questions_for_child"("p_child_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_questions_for_child"("p_child_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_questions_for_child"("p_child_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_risk_distribution"("p_level" "text", "p_entity_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_risk_distribution"("p_level" "text", "p_entity_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_risk_distribution"("p_level" "text", "p_entity_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mandal_ids_in_district"("d_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mandal_ids_in_district"("d_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mandal_ids_in_district"("d_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_child_risk"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_child_risk"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_child_risk"() TO "service_role";


















GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."activity_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."activity_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."alerts" TO "anon";
GRANT ALL ON TABLE "public"."alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."alerts" TO "service_role";



GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."awcs" TO "anon";
GRANT ALL ON TABLE "public"."awcs" TO "authenticated";
GRANT ALL ON TABLE "public"."awcs" TO "service_role";



GRANT ALL ON TABLE "public"."caregiver_profiles" TO "anon";
GRANT ALL ON TABLE "public"."caregiver_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."caregiver_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."children" TO "anon";
GRANT ALL ON TABLE "public"."children" TO "authenticated";
GRANT ALL ON TABLE "public"."children" TO "service_role";



GRANT ALL ON TABLE "public"."districts" TO "anon";
GRANT ALL ON TABLE "public"."districts" TO "authenticated";
GRANT ALL ON TABLE "public"."districts" TO "service_role";



GRANT ALL ON TABLE "public"."flags" TO "anon";
GRANT ALL ON TABLE "public"."flags" TO "authenticated";
GRANT ALL ON TABLE "public"."flags" TO "service_role";



GRANT ALL ON TABLE "public"."interventions" TO "anon";
GRANT ALL ON TABLE "public"."interventions" TO "authenticated";
GRANT ALL ON TABLE "public"."interventions" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_cache" TO "anon";
GRANT ALL ON TABLE "public"."kpi_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_cache" TO "service_role";



GRANT ALL ON TABLE "public"."mandals" TO "anon";
GRANT ALL ON TABLE "public"."mandals" TO "authenticated";
GRANT ALL ON TABLE "public"."mandals" TO "service_role";



GRANT ALL ON TABLE "public"."nudge_log" TO "anon";
GRANT ALL ON TABLE "public"."nudge_log" TO "authenticated";
GRANT ALL ON TABLE "public"."nudge_log" TO "service_role";



GRANT ALL ON TABLE "public"."observations" TO "anon";
GRANT ALL ON TABLE "public"."observations" TO "authenticated";
GRANT ALL ON TABLE "public"."observations" TO "service_role";



GRANT ALL ON TABLE "public"."panchayats" TO "anon";
GRANT ALL ON TABLE "public"."panchayats" TO "authenticated";
GRANT ALL ON TABLE "public"."panchayats" TO "service_role";



GRANT ALL ON TABLE "public"."prenatal_history" TO "anon";
GRANT ALL ON TABLE "public"."prenatal_history" TO "authenticated";
GRANT ALL ON TABLE "public"."prenatal_history" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."questionnaire_responses" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."questionnaire_responses" TO "service_role";



GRANT ALL ON TABLE "public"."questionnaire_sessions" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."questionnaire_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."sectors" TO "anon";
GRANT ALL ON TABLE "public"."sectors" TO "authenticated";
GRANT ALL ON TABLE "public"."sectors" TO "service_role";



GRANT ALL ON TABLE "public"."states" TO "anon";
GRANT ALL ON TABLE "public"."states" TO "authenticated";
GRANT ALL ON TABLE "public"."states" TO "service_role";



GRANT ALL ON TABLE "public"."visit_plans" TO "anon";
GRANT ALL ON TABLE "public"."visit_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."visit_plans" TO "service_role";









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































