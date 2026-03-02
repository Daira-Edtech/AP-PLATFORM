
import React from 'react';
import {
  LayoutGrid, MapPin, Globe, Scan, TrendingUp, Lightbulb,
  ArrowUpCircle, Send, Users, User as UserIcon, Presentation, FileText, Settings
} from 'lucide-react';
import {
  AppView, NavItem, KPI, DistrictData, CDPOData, MandalData,
  AWCData, ChildData, ConditionStat, AgeBandStat, PolicyGap,
  BenchmarkItem, Escalation, FacilityGridItem, OverdueReferral,
  DistrictWorkforce, DirectoryChild, GeneratedBrief, StandardReport
} from './types';

export const NAV_ITEMS: NavItem[] = [
  { id: AppView.DASHBOARD, icon: 'LayoutGrid' },
  { id: AppView.DISTRICTS, icon: 'MapPin' },
  { id: AppView.MAP, icon: 'Globe' },
  { id: AppView.SCREENING, icon: 'Scan', divider: true },
  { id: AppView.ANALYTICS, icon: 'TrendingUp' },
  { id: AppView.POLICY, icon: 'Lightbulb' },
  { id: AppView.ESCALATIONS, icon: 'ArrowUpCircle', divider: true },
  { id: AppView.REFERRALS, icon: 'Send' },
  { id: AppView.WORKFORCE, icon: 'Users' },
  { id: AppView.CHILDREN, icon: 'UserIcon' },
  { id: AppView.BRIEFS, icon: 'Presentation', divider: true },
  { id: AppView.REPORTS, icon: 'FileText' },
  { id: AppView.SETTINGS, icon: 'Settings' },
];

export const getIcon = (iconName: string, size = 20) => {
  const icons: Record<string, any> = {
    LayoutGrid, MapPin, Globe, Scan, TrendingUp, Lightbulb,
    ArrowUpCircle, Send, Users, UserIcon, Presentation, FileText, Settings
  };
  const IconComponent = icons[iconName];
  return IconComponent ? <IconComponent size={size} /> : null;
};

export const EXECUTIVE_KPIS: KPI[] = [
  { id: '1', label: 'TOTAL CHILDREN', value: '5,10,000', delta: 0, trend: [480, 485, 490, 495, 500, 505, 510], accent: '#3B82F6' },
  { id: '2', label: 'SCREENED', value: '3,42,000', delta: 12, trend: [280, 290, 305, 315, 330, 342], accent: '#22C55E' },
  { id: '3', label: 'COVERAGE', value: '67%', delta: 8, trend: [58, 60, 62, 63, 65, 67], accent: '#000000' },
  { id: '4', label: 'HIGH/CRITICAL', value: '34,200', delta: 0, trend: [34, 34.2, 34.1, 34.2, 34.2], accent: '#E11D48' },
  { id: '5', label: 'STATE ESCALATIONS', value: '128', delta: -15, trend: [160, 155, 150, 142, 135, 128], accent: '#F59E0B' },
  { id: '6', label: 'ACTIVE REFERRALS', value: '4,780', delta: 0, trend: [4200, 4350, 4500, 4650, 4780], accent: '#6B7280' },
];

export const PREVIOUS_BRIEFS: GeneratedBrief[] = [
  { id: 'B-001', name: 'March Executive Summary', type: 'Monthly Summary', period: 'Mar 2024', scope: 'Statewide', generatedAt: 'Apr 02, 2024', size: '2.4 MB' },
  { id: 'B-002', name: 'Q1 Impact Review', type: 'Quarterly Impact', period: 'Q1 2024', scope: 'Statewide', generatedAt: 'Mar 28, 2024', size: '4.8 MB' },
  { id: 'B-003', name: 'Guntur District Spotlight', type: 'District Spotlight', period: 'Feb 2024', scope: 'Guntur', generatedAt: 'Mar 15, 2024', size: '1.2 MB' },
  { id: 'B-004', name: 'SAM Escalation Brief', type: 'Crisis Brief', period: 'Current', scope: 'Statewide', generatedAt: 'Mar 10, 2024', size: '0.8 MB' },
];

