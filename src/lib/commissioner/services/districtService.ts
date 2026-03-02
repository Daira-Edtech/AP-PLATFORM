import { createClient } from '@/lib/supabase/client';
import type { DistrictSummary } from '@/lib/commissioner/types-db';

/**
 * Fetch all districts with aggregated metrics for the comparison view and dashboard rankings.
 */
export async function getAllDistrictsSummary(): Promise<DistrictSummary[]> {
    const supabase = createClient();
    // Fetch all districts
    const { data: districts, error: distError } = await supabase
        .from('districts')
        .select('id, name, code')
        .order('name');

    if (distError || !districts) {
        console.error('Failed to fetch districts:', distError?.message);
        return [];
    }

    // Fetch mandals for mandal counts
    const { data: mandals } = await supabase
        .from('mandals')
        .select('id, district_id');

    // Fetch AWCs for AWC counts + capacity
    const { data: awcs } = await supabase
        .from('awcs')
        .select('id, mandal_id, target_children')
        .eq('is_active', true);

    // Fetch children with risk levels
    const { data: children } = await supabase
        .from('children')
        .select('id, awc_id, current_risk_level, last_screening_date')
        .eq('is_active', true);

    // Fetch active escalations (flags escalated to state)
    const { data: flags } = await supabase
        .from('flags')
        .select('id, child_id, escalated_to, status');

    // Fetch referrals with timestamps for avg wait computation
    const { data: referrals } = await supabase
        .from('referrals')
        .select('id, child_id, status, created_at, completed_at');

    // Fetch DPO profiles (district officers)
    const { data: dpoProfiles } = await supabase
        .from('profiles')
        .select('name, district_id')
        .eq('role', 'district_officer')
        .eq('is_active', true);

    // Fetch CDPO profiles for counts
    const { data: cdpoProfiles } = await supabase
        .from('profiles')
        .select('id, district_id')
        .eq('role', 'cdpo')
        .eq('is_active', true);

    // Build DPO name map: district_id → name
    const dpoMap: Record<string, string> = {};
    (dpoProfiles || []).forEach((p) => {
        if (p.district_id) dpoMap[p.district_id] = p.name;
    });

    // Build CDPO count map: district_id → count
    const cdpoCountMap: Record<string, number> = {};
    (cdpoProfiles || []).forEach((p) => {
        if (p.district_id) cdpoCountMap[p.district_id] = (cdpoCountMap[p.district_id] || 0) + 1;
    });

    // Build mandal → district mapping
    const mandalToDistrict: Record<string, string> = {};
    const districtMandals: Record<string, string[]> = {};
    (mandals || []).forEach((m) => {
        mandalToDistrict[m.id] = m.district_id;
        if (!districtMandals[m.district_id]) districtMandals[m.district_id] = [];
        districtMandals[m.district_id].push(m.id);
    });

    // Build AWC → district mapping via mandal + track capacity
    const awcToDistrict: Record<string, string> = {};
    const districtAWCs: Record<string, string[]> = {};
    const districtCapacity: Record<string, number> = {};
    (awcs || []).forEach((a) => {
        const distId = mandalToDistrict[a.mandal_id];
        if (distId) {
            awcToDistrict[a.id] = distId;
            if (!districtAWCs[distId]) districtAWCs[distId] = [];
            districtAWCs[distId].push(a.id);
            districtCapacity[distId] = (districtCapacity[distId] || 0) + (a.target_children || 25);
        }
    });

    // Build child → district mapping and aggregate
    const childToDistrict: Record<string, string> = {};
    interface ChildAgg {
        total: number;
        screened: number;
        riskLow: number;
        riskMedium: number;
        riskHigh: number;
        riskCritical: number;
    }
    const districtChildren: Record<string, ChildAgg> = {};

    (children || []).forEach((c) => {
        const distId = awcToDistrict[c.awc_id];
        if (!distId) return;
        childToDistrict[c.id] = distId;

        if (!districtChildren[distId]) {
            districtChildren[distId] = { total: 0, screened: 0, riskLow: 0, riskMedium: 0, riskHigh: 0, riskCritical: 0 };
        }
        const agg = districtChildren[distId];
        agg.total++;
        if (c.last_screening_date) agg.screened++;
        if (c.current_risk_level === 'low') agg.riskLow++;
        if (c.current_risk_level === 'medium') agg.riskMedium++;
        if (c.current_risk_level === 'high') agg.riskHigh++;
        if (c.current_risk_level === 'critical') agg.riskCritical++;
    });

    // Aggregate escalations by district
    const districtEscalations: Record<string, number> = {};
    (flags || []).forEach((f) => {
        if (f.status === 'escalated') {
            const distId = childToDistrict[f.child_id];
            if (distId) {
                districtEscalations[distId] = (districtEscalations[distId] || 0) + 1;
            }
        }
    });

    // Aggregate referrals by district + compute avg wait (days)
    const districtReferralsActive: Record<string, number> = {};
    const districtReferralsDone: Record<string, number> = {};
    const districtWaitDays: Record<string, number[]> = {};
    (referrals || []).forEach((r) => {
        const distId = childToDistrict[r.child_id];
        if (!distId) return;
        if (['generated', 'sent', 'scheduled'].includes(r.status)) {
            districtReferralsActive[distId] = (districtReferralsActive[distId] || 0) + 1;
        } else if (r.status === 'completed') {
            districtReferralsDone[distId] = (districtReferralsDone[distId] || 0) + 1;
            // Compute wait time
            if (r.created_at && r.completed_at) {
                const days = Math.round((new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / 86400000);
                if (!districtWaitDays[distId]) districtWaitDays[distId] = [];
                districtWaitDays[distId].push(days);
            }
        }
    });

    // Build result
    return districts.map((d) => {
        const agg = districtChildren[d.id] || { total: 0, screened: 0, riskLow: 0, riskMedium: 0, riskHigh: 0, riskCritical: 0 };
        const coveragePct = agg.total > 0 ? Math.round((agg.screened / agg.total) * 1000) / 10 : 0;
        const capacity = districtCapacity[d.id] || 1;
        const facilityLoad = Math.round((agg.total / capacity) * 100);
        const waitArr = districtWaitDays[d.id] || [];
        const avgWait = waitArr.length > 0 ? Math.round(waitArr.reduce((a, b) => a + b, 0) / waitArr.length) : 0;

        // Performance: composite of coverage (40%), referral completion (30%), low escalation (30%)
        const refTotal = (districtReferralsActive[d.id] || 0) + (districtReferralsDone[d.id] || 0);
        const refRate = refTotal > 0 ? (districtReferralsDone[d.id] || 0) / refTotal : 1;
        const escScore = agg.total > 0 ? Math.max(0, 100 - ((districtEscalations[d.id] || 0) / agg.total) * 1000) : 100;
        const performance = Math.round(coveragePct * 0.4 + refRate * 100 * 0.3 + escScore * 0.3);

        return {
            id: d.id,
            name: d.name,
            code: d.code,
            mandal_count: (districtMandals[d.id] || []).length,
            awc_count: (districtAWCs[d.id] || []).length,
            total_children: agg.total,
            screened: agg.screened,
            coverage_pct: coveragePct,
            risk_low: agg.riskLow,
            risk_medium: agg.riskMedium,
            risk_high: agg.riskHigh,
            risk_critical: agg.riskCritical,
            escalations: districtEscalations[d.id] || 0,
            referrals_active: districtReferralsActive[d.id] || 0,
            referrals_done: districtReferralsDone[d.id] || 0,
            dpo_name: dpoMap[d.id] || '—',
            cdpo_count: cdpoCountMap[d.id] || 0,
            avg_wait: avgWait,
            facility_load: Math.min(facilityLoad, 100),
            performance: Math.min(performance, 100),
            trend: [],
        };
    });
}

/**
 * Fetch a single district detail.
 */
export async function getDistrictDetail(districtId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('districts')
        .select('*')
        .eq('id', districtId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * Fetch CDPOs (profiles with role='cdpo') for a district.
 */
export async function getCDPOsForDistrict(districtId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone')
        .eq('role', 'cdpo')
        .eq('district_id', districtId)
        .eq('is_active', true);

    if (error) {
        console.error('Failed to fetch CDPOs:', error.message);
        return [];
    }

    return data || [];
}

/**
 * Fetch mandals for a district.
 */
export async function getMandalsForDistrict(districtId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('mandals')
        .select('id, name, code')
        .eq('district_id', districtId)
        .order('name');

    if (error) {
        console.error('Failed to fetch mandals:', error.message);
        return [];
    }

    return data || [];
}

/**
 * Fetch AWCs for a mandal.
 */
export async function getAWCsForMandal(mandalId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('awcs')
        .select('id, name, code, village_name, latitude, longitude, target_children, is_active')
        .eq('mandal_id', mandalId)
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Failed to fetch AWCs:', error.message);
        return [];
    }

    return data || [];
}

/**
 * Fetch children for an AWC.
 */
export async function getChildrenForAWC(awcId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('children')
        .select('id, name, dob, gender, mother_name, current_risk_level, last_screening_date')
        .eq('awc_id', awcId)
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Failed to fetch children:', error.message);
        return [];
    }

    return data || [];
}
