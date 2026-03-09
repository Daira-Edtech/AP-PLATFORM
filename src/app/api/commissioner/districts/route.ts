import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { DistrictSummary } from '@/lib/commissioner/types-db'

export async function GET() {
    try {
        const supabaseServer = await createClient()
        const { data: { user } } = await supabaseServer.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = createAdminClient()

        const { data: profile } = await supabase.from('profiles').select('state_id').eq('id', user.id).single()
        const stateId = profile?.state_id

        if (!stateId) return NextResponse.json({ error: 'Commissioner not assigned to a state' }, { status: 403 })

        // Fetch all districts only for this state
        const { data: districts, error: distError } = await supabase
            .from('districts')
            .select('id, name, code, state_id')
            .eq('state_id', stateId)
            .order('name')

        if (distError || !districts) {
            return NextResponse.json({ error: distError?.message || 'Failed to fetch districts' }, { status: 500 })
        }

        const districtIds = districts.map(d => d.id)
        if (districtIds.length === 0) return NextResponse.json([])

        // Fetch mandals
        const { data: mandals } = await supabase.from('mandals').select('id, district_id').in('district_id', districtIds)
        const mandalIds = (mandals || []).map(m => m.id)

        // Fetch AWCs with capacity
        const { data: awcs } = await supabase.from('awcs').select('id, mandal_id, target_children').in('mandal_id', mandalIds.length ? mandalIds : [stateId]).eq('is_active', true)
        const awcIds = (awcs || []).map(a => a.id)

        // Fetch children
        const { data: children } = await supabase.from('children').select('id, awc_id, current_risk_level, last_screening_date').in('awc_id', awcIds.length ? awcIds : [stateId]).eq('is_active', true)
        const childIds = (children || []).map(c => c.id)

        // Fetch flags
        const { data: flags } = await supabase.from('flags').select('id, child_id, escalated_to, status').in('child_id', childIds.length ? childIds : [stateId])

        // Fetch referrals with timestamps
        const { data: referrals } = await supabase.from('referrals').select('id, child_id, status, created_at, completed_at').in('child_id', childIds.length ? childIds : [stateId])

        // Fetch DPO profiles
        const { data: dpoProfiles } = await supabase.from('profiles').select('name, district_id').eq('role', 'district_officer').in('district_id', districtIds).eq('is_active', true)

        // Fetch CDPO profiles
        const { data: cdpoProfiles } = await supabase.from('profiles').select('id, district_id').eq('role', 'cdpo').in('district_id', districtIds).eq('is_active', true)

        // Build DPO name map
        const dpoMap: Record<string, string> = {}
            ; (dpoProfiles || []).forEach((p) => { if (p.district_id) dpoMap[p.district_id] = p.name })

        // Build CDPO count map
        const cdpoCountMap: Record<string, number> = {}
            ; (cdpoProfiles || []).forEach((p) => {
                if (p.district_id) cdpoCountMap[p.district_id] = (cdpoCountMap[p.district_id] || 0) + 1
            })

        // Mandal → district mapping
        const mandalToDistrict: Record<string, string> = {}
        const districtMandals: Record<string, string[]> = {}
            ; (mandals || []).forEach((m) => {
                mandalToDistrict[m.id] = m.district_id
                if (!districtMandals[m.district_id]) districtMandals[m.district_id] = []
                districtMandals[m.district_id].push(m.id)
            })

        // AWC → district mapping + capacity
        const awcToDistrict: Record<string, string> = {}
        const districtAWCs: Record<string, string[]> = {}
        const districtCapacity: Record<string, number> = {}
            ; (awcs || []).forEach((a) => {
                const distId = mandalToDistrict[a.mandal_id]
                if (distId) {
                    awcToDistrict[a.id] = distId
                    if (!districtAWCs[distId]) districtAWCs[distId] = []
                    districtAWCs[distId].push(a.id)
                    districtCapacity[distId] = (districtCapacity[distId] || 0) + (a.target_children || 25)
                }
            })

        // Child aggregation
        const childToDistrict: Record<string, string> = {}
        const districtChildren: Record<string, { total: number; screened: number; riskLow: number; riskMedium: number; riskHigh: number; riskCritical: number }> = {}
            ; (children || []).forEach((c) => {
                const distId = awcToDistrict[c.awc_id]
                if (!distId) return
                childToDistrict[c.id] = distId
                if (!districtChildren[distId]) districtChildren[distId] = { total: 0, screened: 0, riskLow: 0, riskMedium: 0, riskHigh: 0, riskCritical: 0 }
                const agg = districtChildren[distId]
                agg.total++
                if (c.last_screening_date) agg.screened++
                if (c.current_risk_level === 'low') agg.riskLow++
                if (c.current_risk_level === 'medium') agg.riskMedium++
                if (c.current_risk_level === 'high') agg.riskHigh++
                if (c.current_risk_level === 'critical') agg.riskCritical++
            })

        // Escalations
        const districtEscalations: Record<string, number> = {}
            ; (flags || []).forEach((f) => {
                if (f.status === 'escalated') {
                    const distId = childToDistrict[f.child_id]
                    if (distId) districtEscalations[distId] = (districtEscalations[distId] || 0) + 1
                }
            })

        // Referrals + wait time
        const districtReferralsActive: Record<string, number> = {}
        const districtReferralsDone: Record<string, number> = {}
        const districtWaitDays: Record<string, number[]> = {}
            ; (referrals || []).forEach((r) => {
                const distId = childToDistrict[r.child_id]
                if (!distId) return
                if (['generated', 'sent', 'scheduled'].includes(r.status)) {
                    districtReferralsActive[distId] = (districtReferralsActive[distId] || 0) + 1
                } else if (r.status === 'completed') {
                    districtReferralsDone[distId] = (districtReferralsDone[distId] || 0) + 1
                    if (r.created_at && r.completed_at) {
                        const days = Math.round((new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / 86400000)
                        if (!districtWaitDays[distId]) districtWaitDays[distId] = []
                        districtWaitDays[distId].push(days)
                    }
                }
            })

        // Build results
        const results: DistrictSummary[] = districts.map((d) => {
            const agg = districtChildren[d.id] || { total: 0, screened: 0, riskLow: 0, riskMedium: 0, riskHigh: 0, riskCritical: 0 }
            const coveragePct = agg.total > 0 ? Math.round((agg.screened / agg.total) * 1000) / 10 : 0
            const capacity = districtCapacity[d.id] || 1
            const facilityLoad = Math.round((agg.total / capacity) * 100)
            const waitArr = districtWaitDays[d.id] || []
            const avgWait = waitArr.length > 0 ? Math.round(waitArr.reduce((a, b) => a + b, 0) / waitArr.length) : 0
            const refTotal = (districtReferralsActive[d.id] || 0) + (districtReferralsDone[d.id] || 0)
            const refRate = refTotal > 0 ? (districtReferralsDone[d.id] || 0) / refTotal : 1
            const escScore = agg.total > 0 ? Math.max(0, 100 - ((districtEscalations[d.id] || 0) / agg.total) * 1000) : 100
            const performance = Math.round(coveragePct * 0.4 + refRate * 100 * 0.3 + escScore * 0.3)

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
            }
        })

        return NextResponse.json(results)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
