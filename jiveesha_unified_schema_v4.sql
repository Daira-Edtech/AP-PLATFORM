-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  JIVEESHA ECD PLATFORM — Unified Schema v4.0                          ║
-- ║  Complete Database: v2.0 Base + v3.0 + v3.1 + Super Admin             ║
-- ║  Single-file deployment — run in Supabase SQL Editor                  ║
-- ║  Daira EdTech Pvt. Ltd. | March 2026                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- TABLE COUNT:  42 tables
-- VIEWS:        6
-- FUNCTIONS:    22
-- TRIGGERS:     25
-- RLS POLICIES: 90+
-- INDEXES:      75+
-- ENUMS:        13
-- CRON JOBS:    4
--
-- ROLES: aww, supervisor, cdpo, district_officer, commissioner,
--         system_admin, super_admin
--
-- Run sections in order — tables reference each other via foreign keys.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS moddatetime;
CREATE EXTENSION IF NOT EXISTS pg_cron;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: CUSTOM ENUMS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE user_role AS ENUM (
  'aww', 'supervisor', 'cdpo', 'district_officer', 'commissioner',
  'system_admin', 'super_admin'
);

CREATE TYPE flag_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE flag_status AS ENUM (
  'raised', 'acknowledged', 'in_progress', 'resolved', 'escalated',
  'pending_review', 'confirmed', 'dismissed'
);
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE screening_level AS ENUM ('aww_basic', 'supervisor_detailed');
CREATE TYPE intervention_task_status AS ENUM (
  'pending', 'in_progress', 'completed', 'not_done', 'skipped', 'deferred'
);
CREATE TYPE referral_source AS ENUM ('ai_suggested', 'manual', 'auto_escalation');
CREATE TYPE conversation_response_type AS ENUM (
  'verbal', 'non_verbal', 'no_response', 'partial',
  'age_appropriate', 'below_expected'
);
CREATE TYPE observation_type AS ENUM ('manual', 'ai_generated');
CREATE TYPE observation_status AS ENUM ('approved', 'pending_approval', 'rejected');
CREATE TYPE concern_level AS ENUM ('normal', 'mild', 'moderate', 'significant');
CREATE TYPE flag_source AS ENUM ('manual', 'ai_auto', 'ai_suggested');
CREATE TYPE observation_visit_type AS ENUM (
  'home_visit', 'awc_routine', 'follow_up', 'screening'
);
CREATE TYPE consent_method AS ENUM (
  'verbal', 'digital', 'written', 'guardian_verbal', 'guardian_digital'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: GEOGRAPHIC HIERARCHY
-- State > District > Mandal > Sector > Panchayat > AWC
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mandals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE panchayats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE awcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panchayat_id UUID REFERENCES panchayats(id),
  sector_id UUID NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  mandal_id UUID NOT NULL REFERENCES mandals(id),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  village_name TEXT,
  target_children INT DEFAULT 40,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: USER PROFILES (extends Supabase Auth)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT,
  role user_role NOT NULL DEFAULT 'aww',
  panchayat_id UUID REFERENCES panchayats(id),
  sector_id UUID REFERENCES sectors(id),
  mandal_id UUID REFERENCES mandals(id),
  district_id UUID REFERENCES districts(id),
  state_id UUID REFERENCES states(id),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  -- Super Admin fields
  permissions JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  login_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.phone,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aww')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: CHILDREN & PRENATAL HISTORY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  mother_name TEXT,
  mother_phone TEXT,
  father_name TEXT,
  father_phone TEXT,
  guardian_name TEXT,
  address TEXT,
  village TEXT,
  panchayat_name TEXT,
  photo_url TEXT,
  awc_id UUID NOT NULL REFERENCES awcs(id),
  registration_mode TEXT CHECK (registration_mode IN ('manual', 'omr', 'voice')) DEFAULT 'manual',
  registration_audio_url TEXT,
  consent_obtained BOOLEAN DEFAULT false,
  consent_date DATE,
  consent_type TEXT CHECK (consent_type IN ('verbal', 'digital_signature', 'written')) DEFAULT 'verbal',
  current_risk_level risk_level,
  last_screening_date DATE,
  is_active BOOLEAN DEFAULT true,
  registered_by UUID REFERENCES auth.users(id),
  registered_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION child_age_months(child_dob DATE)
RETURNS INT AS $$
  SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, child_dob))::INT * 12
       + EXTRACT(MONTH FROM age(CURRENT_DATE, child_dob))::INT;
$$ LANGUAGE sql IMMUTABLE;

CREATE TABLE prenatal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL UNIQUE REFERENCES children(id) ON DELETE CASCADE,
  gestational_age_weeks INT,
  birth_weight_grams INT,
  delivery_type TEXT CHECK (delivery_type IN ('normal', 'c_section', 'assisted', 'emergency')),
  birth_place TEXT CHECK (birth_place IN ('hospital', 'home', 'phc', 'other')),
  apgar_1min INT,
  apgar_5min INT,
  nicu_stay BOOLEAN DEFAULT false,
  nicu_days INT DEFAULT 0,
  birth_complications JSONB DEFAULT '[]',
  maternal_conditions JSONB DEFAULT '[]',
  neonatal_jaundice BOOLEAN DEFAULT false,
  congenital_conditions TEXT,
  family_history JSONB DEFAULT '{}',
  developmental_concerns TEXT,
  input_mode TEXT CHECK (input_mode IN ('manual', 'omr', 'voice')) DEFAULT 'manual',
  taken_by UUID REFERENCES auth.users(id),
  taken_at TIMESTAMPTZ DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: QUESTIONNAIRE SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INT UNIQUE NOT NULL,
  text_en TEXT NOT NULL,
  text_te TEXT,
  domain TEXT NOT NULL CHECK (domain IN ('GM', 'FM', 'LC', 'COG', 'SE')),
  age_min_months INT NOT NULL,
  age_max_months INT NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.00,
  is_critical BOOLEAN DEFAULT false,
  illustration_url TEXT,
  audio_url_te TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE questionnaire_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_type TEXT CHECK (session_type IN (
    'initial_checklist', 'follow_up', 'milestone_check'
  )) DEFAULT 'initial_checklist',
  input_mode TEXT CHECK (input_mode IN ('digital', 'omr_scan', 'voice')) DEFAULT 'digital',
  omr_scan_url TEXT,
  omr_confidence DECIMAL(3,2),
  questions_total INT,
  questions_answered INT,
  domain_scores JSONB,
  composite_score DECIMAL(5,2),
  risk_level risk_level,
  risk_confidence DECIMAL(3,2),
  deviation_flags JSONB,
  ai_version TEXT DEFAULT 'rule_v1',
  conducted_by UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('in_progress', 'complete', 'abandoned')) DEFAULT 'in_progress',
  -- v3.0 additions
  screening_level screening_level DEFAULT 'aww_basic',
  parent_session_id UUID REFERENCES questionnaire_sessions(id),
  -- v3.1 additions
  supervisor_review JSONB,
  ai_narrative TEXT,
  ai_predictions JSONB,
  supervisor_override_risk TEXT CHECK (supervisor_override_risk IN ('low', 'medium', 'high', 'critical')),
  override_justification TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES questionnaire_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  response TEXT CHECK (response IN ('yes', 'sometimes', 'no', 'skipped')),
  omr_confidence DECIMAL(3,2),
  needs_review BOOLEAN DEFAULT false,
  voice_audio_url TEXT,
  answered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, question_id)
);

-- Supervisor questions (M-CHAT-R + detailed)
CREATE TABLE supervisor_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INT NOT NULL,
  text_en TEXT NOT NULL,
  text_te TEXT,
  domain TEXT NOT NULL CHECK (domain IN ('GM', 'FM', 'LC', 'COG', 'SE', 'AUTISM', 'PSYCH', 'SOCIAL')),
  sub_domain TEXT,
  age_min_months INT NOT NULL,
  age_max_months INT NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.00,
  is_critical BOOLEAN DEFAULT false,
  screening_tool TEXT,
  instructions_en TEXT,
  instructions_te TEXT,
  scoring_guide JSONB,
  illustration_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_number, screening_tool)
);