export const PREVIOUS_REPORTS: StandardReport[] = [
  { id: 'R-101', name: 'Statewide Coverage Analysis', type: 'Performance', period: 'Mar 2024', generatedAt: 'Apr 01, 2024' },
  { id: 'R-102', name: 'Workforce Compliance Audit', type: 'Workforce', period: 'Q1 2024', generatedAt: 'Mar 25, 2024' },
  { id: 'R-103', name: 'Referral Pipeline Health', type: 'Referral', period: 'Feb 2024', generatedAt: 'Mar 05, 2024' },
];

export const DIRECTORY_CHILDREN: DirectoryChild[] = [
  { id: 'CH-9942', name: 'Aarav Reddy', age: '3y 2m', gender: 'Male', parentName: 'V. Reddy', riskStatus: 'Critical', lastScreened: 'Mar 12, 2024', height: '92cm', weight: '10.5kg', muac: '10.8cm', flags: 3, awc: 'Kondapur-A1', mandal: 'Mandal-4', cdpo: 'Kondapur', district: 'Guntur', referrals: 1, lastActivity: 'Referral Waitlisted', status: 'In Intervention' },
  { id: 'CH-2150', name: 'Ishani Rao', age: '2y 8m', gender: 'Female', parentName: 'K. Rao', riskStatus: 'High', lastScreened: 'Mar 08, 2024', height: '88cm', weight: '9.8kg', muac: '12.4cm', flags: 1, awc: 'Harbour Road AWC', mandal: 'K-Mandal 2', cdpo: 'Kakinada Urban', district: 'East Godavari', referrals: 1, lastActivity: 'CDPO Review', status: 'Pending' },
  { id: 'CH-3341', name: 'Vihaan Kumar', age: '4y 1m', gender: 'Male', parentName: 'P. Kumar', riskStatus: 'Low', lastScreened: 'Mar 01, 2024', height: '102cm', weight: '14.2kg', muac: '14.8cm', flags: 0, awc: 'Market Street 1', mandal: 'City Central', cdpo: 'Guntur Urban', district: 'Guntur', referrals: 0, lastActivity: 'Routine Screen', status: 'Screened' },
  { id: 'CH-8821', name: 'Ananya S.', age: '1y 11m', gender: 'Female', parentName: 'S. Rao', riskStatus: 'Medium', lastScreened: 'Mar 15, 2024', height: '76cm', weight: '8.4kg', muac: '13.1cm', flags: 0, awc: 'Old Town AWC', mandal: 'Kondapur Mandal', cdpo: 'Guntur Urban', district: 'Guntur', referrals: 0, lastActivity: 'Weight Entry', status: 'Screened' },
  { id: 'CH-4452', name: 'Suresh V.', age: '5y 2m', gender: 'Male', parentName: 'N. Varma', riskStatus: 'Critical', lastScreened: 'Mar 10, 2024', height: '108cm', weight: '12.4kg', muac: '11.2cm', flags: 2, awc: 'Kondapur AWC 2', mandal: 'Rural East', cdpo: 'Guntur Rural', district: 'Guntur', referrals: 2, lastActivity: 'ESCALATED', status: 'In Intervention' },
  { id: 'CH-5510', name: 'Meena R.', age: '0y 8m', gender: 'Female', parentName: 'J. Ram', riskStatus: 'Medium', lastScreened: 'Feb 28, 2024', height: '62cm', weight: '6.2kg', muac: '12.8cm', flags: 0, awc: 'Station Road', mandal: 'City Center', cdpo: 'Nellore Urban', district: 'Nellore', referrals: 1, lastActivity: 'Specialist Appt', status: 'In Intervention' },
  { id: 'CH-6671', name: 'Arjun K.', age: '3y 11m', gender: 'Male', parentName: 'K. Krish', riskStatus: 'Low', lastScreened: 'Mar 05, 2024', height: '98cm', weight: '15.5kg', muac: '15.2cm', flags: 0, awc: 'Bypass AWC', mandal: 'West Mandal', cdpo: 'Anantapur Town', district: 'Anantapur', referrals: 0, lastActivity: 'Routine Screen', status: 'Screened' },
  { id: 'CH-7782', name: 'Kavya S.', age: '2y 4m', gender: 'Female', parentName: 'L. Siv', riskStatus: 'High', lastScreened: 'Mar 14, 2024', height: '82cm', weight: '9.2kg', muac: '12.0cm', flags: 1, awc: 'Hill View 1', mandal: 'East Mandal', cdpo: 'Chittoor Urban', district: 'Chittoor', referrals: 1, lastActivity: 'Referral Sent', status: 'Pending' },
  { id: 'CH-1102', name: 'Rahul M.', age: '4y 6m', gender: 'Male', parentName: 'P. Mani', riskStatus: 'Low', lastScreened: 'Unscreened', height: '-', weight: '-', muac: '-', flags: 0, awc: 'Temple Square', mandal: 'North Mandal', cdpo: 'Kurnool Town', district: 'Kurnool', referrals: 0, lastActivity: 'Registration', status: 'Unscreened' },
  { id: 'CH-2291', name: 'Priya D.', age: '1y 2m', gender: 'Female', parentName: 'D. Dev', riskStatus: 'Medium', lastScreened: 'Mar 02, 2024', height: '72cm', weight: '7.8kg', muac: '13.0cm', flags: 0, awc: 'River Side', mandal: 'South Mandal', cdpo: 'Krishna Rural', district: 'Krishna', referrals: 0, lastActivity: 'Routine Screen', status: 'Screened' },
];

