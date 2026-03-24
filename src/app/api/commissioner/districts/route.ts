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

        // 1. Fetch districts
        const districtsRes = await supabase
            .from('districts')
            .select('id, name, code')
            .eq('state_id', stateId)
            .order('name')

        const districts = districtsRes.data || []
        if (districts.length === 0) return NextResponse.json([])

        const districtIds = districts.map(d => d.id)

        // 2. Fetch mandals for these districts
        const { data: mandals } = await supabase
            .from('mandals')
            .select('id, district_id')
            .in('district_id', districtIds)

        const mandalArr = mandals || []
        const mandalIds = mandalArr.map(m => m.id)

        if (mandalIds.length === 0) {
            // No mandals, return empty district data
            return NextResponse.json(districts.map(d => ({
                id: d.id, name: d.name, code: d.code,
                mandal_count: 0, awc_count: 0, total_children: 0, screened: 0, coverage_pct: 0,
                risk_low: 0, risk_medium: 0, risk_high: 0, risk_critical: 0,
                escalations: 0, referrals_active: 0, referrals_done: 0,
                dpo_name: '—', cdpo_count: 0, avg_wait: 0, facility_load: 0, performance: 0, trend: []
            })))
        }

        // Mandal -> District Map
        const m2d: Record<string, string> = {}
        mandalArr.forEach(m => m2d[m.id] = m.district_id)

        // 3. Fetch AWCs and profiles in parallel
        const [awcsRes, dpoRes, cdpoRes] = await Promise.all([
            supabase.from('awcs').select('id, mandal_id, target_children').in('mandal_id', mandalIds).eq('is_active', true),
            supabase.from('profiles').select('name, district_id').eq('role', 'district_officer').in('district_id', districtIds).eq('is_active', true),
            supabase.from('profiles').select('district_id').eq('role', 'cdpo').in('district_id', districtIds).eq('is_active', true)
        ])

        const awcs = awcsRes.data || []
        const awcIds = awcs.map(a => a.id)
        const dpoProfiles = dpoRes.data || []
        const cdpoProfiles = cdpoRes.data || []

        if (awcIds.length === 0) {
            // No AWCs, return district data with mandal counts only
            return NextResponse.json(districts.map(d => ({
                id: d.id, name: d.name, code: d.code,
                mandal_count: mandalArr.filter(m => m.district_id === d.id).length,
                awc_count: 0, total_children: 0, screened: 0, coverage_pct: 0,
                risk_low: 0, risk_medium: 0, risk_high: 0, risk_critical: 0,
                escalations: 0, referrals_active: 0, referrals_done: 0,
                dpo_name: dpoProfiles.find(p => p.district_id === d.id)?.name || '—',
                cdpo_count: cdpoProfiles.filter(p => p.district_id === d.id).length,
                avg_wait: 0, facility_load: 0, performance: 0, trend: []
            })))
        }

        // AWC -> District Map and capacity calculation
        const a2d: Record<string, string> = {}
        const distCapacity: Record<string, number> = {}
        const distAwcCount: Record<string, number> = {}
        awcs.forEach(a => {
            const dId = m2d[a.mandal_id]
            if (dId) {
                a2d[a.id] = dId
                distCapacity[dId] = (distCapacity[dId] || 0) + (a.target_children || 25)
                distAwcCount[dId] = (distAwcCount[dId] || 0) + 1
            }
        })

        // 4. Fetch children ONLY for these AWCs (this is the key optimization)
        const { data: children } = await supabase
            .from('children')
            .select('id, awc_id, current_risk_level, last_screening_date')
            .in('awc_id', awcIds)
            .eq('is_active', true)

        const childrenArr = children || []
        const childIds = childrenArr.map(c => c.id)

        // Child aggregation
        const child2dist: Record<string, string> = {}
        const distChildren: Record<string, any> = {}
        childrenArr.forEach(c => {
            const dId = a2d[c.awc_id]
            if (!dId) return
            child2dist[c.id] = dId
            if (!distChildren[dId]) distChildren[dId] = { total: 0, screened: 0, riskLow: 0, riskMedium: 0, riskHigh: 0, riskCritical: 0 }
            const agg = distChildren[dId]
            agg.total++
            if (c.last_screening_date) agg.screened++
            if (c.current_risk_level === 'low') agg.riskLow++
            else if (c.current_risk_level === 'medium') agg.riskMedium++
            else if (c.current_risk_level === 'high') agg.riskHigh++
            else if (c.current_risk_level === 'critical') agg.riskCritical++
        })

        // 5. Fetch flags and referrals ONLY for these children (another key optimization)
        let flagData: any[] = []
        let refData: any[] = []

        if (childIds.length > 0) {
            const [flagRes, refRes] = await Promise.all([
                supabase.from('flags').select('status, child_id').in('child_id', childIds).eq('status', 'escalated'),
                supabase.from('referrals').select('status, child_id, created_at, completed_at').in('child_id', childIds)
            ])
            flagData = flagRes.data || []
            refData = refRes.data || []
        }

        // Flag aggregation
        const distEsc: Record<string, number> = {}
        flagData.forEach((f: any) => {
            const dId = child2dist[f.child_id]
            if (dId) distEsc[dId] = (distEsc[dId] || 0) + 1
        })

        // Referral aggregation
        const distRefActive: Record<string, number> = {}
        const distRefDone: Record<string, number> = {}
        const distWait: Record<string, number[]> = {}
        refData.forEach((r: any) => {
            const dId = child2dist[r.child_id]
            if (!dId) return
            if (['generated', 'sent', 'scheduled'].includes(r.status)) distRefActive[dId] = (distRefActive[dId] || 0) + 1
            else if (r.status === 'completed') {
                distRefDone[dId] = (distRefDone[dId] || 0) + 1
                if (r.created_at && r.completed_at) {
                    const days = Math.round((new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / 86400000)
                    if (!distWait[dId]) distWait[dId] = []
                    distWait[dId].push(days)
                }
            }
        })

        // 6. Final result mapping
        const results: DistrictSummary[] = districts.map(d => {
            const agg = distChildren[d.id] || { total: 0, screened: 0, riskLow: 0, riskMedium: 0, riskHigh: 0, riskCritical: 0 }
            const waitArr = distWait[d.id] || []
            const avgWait = waitArr.length > 0 ? Math.round(waitArr.reduce((a, b) => a + b, 0) / waitArr.length) : 0

            const coveragePct = agg.total > 0 ? Math.round((agg.screened / agg.total) * 1000) / 10 : 0
            const refTotal = (distRefActive[d.id] || 0) + (distRefDone[d.id] || 0)
            const refRate = refTotal > 0 ? (distRefDone[d.id] || 0) / refTotal : 1
            const escScore = agg.total > 0 ? Math.max(0, 100 - ((distEsc[d.id] || 0) / agg.total) * 1000) : 100

            return {
                id: d.id,
                name: d.name,
                code: d.code,
                mandal_count: mandalArr.filter(m => m.district_id === d.id).length,
                awc_count: distAwcCount[d.id] || 0,
                total_children: agg.total,
                screened: agg.screened,
                coverage_pct: coveragePct,
                risk_low: agg.riskLow,
                risk_medium: agg.riskMedium,
                risk_high: agg.riskHigh,
                risk_critical: agg.riskCritical,
                escalations: distEsc[d.id] || 0,
                referrals_active: distRefActive[d.id] || 0,
                referrals_done: distRefDone[d.id] || 0,
                dpo_name: dpoProfiles.find(p => p.district_id === d.id)?.name || '—',
                cdpo_count: cdpoProfiles.filter(p => p.district_id === d.id).length,
                avg_wait: avgWait,
                facility_load: Math.min(Math.round((agg.total / (distCapacity[d.id] || 1)) * 100), 100),
                performance: Math.round(coveragePct * 0.4 + refRate * 100 * 0.3 + escScore * 0.3),
                trend: []
            }
        })

        return NextResponse.json(results)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