CREATE TABLE supervisor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES questionnaire_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES supervisor_questions(id),
  response TEXT,
  response_score DECIMAL(4,2),
  observer_notes TEXT,
  confidence TEXT CHECK (confidence IN ('certain', 'likely', 'unsure')),
  answered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, question_id)
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 6: OBSERVATIONS (v2.0 base + v3.1 enhancements unified)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  aww_user_id UUID NOT NULL REFERENCES auth.users(id),
  visit_date DATE DEFAULT CURRENT_DATE,
  observation_text TEXT NOT NULL,
  voice_note_url TEXT,
  category TEXT CHECK (category IN (
    'developmental', 'behavioral', 'physical', 'nutritional', 'social', 'other'
  )),
  auto_tags TEXT[],
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'concern')),
  attachments JSONB DEFAULT '[]',
  -- v3.1 enhancements
  type observation_type NOT NULL DEFAULT 'manual',
  domain TEXT CHECK (domain IN ('GM', 'FM', 'LC', 'COG', 'SE', 'health', 'nutrition', 'behavioral')),
  concern_level concern_level DEFAULT 'normal',
  severity_weight INT DEFAULT 0 CHECK (severity_weight BETWEEN 0 AND 3),
  ai_response JSONB,
  ai_model TEXT,
  ai_confidence TEXT CHECK (ai_confidence IN ('HIGH', 'MODERATE', 'LOW')),
  status observation_status NOT NULL DEFAULT 'approved',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  session_id UUID REFERENCES questionnaire_sessions(id),
  followup_id UUID,  -- FK added after intervention_followups created
  photo_analysis_id UUID,  -- FK added after photo_analyses created
  visit_type_v31 observation_visit_type,
  photo_url TEXT,
  audio_url TEXT,
  created_by_role screening_level DEFAULT 'aww_basic',
  observation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 7: FLAGS (v2.0 base + v3.1 enhancements unified)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES auth.users(id),
  priority flag_priority NOT NULL DEFAULT 'medium',
  status flag_status DEFAULT 'raised',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'developmental_concern', 'health_issue', 'nutrition',
    'behavioral', 'urgent_medical', 'attendance', 'other'
  )),
  related_observation_id UUID REFERENCES observations(id),
  related_session_id UUID REFERENCES questionnaire_sessions(id),
  assigned_to UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  escalated_to TEXT,
  escalated_at TIMESTAMPTZ,
  auto_escalation_due TIMESTAMPTZ,
  -- v3.1 enhancements
  source flag_source DEFAULT 'manual',
  ai_reasoning TEXT,
  raised_by_role screening_level,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  escalation_deadline TIMESTAMPTZ DEFAULT (now() + INTERVAL '48 hours'),
  auto_escalated BOOLEAN DEFAULT false,
  escalated_to_user_id UUID REFERENCES auth.users(id),
  observation_id UUID REFERENCES observations(id),
  photo_analysis_id UUID,  -- FK added after photo_analyses
  conversation_assessment_id UUID,  -- FK added after conversation_assessments
  autism_screening_id UUID,  -- FK added after autism_screenings
  referral_id UUID,  -- FK added after referrals
  plan_id UUID,  -- FK added after intervention_plans
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 8: VISIT PLANS (v2.0 + v3.1 missed visit tracking)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE visit_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aww_user_id UUID NOT NULL REFERENCES auth.users(id),
  child_id UUID REFERENCES children(id),
  visit_date DATE NOT NULL,
  visit_time TIME,
  visit_type TEXT CHECK (visit_type IN (
    'home_visit', 'follow_up', 'activity_session',
    'referral_follow_up', 'general', 'awc_session'
  )),
  purpose TEXT,
  recommended_activities JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  status TEXT CHECK (status IN (
    'planned', 'in_progress', 'completed', 'cancelled', 'missed'
  )) DEFAULT 'planned',
  notes TEXT,
  activity_completion JSONB,
  completed_at TIMESTAMPTZ,
  is_auto_generated BOOLEAN DEFAULT false,
  -- v3.1 missed visit tracking
  missed_notification_sent BOOLEAN DEFAULT false,
  consecutive_misses INT DEFAULT 0,
  -- Universal consent (DPDP Act)
  consent_obtained BOOLEAN DEFAULT false,
  consent_type consent_method,
  consent_recorded_at TIMESTAMPTZ,
  consent_recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 9: ASSESSMENTS & RISK
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  composite_score DECIMAL(5,2),
  domain_scores JSONB NOT NULL,
  risk_level risk_level NOT NULL,
  confidence DECIMAL(3,2),
  predicted_risk_3mo risk_level,
  predicted_risk_6mo risk_level,
  trajectory TEXT CHECK (trajectory IN ('improving', 'stable', 'declining', 'new')),
  condition_flags JSONB,
  explainability JSONB,
  previous_assessment_id UUID REFERENCES assessments(id),
  assessed_by TEXT DEFAULT 'ai_questionnaire_v1',
  assessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_child_risk()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE children SET
    current_risk_level = NEW.risk_level,
    last_screening_date = NEW.assessed_at::DATE,
    updated_at = now()
  WHERE id = NEW.child_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_assessment_created
  AFTER INSERT ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_child_risk();


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 10: PHOTO ANALYSIS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE photo_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  face_photo_url TEXT NOT NULL,
  body_photo_url TEXT,
  additional_photo_urls JSONB DEFAULT '[]',
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  head_circumference_cm DECIMAL(5,2),
  muac_cm DECIMAL(4,2),
  age_months_at_analysis INT NOT NULL,
  ai_response JSONB NOT NULL,
  photo_risk_score INT DEFAULT 0 CHECK (photo_risk_score BETWEEN 0 AND 15),
  risk_level risk_level,
  confidence TEXT CHECK (confidence IN ('HIGH', 'MODERATE', 'LOW')),
  priority_flags TEXT[],
  referrals_suggested JSONB,
  photo_quality TEXT CHECK (photo_quality IN ('GOOD', 'ADEQUATE', 'POOR', 'UNANALYZABLE')),
  analyzable BOOLEAN DEFAULT true,
  ai_model TEXT DEFAULT 'gemini-2.5-flash',
  ai_version TEXT DEFAULT 'v1.0',
  clinical_knowledge_version TEXT DEFAULT 'v1.0',
  prompt_tokens INT,
  response_tokens INT,
  processing_time_ms INT,
  conducted_by UUID NOT NULL REFERENCES auth.users(id),
  conducted_by_role screening_level NOT NULL DEFAULT 'aww_basic',
  consent_obtained consent_method,
  consent_recorded_at TIMESTAMPTZ,
  consent_recorded_by UUID REFERENCES auth.users(id),
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE observations ADD CONSTRAINT fk_obs_photo FOREIGN KEY (photo_analysis_id) REFERENCES photo_analyses(id);
ALTER TABLE flags ADD CONSTRAINT fk_flag_photo FOREIGN KEY (photo_analysis_id) REFERENCES photo_analyses(id);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 11: AUTISM SCREENING
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE autism_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  tool_used TEXT NOT NULL CHECK (tool_used IN ('M-CHAT-R', 'M-CHAT-RF', 'ISAA', 'INCLEN_ASD', 'custom')),
  age_months_at_screening INT NOT NULL,
  responses JSONB NOT NULL,
  total_score INT,
  domain_scores JSONB,
  risk_category TEXT CHECK (risk_category IN ('low_risk', 'medium_risk', 'high_risk')),
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_items JSONB,
  clinical_impression TEXT,
  behavioral_observations TEXT,
  referral_generated BOOLEAN DEFAULT false,
  consent_obtained consent_method,
  consent_type TEXT,
  consent_recorded_at TIMESTAMPTZ,
  consent_recorded_by UUID REFERENCES auth.users(id),
  conducted_by UUID NOT NULL REFERENCES auth.users(id),
  conducted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE flags ADD CONSTRAINT fk_flag_autism FOREIGN KEY (autism_screening_id) REFERENCES autism_screenings(id);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 12: CONVERSATION ASSESSMENTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE conversation_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  age_months_at_assessment INT NOT NULL,
  setting TEXT CHECK (setting IN ('awc', 'home', 'outdoor', 'other')) DEFAULT 'awc',
  duration_minutes INT,
  caregiver_present BOOLEAN DEFAULT true,
  audio_recording_url TEXT,
  video_recording_url TEXT,
  transcript TEXT,
  observations JSONB NOT NULL,
  tasks_administered JSONB,
  social_cue_score DECIMAL(5,2),
  language_interaction_score DECIMAL(5,2),
  cognitive_response_score DECIMAL(5,2),
  overall_impression TEXT CHECK (overall_impression IN (
    'age_appropriate', 'mild_concern', 'moderate_concern', 'significant_concern'
  )),
  clinical_notes TEXT,
  psycho_evaluation_indicated BOOLEAN DEFAULT false,
  referral_generated BOOLEAN DEFAULT false,
  screening_level screening_level DEFAULT 'supervisor_detailed',
  audio_recordings JSONB DEFAULT '[]',
  bhashini_transcripts JSONB DEFAULT '{}',
  rule_based_scores JSONB,
  ai_analysis JSONB,
  preferred_language TEXT DEFAULT 'te',
  questions_administered JSONB DEFAULT '[]',
  consent_obtained consent_method,
  consent_recorded_at TIMESTAMPTZ,
  consent_recorded_by UUID REFERENCES auth.users(id),
  conducted_by UUID NOT NULL REFERENCES auth.users(id),
  conducted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE flags ADD CONSTRAINT fk_flag_convo FOREIGN KEY (conversation_assessment_id) REFERENCES conversation_assessments(id);

-- SECTION 13: REFERRALS

CREATE TABLE referral_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'DEIC', 'district_hospital', 'PHC', 'CHC', 'private_hospital',
    'therapy_center', 'special_school', 'NGO', 'government_scheme',
    'individual_specialist', 'other'
  )),
  specialties TEXT[],
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  district_id UUID REFERENCES districts(id),
  mandal_id UUID REFERENCES mandals(id),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  operating_hours TEXT,
  accepts_referrals BOOLEAN DEFAULT true,
  government_facility BOOLEAN DEFAULT true,
  free_service BOOLEAN DEFAULT true,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  referred_by UUID NOT NULL REFERENCES auth.users(id),
  referral_type TEXT CHECK (referral_type IN (
    'DEIC', 'specialist', 'hospital', 'therapy', 'nutrition_program', 'other'
  )),
  urgency TEXT CHECK (urgency IN ('routine', 'urgent', 'emergency')) DEFAULT 'routine',
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN (
    'created', 'informed', 'scheduled', 'visited',
    'results_received', 'completed', 'cancelled'
  )) DEFAULT 'created',
  outcome_notes TEXT,
  completed_at TIMESTAMPTZ,
  -- v3.0 additions
  source referral_source DEFAULT 'manual',
  referral_directory_id UUID REFERENCES referral_directory(id),
  referred_to_name TEXT,
  referred_to_phone TEXT,
  referred_to_designation TEXT,
  referral_letter_url TEXT,
  ai_reasoning TEXT,
  photo_analysis_id UUID REFERENCES photo_analyses(id),
  autism_screening_id UUID REFERENCES autism_screenings(id),
  conversation_assessment_id UUID REFERENCES conversation_assessments(id),
  follow_up_date DATE,
  follow_up_status TEXT CHECK (follow_up_status IN (
    'pending', 'scheduled', 'visited', 'completed', 'lost_to_followup'
  )),
  parent_informed BOOLEAN DEFAULT false,
  parent_consent_for_referral BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE flags ADD CONSTRAINT fk_flag_referral FOREIGN KEY (referral_id) REFERENCES referrals(id);

-- Supervisor-assigned single interventions (v2.0 mobile app)
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  intervention_type TEXT,
  description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  activities JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'assigned',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  follow_up_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SECTION 14: INTERVENTION PLANS (AI multi-week programmes)

CREATE TABLE intervention_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  photo_analysis_id UUID REFERENCES photo_analyses(id),
  source_intervention_id UUID REFERENCES interventions(id),
  title TEXT NOT NULL,
  description TEXT,
  target_domains TEXT[],
  goals JSONB,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  start_date DATE NOT NULL,
  end_date DATE,
  duration_weeks INT,
  review_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_by_role screening_level,
  assigned_aww UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN (
    'draft', 'active', 'paused', 'completed', 'cancelled'
  )) DEFAULT 'draft',
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  visible_to_roles user_role[] DEFAULT '{aww, supervisor, cdpo}',
  ai_generated BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE flags ADD CONSTRAINT fk_flag_plan FOREIGN KEY (plan_id) REFERENCES intervention_plans(id);

-- Parent cards must be created BEFORE intervention_tasks references them
-- SECTION 15: PARENT CARDS

CREATE TABLE parent_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_te TEXT,
  content_en TEXT NOT NULL,
  content_te TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'activity_guide', 'nutrition_advice', 'health_tip', 'safety',
    'milestone_info', 'stimulation_technique', 'referral_info',
    'condition_awareness', 'home_exercise', 'feeding_guide'
  )),
  target_domains TEXT[],
  age_min_months INT,
  age_max_months INT,
  illustration_url TEXT,
  icon_name TEXT,
  color_code TEXT,
  audio_url_te TEXT,
  video_url TEXT,
  difficulty TEXT CHECK (difficulty IN ('simple', 'moderate', 'detailed')) DEFAULT 'simple',
  reading_time_minutes INT DEFAULT 2,
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  is_system_card BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE intervention_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES intervention_plans(id) ON DELETE CASCADE,
  activity_id TEXT,
  parent_card_id UUID REFERENCES parent_cards(id),
  title TEXT NOT NULL,
  description TEXT,
  instructions_for_aww TEXT,
  instructions_for_parent TEXT,
  domain TEXT CHECK (domain IN ('GM', 'FM', 'LC', 'COG', 'SE', 'HEALTH', 'NUTRITION')),
  scheduled_week INT,
  scheduled_date DATE,
  frequency TEXT CHECK (frequency IN (
    'once', 'daily', 'alternate_days', 'twice_weekly', 'weekly', 'as_needed'
  )) DEFAULT 'weekly',
  duration_minutes INT DEFAULT 10,
  sequence_order INT DEFAULT 1,
  status intervention_task_status DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  completion_notes TEXT,
  parent_feedback TEXT,
  child_response TEXT CHECK (child_response IN (
    'engaged', 'partially_engaged', 'resistant', 'unable', 'not_observed'
  )),
  materials_needed TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE intervention_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES intervention_plans(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id),
  visit_plan_id UUID REFERENCES visit_plans(id),
  scheduled_date DATE NOT NULL,
  scheduled_week INT,
  followup_number INT DEFAULT 1,
  task_checklist JSONB NOT NULL DEFAULT '[]',
  visit_status TEXT CHECK (visit_status IN (
    'scheduled', 'completed', 'missed', 'rescheduled', 'cancelled'
  )) DEFAULT 'scheduled',
  visited_at TIMESTAMPTZ,
  visited_by UUID REFERENCES auth.users(id),
  tasks_completed INT DEFAULT 0,
  tasks_total INT DEFAULT 0,
  completion_rate DECIMAL(5,2),
  overall_progress TEXT CHECK (overall_progress IN (
    'significant_improvement', 'some_improvement', 'no_change',
    'regression', 'unable_to_assess'
  )),
  aww_notes TEXT,
  supervisor_notes TEXT,
  parent_feedback TEXT,
  continue_plan BOOLEAN DEFAULT true,
  modifications_needed TEXT,
  escalation_needed BOOLEAN DEFAULT false,
  next_followup_date DATE,
  -- v3.1 missed visit tracking
  missed_notification_sent BOOLEAN DEFAULT false,
  missed_notification_sent_at TIMESTAMPTZ,
  consecutive_misses INT DEFAULT 0,
  auto_escalated_to_supervisor BOOLEAN DEFAULT false,
  -- Universal consent
  consent_obtained BOOLEAN DEFAULT false,
  consent_type consent_method,
  consent_recorded_at TIMESTAMPTZ,
  consent_recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK from observations to intervention_followups
ALTER TABLE observations ADD CONSTRAINT fk_obs_followup FOREIGN KEY (followup_id) REFERENCES intervention_followups(id);

