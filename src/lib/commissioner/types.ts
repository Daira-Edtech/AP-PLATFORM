
export enum AppView {
  DASHBOARD = 'Dashboard',
  DISTRICTS = 'Districts',
  MAP = 'Geographic Map',
  SCREENING = 'Screening & Risk',
  ANALYTICS = 'Impact Analytics',
  POLICY = 'Policy Insights',
  ESCALATIONS = 'Escalations',
  REFERRALS = 'Referral Health',
  WORKFORCE = 'Workforce',
  CHILDREN = 'Children',
  BRIEFS = 'Cabinet Briefs',
  REPORTS = 'Reports',
  SETTINGS = 'Settings'
}

export type MetricType = 
  | 'Screening Coverage' 
  | 'Risk Distribution' 
  | 'Referral Pipeline Health' 
  | 'Flag Volume' 
  | 'AWW Activity' 
  | 'Facility Load';

export interface KPI {
  id: string;
  label: string;
  value: string | number;
  delta: number;
  trend: number[];
  accent: string;
  comparisonLabel?: string;
  comparisonValue?: string | number;
}

export interface DistrictRisk {
  low: number;
  med: number;
  high: number;
  crit: number;
}

export interface ChildData {
  id: string;
  name: string;
  age: string;
  gender: 'Male' | 'Female';
  parentName: string;
  riskStatus: 'Low' | 'Medium' | 'High' | 'Critical';
  lastScreened: string;
  height: string;
  weight: string;
  muac: string;
  flags: number;
}

export interface DirectoryChild extends ChildData {
  awc: string;
  mandal: string;
  cdpo: string;
  district: string;
  referrals: number;
  lastActivity: string;
  status: 'Screened' | 'Unscreened' | 'Pending' | 'In Intervention';
}

export interface AWCData {
  id: string;
  name: string;
  awwName: string;
  children: number;
  screened: number;
  coverage: number;
  riskHigh: number;
  riskCrit: number;
  score: number;
  childrenList?: ChildData[];
}

export interface MandalData {
  id: string;
  name: string;
  supervisor: string;
  awcs: number;
  children: number;
  screened: number;
  coverage: number;
  riskHigh: number;
  riskCrit: number;
  score: number;
  awcList?: AWCData[];
}

export interface CDPOData {
  id: string;
  name: string;
  officer: string;
  mandals: number;
  awcs: number;
  children: number;
  screened: number;
  coverage: number;
  riskHigh: number;
  riskCrit: number;
  escalations: number;
  referrals: string;
  score: number;
  mandalList?: MandalData[];
}

export interface DistrictData {
  id: string;
  name: string;
  dpo: string;
  cdpos: number;
  mandals: number;
  awcs: number;
  children: number;
  screened: number;
  coverage: number;
  risk: DistrictRisk;
  escalations: number;
  referralsActive: number;
  referralsDone: number;
  avgWait: number;
  facilityLoad: number;
  performance: number;
  trend: number[];
  rank?: number;
  cdpoList?: CDPOData[];
}

export interface NavItem {
  id: AppView;
  icon: string;
  divider?: boolean;
}

export interface User {
  name: string;
  role: string;
  email: string;
  avatar: string;
}

export interface DrillDownPath {
  districtId?: string;
  cdpoId?: string;
  mandalId?: string;
  awcId?: string;
  childId?: string;
}

export interface ConditionStat {
  condition: string;
  count: number;
  rate: number; // per 1000
}

export interface AgeBandStat {
  band: string;
  screened: number;
  unscreened: number;
}

export interface PolicyGap {
  id: string;
  severity: 'RED' | 'AMBER' | 'GREY';
  title: string;
  description: string;
  affectedCount: string;
  suggestedAction: string;
  icon: string;
}

export interface BenchmarkItem {
  metric: string;
  stateValue: string;
  nationalTarget: string;
  status: 'Green' | 'Amber' | 'Red';
  statusText: string;
  gapPercentage: number;
  historicalTrend: 'Better' | 'Worse' | 'Same';
}

export interface EscalationTimelineEvent {
  date: string;
  event: string;
  role: string;
  note?: string;
}

export interface Escalation {
  id: string;
  childName: string;
  childId: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  daysOpen: number;
  location: {
    district: string;
    cdpo: string;
    mandal: string;
    awc: string;
  };
  path: string[]; 
  districtNotes: string;
  timeline: EscalationTimelineEvent[];
  status: 'Active' | 'In Progress' | 'Resolved';
  outcome?: string;
}

export type FacilityStatus = 'Available' | 'Limited' | 'Capacity' | 'None';

export interface FacilityGridItem {
  districtId: string;
  districtName: string;
  statuses: Record<string, FacilityStatus>;
}

export interface OverdueReferral {
  id: string;
  childName: string;
  district: string;
  type: string;
  daysOverdue: number;
  status: string;
}

export interface DistrictWorkforce {
  id: string;
  name: string;
  awwsFilled: number;
  awwsTarget: number;
  screenersFilled: number;
  screenersTarget: number;
  cdposCount: number;
  vacancyRate: number;
  trainingCompliance: number;
  childToAwwRatio: number;
  complianceScore: number;
}

export interface GeneratedBrief {
  id: string;
  name: string;
  type: string;
  period: string;
  scope: string;
  generatedAt: string;
  size: string;
}

export interface StandardReport {
  id: string;
  name: string;
  type: string;
  period: string;
  generatedAt: string;
}
