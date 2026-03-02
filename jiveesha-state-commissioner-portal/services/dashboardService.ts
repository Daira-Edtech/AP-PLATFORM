import { supabase } from '../lib/supabase';
import type { StateKPIs, RiskDistribution, Alert } from '../types/database';

/**
 * Fetch executive dashboard KPIs.
 * Uses direct queries since kpi_cache may not be populated yet.
 */
export async function getStateKPIs(): Promise<StateKPIs> {
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