CREATE TABLE parent_card_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES parent_cards(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES intervention_plans(id),
  task_id UUID REFERENCES intervention_tasks(id),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  shared_with_parent BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  shared_method TEXT CHECK (shared_method IN ('in_person', 'whatsapp', 'sms', 'printed')),
  parent_understood BOOLEAN,
  parent_feedback TEXT,
  aww_notes TEXT,
  UNIQUE(card_id, child_id, plan_id)
);

-- SECTION 16: DOMAIN TABLES (Growth, Immunization, Nutrition, Behavioral, Environment)

CREATE TABLE growth_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  age_months_at_measurement INT NOT NULL,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  head_circumference_cm DECIMAL(5,2),
  muac_cm DECIMAL(4,2),
  waz DECIMAL(5,2),
  haz DECIMAL(5,2),
  whz DECIMAL(5,2),
  hcz DECIMAL(5,2),
  muac_class TEXT CHECK (muac_class IN ('SAM', 'MAM', 'NORMAL')),
  edema BOOLEAN DEFAULT false,
  edema_severity TEXT CHECK (edema_severity IN ('none', 'mild', 'moderate', 'severe')),
  growth_risk_score DECIMAL(5,2) DEFAULT 0,
  growth_chart_url TEXT,
  vision_concern BOOLEAN DEFAULT false,
  hearing_concern BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE immunization_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  vaccines_given JSONB DEFAULT '[]',
  compliance_score DECIMAL(5,2) DEFAULT 0,
  hemoglobin DECIMAL(4,2),
  vitamin_d_status TEXT CHECK (vitamin_d_status IN ('sufficient', 'insufficient', 'deficient', 'not_tested')),
  health_events JSONB DEFAULT '[]',
  health_risk_score DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  recorded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nutrition_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  bf_status TEXT CHECK (bf_status IN (
    'exclusively_breastfed', 'predominantly_breastfed',
    'partially_breastfed', 'not_breastfed'
  )),
  bf_difficulties TEXT[],
  age_bf_stopped_months INT,
  cf_started_months INT,
  food_groups TEXT[],
  dietary_diversity_score INT CHECK (dietary_diversity_score BETWEEN 0 AND 9),
  meal_frequency INT,
  food_consistency TEXT,
  responsive_feeding TEXT CHECK (responsive_feeding IN (
    'active', 'somewhat_responsive', 'force_feeding', 'neglectful'
  )),
  junk_food_frequency TEXT CHECK (junk_food_frequency IN (
    'never', 'occasionally', 'frequently', 'daily'
  )),
  awc_meal_attendance TEXT CHECK (awc_meal_attendance IN (
    'regular', 'irregular', 'rarely', 'not_enrolled'
  )),
  nutrition_risk_score DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  assessed_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE behavioral_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  observations JSONB NOT NULL DEFAULT '{}',
  concern_count INT DEFAULT 0,
  autism_flag_count INT DEFAULT 0,
  se_concern_count INT DEFAULT 0,
  regression_detected BOOLEAN DEFAULT false,
  abuse_neglect_suspected BOOLEAN DEFAULT false,
  behavioral_risk_score DECIMAL(5,2) DEFAULT 0,
  aww_observations TEXT,
  assessed_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE environment_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  stimulation_level TEXT CHECK (stimulation_level IN ('high', 'medium', 'low')),
  toys_available BOOLEAN DEFAULT false,
  books_available BOOLEAN DEFAULT false,
  play_space BOOLEAN DEFAULT false,
  screen_time_hours_daily DECIMAL(3,1),
  primary_caregiver TEXT,
  caregiver_engagement TEXT CHECK (caregiver_engagement IN ('high', 'medium', 'low', 'refused')),
  multiple_caregivers BOOLEAN DEFAULT false,
  sanitation TEXT CHECK (sanitation IN (
    'flush_toilet', 'pit_toilet', 'shared_toilet', 'open_defecation', 'other'
  )),
  safe_water BOOLEAN DEFAULT true,
  overcrowding BOOLEAN DEFAULT false,
  food_security TEXT CHECK (food_security IN (
    'food_secure', 'mildly_insecure', 'moderately_insecure', 'severely_insecure'
  )),
  income_bracket TEXT CHECK (income_bracket IN ('AAY', 'BPL', 'APL')),
  domestic_violence TEXT CHECK (domestic_violence IN ('no', 'yes', 'prefer_not_to_say')),
  maternal_depression TEXT CHECK (maternal_depression IN ('none', 'mild', 'moderate', 'severe')),
  awc_attendance TEXT CHECK (awc_attendance IN ('regular', 'irregular', 'poor', 'not_enrolled')),
  environmental_risk_score DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  assessed_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- SECTION 17: SYNC & MOBILE

CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  payload JSONB NOT NULL,
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- SECTION 18: MONITORING & ADMIN

CREATE TABLE activity_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES questionnaire_sessions(id),
  domain TEXT CHECK (domain IN ('GM', 'FM', 'LC', 'COG', 'SE', 'health', 'nutrition')),
  activity_title TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  instructions_for_aww TEXT,
  instructions_for_parent TEXT,
  age_appropriate BOOLEAN DEFAULT true,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  materials_needed TEXT,
  source TEXT DEFAULT 'ai_generated',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE kpi_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('awc', 'mandal', 'district', 'state')),
  entity_id UUID NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(level, entity_id, period, period_start)
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  role user_role,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'flag_escalation', 'missed_visit', 'high_risk_screening',
    'referral_overdue', 'system', 'intervention_review',
    'aww_compliance', 'sync_issue', 'super_admin_broadcast'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
  related_child_id UUID REFERENCES children(id),
  related_entity_id UUID,
  related_entity_type TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- SECTION 19: SUPER ADMIN TABLES

-- System configuration (key-value store for platform settings)
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'general', 'screening', 'escalation', 'notifications',
    'ai_config', 'sync', 'security', 'feature_flags', 'reporting'
  )),
  is_sensitive BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Platform-wide announcements and maintenance notices
CREATE TABLE platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  announcement_type TEXT CHECK (announcement_type IN (
    'info', 'warning', 'maintenance', 'update', 'emergency'
  )) DEFAULT 'info',
  target_roles user_role[] DEFAULT '{aww, supervisor, cdpo, district_officer, commissioner}',
  target_districts UUID[],
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Role permission templates (what each role can do)
CREATE TABLE role_permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_key TEXT NOT NULL,
  permission_value JSONB NOT NULL DEFAULT 'true',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission_key)
);

-- Data export requests (GDPR/DPDP compliance)
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  export_type TEXT CHECK (export_type IN (
    'child_data', 'screening_data', 'analytics_report',
    'compliance_report', 'full_backup', 'anonymized_research',
    'dpdp_data_subject_request', 'audit_report'
  )),
  scope JSONB NOT NULL DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  format TEXT CHECK (format IN ('csv', 'json', 'xlsx', 'pdf')) DEFAULT 'csv',
  status TEXT CHECK (status IN (
    'requested', 'approved', 'processing', 'completed', 'failed', 'rejected'
  )) DEFAULT 'requested',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  file_url TEXT,
  file_size_bytes BIGINT,
  row_count INT,
  error_message TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- System health monitoring
CREATE TABLE system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL CHECK (check_type IN (
    'database', 'api', 'sync', 'cron', 'storage',
    'ai_service', 'notification', 'overall'
  )),
  status TEXT CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')) DEFAULT 'unknown',
  response_time_ms INT,
  details JSONB DEFAULT '{}',
  error_message TEXT,
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- User session tracking for Super Admin
CREATE TABLE user_sessions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_start TIMESTAMPTZ DEFAULT now(),
  session_end TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown')),
  app_version TEXT,
  platform TEXT CHECK (platform IN ('react_native', 'nextjs', 'streamlit', 'api')),
  actions_count INT DEFAULT 0,
  last_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feature flags for A/B testing and gradual rollouts
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INT DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_roles user_role[],
  target_districts UUID[],
  config JSONB DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 20: AUTH HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_awc_id()
RETURNS UUID AS $$
  SELECT awc_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_mandal_id()
RETURNS UUID AS $$
  SELECT mandal_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_district_id()
RETURNS UUID AS $$
  SELECT district_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_state_id()
RETURNS UUID AS $$
  SELECT state_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION awc_ids_in_mandal(p_mandal_id UUID)
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(id) FROM awcs WHERE mandal_id = p_mandal_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION awc_ids_in_district(p_district_id UUID)
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(a.id) FROM awcs a
  JOIN mandals m ON a.mandal_id = m.id
  WHERE m.district_id = p_district_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 21: MONITORING FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Risk distribution by geographic level
CREATE OR REPLACE FUNCTION get_risk_distribution(p_level TEXT, p_entity_id UUID)
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  IF p_level = 'awc' THEN
    SELECT jsonb_build_object(
      'low', COUNT(*) FILTER (WHERE current_risk_level = 'low'),
      'medium', COUNT(*) FILTER (WHERE current_risk_level = 'medium'),
      'high', COUNT(*) FILTER (WHERE current_risk_level = 'high'),
      'critical', COUNT(*) FILTER (WHERE current_risk_level = 'critical'),
      'unscreened', COUNT(*) FILTER (WHERE current_risk_level IS NULL)
    ) INTO v_result FROM children WHERE awc_id = p_entity_id AND is_active = true;
  ELSIF p_level = 'mandal' THEN
    SELECT jsonb_build_object(
      'low', COUNT(*) FILTER (WHERE current_risk_level = 'low'),
      'medium', COUNT(*) FILTER (WHERE current_risk_level = 'medium'),
      'high', COUNT(*) FILTER (WHERE current_risk_level = 'high'),
      'critical', COUNT(*) FILTER (WHERE current_risk_level = 'critical'),
      'unscreened', COUNT(*) FILTER (WHERE current_risk_level IS NULL)
    ) INTO v_result FROM children WHERE awc_id = ANY(awc_ids_in_mandal(p_entity_id)) AND is_active = true;
  ELSIF p_level = 'district' THEN
    SELECT jsonb_build_object(
      'low', COUNT(*) FILTER (WHERE current_risk_level = 'low'),
      'medium', COUNT(*) FILTER (WHERE current_risk_level = 'medium'),
      'high', COUNT(*) FILTER (WHERE current_risk_level = 'high'),
      'critical', COUNT(*) FILTER (WHERE current_risk_level = 'critical'),
      'unscreened', COUNT(*) FILTER (WHERE current_risk_level IS NULL)
    ) INTO v_result FROM children WHERE awc_id = ANY(awc_ids_in_district(p_entity_id)) AND is_active = true;
  ELSE
    SELECT jsonb_build_object(
      'low', COUNT(*) FILTER (WHERE current_risk_level = 'low'),
      'medium', COUNT(*) FILTER (WHERE current_risk_level = 'medium'),
      'high', COUNT(*) FILTER (WHERE current_risk_level = 'high'),
      'critical', COUNT(*) FILTER (WHERE current_risk_level = 'critical'),
      'unscreened', COUNT(*) FILTER (WHERE current_risk_level IS NULL)
    ) INTO v_result FROM children WHERE is_active = true;
  END IF;
  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Flag escalation: 7/14/21-day tiered model
CREATE OR REPLACE FUNCTION auto_escalate_flags()
RETURNS INT AS $$
DECLARE v_count INT := 0; v_sub INT;
BEGIN
  -- 7-day: escalate to CDPO
  UPDATE flags SET status = 'escalated', escalated_to = 'cdpo', escalated_at = now(), auto_escalated = true, updated_at = now()
  WHERE status IN ('raised', 'pending_review', 'acknowledged')
    AND created_at < now() - INTERVAL '7 days'
    AND (escalated_to IS NULL OR escalated_to = '');
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  -- 14-day: escalate to District
  UPDATE flags SET escalated_to = 'district', escalated_at = now(), updated_at = now()
  WHERE status = 'escalated' AND escalated_to = 'cdpo'
    AND created_at < now() - INTERVAL '14 days';
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  -- 21-day: escalate to State
  UPDATE flags SET escalated_to = 'state', escalated_at = now(), updated_at = now()
  WHERE status = 'escalated' AND escalated_to = 'district'
    AND created_at < now() - INTERVAL '21 days';
  GET DIAGNOSTICS v_sub = ROW_COUNT; v_count := v_count + v_sub;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 48-hour fast-track escalation (v3.1)