export const WORKFORCE_DISTRICT_DATA: DistrictWorkforce[] = [
  { id: '1', name: 'Anantapur', awwsFilled: 610, awwsTarget: 640, screenersFilled: 28, screenersTarget: 32, cdposCount: 5, vacancyRate: 4.6, trainingCompliance: 82, childToAwwRatio: 42, complianceScore: 88 },
  { id: '2', name: 'Chittoor', awwsFilled: 680, awwsTarget: 710, screenersFilled: 34, screenersTarget: 38, cdposCount: 6, vacancyRate: 4.2, trainingCompliance: 88, childToAwwRatio: 44, complianceScore: 91 },
  { id: '3', name: 'East Godavari', awwsFilled: 900, awwsTarget: 920, screenersFilled: 44, screenersTarget: 45, cdposCount: 8, vacancyRate: 2.1, trainingCompliance: 94, childToAwwRatio: 38, complianceScore: 95 },
  { id: '4', name: 'Guntur', awwsFilled: 740, awwsTarget: 850, screenersFilled: 32, screenersTarget: 42, cdposCount: 5, vacancyRate: 12.9, trainingCompliance: 72, childToAwwRatio: 52, complianceScore: 68 },
  { id: '5', name: 'Krishna', awwsFilled: 620, awwsTarget: 640, screenersFilled: 29, screenersTarget: 32, cdposCount: 5, vacancyRate: 3.1, trainingCompliance: 91, childToAwwRatio: 40, complianceScore: 92 },
  { id: '6', name: 'Kurnool', awwsFilled: 640, awwsTarget: 780, screenersFilled: 26, screenersTarget: 38, cdposCount: 6, vacancyRate: 17.9, trainingCompliance: 64, childToAwwRatio: 58, complianceScore: 54 },
];

export const TRAINING_HEATMAP_DATA = [
  { district: 'Anantapur', months: [82, 84, 85, 82, 88, 90] },
  { district: 'Chittoor', months: [88, 89, 91, 88, 90, 92] },
  { district: 'East Godavari', months: [94, 95, 96, 94, 98, 99] },
  { district: 'Guntur', months: [72, 70, 75, 72, 74, 76] },
  { district: 'Krishna', months: [91, 92, 93, 91, 94, 95] },
  { district: 'Kurnool', months: [64, 62, 60, 64, 68, 70] },
];

