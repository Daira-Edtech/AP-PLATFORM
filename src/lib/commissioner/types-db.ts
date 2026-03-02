/** Types aligned with the Supabase database schema */

export type UserRole = 'aww' | 'supervisor' | 'cdpo' | 'district_officer' | 'commissioner' | 'system_admin';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type FlagPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FlagStatus = 'raised' | 'acknowledged' | 'in_progress' | 'resolved' | 'escalated';

export interface UserProfile {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    role: UserRole;
    awc_id: string | null;
    mandal_id: string | null;
    district_id: string | null;
    state_id: string | null;
    is_active: boolean;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface State {
    id: string;
    name: string;
    code: string;
    created_at: string;
}

export interface District {
    id: string;
    state_id: string;
    name: string;
    code: string;
    created_at: string;
}

export interface Mandal {
    id: string;
    district_id: string;
    name: string;
    code: string;
    created_at: string;
}

export interface Sector {
    id: string;
    mandal_id: string;
    name: string;
    code: string;
    created_at: string;
}

export interface AWC {
    id: string;
    panchayat_id: string | null;
    sector_id: string;
    mandal_id: string;
    name: string;
    code: string;
    latitude: number | null;
    longitude: number | null;
    village_name: string | null;
    target_children: number;
    is_active: boolean;
    created_at: string;
}

export interface Child {
    id: string;
    name: string;
    dob: string;
    gender: 'male' | 'female' | 'other' | null;
    mother_name: string | null;
    mother_phone: string | null;
    father_name: string | null;
    father_phone: string | null;
    guardian_name: string | null;
    address: string | null;
    village: string | null;
    panchayat_name: string | null;
    photo_url: string | null;
    awc_id: string;
    current_risk_level: RiskLevel | null;
    last_screening_date: string | null;
    is_active: boolean;
    registered_by: string | null;
    registered_at: string;
    updated_at: string;
}

export interface Assessment {
    id: string;
    child_id: string;
    session_id: string | null;
    composite_score: number | null;
    domain_scores: Record<string, number>;
    risk_level: RiskLevel;
    confidence: number | null;
    predicted_risk_3mo: RiskLevel | null;
    predicted_risk_6mo: RiskLevel | null;
    trajectory: 'improving' | 'stable' | 'declining' | 'new' | null;
    condition_flags: Record<string, any> | null;
    explainability: Record<string, any> | null;
    assessed_by: string;
    assessed_at: string;
}

export interface Flag {
    id: string;
    child_id: string;
    raised_by: string;
    priority: FlagPriority;
    status: FlagStatus;
    title: string;
    description: string;
    category: string | null;
    assigned_to: string | null;
    acknowledged_at: string | null;
    resolved_at: string | null;
    resolution_notes: string | null;
    escalated_to: string | null;
    escalated_at: string | null;
    created_at: string;
}

export interface Referral {
    id: string;
    child_id: string;
    assessment_id: string | null;
    referral_type: string;
    urgency: 'routine' | 'priority' | 'urgent' | 'emergency';
    status: 'generated' | 'sent' | 'scheduled' | 'completed' | 'cancelled';
    facility_name: string | null;
    facility_type: string | null;
    specialist_notes: string | null;
    appointment_date: string | null;
    outcome_notes: string | null;
    completed_at: string | null;
    created_by: string | null;
    created_at: string;
}

export interface Intervention {
    id: string;
    child_id: string;
    assessment_id: string | null;
    intervention_type: string;
    description: string | null;
    target_domains: string[] | null;
    assigned_to: string | null;
    status: 'planned' | 'active' | 'completed' | 'cancelled';
    start_date: string | null;
    end_date: string | null;
    progress_notes: any[];
    created_by: string | null;
    created_at: string;
}

export interface Alert {
    id: string;
    type: string;
    severity: 'info' | 'medium' | 'high' | 'critical';
    child_id: string | null;
    awc_id: string | null;
    target_roles: UserRole[] | null;
    target_user_id: string | null;
    message: string;
    action_url: string | null;
    is_read: boolean;
    acknowledged_at: string | null;
    created_at: string;
}

export interface KPICache {
    id: string;
    level: string;
    entity_id: string;
    period: string;
    metrics: Record<string, any>;
    computed_at: string;
}

export interface Observation {
    id: string;
    child_id: string;
    aww_user_id: string;
    visit_date: string;
    observation_text: string;
    voice_note_url: string | null;
    category: string | null;
    auto_tags: string[] | null;
    sentiment: 'positive' | 'neutral' | 'concern' | null;
    created_at: string;
}

export interface AuditLogEntry {
    id: number;
    timestamp: string;
    user_id: string | null;
    user_role: UserRole | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    details: Record<string, any> | null;
    purpose: string;
}

// Aggregated types (returned by RPC functions)

export interface StateKPIs {
    total_children: number;
    screened: number;
    coverage_pct: number;
    high_risk: number;
    critical_risk: number;
    active_referrals: number;
    open_flags: number;
}

export interface DistrictSummary {
    id: string;
    name: string;
    code: string;
    mandal_count: number;
    awc_count: number;
    total_children: number;
    screened: number;
    coverage_pct: number;
    risk_low: number;
    risk_medium: number;
    risk_high: number;
    risk_critical: number;
    escalations: number;
    referrals_active: number;
    referrals_done: number;
    dpo_name: string;
    cdpo_count: number;
    avg_wait: number;
    facility_load: number;
    performance: number;
    trend: number[];
}

export interface RiskDistribution {
    total: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
    unscreened: number;
}