CREATE OR REPLACE FUNCTION escalate_overdue_flags()
RETURNS INT AS $$
DECLARE v_count INT;
BEGIN
  UPDATE flags SET
    status = 'escalated', auto_escalated = true, escalated_at = now(),
    escalated_to = 'cdpo', updated_at = now()
  WHERE status IN ('raised', 'pending_review')
    AND escalation_deadline < now()
    AND auto_escalated = false;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process overdue follow-ups (cron daily 6 AM IST)
CREATE OR REPLACE FUNCTION process_overdue_followups()
RETURNS TABLE(followup_id UUID, child_id UUID, plan_id UUID, consecutive INT) AS $$
BEGIN
  RETURN QUERY
  WITH overdue AS (
    UPDATE intervention_followups SET visit_status = 'missed', updated_at = now()
    WHERE visit_status = 'scheduled' AND scheduled_date < CURRENT_DATE
    RETURNING id, intervention_followups.child_id, intervention_followups.plan_id
  ),
  miss_counts AS (
    SELECT o.id AS fid, o.child_id AS cid, o.plan_id AS pid,
      (SELECT COUNT(*)::INT FROM intervention_followups ifu
       WHERE ifu.plan_id = o.plan_id AND ifu.visit_status = 'missed'
         AND ifu.scheduled_date >= CURRENT_DATE - INTERVAL '60 days') AS consec
    FROM overdue o
  )
  UPDATE intervention_followups ifu SET
    consecutive_misses = mc.consec,
    auto_escalated_to_supervisor = (mc.consec >= 2)
  FROM miss_counts mc WHERE ifu.id = mc.fid
  RETURNING ifu.id, mc.cid, mc.pid, mc.consec;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process overdue visit plans
CREATE OR REPLACE FUNCTION process_overdue_visit_plans()
RETURNS INT AS $$
DECLARE v_count INT;
BEGIN
  UPDATE visit_plans SET status = 'missed', updated_at = now()
  WHERE status = 'planned' AND visit_date < CURRENT_DATE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Flag summary for mandal
CREATE OR REPLACE FUNCTION get_flag_summary_for_mandal(p_mandal_id UUID)
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_pending', COUNT(*) FILTER (WHERE f.status IN ('raised', 'pending_review')),
    'total_escalated', COUNT(*) FILTER (WHERE f.status = 'escalated'),
    'total_confirmed', COUNT(*) FILTER (WHERE f.status IN ('acknowledged', 'confirmed', 'in_progress')),
    'critical_pending', COUNT(*) FILTER (WHERE f.status IN ('raised', 'pending_review') AND f.priority = 'urgent'),
    'overdue_count', COUNT(*) FILTER (WHERE f.status IN ('raised', 'pending_review') AND f.escalation_deadline < now()),
    'children_flagged', COUNT(DISTINCT f.child_id))
  INTO v_result FROM flags f JOIN children c ON c.id = f.child_id
  WHERE c.awc_id = ANY(awc_ids_in_mandal(p_mandal_id))
    AND f.status NOT IN ('resolved', 'dismissed');
  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Follow-up compliance
CREATE OR REPLACE FUNCTION get_followup_compliance(p_aww_id UUID, p_days_back INT DEFAULT 30)
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_scheduled', COUNT(*),
    'completed', COUNT(*) FILTER (WHERE ifu.visit_status = 'completed'),
    'missed', COUNT(*) FILTER (WHERE ifu.visit_status = 'missed'),
    'pending', COUNT(*) FILTER (WHERE ifu.visit_status = 'scheduled'),
    'compliance_rate', CASE
      WHEN COUNT(*) FILTER (WHERE ifu.visit_status IN ('completed', 'missed')) = 0 THEN 100.0
      ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE ifu.visit_status = 'completed')
        / COUNT(*) FILTER (WHERE ifu.visit_status IN ('completed', 'missed')), 1)
    END)
  INTO v_result FROM intervention_followups ifu JOIN intervention_plans ip ON ip.id = ifu.plan_id
  WHERE ip.assigned_aww = p_aww_id
    AND ifu.scheduled_date >= CURRENT_DATE - (p_days_back || ' days')::INTERVAL
    AND ifu.scheduled_date <= CURRENT_DATE;
  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Child intervention plans
