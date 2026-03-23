import { createClient } from '@/lib/supabase/client';
import type { StateKPIs, RiskDistribution, Alert } from '@/lib/commissioner/types-db';
import type { Escalation, EscalationTimelineEvent } from '@/lib/commissioner/types';

/**
 * Fetch executive dashboard KPIs.
 * Uses direct queries since kpi_cache may not be populated yet.
 */
export async function getStateKPIs(): Promise<StateKPIs> {
    const supabase = createClient();
    // Total active children
    const { count: totalChildren } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    // Screened children
    const { count: screened } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('last_screening_date', 'is', null);

    // High risk
    const { count: highRisk } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('current_risk_level', 'high');

    // Critical risk
    const { count: criticalRisk } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('current_risk_level', 'critical');

    // Active referrals
    const { count: activeReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .in('status', ['generated', 'sent', 'scheduled']);

    // Open flags
    const { count: openFlags } = await supabase
        .from('flags')
        .select('*', { count: 'exact', head: true })
        .not('status', 'eq', 'resolved');

    const total = totalChildren || 0;
    const scr = screened || 0;

    return {
        total_children: total,
        screened: scr,
        coverage_pct: total > 0 ? Math.round((scr / total) * 1000) / 10 : 0,
        high_risk: highRisk || 0,
        critical_risk: criticalRisk || 0,
        active_referrals: activeReferrals || 0,
        open_flags: openFlags || 0,
    };
}

/**
 * Fetch risk distribution using the existing RPC function.
 */
export async function getStateRiskDistribution(): Promise<RiskDistribution> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_risk_distribution', {
        p_level: 'state',
        p_entity_id: null,
    });

    if (error) {
        // Fallback: compute from children table
        console.warn('get_risk_distribution RPC failed, using fallback:', error.message);
        return getStateRiskDistributionFallback();
    }

    return data as RiskDistribution;
}

async function getStateRiskDistributionFallback(): Promise<RiskDistribution> {
    const supabase = createClient();
    const { count: total } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    const { count: low } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('current_risk_level', 'low');

    const { count: medium } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('current_risk_level', 'medium');

    const { count: high } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('current_risk_level', 'high');

    const { count: critical } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('current_risk_level', 'critical');

    const { count: unscreened } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('current_risk_level', null);

    return {
        total: total || 0,
        low: low || 0,
        medium: medium || 0,
        high: high || 0,
        critical: critical || 0,
        unscreened: unscreened || 0,
    };
}

/**
 * Fetch critical alerts for the commissioner.
 */
export async function getCommissionerAlerts(limit = 10): Promise<Alert[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.warn('Failed to fetch alerts:', error.message);
        return [];
    }

    return (data || []) as Alert[];
}

/**
 * Fetch escalation summary for the dashboard widget.
 */
export async function getEscalationSummary() {
    const supabase = createClient();
    const { count: total } = await supabase
        .from('flags')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'escalated');

    const { count: critical } = await supabase
        .from('flags')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'escalated')
        .eq('priority', 'urgent');

    const { count: stateLevel } = await supabase
        .from('flags')
        .select('*', { count: 'exact', head: true })
        .eq('escalated_to', 'state');

    return {
        total: total || 0,
        critical: critical || 0,
        stateLevel: stateLevel || 0,
    };
}

export interface TrendDataPoint {
    name: string;
    value: number;
    target: number;
}

/**
 * Fetch historical screening trend data.
 * Tries kpi_cache first, falls back to computing from assessments.
 */
export async function getHistoricalKPIs(): Promise<TrendDataPoint[]> {
    const supabase = createClient();

    // Try kpi_cache for state-level historical data
    const { data: cached, error: cacheError } = await supabase
        .from('kpi_cache')
        .select('period, metrics')
        .eq('level', 'state')
        .order('period', { ascending: true });

    if (!cacheError && cached && cached.length > 0) {
        return cached.map((row: { period: string; metrics: Record<string, number> }) => ({
            name: row.period,
            value: row.metrics?.screened || row.metrics?.total_screened || 0,
            target: row.metrics?.target || row.metrics?.total_children || 0,
        }));
    }

    // Fallback: compute monthly trend from assessments table
    const { data: assessments, error: assessError } = await supabase
        .from('assessments')
        .select('assessed_at')
        .order('assessed_at', { ascending: true });

    if (assessError || !assessments || assessments.length === 0) {
        return [];
    }

    // Group by month
    const monthMap: Record<string, number> = {};
    assessments.forEach((a: { assessed_at: string }) => {
        const d = new Date(a.assessed_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = (monthMap[key] || 0) + 1;
    });

    // Build cumulative trend
    const months = Object.keys(monthMap).sort();
    let cumulative = 0;
    return months.map(m => {
        cumulative += monthMap[m];
        const [year, month] = m.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
            name: `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`,
            value: cumulative,
            target: 0,
        };
    });
}

/**
 * Fetch all escalations that have been escalated to state level.
 * Returns data in the Escalation format for the EscalationView component.
 */