export const MOCK_ESCALATIONS: Escalation[] = [
  {
    id: 'ESC-1042',
    childName: 'Aarav Reddy',
    childId: 'CH-9942',
    priority: 'Critical',
    daysOpen: 24,
    location: {
      district: 'Guntur',
      cdpo: 'Kondapur',
      mandal: 'Mandal-4',
      awc: 'Kondapur-A1'
    },
    path: ['AWW Lakshmi', 'Mandal Team B', 'CDPO Rajesh', 'DPO Guntur', 'State Commissioner'],
    districtNotes: 'Facility at District General Hospital is at 110% capacity. Specialist pediatrician on leave for 14 days. No alternative provided by District Health Office.',
    status: 'Active',
    timeline: [
      { date: '2024-03-01', event: 'Screening Flagged SAM', role: 'AWW Lakshmi', note: 'Child presents SAM symptoms, MUAC 10.8cm' },
      { date: '2024-03-04', event: 'Mandal Review Completed', role: 'Supervisor Murthy' },
      { date: '2024-03-06', event: 'Referred to District Hospital', role: 'CDPO Rajesh' },
      { date: '2024-03-12', event: 'Stalled at Referral Desk', role: 'DPO Desk', note: 'Waiting list exceeding 7 days' },
      { date: '2024-03-18', event: 'Escalated to State Command', role: 'System Auto-Flag', note: 'Case exceeded 14-day district resolution limit' }
    ]
  },
  {
    id: 'ESC-1108',
    childName: 'Ishani Rao',
    childId: 'CH-2150',
    priority: 'High',
    daysOpen: 18,
    location: {
      district: 'East Godavari',
      cdpo: 'Kakinada Urban',
      mandal: 'K-Mandal 2',
      awc: 'Harbour Road AWC'
    },
    path: ['AWW Sarala', 'Mandal Team A', 'CDPO Lakshmi', 'DPO East Godavari', 'State Commissioner'],
    districtNotes: 'Parental refusal for institutional referral. Require state directive for home-based intensive intervention and counselor deployment.',
    status: 'Active',
    timeline: [
      { date: '2024-03-08', event: 'Screening Flagged SAM', role: 'AWW Sarala' },
      { date: '2024-03-15', event: 'CDPO Review: Refusal Logged', role: 'CDPO Lakshmi' },
      { date: '2024-03-22', event: 'Escalated for Directive', role: 'DPO Lakshmi', note: 'Requesting permission for Counselor led outreach' }
    ]
  }
];

export const FACILITY_GRID_DATA: FacilityGridItem[] = [
  { districtId: '1', districtName: 'Anantapur', statuses: { 'DEIC': 'Available', 'Hospital': 'Limited', 'OT': 'Capacity', 'Speech': 'None', 'ENT': 'Available', 'Eye': 'Available', 'Nutrition': 'Limited' } },
  { districtId: '2', districtName: 'Chittoor', statuses: { 'DEIC': 'Limited', 'Hospital': 'Available', 'OT': 'Available', 'Speech': 'Available', 'ENT': 'Limited', 'Eye': 'Available', 'Nutrition': 'Available' } },
  { districtId: '3', districtName: 'East Godavari', statuses: { 'DEIC': 'Available', 'Hospital': 'Available', 'OT': 'Available', 'Speech': 'Available', 'ENT': 'Available', 'Eye': 'Available', 'Nutrition': 'Available' } },
  { districtId: '4', districtName: 'Guntur', statuses: { 'DEIC': 'Capacity', 'Hospital': 'Limited', 'OT': 'Limited', 'Speech': 'Limited', 'ENT': 'Available', 'Eye': 'Limited', 'Nutrition': 'Available' } },
  { districtId: '5', districtName: 'Krishna', statuses: { 'DEIC': 'Available', 'Hospital': 'Available', 'OT': 'Limited', 'Speech': 'Available', 'ENT': 'Available', 'Eye': 'Available', 'Nutrition': 'Available' } },
  { districtId: '6', districtName: 'Kurnool', statuses: { 'DEIC': 'Limited', 'Hospital': 'Capacity', 'OT': 'None', 'Speech': 'None', 'ENT': 'Limited', 'Eye': 'Available', 'Nutrition': 'Limited' } },
];

export const OVERDUE_REFERRALS: OverdueReferral[] = [
  { id: 'REF-8842', childName: 'Suresh V.', district: 'Guntur', type: 'Nutritional', daysOverdue: 14, status: 'Active' },
  { id: 'REF-9120', childName: 'Meena R.', district: 'Kurnool', type: 'Hearing', daysOverdue: 12, status: 'Scheduled' },
  { id: 'REF-7741', childName: 'Arjun K.', district: 'Anantapur', type: 'OT', daysOverdue: 9, status: 'Active' },
  { id: 'REF-6652', childName: 'Kavya S.', district: 'Guntur', type: 'ENT', daysOverdue: 8, status: 'Active' },
  { id: 'REF-5541', childName: 'Rahul M.', district: 'Nellore', type: 'Vision', daysOverdue: 7, status: 'Scheduled' },
];

