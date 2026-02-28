export type UserRole =
    | 'aww'
    | 'supervisor'
    | 'cdpo'
    | 'district_officer'
    | 'commissioner'
    | 'system_admin'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type FlagPriority = 'low' | 'medium' | 'high' | 'urgent'
export type FlagStatus = 'raised' | 'acknowledged' | 'in_progress' | 'resolved' | 'escalated'

export interface Profile {
    id: string
    name: string
    phone: string | null
    email: string | null
    role: UserRole
    awc_id: string | null
    mandal_id: string | null
    district_id: string | null
    state_id: string | null
    is_active: boolean
    avatar_url: string | null
    created_at: string
    updated_at: string
}

export interface State {
    id: string
    name: string
    code: string
    created_at: string
}

export interface District {
    id: string
    state_id: string
    name: string
    code: string
    created_at: string
}

export interface Mandal {
    id: string
    district_id: string
    name: string
    code: string
    created_at: string
}

export interface Sector {
    id: string
    mandal_id: string
    name: string
    code: string
    created_at: string
}

export interface Panchayat {
    id: string
    sector_id: string
    name: string
    code: string
    created_at: string
}

export interface AWC {
    id: string
    panchayat_id: string | null
    sector_id: string
    mandal_id: string
    name: string
    code: string
    latitude: number | null
    longitude: number | null
    village_name: string | null
    target_children: number
    is_active: boolean
    created_at: string
}

export interface Child {
    id: string
    name: string
    dob: string
    gender: 'male' | 'female' | 'other'
    awc_id: string
    current_risk_level: RiskLevel | null
    is_active: boolean
    registered_at: string
}

export interface Question {
    id: string
    question_number: number
    text_en: string
    text_te: string | null
    domain: 'GM' | 'FM' | 'LC' | 'COG' | 'SE'
    age_min_months: number
    age_max_months: number
    weight: number
    is_critical: boolean
    illustration_url: string | null
    created_at: string
}

export interface Activity {
    id: string
    title_en: string
    title_te: string | null
    description_en: string
    description_te: string | null
    domain: 'GM' | 'FM' | 'LC' | 'COG' | 'SE'
    age_min_months: number
    age_max_months: number
    difficulty: 'easy' | 'moderate' | 'advanced'
    materials_needed: string | null
    duration_minutes: number
    tags: string[]
    is_active: boolean
    created_at: string
}

export interface Flag {
    id: string
    child_id: string
    raised_by: string
    priority: FlagPriority
    status: FlagStatus
    title: string
    description: string
    created_at: string
}

export interface AuditLog {
    id: number
    timestamp: string
    user_id: string | null
    user_role: UserRole | null
    action: string
    resource_type: string | null
    resource_id: string | null
    details: Record<string, unknown> | null
    ip_address: string | null
    purpose: string
}

export interface Alert {
    id: string
    type: string
    severity: 'info' | 'medium' | 'high' | 'critical'
    child_id: string | null
    awc_id: string | null
    target_roles: UserRole[]
    target_user_id: string | null
    message: string
    is_read: boolean
    acknowledged_at: string | null
    created_at: string
}