export async function getCommissionerEscalations(): Promise<Escalation[]> {
    const supabase = createClient();

    // Fetch all flags escalated to state level
    const { data: flags, error: flagsError } = await supabase
        .from('flags')
        .select('*')
        .eq('escalated_to', 'state')
        .order('created_at', { ascending: false });

    if (flagsError || !flags || flags.length === 0) {
        console.warn('No state-level escalations found:', flagsError?.message);
        return [];
    }

    // Get unique child IDs from flags
    const childIds = [...new Set(flags.map(f => f.child_id).filter(Boolean))];
    if (childIds.length === 0) return [];

    // Fetch children with their AWC info
    const { data: children } = await supabase
        .from('children')
        .select('id, name, dob, gender, awc_id')
        .in('id', childIds);

    if (!children || children.length === 0) return [];

    // Get unique AWC IDs
    const awcIds = [...new Set(children.map(c => c.awc_id).filter(Boolean))];

    // Fetch AWCs with mandal info
    const { data: awcs } = awcIds.length > 0
        ? await supabase
            .from('awcs')
            .select('id, name, mandal_id')
            .in('id', awcIds)
        : { data: [] };

    // Get unique mandal IDs
    const mandalIds = [...new Set((awcs || []).map(a => a.mandal_id).filter(Boolean))];

    // Fetch mandals with district info
    const { data: mandals } = mandalIds.length > 0
        ? await supabase
            .from('mandals')
            .select('id, name, district_id')
            .in('id', mandalIds)
        : { data: [] };

    // Get unique district IDs
    const districtIds = [...new Set((mandals || []).map(m => m.district_id).filter(Boolean))];

    // Fetch districts
    const { data: districts } = districtIds.length > 0
        ? await supabase
            .from('districts')
            .select('id, name')
            .in('id', districtIds)
        : { data: [] };

    // Build lookup maps for efficient access
    const districtMap: Record<string, string> = (districts || []).reduce(
        (acc, d) => { acc[d.id] = d.name; return acc; },
        {} as Record<string, string>
    );

    const mandalMap: Record<string, { name: string; districtId: string; districtName: string }> = (mandals || []).reduce(
        (acc, m) => {
            acc[m.id] = {
                name: m.name,
                districtId: m.district_id,
                districtName: districtMap[m.district_id] || 'Unknown District'
            };
            return acc;
        },
        {} as Record<string, { name: string; districtId: string; districtName: string }>
    );

    const awcMap: Record<string, { name: string; mandalId: string; mandalName: string; districtName: string }> = (awcs || []).reduce(
        (acc, a) => {
            const mandal = mandalMap[a.mandal_id];
            acc[a.id] = {
                name: a.name,
                mandalId: a.mandal_id,
                mandalName: mandal?.name || 'Unknown Mandal',
                districtName: mandal?.districtName || 'Unknown District'
            };
            return acc;
        },
        {} as Record<string, { name: string; mandalId: string; mandalName: string; districtName: string }>
    );

    const childMap: Record<string, { name: string; dob: string; gender: string; awcId: string; awc: typeof awcMap[string] | null }> = (children || []).reduce(
        (acc, c) => {
            acc[c.id] = {
                name: c.name,
                dob: c.dob,
                gender: c.gender,
                awcId: c.awc_id,
                awc: awcMap[c.awc_id] || null
            };
            return acc;
        },
        {} as Record<string, { name: string; dob: string; gender: string; awcId: string; awc: typeof awcMap[string] | null }>
    );

    const now = new Date();

    // Map flags to Escalation format
    const escalations: Escalation[] = flags.map((flag) => {
        const child = childMap[flag.child_id];
        const awcInfo = child?.awc;

        // Calculate days open
        const createdAt = flag.created_at ? new Date(flag.created_at) : now;
        const daysOpen = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // Map priority from flag to Escalation priority
        let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
        if (flag.priority === 'urgent' || flag.priority === 'critical' || flag.priority === 'emergency') {
            priority = 'Critical';
        } else if (flag.priority === 'high') {
            priority = 'High';
        } else if (flag.priority === 'low') {
            priority = 'Low';
        }

        // Build escalation path
        const path: string[] = [
            'AWW',
            awcInfo?.mandalName ? `Mandal Team (${awcInfo.mandalName})` : 'Mandal Team',
            'CDPO',
            awcInfo?.districtName ? `DPO ${awcInfo.districtName}` : 'DPO',
            'State Commissioner'
        ];

        // Build timeline from flag data
        const timeline: EscalationTimelineEvent[] = [];

        if (flag.created_at) {
            timeline.push({
                date: new Date(flag.created_at).toISOString().split('T')[0],
                event: flag.title || 'Flag Raised',
                role: 'AWW',
                note: flag.description || undefined
            });
        }

        if (flag.acknowledged_at) {
            timeline.push({
                date: new Date(flag.acknowledged_at).toISOString().split('T')[0],
                event: 'Acknowledged by CDPO',
                role: 'CDPO'
            });
        }

        // Add escalation to state event
        timeline.push({
            date: flag.updated_at
                ? new Date(flag.updated_at).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
            event: 'Escalated to State Command',
            role: 'DPO',
            note: 'Case escalated for state-level intervention'
        });

        // Map status
        let status: 'Active' | 'In Progress' | 'Resolved' = 'Active';
        if (flag.status === 'resolved') {
            status = 'Resolved';
        } else if (flag.status === 'acknowledged' || flag.status === 'in_progress') {
            status = 'In Progress';
        }

        return {
            id: `ESC-${flag.id.substring(0, 4).toUpperCase()}`,
            childName: child?.name || 'Unknown Child',
            childId: flag.child_id || 'Unknown',
            priority,
            daysOpen,
            location: {
                district: awcInfo?.districtName || 'Unknown District',
                cdpo: awcInfo?.mandalName || 'Unknown CDPO',
                mandal: awcInfo?.mandalName || 'Unknown Mandal',
                awc: awcInfo?.name || 'Unknown AWC'
            },
            path,
            districtNotes: flag.description || 'No district notes available.',
            timeline,
            status,
            outcome: flag.status === 'resolved' ? 'Case resolved' : undefined
        };
    });

    return escalations;
}