export const REFERRAL_MONTHLY_TREND = [
  { month: 'Jan', generated: 3200, completed: 2100, rate: 65 },
  { month: 'Feb', generated: 3400, completed: 2300, rate: 67 },
  { month: 'Mar', generated: 3800, completed: 2800, rate: 73 },
  { month: 'Apr', generated: 4100, completed: 2950, rate: 71 },
  { month: 'May', generated: 4500, completed: 3400, rate: 75 },
  { month: 'Jun', generated: 4780, completed: 3442, rate: 72 },
];

export const CONDITION_STATS: ConditionStat[] = [
  { condition: 'Nutritional Deficiency', count: 1400, rate: 4.1 },
  { condition: 'Motor Delay Pattern', count: 1200, rate: 3.5 },
  { condition: 'ASD Indicators', count: 890, rate: 2.6 },
  { condition: 'Hearing Concerns', count: 620, rate: 1.8 },
  { condition: 'Speech Delay', count: 540, rate: 1.6 },
  { condition: 'Visual Issues', count: 320, rate: 0.9 },
  { condition: 'Dysmorphology Flags', count: 180, rate: 0.5 },
];

export const AGE_BAND_STATS: AgeBandStat[] = [
  { band: '0-1 yr', screened: 45000, unscreened: 12000 },
  { band: '1-2 yr', screened: 68000, unscreened: 15000 },
  { band: '2-3 yr', screened: 82000, unscreened: 22000 },
  { band: '3-4 yr', screened: 75000, unscreened: 28000 },
  { band: '4-5 yr', screened: 42000, unscreened: 35000 },
  { band: '5-6 yr', screened: 30000, unscreened: 26000 },
];

export const IMPACT_LONGITUDINAL_DATA = [
  { q: 'Q1-23', volume: 45000, rate: 2.1, annotation: 'Pilot' },
  { q: 'Q2-23', volume: 68000, rate: 3.4, annotation: 'Pilot' },
  { q: 'Q3-23', volume: 120000, rate: 5.8, annotation: 'Phase 1' },
  { q: 'Q4-23', volume: 185000, rate: 7.2, annotation: 'Phase 1' },
  { q: 'Q1-24', volume: 280000, rate: 8.9, annotation: 'Full Rollout' },
  { q: 'Q2-24', volume: 342000, rate: 10.4, annotation: 'Full Rollout' },
];

export const INTERVENTION_PIPELINE_DATA = [
  { stage: 'Screened', value: 342000, drop: 0 },
  { stage: 'Identified', value: 34200, drop: 90 },
  { stage: 'Referred', value: 4780, drop: 86 },
  { stage: 'Intervention Started', value: 3442, drop: 28 },
  { stage: 'Completed', value: 2478, drop: 28 },
  { stage: 'Follow-up Normal', value: 1800, drop: 27 },
];

export const COHORT_OUTCOME_DATA = [
  { name: 'Normal Development', value: 60, color: '#22C55E' },
  { name: 'Referred & Resolved', value: 15, color: '#000000' },
  { name: 'Under Intervention', value: 10, color: '#3B82F6' },
  { name: 'Lost to Follow-up', value: 8, color: '#EF4444' },
  { name: 'Still Pending', value: 7, color: '#F59E0B' },
];

export const BEFORE_AFTER_DATA = [
  { label: 'Identification Rate', before: '2.8 / 1000', after: '10.4 / 1000', delta: '+271%', positive: true },
  { label: 'Time to Identification', before: '14.2 months', after: '3.8 months', delta: '-73%', positive: true },
  { label: 'Referral Completion', before: '12%', after: '72%', delta: '+500%', positive: true },
  { label: 'Specialist Access', before: 'Low (Manual)', after: 'High (Digital)', delta: 'Managed', positive: true },
  { label: 'Coverage Rate', before: '18%', after: '67%', delta: '+272%', positive: true },
];