CREATE OR REPLACE FUNCTION get_child_intervention_plans(p_child_id UUID)
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_agg(plan_data) INTO v_result FROM (
    SELECT jsonb_build_object(
      'plan_id', ip.id, 'title', ip.title, 'status', ip.status,
      'start_date', ip.start_date, 'end_date', ip.end_date,
      'completion_percentage', ip.completion_percentage, 'target_domains', ip.target_domains,
      'tasks', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'task_id', it.id, 'title', it.title, 'status', it.status,
        'scheduled_week', it.scheduled_week, 'frequency', it.frequency,
        'completed_at', it.completed_at, 'child_response', it.child_response
      ) ORDER BY it.scheduled_week, it.sequence_order), '[]'::JSONB)
      FROM intervention_tasks it WHERE it.plan_id = ip.id),
      'next_followup', (SELECT jsonb_build_object(
        'date', ifu.scheduled_date, 'followup_number', ifu.followup_number, 'status', ifu.visit_status)
       FROM intervention_followups ifu WHERE ifu.plan_id = ip.id AND ifu.visit_status = 'scheduled'
       ORDER BY ifu.scheduled_date LIMIT 1)
    ) AS plan_data FROM intervention_plans ip
    WHERE ip.child_id = p_child_id AND ip.status IN ('active', 'draft')
    ORDER BY ip.start_date DESC
  ) sub;
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Child observations (90-day window)
CREATE OR REPLACE FUNCTION get_child_observations(p_child_id UUID, p_days_back INT DEFAULT 90)
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_agg(obs ORDER BY observation_date DESC) INTO v_result FROM (
    SELECT jsonb_build_object('id', o.id, 'type', o.type, 'domain', o.domain,
      'concern_level', o.concern_level, 'notes', o.observation_text, 'status', o.status,
      'visit_type', o.visit_type_v31, 'ai_confidence', o.ai_confidence,
      'created_by_role', o.created_by_role, 'observation_date', o.observation_date,
      'severity_weight', o.severity_weight) AS obs, o.observation_date
    FROM observations o WHERE o.child_id = p_child_id AND o.status = 'approved'
      AND o.observation_date >= CURRENT_DATE - (p_days_back || ' days')::INTERVAL) sub;
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete child risk profile
CREATE OR REPLACE FUNCTION get_child_risk_profile(p_child_id UUID)
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'child_id', c.id, 'name', c.name, 'age_months', child_age_months(c.dob),
    'current_risk_level', c.current_risk_level, 'last_screening_date', c.last_screening_date,
    'screening', (SELECT jsonb_build_object('risk_level', qs.risk_level,
      'composite_score', qs.composite_score, 'domain_scores', qs.domain_scores,
      'supervisor_override', qs.supervisor_override_risk, 'date', qs.completed_at)
     FROM questionnaire_sessions qs WHERE qs.child_id = c.id AND qs.status = 'complete'
     ORDER BY qs.completed_at DESC LIMIT 1),
    'photo', (SELECT jsonb_build_object('risk_level', pa.risk_level,
      'score', pa.photo_risk_score, 'priority_flags', pa.priority_flags, 'date', pa.analyzed_at)
     FROM photo_analyses pa WHERE pa.child_id = c.id AND pa.analyzable = true
     ORDER BY pa.analyzed_at DESC LIMIT 1),
    'observations', (SELECT jsonb_build_object('significant_count', cor.significant_count,
      'moderate_count', cor.moderate_count, 'total', cor.total_observations,
      'risk_bump', cor.observation_risk_bump, 'latest_date', cor.latest_observation)
     FROM child_observation_risk cor WHERE cor.child_id = c.id),
    'flags', (SELECT jsonb_build_object(
      'pending', COUNT(*) FILTER (WHERE f.status IN ('raised', 'pending_review')),
      'escalated', COUNT(*) FILTER (WHERE f.status = 'escalated'),
      'total_active', COUNT(*) FILTER (WHERE f.status NOT IN ('resolved', 'dismissed')))
     FROM flags f WHERE f.child_id = c.id),
    'autism', (SELECT jsonb_build_object('risk_category', aus.risk_category,
      'tool', aus.tool_used, 'score', aus.total_score, 'date', aus.conducted_at)
     FROM autism_screenings aus WHERE aus.child_id = c.id
     ORDER BY aus.conducted_at DESC LIMIT 1)
  ) INTO v_result FROM children c WHERE c.id = p_child_id;
  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Super Admin: Platform stats overview
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_children', (SELECT COUNT(*) FROM children WHERE is_active = true),
    'total_awws', (SELECT COUNT(*) FROM profiles WHERE role = 'aww' AND is_active = true),
    'total_supervisors', (SELECT COUNT(*) FROM profiles WHERE role = 'supervisor' AND is_active = true),
    'total_awcs', (SELECT COUNT(*) FROM awcs WHERE is_active = true),
    'total_districts', (SELECT COUNT(*) FROM districts),
    'total_mandals', (SELECT COUNT(*) FROM mandals),
    'total_screenings', (SELECT COUNT(*) FROM questionnaire_sessions WHERE status = 'complete'),
    'total_flags_active', (SELECT COUNT(*) FROM flags WHERE status NOT IN ('resolved', 'dismissed')),
    'total_referrals_pending', (SELECT COUNT(*) FROM referrals WHERE status NOT IN ('completed', 'cancelled')),
    'total_intervention_plans_active', (SELECT COUNT(*) FROM intervention_plans WHERE status = 'active'),
    'risk_distribution', (SELECT jsonb_build_object(
      'low', COUNT(*) FILTER (WHERE current_risk_level = 'low'),
      'medium', COUNT(*) FILTER (WHERE current_risk_level = 'medium'),
      'high', COUNT(*) FILTER (WHERE current_risk_level = 'high'),
      'critical', COUNT(*) FILTER (WHERE current_risk_level = 'critical'))
     FROM children WHERE is_active = true),
    'active_users_24h', (SELECT COUNT(DISTINCT user_id) FROM user_sessions_log
      WHERE last_action_at >= now() - INTERVAL '24 hours'),
    'sync_queue_pending', (SELECT COUNT(*) FROM sync_queue WHERE synced = false),
    'system_health', (SELECT jsonb_object_agg(check_type, status)
      FROM (SELECT DISTINCT ON (check_type) check_type, status
            FROM system_health_checks ORDER BY check_type, checked_at DESC) latest)
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Super Admin: User management helper
CREATE OR REPLACE FUNCTION admin_get_users(
  p_role user_role DEFAULT NULL,
  p_district_id UUID DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_agg(u) INTO v_result FROM (
    SELECT jsonb_build_object(
      'id', p.id, 'name', p.name, 'email', p.email, 'phone', p.phone,
      'role', p.role, 'is_active', p.is_active,
      'awc_name', a.name, 'mandal_name', m.name, 'district_name', d.name,
      'last_login', p.last_login_at, 'login_count', p.login_count,
      'created_at', p.created_at
    ) AS u
    FROM profiles p
    LEFT JOIN awcs a ON p.awc_id = a.id
    LEFT JOIN mandals m ON p.mandal_id = m.id
    LEFT JOIN districts d ON p.district_id = d.id
    WHERE (p_role IS NULL OR p.role = p_role)
      AND (p_district_id IS NULL OR p.district_id = p_district_id)
      AND (p_is_active IS NULL OR p.is_active = p_is_active)
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) sub;
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 22: VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- Observation risk (90-day rolling window)
CREATE OR REPLACE VIEW child_observation_risk AS
SELECT
  o.child_id,
  COUNT(*) FILTER (WHERE o.concern_level = 'significant') AS significant_count,
  COUNT(*) FILTER (WHERE o.concern_level = 'moderate') AS moderate_count,
  COUNT(*) FILTER (WHERE o.concern_level = 'mild') AS mild_count,
  COUNT(*) AS total_observations,
  SUM(o.severity_weight) AS total_severity_weight,
  CASE
    WHEN COUNT(*) FILTER (WHERE o.concern_level = 'significant') >= 1 THEN 'critical'
    WHEN COUNT(*) FILTER (WHERE o.concern_level = 'moderate') >= 3 THEN 'high'
    WHEN COUNT(*) FILTER (WHERE o.concern_level = 'moderate') >= 1 THEN 'medium'
    WHEN COUNT(*) FILTER (WHERE o.concern_level = 'mild') >= 3 THEN 'medium'
    ELSE NULL
  END AS observation_risk_bump,
  MAX(o.observation_date) AS latest_observation
FROM observations o
WHERE o.status = 'approved' AND o.observation_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY o.child_id;

-- Child screening summary (comprehensive)
CREATE OR REPLACE VIEW child_screening_summary AS
SELECT
  c.id AS child_id, c.name, c.dob, c.gender, c.current_risk_level,
  c.last_screening_date, c.awc_id, child_age_months(c.dob) AS age_months,
  (SELECT jsonb_build_object('session_id', qs.id, 'date', qs.completed_at,
    'risk_level', qs.risk_level, 'composite_score', qs.composite_score,
    'screening_level', qs.screening_level, 'supervisor_override', qs.supervisor_override_risk,
    'has_ai_narrative', (qs.ai_narrative IS NOT NULL))
   FROM questionnaire_sessions qs WHERE qs.child_id = c.id AND qs.status = 'complete'
   ORDER BY qs.completed_at DESC LIMIT 1) AS latest_screening,
  (SELECT jsonb_build_object('id', pa.id, 'date', pa.analyzed_at,
    'risk_level', pa.risk_level, 'photo_risk_score', pa.photo_risk_score,
    'priority_flags', pa.priority_flags)
   FROM photo_analyses pa WHERE pa.child_id = c.id AND pa.analyzable = true
   ORDER BY pa.analyzed_at DESC LIMIT 1) AS latest_photo_analysis,
  (SELECT jsonb_build_object('id', ca.id, 'date', ca.conducted_at,
    'screening_level', ca.screening_level, 'overall_impression', ca.overall_impression,
    'social_score', ca.social_cue_score, 'language_score', ca.language_interaction_score,
    'cognitive_score', ca.cognitive_response_score)
   FROM conversation_assessments ca WHERE ca.child_id = c.id
   ORDER BY ca.conducted_at DESC LIMIT 1) AS latest_conversation,
  (SELECT jsonb_build_object('id', aus.id, 'date', aus.conducted_at,
    'tool', aus.tool_used, 'risk_category', aus.risk_category)
   FROM autism_screenings aus WHERE aus.child_id = c.id
   ORDER BY aus.conducted_at DESC LIMIT 1) AS latest_autism_screening,
  (SELECT jsonb_build_object('weight_kg', gr.weight_kg, 'height_cm', gr.height_cm,
    'muac_cm', gr.muac_cm, 'muac_class', gr.muac_class, 'waz', gr.waz,
    'haz', gr.haz, 'date', gr.measurement_date)
   FROM growth_records gr WHERE gr.child_id = c.id
   ORDER BY gr.measurement_date DESC LIMIT 1) AS latest_growth,
  (SELECT jsonb_build_object('total', COUNT(*),
    'significant', COUNT(*) FILTER (WHERE o.concern_level = 'significant'),
    'moderate', COUNT(*) FILTER (WHERE o.concern_level = 'moderate'),
    'latest_date', MAX(o.observation_date),
    'risk_bump', (SELECT observation_risk_bump FROM child_observation_risk cor WHERE cor.child_id = c.id))
   FROM observations o WHERE o.child_id = c.id AND o.status = 'approved'
    AND o.observation_date >= CURRENT_DATE - INTERVAL '90 days') AS observation_summary,
  (SELECT jsonb_build_object(
    'pending', COUNT(*) FILTER (WHERE f.status IN ('raised', 'pending_review')),
    'confirmed', COUNT(*) FILTER (WHERE f.status IN ('acknowledged', 'confirmed', 'in_progress')),
    'escalated', COUNT(*) FILTER (WHERE f.status = 'escalated'),
    'oldest_unresolved', MIN(f.created_at) FILTER (WHERE f.status NOT IN ('resolved', 'dismissed')))
   FROM flags f WHERE f.child_id = c.id) AS flag_summary,
  (SELECT COUNT(*) FROM intervention_plans ip WHERE ip.child_id = c.id AND ip.status = 'active') AS active_intervention_plans,
  (SELECT COUNT(*) FROM referrals r WHERE r.child_id = c.id AND r.status NOT IN ('completed', 'cancelled')) AS pending_referrals,
  (SELECT MIN(ifu.scheduled_date) FROM intervention_followups ifu
   JOIN intervention_plans ip ON ip.id = ifu.plan_id
   WHERE ip.child_id = c.id AND ifu.visit_status = 'scheduled'
   AND ifu.scheduled_date >= CURRENT_DATE) AS next_followup_date
FROM children c WHERE c.is_active = true;

-- Intervention plan progress
CREATE OR REPLACE VIEW intervention_plan_progress AS
SELECT
  ip.id AS plan_id, ip.child_id, c.name AS child_name, c.awc_id,
  ip.title AS plan_title, ip.target_domains, ip.status AS plan_status,
  ip.start_date, ip.end_date, ip.assigned_aww, ip.created_by, ip.created_by_role,
  (SELECT COUNT(*) FROM intervention_tasks it WHERE it.plan_id = ip.id) AS total_tasks,
  (SELECT COUNT(*) FROM intervention_tasks it WHERE it.plan_id = ip.id AND it.status = 'completed') AS completed_tasks,
  (SELECT COUNT(*) FROM intervention_tasks it WHERE it.plan_id = ip.id AND it.status = 'not_done') AS not_done_tasks,
  (SELECT COUNT(*) FROM intervention_tasks it WHERE it.plan_id = ip.id AND it.status = 'pending') AS pending_tasks,
  (SELECT COUNT(*) FROM intervention_followups ifu WHERE ifu.plan_id = ip.id) AS total_followups,
  (SELECT COUNT(*) FROM intervention_followups ifu WHERE ifu.plan_id = ip.id AND ifu.visit_status = 'completed') AS completed_followups,
  (SELECT COUNT(*) FROM intervention_followups ifu WHERE ifu.plan_id = ip.id AND ifu.visit_status = 'missed') AS missed_followups,
  (SELECT jsonb_build_object('date', ifu.visited_at, 'progress', ifu.overall_progress,
    'completion_rate', ifu.completion_rate, 'notes', ifu.aww_notes)
   FROM intervention_followups ifu WHERE ifu.plan_id = ip.id AND ifu.visit_status = 'completed'
   ORDER BY ifu.visited_at DESC LIMIT 1) AS latest_followup,
  CASE WHEN (SELECT COUNT(*) FROM intervention_tasks it WHERE it.plan_id = ip.id) = 0 THEN 0
    ELSE ROUND(100.0 * (SELECT COUNT(*) FROM intervention_tasks it WHERE it.plan_id = ip.id AND it.status = 'completed')
      / (SELECT COUNT(*) FROM intervention_tasks it WHERE it.plan_id = ip.id), 1) END AS completion_percentage
FROM intervention_plans ip JOIN children c ON c.id = ip.child_id;

-- Flag dashboard
CREATE OR REPLACE VIEW flag_dashboard AS
SELECT
  f.id AS flag_id, f.child_id, c.name AS child_name, c.awc_id,
  c.current_risk_level, child_age_months(c.dob) AS age_months,
  f.source, f.status, f.priority, f.category, f.title, f.description,
  f.ai_reasoning, f.raised_by, f.raised_by_role, f.created_at,
  f.escalation_deadline, f.auto_escalated, f.escalated_at,
  CASE WHEN f.status IN ('raised', 'pending_review') AND f.escalation_deadline > now()
    THEN f.escalation_deadline - now() ELSE NULL END AS time_until_escalation,
  (f.status IN ('raised', 'pending_review') AND f.escalation_deadline < now()) AS is_overdue,
  f.related_session_id, f.related_observation_id, f.observation_id,
  f.photo_analysis_id, f.conversation_assessment_id, f.autism_screening_id
FROM flags f JOIN children c ON c.id = f.child_id
WHERE f.status NOT IN ('resolved', 'dismissed')
ORDER BY
  CASE f.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
  f.escalation_deadline ASC;

-- AWW Follow-up Calendar
CREATE OR REPLACE VIEW aww_followup_calendar AS
SELECT
  ifu.id AS followup_id, ifu.plan_id, ifu.child_id, c.name AS child_name,
  ip.title AS plan_title, ip.target_domains, ifu.scheduled_date,
  ifu.scheduled_week, ifu.followup_number, ifu.visit_status,
  ifu.consecutive_misses, ifu.auto_escalated_to_supervisor, ip.assigned_aww,
  (ifu.visit_status = 'scheduled' AND ifu.scheduled_date < CURRENT_DATE) AS is_overdue,
  CASE WHEN ifu.visit_status = 'scheduled' AND ifu.scheduled_date < CURRENT_DATE
    THEN CURRENT_DATE - ifu.scheduled_date ELSE 0 END AS days_overdue,
  jsonb_array_length(ifu.task_checklist) AS task_count
FROM intervention_followups ifu
JOIN intervention_plans ip ON ip.id = ifu.plan_id
JOIN children c ON c.id = ifu.child_id
WHERE ip.status = 'active'
ORDER BY
  CASE WHEN ifu.visit_status = 'scheduled' AND ifu.scheduled_date < CURRENT_DATE THEN 0 ELSE 1 END,
  ifu.scheduled_date ASC;

-- AWW Visit Calendar
CREATE OR REPLACE VIEW aww_visit_calendar AS
SELECT
  vp.id AS visit_id, vp.child_id, c.name AS child_name,
  vp.visit_date, vp.visit_time, vp.visit_type, vp.purpose, vp.status, vp.aww_user_id,
  (vp.status = 'planned' AND vp.visit_date < CURRENT_DATE) AS is_overdue,
  CASE WHEN vp.status = 'planned' AND vp.visit_date < CURRENT_DATE
    THEN CURRENT_DATE - vp.visit_date ELSE 0 END AS days_overdue
FROM visit_plans vp LEFT JOIN children c ON c.id = vp.child_id
WHERE vp.status IN ('planned', 'in_progress')
ORDER BY
  CASE WHEN vp.status = 'planned' AND vp.visit_date < CURRENT_DATE THEN 0 ELSE 1 END,
  vp.visit_date ASC;


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 23: TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- updated_at auto-triggers (moddatetime)
CREATE TRIGGER set_updated_at_profiles          BEFORE UPDATE ON profiles            FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_children          BEFORE UPDATE ON children             FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_observations      BEFORE UPDATE ON observations         FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_flags             BEFORE UPDATE ON flags                FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_visit_plans       BEFORE UPDATE ON visit_plans          FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_interventions     BEFORE UPDATE ON interventions        FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_intplan           BEFORE UPDATE ON intervention_plans   FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_inttask           BEFORE UPDATE ON intervention_tasks   FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_intfu             BEFORE UPDATE ON intervention_followups FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_pcard             BEFORE UPDATE ON parent_cards         FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_growth            BEFORE UPDATE ON growth_records       FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_imm               BEFORE UPDATE ON immunization_records FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_nutrition         BEFORE UPDATE ON nutrition_assessments FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_behavioral        BEFORE UPDATE ON behavioral_assessments FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_env               BEFORE UPDATE ON environment_assessments FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_sys_settings      BEFORE UPDATE ON system_settings      FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_announcements     BEFORE UPDATE ON platform_announcements FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_permissions       BEFORE UPDATE ON role_permission_templates FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
CREATE TRIGGER set_updated_at_feature_flags     BEFORE UPDATE ON feature_flags        FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Observation severity auto-set
CREATE OR REPLACE FUNCTION set_observation_severity_weight()
RETURNS TRIGGER AS $$
BEGIN
  NEW.severity_weight := CASE NEW.concern_level
    WHEN 'normal' THEN 0 WHEN 'mild' THEN 1 WHEN 'moderate' THEN 2 WHEN 'significant' THEN 3 ELSE 0 END;
  IF NEW.type = 'ai_generated' AND NEW.status = 'approved' THEN
    NEW.status := 'pending_approval';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_observation_insert BEFORE INSERT ON observations
  FOR EACH ROW EXECUTE FUNCTION set_observation_severity_weight();
CREATE TRIGGER before_observation_update BEFORE UPDATE OF concern_level ON observations
  FOR EACH ROW EXECUTE FUNCTION set_observation_severity_weight();

-- Observation-fed risk recalculation
CREATE OR REPLACE FUNCTION recalculate_child_risk_from_observations()
RETURNS TRIGGER AS $$
DECLARE
  v_bump TEXT; v_current TEXT; v_total INT;
  v_risk_order TEXT[] := ARRAY['low', 'medium', 'high', 'critical'];
BEGIN
  IF NEW.status != 'approved' THEN RETURN NEW; END IF;
  SELECT observation_risk_bump, total_observations INTO v_bump, v_total
  FROM child_observation_risk WHERE child_id = NEW.child_id;
  IF v_bump IS NULL THEN RETURN NEW; END IF;
  SELECT current_risk_level::TEXT INTO v_current FROM children WHERE id = NEW.child_id;
  IF v_current IS NULL OR array_position(v_risk_order, v_bump) > array_position(v_risk_order, v_current) THEN
    UPDATE children SET current_risk_level = v_bump::risk_level, updated_at = now() WHERE id = NEW.child_id;
    IF v_bump IN ('high', 'critical') THEN
      INSERT INTO flags (child_id, observation_id, source, status, priority, category, title,
        description, raised_by, raised_by_role, escalation_deadline)
      VALUES (NEW.child_id, NEW.id, 'ai_auto', 'raised',
        CASE WHEN v_bump = 'critical' THEN 'urgent'::flag_priority ELSE 'high'::flag_priority END,
        'developmental_concern', 'Risk escalated from observations: ' || v_bump,
        'Risk escalated to ' || v_bump || ' based on ' || COALESCE(v_total, 0) || ' observations in last 90 days',
        NEW.aww_user_id, COALESCE(NEW.created_by_role, 'aww_basic'), now() + INTERVAL '48 hours');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_observation_approved_recalc AFTER UPDATE OF status ON observations
  FOR EACH ROW WHEN (NEW.status = 'approved') EXECUTE FUNCTION recalculate_child_risk_from_observations();

-- Auto-flag on HIGH/CRITICAL screening
CREATE OR REPLACE FUNCTION auto_flag_on_high_risk()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'complete' AND NEW.risk_level IN ('high', 'critical')
    AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'complete') THEN
    INSERT INTO flags (child_id, related_session_id, source, status, priority, category, title,
      description, raised_by, raised_by_role, escalation_deadline)
    VALUES (NEW.child_id, NEW.id, 'ai_auto', 'raised',
      CASE WHEN NEW.risk_level = 'critical' THEN 'urgent'::flag_priority ELSE 'high'::flag_priority END,
      'developmental_concern', 'Auto-flagged: ' || NEW.risk_level || ' risk screening',
      'Screening returned ' || NEW.risk_level || ' risk (composite: ' || COALESCE(NEW.composite_score::TEXT, 'N/A') || ')',
      NEW.conducted_by, COALESCE(NEW.screening_level, 'aww_basic'), now() + INTERVAL '48 hours');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_screening_complete_flag AFTER UPDATE OF status ON questionnaire_sessions
  FOR EACH ROW EXECUTE FUNCTION auto_flag_on_high_risk();
