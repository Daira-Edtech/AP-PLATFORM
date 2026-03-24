export type Status = 'available' | 'limited' | 'at-capacity' | 'no-data';

export interface KPI {
    label: string;
    value: string | number;
    trend: number[];
    change: string;
    isPositive: boolean;
}

export interface ResourceData {
    category: string;
    allocated: number;
    utilized: number;
}

export interface Facility {
    id: string;
    name: string;
    region: string;
    status: Status;
    utilization: number;
}

export interface RegionRisk {
    id: string;
    name: string;
    riskLevel: 'low' | 'medium' | 'high';
    coverage: number;
}

export interface CDPOPerformance {
    id: string;
    name: string;
    officer: string;
    mandals: number;
    awcs: number;
    children: number;
    screened: number;
    coverage: number;
    lowRisk: number;
    medRisk: number;
    highRisk: number;
    critRisk: number;
    escalations: number;
    referralsPending: number;
    referralsDone: number;
    avgResolution: number;
    performanceScore: number;
}

export interface TrendData {
    name: string;
    val: number;
}

export interface DpoDashboardStats {
    totalChildren: number;
    screenedChildren: number;
    coverageRate: number;
    highRiskCount: number;
    criticalRiskCount: number;
    escalationsCount: number;
    activeReferralsCount: number;
    riskDistribution: { name: string; value: number; color: string }[];
    screeningTrend: TrendData[];
    regionalPerformance: { name: string; coverage: number; color: string; path: string }[];
}

export interface RiskAnalysisStats {
    treemapData: { id: string; name: string; size: number; coverage: number; color: string }[];
    riskHistory: { name: string; Low: number; Med: number; High: number; Crit: number }[];
    domainHeatmap: { domain: string; scores: number[] }[];
    highRiskChildren: {
        id: string;
        shortId: string;
        name: string;
        age: string;
        awc: string;
        mandal: string;
        cdpo: string;
        risk: string;
        score: number;
        conditions: string;
        status: string;
    }[];
    demographicData: { age: string; screened: number; total: number }[];
}

export interface Escalation {
    id: string;
    uid?: string;
    priority: 'low' | 'amber' | 'high' | 'critical';
    title: string;
    daysOpen: number;
    childName: string;
    childAge: string;
    childGender: 'M' | 'F';
    location: {
        awc: string;
        mandal: string;
        cdpo: string;
    };
    path: string[];
    history: {
        event: string;
        date: string;
    }[];
    notes?: string;
    assignedTo?: string;
    progressNotes?: string;
    resolutionOutcome?: 'Resolved' | 'Referred' | 'Transferred' | 'Other';
    resolvedBy?: string;
    resolvedDate?: string;
}

export interface DpoEscalationsData {
    active: Escalation[];
    resolved: Escalation[];
    kpis: KPI[];
}

export enum DpoTab {
    DASHBOARD = 'Dashboard',
    CDPOS = 'CDPOs',
    SCREENING = 'Screening',
    RISK_ANALYSIS = 'Risk Analysis',
    ESCALATIONS = 'Escalations',
    REFERRAL_PIPELINE = 'Referral Pipeline',
    FACILITY_HEALTH = 'Facility Health',
    RESOURCES = 'Resources',
    WORKFORCE = 'Workforce',
    CHILDREN = 'Children',
    REPORTS = 'Reports',
    SETTINGS = 'Settings'
}

export interface MandalPerformance {
    id: string;
    name: string;
    screener: string;
    awcs: number;
    children: number;
    screened: number;
    coverage: number;
    flags: number;
    escalated: number;
    referrals: number;
}

export interface CDPODetailStats {
    id: string;
    name: string;
    officer: string;
    phone?: string;
    email?: string;
    mandalsCount: number;
    sectorsCount: number;
    panchayatsCount: number;
    awcsCount: number;
    childrenCount: number;
    kpis: KPI[];
    mandals: MandalPerformance[];
    riskDistribution: { name: string; value: number; color: string }[];
    coverageTrend: { name: string; cdpo: number; district: number }[];
    recentActivities: {
        icon: string;
        color: string;
        bg: string;
        text: string;
        time: string;
    }[];
    referralFunnel: { label: string; count: number; total: number; bottleneck?: boolean }[];
    actionsRequired: { id: string; child: string; days: number; status: string }[];
    districtAvg: number;
}

export interface DpoScreeningStats {
    coverageKpis: KPI[];
    riskKpis: { label: string; value: string; color: string; percentage: string; change: string }[];
    treemapData: { id: string; name: string; size: number; coverage: number }[];
    criticalSubCenters: { name: string; cdpo: string; coverage: number; activity: string }[];
    ageSegmentation: { age: string; screened: number; total: number }[];
    interRegionalRisk: { name: string; Low: number; Med: number; High: number; Crit: number }[];
    riskHistory: { name: string; Low: number; Med: number; High: number; Crit: number }[];
    domainHeatmap: { domain: string; scores: number[] }[];
    highRiskChildren: {
        id: string;
        shortId: string;
        name: string;
        age: string;
        awc: string;
        mandal: string;
        cdpo: string;
        risk: string;
        score: number;
        conditions: string;
        status: string;
    }[];
    multiLineData: any[]; // CDPO-wise performance trends
    cdpos: string[];
}


export interface DpoWorkforceData {
    kpis: KPI[];
    awwPerformanceData: { id: string; name: string; cdpo: string; mandal: string; awc: string; children: number; questionnaires: number; coverage: number; observations: number; flags: number; visits: number; lastActive: string; score: number }[];
    screenerData: { name: string; cdpo: string; mandal: string; screenings: number; quality: number; referrals: number; activeCases: number; lastActive: string }[];
    cdpoOfficers: { name: string; cdpo: string; mandals: number; escalations: number; reports: number; lastLogin: string; status: string }[];
    heatmapRows: string[];
    heatmapWeeks: string[];
}

export interface ChildDetailData {
    id: string;
    name: string;
    dob: string;
    age: string;
    gender: string;
    guardianName: string;
    contactNo: string;
    mandalName: string;
    awcName: string;
    currentRisk: string;
    recentObservation?: {
        text?: string;
        by?: string;
        date?: string;
    };
    vitals?: {
        height: number;
        weight: number;
        muac: number;
        status: string;
    };
    screenings: {
        id: string;
        date: string;
        level: string;
        by: string;
        status: string;
        scores: Record<string, number>;
    }[];
    flags: {
        id: string;
        title: string;
        status: string;
        priority: string;
        date: string;
        raisedBy: string;
    }[];
    referrals: {
        id: string;
        type: string;
        status: string;
        date: string;
        referredBy: string;
    }[];
}