export const POLICY_GAPS: PolicyGap[] = [
  {
    id: 'g1', severity: 'RED', title: 'Specialist Shortage', icon: 'UserIcon',
    description: '4 districts have no paediatrician within the direct referral network. Referral path relies on tertiary hospitals outside district boundaries.',
    affectedCount: '890 referrals affected', suggestedAction: 'Initiate MOU with private paediatric networks for weekly outreach clinics.'
  },
  {
    id: 'g2', severity: 'AMBER', title: 'AWW Training Compliance', icon: 'Users',
    description: '3 districts are below 70% AWW training compliance for new developmental tools. Screening quality issues detected in these zones.',
    affectedCount: 'Coverage in these districts: 42% avg.', suggestedAction: 'Deploy mobile training units for mandatory 2-day on-site workshops.'
  },
  {
    id: 'g3', severity: 'AMBER', title: 'Device Availability', icon: 'Settings',
    description: '8 mandal screening teams lack tablets for protocol execution. Manual data entry causing 14-day reporting lag.',
    affectedCount: '210 AWCs currently offline', suggestedAction: 'Emergency procurement of 250 verified rugged tablets.'
  },
  {
    id: 'g4', severity: 'GREY', title: 'Data Quality (Voice)', icon: 'FileText',
    description: 'Voice transcription accuracy below 85% in districts with heavy local dialect variations. Transcription noise affecting risk flags.',
    affectedCount: '15,000 records requiring manual audit', suggestedAction: 'Fine-tune Whisper model with local dialect dataset for better transcription.'
  }
];

export const NATIONAL_BENCHMARKS: BenchmarkItem[] = [
  { metric: 'Screening Coverage', stateValue: '67%', nationalTarget: '80%', status: 'Amber', statusText: 'Below target', gapPercentage: 13, historicalTrend: 'Better' },
  { metric: 'Early Identification Rate', stateValue: '10%', nationalTarget: '8-12%', status: 'Green', statusText: 'Within range', gapPercentage: 0, historicalTrend: 'Same' },
  { metric: 'Referral Completion', stateValue: '72%', nationalTarget: '85%', status: 'Red', statusText: 'Below target', gapPercentage: 13, historicalTrend: 'Better' },
  { metric: 'Time to First Intervention', stateValue: '11 days', nationalTarget: '<7 days', status: 'Red', statusText: 'Above target', gapPercentage: 40, historicalTrend: 'Worse' },
  { metric: 'AWW Compliance', stateValue: '82%', nationalTarget: '90%', status: 'Amber', statusText: 'Below target', gapPercentage: 8, historicalTrend: 'Better' },
];

export const AGE_PYRAMID_DATA = [
  { band: '0-6m', male: -12500, female: 11800 },
  { band: '6-12m', male: -18400, female: 17200 },
  { band: '1-2y', male: -32000, female: 31000 },
  { band: '2-3y', male: -45000, female: 43500 },
  { band: '3-4y', male: -38000, female: 37200 },
  { band: '4-5y', male: -28000, female: 27500 },
];

const MOCK_CHILDREN: ChildData[] = [
  { id: 'ch1', name: 'Aarav Reddy', age: '3y 2m', gender: 'Male', parentName: 'V. Reddy', riskStatus: 'Critical', lastScreened: '2 days ago', height: '92cm', weight: '10.5kg', muac: '11.2cm', flags: 3 },
  { id: 'ch2', name: 'Ishani Rao', age: '2y 8m', gender: 'Female', parentName: 'K. Rao', riskStatus: 'High', lastScreened: '5 days ago', height: '88cm', weight: '9.8kg', muac: '12.4cm', flags: 1 },
  { id: 'ch3', name: 'Vihaan Kumar', age: '4y 1m', gender: 'Male', parentName: 'P. Kumar', riskStatus: 'Low', lastScreened: '1 week ago', height: '102cm', weight: '14.2kg', muac: '14.8cm', flags: 0 },
  { id: 'ch4', name: 'Ananya S.', age: '1y 11m', gender: 'Female', parentName: 'S. Rao', riskStatus: 'Medium', lastScreened: '3 days ago', height: '76cm', weight: '8.4kg', muac: '13.1cm', flags: 0 },
];

