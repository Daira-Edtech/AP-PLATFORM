import { createClient } from '@/lib/supabase/client';
import type { StateKPIs, RiskDistribution, Alert } from '@/lib/commissioner/types-db';

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