CREATE TRIGGER on_screening_insert_flag AFTER INSERT ON questionnaire_sessions
  FOR EACH ROW EXECUTE FUNCTION auto_flag_on_high_risk();

-- Flag review timestamp
CREATE OR REPLACE FUNCTION on_flag_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('confirmed', 'dismissed', 'resolved', 'acknowledged', 'in_progress')
    AND OLD.status IN ('raised', 'pending_review') THEN
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_flag_status_change BEFORE UPDATE OF status ON flags
  FOR EACH ROW EXECUTE FUNCTION on_flag_review();

-- Plan completion auto-update
CREATE OR REPLACE FUNCTION update_plan_completion()
RETURNS TRIGGER AS $$
DECLARE v_total INT; v_completed INT; v_pct DECIMAL;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO v_total, v_completed FROM intervention_tasks WHERE plan_id = NEW.plan_id;
  v_pct := CASE WHEN v_total = 0 THEN 0 ELSE ROUND(100.0 * v_completed / v_total, 1) END;
  UPDATE intervention_plans SET completion_percentage = v_pct,
    status = CASE WHEN v_pct >= 100 THEN 'completed' WHEN v_pct > 0 THEN 'active' ELSE status END,
    updated_at = now() WHERE id = NEW.plan_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_status_change AFTER UPDATE OF status ON intervention_tasks
  FOR EACH ROW EXECUTE FUNCTION update_plan_completion();
CREATE TRIGGER on_task_insert AFTER INSERT ON intervention_tasks
  FOR EACH ROW EXECUTE FUNCTION update_plan_completion();

-- Follow-up stats auto-update
CREATE OR REPLACE FUNCTION update_followup_stats()
RETURNS TRIGGER AS $$
DECLARE v_checklist JSONB; v_total INT; v_completed INT;
BEGIN
  v_checklist := NEW.task_checklist;
  v_total := jsonb_array_length(v_checklist);
  v_completed := (SELECT COUNT(*) FROM jsonb_array_elements(v_checklist) elem WHERE elem->>'status' = 'completed');
  NEW.tasks_total := v_total;
  NEW.tasks_completed := v_completed;
  NEW.completion_rate := CASE WHEN v_total = 0 THEN 0 ELSE ROUND(100.0 * v_completed / v_total, 1) END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_followup_checklist_update BEFORE UPDATE OF task_checklist ON intervention_followups
  FOR EACH ROW EXECUTE FUNCTION update_followup_stats();
CREATE TRIGGER on_followup_insert BEFORE INSERT ON intervention_followups
  FOR EACH ROW EXECUTE FUNCTION update_followup_stats();

-- Super Admin audit logging
CREATE OR REPLACE FUNCTION log_super_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  IF auth_role() IN ('super_admin', 'system_admin') THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data, purpose)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::JSONB WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
      CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::JSONB END,
      'super_admin_action');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_system_settings AFTER INSERT OR UPDATE OR DELETE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION log_super_admin_action();
CREATE TRIGGER audit_role_permissions AFTER INSERT OR UPDATE OR DELETE ON role_permission_templates
  FOR EACH ROW EXECUTE FUNCTION log_super_admin_action();
CREATE TRIGGER audit_feature_flags AFTER INSERT OR UPDATE OR DELETE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION log_super_admin_action();


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 24: ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on ALL tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE prenatal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE autism_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_card_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE immunization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE environment_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- Super Admin tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- ─── SUPER ADMIN: Full access to ALL tables ────────────────────────────
-- Super admin bypasses all RLS restrictions
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'children', 'prenatal_history', 'questions',
    'questionnaire_sessions', 'questionnaire_responses',
    'supervisor_questions', 'supervisor_responses',
    'observations', 'flags', 'visit_plans', 'assessments',
    'photo_analyses', 'autism_screenings', 'conversation_assessments',
    'referral_directory', 'referrals', 'interventions',
    'intervention_plans', 'intervention_tasks', 'intervention_followups',
    'parent_cards', 'parent_card_assignments',
    'growth_records', 'immunization_records', 'nutrition_assessments',
    'behavioral_assessments', 'environment_assessments',
    'sync_queue', 'activity_recommendations', 'kpi_cache',
    'alerts', 'audit_log',
    'system_settings', 'platform_announcements', 'role_permission_templates',
    'data_export_requests', 'system_health_checks', 'user_sessions_log', 'feature_flags'
  ] LOOP
    EXECUTE format('CREATE POLICY "Super admin full access %1$s" ON %1$s FOR ALL USING (auth_role() IN (''super_admin'', ''system_admin''));', t);
  END LOOP;
END $$;

-- ─── PROFILES ────────────────────────────────────────────────────────────
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Upper reads profiles" ON profiles FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));

-- ─── CHILDREN ────────────────────────────────────────────────────────────
CREATE POLICY "AWW manages AWC children" ON children FOR ALL USING (awc_id = auth_awc_id());
CREATE POLICY "Supervisor reads mandal children" ON children FOR SELECT USING (awc_id = ANY(awc_ids_in_mandal(auth_mandal_id())));
CREATE POLICY "CDPO reads district children" ON children FOR SELECT USING (awc_id = ANY(awc_ids_in_district(auth_district_id())));
CREATE POLICY "Upper reads all children" ON children FOR SELECT USING (auth_role() IN ('district_officer', 'commissioner'));

-- ─── QUESTIONNAIRE SYSTEM ────────────────────────────────────────────────
CREATE POLICY "All read questions" ON questions FOR SELECT USING (true);
CREATE POLICY "All read supervisor questions" ON supervisor_questions FOR SELECT USING (true);
CREATE POLICY "Conductor manages sessions" ON questionnaire_sessions FOR ALL USING (conducted_by = auth.uid());
CREATE POLICY "AWW reads AWC sessions" ON questionnaire_sessions FOR SELECT USING (child_id IN (SELECT id FROM children WHERE awc_id = auth_awc_id()));
CREATE POLICY "Upper reads sessions" ON questionnaire_sessions FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));
CREATE POLICY "Conductor manages responses" ON questionnaire_responses FOR ALL USING (session_id IN (SELECT id FROM questionnaire_sessions WHERE conducted_by = auth.uid()));
CREATE POLICY "Upper reads responses" ON questionnaire_responses FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));
CREATE POLICY "Conductor manages sup responses" ON supervisor_responses FOR ALL USING (session_id IN (SELECT id FROM questionnaire_sessions WHERE conducted_by = auth.uid()));
CREATE POLICY "Upper reads sup responses" ON supervisor_responses FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));

-- ─── OBSERVATIONS ────────────────────────────────────────────────────────
CREATE POLICY "AWW manages own observations" ON observations FOR ALL USING (aww_user_id = auth.uid());
CREATE POLICY "AWW reads AWC observations" ON observations FOR SELECT USING (child_id IN (SELECT id FROM children WHERE awc_id = auth_awc_id()));
CREATE POLICY "Supervisor reviews observations" ON observations FOR UPDATE USING (auth_role() IN ('supervisor', 'cdpo'));
CREATE POLICY "Upper reads observations" ON observations FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));

-- ─── FLAGS ────────────────────────────────────────────────────────────────
CREATE POLICY "AWW manages own flags" ON flags FOR ALL USING (raised_by = auth.uid());
CREATE POLICY "AWW reads AWC flags" ON flags FOR SELECT USING (child_id IN (SELECT id FROM children WHERE awc_id = auth_awc_id()));
CREATE POLICY "Supervisor manages mandal flags" ON flags FOR ALL USING (auth_role() = 'supervisor' AND child_id IN (SELECT id FROM children WHERE awc_id = ANY(awc_ids_in_mandal(auth_mandal_id()))));
CREATE POLICY "Upper reads flags" ON flags FOR SELECT USING (auth_role() IN ('cdpo', 'district_officer', 'commissioner'));
CREATE POLICY "Upper manages flags" ON flags FOR UPDATE USING (auth_role() IN ('cdpo', 'district_officer', 'commissioner'));

-- ─── VISIT PLANS ─────────────────────────────────────────────────────────
CREATE POLICY "AWW manages own visits" ON visit_plans FOR ALL USING (aww_user_id = auth.uid());
CREATE POLICY "Upper reads visits" ON visit_plans FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));

-- ─── PHOTO ANALYSES ──────────────────────────────────────────────────────
CREATE POLICY "Conductor manages photos" ON photo_analyses FOR ALL USING (conducted_by = auth.uid());
CREATE POLICY "AWW reads AWC photos" ON photo_analyses FOR SELECT USING (child_id IN (SELECT id FROM children WHERE awc_id = auth_awc_id()));
CREATE POLICY "Upper reads photos" ON photo_analyses FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));