const MOCK_AWCS: AWCData[] = [
  { id: 'awc1', name: 'Kondapur AWC 1', awwName: 'P. Aruna', children: 45, screened: 42, coverage: 93, riskHigh: 4, riskCrit: 2, score: 88, childrenList: MOCK_CHILDREN },
  { id: 'awc2', name: 'Kondapur AWC 2', awwName: 'S. Vani', children: 38, screened: 35, coverage: 92, riskHigh: 3, riskCrit: 1, score: 84 },
  { id: 'awc3', name: 'Old Town AWC', awwName: 'K. Saroja', children: 52, screened: 48, coverage: 92, riskHigh: 6, riskCrit: 3, score: 79 },
];

const MOCK_MANDALS: MandalData[] = [
  { id: 'm1', name: 'Kondapur Mandal', supervisor: 'T. Rama', awcs: 42, children: 1250, screened: 1180, coverage: 94, riskHigh: 85, riskCrit: 32, score: 91, awcList: MOCK_AWCS },
  { id: 'm2', name: 'Rural East', supervisor: 'V. Sastry', awcs: 38, children: 1100, screened: 980, coverage: 89, riskHigh: 72, riskCrit: 28, score: 85 },
  { id: 'm3', name: 'City Central', supervisor: 'M. Rao', awcs: 45, children: 1400, screened: 1260, coverage: 90, riskHigh: 94, riskCrit: 41, score: 82 },
];

const MOCK_CDPOS: CDPOData[] = [
  { id: 'c1', name: 'Guntur Urban', officer: 'M. Sridevi', mandals: 1, awcs: 145, children: 6200, screened: 5800, coverage: 94, riskHigh: 420, riskCrit: 180, escalations: 4, referrals: '45/140', score: 88, mandalList: MOCK_MANDALS },
  { id: 'c2', name: 'Guntur Rural', officer: 'K. Lakshmi', mandals: 8, awcs: 180, children: 7500, screened: 6900, coverage: 92, riskHigh: 510, riskCrit: 240, escalations: 6, referrals: '52/165', score: 85 },
  { id: 'c3', name: 'Tenali', officer: 'P. Aruna', mandals: 12, awcs: 165, children: 6800, screened: 6100, coverage: 90, riskHigh: 480, riskCrit: 210, escalations: 3, referrals: '38/120', score: 82 },
];

export const DISTRICT_MOCK_DATA: DistrictData[] = [
  {
    id: '1', name: 'Anantapur', dpo: 'V. Raman', cdpos: 5, mandals: 32, awcs: 640,
    children: 45000, screened: 27900, coverage: 62,
    risk: { low: 18000, med: 6500, high: 2400, crit: 1000 },
    escalations: 18, referralsActive: 420, referralsDone: 1200, avgWait: 12, facilityLoad: 78, performance: 65,
    trend: [58, 59, 60, 62, 62], rank: 8
  },
  {
    id: '2', name: 'Chittoor', dpo: 'M. Rao', cdpos: 6, mandals: 38, awcs: 710,
    children: 52000, screened: 39000, coverage: 75,
    risk: { low: 28000, med: 7200, high: 2800, crit: 1000 },
    escalations: 12, referralsActive: 310, referralsDone: 1450, avgWait: 6, facilityLoad: 62, performance: 78,
    trend: [70, 72, 73, 74, 75], rank: 5
  },
  {
    id: '3', name: 'East Godavari', dpo: 'K. Lakshmi', cdpos: 8, mandals: 45, awcs: 920,
    children: 75000, screened: 66000, coverage: 88,
    risk: { low: 52000, med: 10200, high: 2800, crit: 1000 },
    escalations: 8, referralsActive: 280, referralsDone: 2100, avgWait: 5, facilityLoad: 55, performance: 91,
    trend: [82, 84, 85, 87, 88], rank: 2
  },
  {
    id: '4', name: 'Guntur', dpo: 'Rajesh Kumar, IAS', cdpos: 5, mandals: 42, awcs: 850,
    children: 68000, screened: 62560, coverage: 92,
    risk: { low: 48000, med: 9800, high: 3200, crit: 1560 },
    escalations: 24, referralsActive: 680, referralsDone: 1890, avgWait: 16, facilityLoad: 94, performance: 72,
    trend: [88, 89, 90, 91, 92], rank: 4, cdpoList: MOCK_CDPOS
  },
  { id: '11', name: 'West Godavari', dpo: 'N. Murthy', cdpos: 7, mandals: 41, awcs: 840, children: 64000, screened: 55040, coverage: 86, risk: { low: 42000, med: 9800, high: 2400, crit: 840 }, escalations: 10, referralsActive: 310, referralsDone: 1980, avgWait: 6, facilityLoad: 68, performance: 81, trend: [80, 82, 84, 85, 86], rank: 11 },
  {
    id: '5', name: 'Krishna', dpo: 'P. Aruna', cdpos: 5, mandals: 30, awcs: 640,
    children: 58000, screened: 49300, coverage: 85,
    risk: { low: 40000, med: 6500, high: 2400, crit: 1000 },
    escalations: 14, referralsActive: 320, referralsDone: 1600, avgWait: 8, facilityLoad: 65, performance: 84,
    trend: [80, 82, 83, 84, 85], rank: 6
  },
  {
    id: '6', name: 'Kurnool', dpo: 'S. Ram', cdpos: 6, mandals: 54, awcs: 780,
    children: 66000, screened: 25080, coverage: 38,
    risk: { low: 15000, med: 6500, high: 3200, crit: 1400 },
    escalations: 28, referralsActive: 580, referralsDone: 890, avgWait: 18, facilityLoad: 92, performance: 54,
    trend: [42, 40, 39, 38, 38], rank: 13
  },
  {
    id: '7', name: 'Prakasam', dpo: 'M. Sastry', cdpos: 5, mandals: 38, awcs: 620,
    children: 54000, screened: 37800, coverage: 70,
    risk: { low: 25000, med: 8500, high: 2400, crit: 1000 },
    escalations: 16, referralsActive: 380, referralsDone: 1100, avgWait: 10, facilityLoad: 72, performance: 70,
    trend: [65, 66, 68, 69, 70], rank: 9
  },
  {
    id: '8', name: 'Srikakulam', dpo: 'K. Rao', cdpos: 4, mandals: 30, awcs: 560,
    children: 48000, screened: 39360, coverage: 82,
    risk: { low: 30000, med: 5500, high: 2400, crit: 800 },
    escalations: 12, referralsActive: 280, referralsDone: 1400, avgWait: 7, facilityLoad: 60, performance: 79,
    trend: [78, 79, 80, 81, 82], rank: 7
  },
  {
    id: '9', name: 'Visakhapatnam', dpo: 'V. Lakshmi', cdpos: 6, mandals: 42, awcs: 820,
    children: 72000, screened: 64800, coverage: 90,
    risk: { low: 50000, med: 9500, high: 3200, crit: 1200 },
    escalations: 20, referralsActive: 480, referralsDone: 2200, avgWait: 8, facilityLoad: 82, performance: 88,
    trend: [85, 87, 88, 89, 90], rank: 3
  },
  {
    id: '10', name: 'Vizianagaram', dpo: 'P. Murthy', cdpos: 4, mandals: 34, awcs: 610,
    children: 51000, screened: 41310, coverage: 81,
    risk: { low: 35000, med: 4500, high: 2400, crit: 900 },
    escalations: 10, referralsActive: 310, referralsDone: 1200, avgWait: 6, facilityLoad: 58, performance: 82,
    trend: [76, 78, 79, 80, 81], rank: 10
  },
  {
    id: '12', name: 'Kadapa', dpo: 'N. Varma', cdpos: 5, mandals: 51, awcs: 740,
    children: 62000, screened: 46500, coverage: 75,
    risk: { low: 38000, med: 6500, high: 2400, crit: 1100 },
    escalations: 18, referralsActive: 340, referralsDone: 1350, avgWait: 11, facilityLoad: 75, performance: 74,
    trend: [70, 72, 73, 74, 75], rank: 8
  },
  {
    id: '13', name: 'Nellore', dpo: 'J. Ram', cdpos: 5, mandals: 46, awcs: 680,
    children: 55000, screened: 45100, coverage: 82,
    risk: { low: 38000, med: 5500, high: 2400, crit: 900 },
    escalations: 14, referralsActive: 320, referralsDone: 1450, avgWait: 9, facilityLoad: 68, performance: 80,
    trend: [78, 79, 80, 81, 82], rank: 12
  },
];