-- ─── AUTISM SCREENINGS ───────────────────────────────────────────────────
CREATE POLICY "Conductor manages autism" ON autism_screenings FOR ALL USING (conducted_by = auth.uid());
CREATE POLICY "AWW reads AWC autism" ON autism_screenings FOR SELECT USING (child_id IN (SELECT id FROM children WHERE awc_id = auth_awc_id()));
CREATE POLICY "Upper reads autism" ON autism_screenings FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));

-- ─── CONVERSATION ASSESSMENTS ────────────────────────────────────────────
CREATE POLICY "Conductor manages convo" ON conversation_assessments FOR ALL USING (conducted_by = auth.uid());
CREATE POLICY "Upper reads convo" ON conversation_assessments FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));

-- ─── REFERRALS ───────────────────────────────────────────────────────────
CREATE POLICY "Referrer manages referrals" ON referrals FOR ALL USING (referred_by = auth.uid());
CREATE POLICY "AWW reads AWC referrals" ON referrals FOR SELECT USING (child_id IN (SELECT id FROM children WHERE awc_id = auth_awc_id()));
CREATE POLICY "Upper reads referrals" ON referrals FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));
CREATE POLICY "All read referral directory" ON referral_directory FOR SELECT USING (true);
CREATE POLICY "Supervisor+ manages directory" ON referral_directory FOR ALL USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer'));

-- ─── INTERVENTIONS & PLANS ───────────────────────────────────────────────
CREATE POLICY "Assigned manages intervention" ON interventions FOR ALL USING (assigned_by = auth.uid());
CREATE POLICY "Upper reads interventions" ON interventions FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));
CREATE POLICY "Creator/AWW manages plan" ON intervention_plans FOR ALL USING (assigned_aww = auth.uid() OR created_by = auth.uid());
CREATE POLICY "AWW reads AWC plans" ON intervention_plans FOR SELECT USING (child_id IN (SELECT id FROM children WHERE awc_id = auth_awc_id()));
CREATE POLICY "Upper reads plans" ON intervention_plans FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));
CREATE POLICY "AWW manages own tasks" ON intervention_tasks FOR ALL USING (plan_id IN (SELECT id FROM intervention_plans WHERE assigned_aww = auth.uid() OR created_by = auth.uid()));
CREATE POLICY "Upper reads tasks" ON intervention_tasks FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));
CREATE POLICY "Visitor manages followup" ON intervention_followups FOR ALL USING (visited_by = auth.uid() OR plan_id IN (SELECT id FROM intervention_plans WHERE assigned_aww = auth.uid() OR created_by = auth.uid()));
CREATE POLICY "Upper reads followups" ON intervention_followups FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));

-- ─── PARENT CARDS ────────────────────────────────────────────────────────
CREATE POLICY "All read cards" ON parent_cards FOR SELECT USING (true);
CREATE POLICY "Supervisor+ manages cards" ON parent_cards FOR ALL USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer') OR created_by = auth.uid());
CREATE POLICY "AWW manages card assign" ON parent_card_assignments FOR ALL USING (assigned_by = auth.uid());
CREATE POLICY "Upper reads card assign" ON parent_card_assignments FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));

-- ─── DOMAIN TABLES (Pattern: AWW records, upper reads) ──────────────────
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['growth_records','immunization_records','nutrition_assessments','behavioral_assessments','environment_assessments'] LOOP
    EXECUTE format('CREATE POLICY "AWW manages %1$s" ON %1$s FOR ALL USING (recorded_by = auth.uid());', t);
    EXECUTE format('CREATE POLICY "AWW reads AWC %1$s" ON %1$s FOR SELECT USING (child_id IN (SELECT id FROM children WHERE awc_id = auth_awc_id()));', t);
    EXECUTE format('CREATE POLICY "Upper reads %1$s" ON %1$s FOR SELECT USING (auth_role() IN (''supervisor'',''cdpo'',''district_officer'',''commissioner''));', t);
  END LOOP;
END $$;

-- ─── ASSESSMENTS ─────────────────────────────────────────────────────────
CREATE POLICY "System writes assessments" ON assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "AWW reads AWC assessments" ON assessments FOR SELECT USING (child_id IN (SELECT id FROM children WHERE awc_id = auth_awc_id()));
CREATE POLICY "Upper reads assessments" ON assessments FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));

-- ─── SYNC QUEUE ──────────────────────────────────────────────────────────
CREATE POLICY "User manages own sync" ON sync_queue FOR ALL USING (user_id = auth.uid());

-- ─── ACTIVITY RECOMMENDATIONS ────────────────────────────────────────────
CREATE POLICY "AWW reads AWC activities" ON activity_recommendations FOR SELECT USING (child_id IN (SELECT id FROM children WHERE awc_id = auth_awc_id()));
CREATE POLICY "Upper reads activities" ON activity_recommendations FOR SELECT USING (auth_role() IN ('supervisor', 'cdpo', 'district_officer', 'commissioner'));
CREATE POLICY "System writes activities" ON activity_recommendations FOR INSERT WITH CHECK (true);

-- ─── KPI CACHE ───────────────────────────────────────────────────────────
CREATE POLICY "System writes kpi" ON kpi_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "System updates kpi" ON kpi_cache FOR UPDATE USING (true);
CREATE POLICY "All read kpi" ON kpi_cache FOR SELECT USING (true);

-- ─── ALERTS ──────────────────────────────────────────────────────────────
CREATE POLICY "User reads own alerts" ON alerts FOR SELECT USING (user_id = auth.uid() OR role = auth_role());
CREATE POLICY "User updates own alerts" ON alerts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System creates alerts" ON alerts FOR INSERT WITH CHECK (true);

-- ─── AUDIT LOG ───────────────────────────────────────────────────────────
CREATE POLICY "Admin reads audit" ON audit_log FOR SELECT USING (auth_role() IN ('system_admin', 'super_admin'));
CREATE POLICY "System writes audit" ON audit_log FOR INSERT WITH CHECK (true);

-- ─── SUPER ADMIN EXCLUSIVE TABLES ────────────────────────────────────────
-- system_settings: super_admin only (already covered by loop above)
-- Additional read policy for settings that aren't sensitive
CREATE POLICY "All read non-sensitive settings" ON system_settings FOR SELECT USING (is_sensitive = false);

-- Announcements: all read active, super_admin manages
CREATE POLICY "All read active announcements" ON platform_announcements FOR SELECT
  USING (is_active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now()));

-- Role permissions: readable by all, managed by super_admin
CREATE POLICY "All read permissions" ON role_permission_templates FOR SELECT USING (true);

-- Data exports: users see own, super_admin sees all
CREATE POLICY "User reads own exports" ON data_export_requests FOR SELECT USING (requested_by = auth.uid());
CREATE POLICY "User creates exports" ON data_export_requests FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- System health: super_admin only (covered by loop)
-- User sessions: super_admin only (covered by loop)
-- Feature flags: readable by all
CREATE POLICY "All read feature flags" ON feature_flags FOR SELECT USING (true);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 25: INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

-- Geography
CREATE INDEX idx_districts_state ON districts(state_id);
CREATE INDEX idx_mandals_district ON mandals(district_id);
CREATE INDEX idx_sectors_mandal ON sectors(mandal_id);
CREATE INDEX idx_panchayats_sector ON panchayats(sector_id);
CREATE INDEX idx_awcs_mandal ON awcs(mandal_id);
CREATE INDEX idx_awcs_sector ON awcs(sector_id);

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_awc ON profiles(awc_id);
CREATE INDEX idx_profiles_mandal ON profiles(mandal_id);
CREATE INDEX idx_profiles_district ON profiles(district_id);
CREATE INDEX idx_profiles_sector ON profiles(sector_id);
CREATE INDEX idx_profiles_panchayat ON profiles(panchayat_id);

-- Children
CREATE INDEX idx_children_awc ON children(awc_id);
CREATE INDEX idx_children_risk ON children(current_risk_level);
CREATE INDEX idx_children_active ON children(is_active) WHERE is_active = true;

-- Questionnaire
CREATE INDEX idx_qs_child ON questionnaire_sessions(child_id);
CREATE INDEX idx_qs_conductor ON questionnaire_sessions(conducted_by);
CREATE INDEX idx_qs_status ON questionnaire_sessions(status);
CREATE INDEX idx_qs_risk ON questionnaire_sessions(risk_level);
CREATE INDEX idx_qr_session ON questionnaire_responses(session_id);

-- Observations
CREATE INDEX idx_obs_child ON observations(child_id);
CREATE INDEX idx_obs_aww ON observations(aww_user_id);
CREATE INDEX idx_obs_type ON observations(type);
CREATE INDEX idx_obs_status ON observations(status);
CREATE INDEX idx_obs_domain ON observations(domain);
CREATE INDEX idx_obs_concern ON observations(concern_level);
CREATE INDEX idx_obs_date ON observations(observation_date);
CREATE INDEX idx_obs_approved ON observations(child_id, observation_date)
WHERE status = 'approved';

-- Flags
CREATE INDEX idx_flags_child ON flags(child_id);
CREATE INDEX idx_flags_status ON flags(status);
CREATE INDEX idx_flags_priority ON flags(priority);
CREATE INDEX idx_flags_raised_by ON flags(raised_by);
CREATE INDEX idx_flags_source ON flags(source);
CREATE INDEX idx_flags_escalation ON flags(escalation_deadline) WHERE status IN ('raised', 'pending_review');
CREATE INDEX idx_flags_auto_esc ON flags(auto_escalated) WHERE auto_escalated = false AND status IN ('raised', 'pending_review');

-- Visit Plans
CREATE INDEX idx_vp_aww ON visit_plans(aww_user_id);
CREATE INDEX idx_vp_child ON visit_plans(child_id);
CREATE INDEX idx_vp_date ON visit_plans(visit_date);
CREATE INDEX idx_vp_overdue ON visit_plans(visit_date, status) WHERE status = 'planned';

-- Photo analyses
CREATE INDEX idx_photo_child ON photo_analyses(child_id);
CREATE INDEX idx_photo_risk ON photo_analyses(risk_level);
CREATE INDEX idx_photo_date ON photo_analyses(analyzed_at);

-- Autism screenings
CREATE INDEX idx_autism_child ON autism_screenings(child_id);
CREATE INDEX idx_autism_risk ON autism_screenings(risk_category);

-- Conversation assessments
CREATE INDEX idx_convo_child ON conversation_assessments(child_id);
CREATE INDEX idx_convo_impression ON conversation_assessments(overall_impression);
CREATE INDEX idx_convo_level ON conversation_assessments(screening_level);

-- Referrals
CREATE INDEX idx_ref_child ON referrals(child_id);
CREATE INDEX idx_ref_status ON referrals(status);
CREATE INDEX idx_refdir_district ON referral_directory(district_id);
CREATE INDEX idx_refdir_type ON referral_directory(type);

-- Intervention plans
CREATE INDEX idx_intplan_child ON intervention_plans(child_id);
CREATE INDEX idx_intplan_status ON intervention_plans(status);
CREATE INDEX idx_intplan_aww ON intervention_plans(assigned_aww);

-- Intervention tasks
CREATE INDEX idx_inttask_plan ON intervention_tasks(plan_id);
CREATE INDEX idx_inttask_status ON intervention_tasks(status);
CREATE INDEX idx_inttask_date ON intervention_tasks(scheduled_date);

-- Intervention follow-ups
CREATE INDEX idx_intfu_plan ON intervention_followups(plan_id);
CREATE INDEX idx_intfu_child ON intervention_followups(child_id);
CREATE INDEX idx_intfu_date ON intervention_followups(scheduled_date);
CREATE INDEX idx_intfu_status ON intervention_followups(visit_status);

-- Domain tables
CREATE INDEX idx_growth_child ON growth_records(child_id);
CREATE INDEX idx_growth_date ON growth_records(measurement_date);
CREATE INDEX idx_growth_muac ON growth_records(muac_class);
CREATE INDEX idx_imm_child ON immunization_records(child_id);
CREATE INDEX idx_nut_child ON nutrition_assessments(child_id);
CREATE INDEX idx_beh_child ON behavioral_assessments(child_id);
CREATE INDEX idx_env_child ON environment_assessments(child_id);

-- Parent cards
CREATE INDEX idx_pcard_category ON parent_cards(category);
CREATE INDEX idx_pcard_domain ON parent_cards USING GIN(target_domains);
CREATE INDEX idx_pcardassign_child ON parent_card_assignments(child_id);

-- Sync queue
CREATE INDEX idx_sync_user ON sync_queue(user_id);
CREATE INDEX idx_sync_pending ON sync_queue(synced) WHERE synced = false;

-- KPI cache
CREATE INDEX idx_kpi_level ON kpi_cache(level, entity_id);
CREATE INDEX idx_kpi_period ON kpi_cache(period, period_start);

-- Alerts
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_unread ON alerts(user_id, is_read) WHERE is_read = false;

-- Audit log
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_date ON audit_log(created_at);

-- Super Admin tables
CREATE INDEX idx_settings_category ON system_settings(category);
CREATE INDEX idx_announcements_active ON platform_announcements(is_active, starts_at, expires_at);
CREATE INDEX idx_permissions_role ON role_permission_templates(role);
CREATE INDEX idx_exports_user ON data_export_requests(requested_by);
CREATE INDEX idx_exports_status ON data_export_requests(status);
CREATE INDEX idx_health_type ON system_health_checks(check_type, checked_at DESC);
CREATE INDEX idx_sessions_user ON user_sessions_log(user_id);
CREATE INDEX idx_sessions_active ON user_sessions_log(last_action_at) WHERE session_end IS NULL;
CREATE INDEX idx_feature_key ON feature_flags(flag_key);


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 26: CRON JOBS (pg_cron)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Flag escalation: 7/14/21-day tiers (every 30 min)
SELECT cron.schedule('escalate-flags-tiered', '*/30 * * * *', 'SELECT auto_escalate_flags()');

-- 2. Flag escalation: 48-hour fast-track (every 30 min)
SELECT cron.schedule('escalate-flags-48hr', '*/30 * * * *', 'SELECT escalate_overdue_flags()');

-- 3. Process overdue follow-ups (daily 6 AM IST = 00:30 UTC)
SELECT cron.schedule('process-overdue-followups', '30 0 * * *', 'SELECT * FROM process_overdue_followups()');

-- 4. Process overdue visit plans (daily 6 AM IST = 00:30 UTC)
SELECT cron.schedule('process-overdue-visits', '30 0 * * *', 'SELECT process_overdue_visit_plans()');


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 27: SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- Default system settings
INSERT INTO system_settings (setting_key, setting_value, description, category) VALUES
  ('escalation_7day_enabled', 'true', 'Enable 7-day auto-escalation to CDPO', 'escalation'),
  ('escalation_14day_enabled', 'true', 'Enable 14-day auto-escalation to District', 'escalation'),
  ('escalation_21day_enabled', 'true', 'Enable 21-day auto-escalation to State', 'escalation'),
  ('escalation_48hr_enabled', 'true', 'Enable 48-hour fast-track escalation', 'escalation'),
  ('screening_target_per_aww', '15', 'Monthly screening target per AWW', 'screening'),
  ('visit_compliance_target', '70', 'Minimum visit compliance % target', 'screening'),
  ('consecutive_miss_escalation', '2', 'Auto-escalate to supervisor after N consecutive misses', 'escalation'),
  ('observation_risk_window_days', '90', 'Rolling window days for observation risk calc', 'screening'),
  ('sync_stale_threshold_hours', '48', 'AWW sync considered stale after N hours', 'sync'),
  ('ai_model_screening', '"gemini-2.5-flash"', 'AI model for photo analysis', 'ai_config'),
  ('ai_model_conversation', '"gemini-2.5-flash"', 'AI model for conversation analysis', 'ai_config'),
  ('consent_required', 'true', 'DPDP Act: consent required on every interaction', 'security'),
  ('data_retention_years', '7', 'Years to retain child data', 'security'),
  ('export_expiry_days', '7', 'Days until data export file expires', 'security'),
  ('platform_version', '"4.0.0"', 'Current platform schema version', 'general');

-- Default feature flags
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled, rollout_percentage) VALUES
  ('ai_photo_analysis', 'AI Photo Analysis', 'Enable Gemini-based photo analysis', true, 100),
  ('ai_conversation', 'AI Conversation Assessment', 'Enable AI conversation scoring', true, 100),
  ('bhashini_stt', 'Bhashini Speech-to-Text', 'Enable Telugu speech transcription', true, 100),
  ('autism_screening', 'Autism Screening (M-CHAT-R)', 'Enable autism screening module', true, 100),
  ('observation_risk_bump', 'Observation Risk Escalation', 'Enable risk bump from observations', true, 100),
  ('parent_cards', 'Parent Education Cards', 'Enable parent card assignments', true, 100),
  ('offline_sync', 'Offline Sync', 'Enable WatermelonDB offline sync', true, 100),
  ('supervisor_risk_override', 'Supervisor Risk Override', 'Allow supervisor to override AI risk', true, 100);

-- Referral Directory (sample entries)
INSERT INTO referral_directory (name, type, specialties, government_facility, free_service) VALUES
  ('District Early Intervention Centre (DEIC)', 'DEIC',
   ARRAY['paediatrics','developmental','speech_therapy','physiotherapy','psychology'], true, true),
  ('District Government Hospital', 'district_hospital',
   ARRAY['paediatrics','neurology','ophthalmology','ENT','orthopaedics'], true, true),
  ('Primary Health Centre', 'PHC',
   ARRAY['general','nutrition','immunization'], true, true),
  ('NIEPID Regional Centre', 'therapy_center',
   ARRAY['developmental','psychology','special_education','autism'], true, true);

-- System Parent Cards (sample entries)
INSERT INTO parent_cards (title_en, title_te, content_en, category, target_domains, age_min_months, age_max_months, is_system_card, difficulty) VALUES
  ('Tummy Time at Home', 'ఇంటిలో పొట్ట సమయం',
   'Place your baby on their tummy on a clean mat for 3-5 minutes, 2-3 times a day. Put a colourful toy in front to encourage them to lift their head.',
   'activity_guide', ARRAY['GM'], 0, 6, true, 'simple'),
  ('Talk to Your Baby', 'మీ బిడ్డతో మాట్లాడండి',
   'Talk to your baby during every activity — bathing, feeding, dressing. Name the objects you use.',
   'stimulation_technique', ARRAY['LC'], 0, 24, true, 'simple'),
  ('Iron-Rich Foods', 'ఐరన్ అధికమైన ఆహారాలు',
   'Include iron-rich foods daily: green leafy vegetables, eggs, jaggery, ragi, sprouted pulses.',
   'nutrition_advice', ARRAY[]::TEXT[], 6, 72, true, 'simple'),
  ('When to Worry About Speech', 'పలుకుల గురించి ఎప్పుడు ఆందోళన',
   'By 12 months: babble. By 18 months: 2-3 words. By 24 months: combine 2 words.',
   'milestone_info', ARRAY['LC'], 12, 36, true, 'simple'),
  ('Eye Check Signs', 'కంటి పరీక్ష సంకేతాలు',
   'Watch for: squint, rubbing eyes, sitting close to TV, tilting head, white pupil reflection.',
   'condition_awareness', ARRAY[]::TEXT[], 0, 72, true, 'simple');

-- M-CHAT-R Questions (20 items)
INSERT INTO supervisor_questions (question_number, text_en, domain, sub_domain, age_min_months, age_max_months, screening_tool, is_critical, scoring_guide) VALUES
  (1, 'If you point at something across the room, does your child look at it?', 'AUTISM', 'joint_attention', 16, 30, 'M-CHAT-R', true, '{"pass":"yes","fail":"no","critical":true}'),
  (2, 'Have you ever wondered if your child might be deaf?', 'AUTISM', 'hearing_response', 16, 30, 'M-CHAT-R', false, '{"pass":"no","fail":"yes"}'),
  (3, 'Does your child play pretend or make-believe?', 'AUTISM', 'symbolic_play', 16, 30, 'M-CHAT-R', false, '{"pass":"yes","fail":"no"}'),
  (4, 'Does your child like climbing on things?', 'AUTISM', 'motor', 16, 30, 'M-CHAT-R', false, '{"pass":"yes","fail":"no"}'),
  (5, 'Does your child make unusual finger movements near their eyes?', 'AUTISM', 'stereotypy', 16, 30, 'M-CHAT-R', false, '{"pass":"no","fail":"yes"}'),
  (6, 'Does your child point with one finger to ask for something?', 'AUTISM', 'pointing', 16, 30, 'M-CHAT-R', true, '{"pass":"yes","fail":"no","critical":true}'),
  (7, 'Does your child point with one finger to show something interesting?', 'AUTISM', 'joint_attention', 16, 30, 'M-CHAT-R', true, '{"pass":"yes","fail":"no","critical":true}'),
  (8, 'Is your child interested in other children?', 'AUTISM', 'social_interest', 16, 30, 'M-CHAT-R', false, '{"pass":"yes","fail":"no"}'),
  (9, 'Does your child show you things by bringing them to you?', 'AUTISM', 'showing', 16, 30, 'M-CHAT-R', true, '{"pass":"yes","fail":"no","critical":true}'),
  (10, 'Does your child respond to their name?', 'AUTISM', 'name_response', 16, 30, 'M-CHAT-R', true, '{"pass":"yes","fail":"no","critical":true}'),
  (11, 'When you smile at your child, does the child smile back?', 'AUTISM', 'social_smile', 16, 30, 'M-CHAT-R', false, '{"pass":"yes","fail":"no"}'),
  (12, 'Does your child get upset by everyday noises?', 'AUTISM', 'sensory', 16, 30, 'M-CHAT-R', false, '{"pass":"no","fail":"yes"}'),
  (13, 'Does your child walk?', 'AUTISM', 'motor', 16, 30, 'M-CHAT-R', false, '{"pass":"yes","fail":"no"}'),
  (14, 'Does your child look you in the eye when talking or playing?', 'AUTISM', 'eye_contact', 16, 30, 'M-CHAT-R', true, '{"pass":"yes","fail":"no","critical":true}'),
  (15, 'Does your child try to copy what you do?', 'AUTISM', 'imitation', 16, 30, 'M-CHAT-R', true, '{"pass":"yes","fail":"no","critical":true}'),
  (16, 'If you turn your head, does your child look to see what you are looking at?', 'AUTISM', 'joint_attention', 16, 30, 'M-CHAT-R', false, '{"pass":"yes","fail":"no"}'),
  (17, 'Does your child try to get you to watch them?', 'AUTISM', 'attention_seeking', 16, 30, 'M-CHAT-R', false, '{"pass":"yes","fail":"no"}'),
  (18, 'Does your child understand when you tell them to do something?', 'AUTISM', 'comprehension', 16, 30, 'M-CHAT-R', false, '{"pass":"yes","fail":"no"}'),
  (19, 'If something new happens, does your child look at your face?', 'AUTISM', 'social_referencing', 16, 30, 'M-CHAT-R', false, '{"pass":"yes","fail":"no"}'),
  (20, 'Does your child like movement activities?', 'AUTISM', 'sensory', 16, 30, 'M-CHAT-R', false, '{"pass":"yes","fail":"no"}');


-- ═══════════════════════════════════════════════════════════════════════════
-- SCHEMA COMPLETE — v4.0
-- ═══════════════════════════════════════════════════════════════════════════
-- Tables:          42 (including 7 new Super Admin tables)
-- Views:           6
-- Functions:       22 (including 2 Super Admin functions)
-- Triggers:        25
-- RLS Policies:    90+
-- Indexes:         80+
-- Enums:           13
-- Cron Jobs:       4
-- Seed Data:       15 settings, 8 feature flags, 4 referral entries,
--                  5 parent cards, 20 M-CHAT-R questions
--
-- ROLES:
--   aww              — AWC-level data entry + self-monitoring
--   supervisor       — Mandal oversight + deep assessments
--   cdpo             — District project monitoring + flag management
--   district_officer — Full district governance + analytics
--   commissioner     — Statewide policy + impact measurement
--   system_admin     — Technical administration
--   super_admin      — Full platform control + user management +
--                      system settings + feature flags + data exports +
--                      health monitoring + session tracking + audit
-- ═══════════════════════════════════════════════════════════════════════════
