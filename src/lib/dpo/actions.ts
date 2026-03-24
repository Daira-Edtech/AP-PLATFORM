'use server'

import { createClient } from '@/lib/supabase/server'
import { CDPOPerformance, CDPODetailStats, DpoDashboardStats, MandalPerformance, RiskAnalysisStats, DpoScreeningStats, ChildDetailData, DpoEscalationsData, Escalation, KPI, DpoWorkforceData } from './types'

export async function getDpoCdposPerformance(): Promise<CDPOPerformance[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // 1. Get DPO's profile context
    const { data: profile } = await supabase
        .from('profiles')
        .select('district_id, role, state_id')
        .eq('id', user.id)
        .single()

    let districtId = profile?.district_id

    // Fallback: If superuser or no district, try to find a district that has data
    if (!districtId) {
        const { data: dists } = await supabase.from('districts').select('id').limit(5)
        if (dists) {
            for (const d of dists) {
                const { count } = await supabase.from('mandals').select('*', { count: 'exact', head: true }).eq('district_id', d.id)
                if (count && count > 0) {
                    districtId = d.id;
                    break;
                }
            }
            if (!districtId && dists.length > 0) districtId = dists[0].id
        }
    }

    if (!districtId) return []

    // 2. Fetch Geographic Context (Safe query - awcs don't have district_id in current DB)
    const { data: mandals } = await supabase.from('mandals').select('id, name').eq('district_id', districtId)
    const mandalsArr = mandals || []
    const mandalIds = mandalsArr.map(m => m.id)

    let allAwcs: any[] = []
    if (mandalIds.length > 0) {
        const { data: awcs } = await supabase.from('awcs').select('id, name, mandal_id, sector_id, panchayat_id').in('mandal_id', mandalIds)
        allAwcs = awcs || []
    }

    // 3. Fetch CDPOs
    // We look for CDPOs assigned to this district OR to any mandal within it
    const { data: cdpoProfiles } = await supabase
        .from('profiles')
        .select('id, name, district_id, mandal_id, sector_id, panchayat_id, awc_id')
        .eq('role', 'cdpo')
        .or(`district_id.eq.${districtId}${mandalIds.length ? `,mandal_id.in.(${mandalIds.join(',')})` : ''}`)

    // 4. Merge CDPOs and Mandals
    const rows: any[] = []
    const assignedMandalIds = new Set()

    if (cdpoProfiles) {
        cdpoProfiles.forEach(cdpo => {
            rows.push({
                type: 'cdpo',
                entityId: cdpo.id,
                name: cdpo.name,
                assignment: cdpo
            })
            if (cdpo.mandal_id) assignedMandalIds.add(cdpo.mandal_id)
        })
    }

    mandalsArr.forEach(m => {
        if (!assignedMandalIds.has(m.id)) {
            rows.push({
                type: 'mandal',
                entityId: m.id,
                name: m.name,
                assignment: { mandal_id: m.id }
            })
        }
    })

    if (rows.length === 0) return []

    // 5. Aggregate Metrics
    const { data: children } = await supabase
        .from('children')
        .select('id, awc_id, current_risk_level, last_screening_date')
        .in('awc_id', allAwcs.map(a => a.id))
        .eq('is_active', true)

    const childIds = (children || []).map(c => c.id)
    const [flags, referrals] = await Promise.all([
        childIds.length ? supabase.from('flags').select('child_id, status').in('child_id', childIds).in('status', ['raised', 'acknowledged', 'in_progress']) : Promise.resolve({ data: [] }),
        childIds.length ? supabase.from('referrals').select('child_id, status').in('child_id', childIds) : Promise.resolve({ data: [] })
    ])

    const childrenMap = (children || []).reduce((acc: any, c) => {
        if (!acc[c.awc_id]) acc[c.awc_id] = []
        acc[c.awc_id].push(c)
        return acc
    }, {})

    const flagsCountByChild = (flags.data || []).reduce((acc: any, f) => {
        acc[f.child_id] = (acc[f.child_id] || 0) + 1
        return acc
    }, {})

    const refByChild = (referrals.data || []).reduce((acc: any, r) => {
        if (!acc[r.child_id]) acc[r.child_id] = { pending: 0, done: 0 }
        if (['created', 'informed', 'scheduled'].includes(r.status)) acc[r.child_id].pending++
        else if (['visited', 'results_received', 'completed'].includes(r.status)) acc[r.child_id].done++
        return acc
    }, {})

    const getAwcsForAssignment = (as: any) => {
        if (as.awc_id) return allAwcs.filter(a => a.id === as.awc_id)
        if (as.panchayat_id) return allAwcs.filter(a => a.panchayat_id === as.panchayat_id)
        if (as.sector_id) return allAwcs.filter(a => a.sector_id === as.sector_id)
        if (as.mandal_id) return allAwcs.filter(a => a.mandal_id === as.mandal_id)
        if (as.district_id) return allAwcs
        return []
    }

    return rows.map((row, idx) => {
        const targetAwcs = getAwcsForAssignment(row.assignment)
        const targetAwcIds = targetAwcs.map(a => a.id)

        let total = 0, screened = 0, low = 0, med = 0, high = 0, crit = 0, esc = 0, refP = 0, refD = 0

        targetAwcIds.forEach(aId => {
            const kids = childrenMap[aId] || []
            kids.forEach((k: any) => {
                total++
                if (k.last_screening_date) screened++
                const risk = (k.current_risk_level || 'low').toLowerCase()
                if (risk === 'low') low++
                else if (risk === 'medium') med++
                else if (risk === 'high') high++
                else if (risk === 'critical') crit++

                esc += (flagsCountByChild[k.id] || 0)
                if (refByChild[k.id]) {
                    refP += refByChild[k.id].pending
                    refD += refByChild[k.id].done
                }
            })
        })

        const coverage = total ? Math.round((screened / total) * 100) : 0
        const performanceScore = Math.max(0, Math.min(100, Math.round(coverage * 0.8 - ((high + crit) / (total || 1)) * 50)))

        return {
            id: row.entityId,
            name: row.type === 'cdpo' ? `CDPO: ${row.name}` : `Mandal: ${row.name}`,
            officer: row.type === 'cdpo' ? row.name : 'Vacant',
            mandals: 1,
            awcs: targetAwcs.length,
            children: total,
            screened,
            coverage,
            lowRisk: low,
            medRisk: med,
            highRisk: high,
            critRisk: crit,
            escalations: esc,
            referralsPending: refP,
            referralsDone: refD,
            avgResolution: 4.5,
            performanceScore
        }
    })
}

export async function getDpoDashboardStats(): Promise<DpoDashboardStats> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase.from('profiles').select('district_id').eq('id', user.id).single()
    let districtId = profile?.district_id
    if (!districtId) {
        const { data: dists } = await supabase.from('districts').select('id').limit(5)
        if (dists) {
            for (const d of dists) {
                const { count } = await supabase.from('mandals').select('*', { count: 'exact', head: true }).eq('district_id', d.id)
                if (count && count > 0) {
                    districtId = d.id;
                    break;
                }
            }
            if (!districtId && dists.length > 0) districtId = dists[0].id
        }
    }

    if (!districtId) {
        return {
            totalChildren: 0, screenedChildren: 0, coverageRate: 0, highRiskCount: 0, criticalRiskCount: 0,
            escalationsCount: 0, activeReferralsCount: 0, riskDistribution: [], screeningTrend: [], regionalPerformance: []
        }
    }

    const { data: mandals } = await supabase.from('mandals').select('id, name').eq('district_id', districtId)
    const mandalIds = mandals?.map(m => m.id) || []
    if (mandalIds.length === 0) return { totalChildren: 0, screenedChildren: 0, coverageRate: 0, highRiskCount: 0, criticalRiskCount: 0, escalationsCount: 0, activeReferralsCount: 0, riskDistribution: [], screeningTrend: [], regionalPerformance: [] }

    const { data: awcs } = await supabase.from('awcs').select('id, mandal_id').in('mandal_id', mandalIds)
    const awcIds = awcs?.map(a => a.id) || []
    if (awcIds.length === 0) return { totalChildren: 0, screenedChildren: 0, coverageRate: 0, highRiskCount: 0, criticalRiskCount: 0, escalationsCount: 0, activeReferralsCount: 0, riskDistribution: [], screeningTrend: [], regionalPerformance: [] }

    const { data: children } = await supabase.from('children').select('id, current_risk_level, last_screening_date, awc_id').in('awc_id', awcIds).eq('is_active', true)
    const totalChildren = children?.length || 0
    const screenedChildren = children?.filter(c => c.last_screening_date).length || 0
    const coverageRate = totalChildren ? Math.round((screenedChildren / totalChildren) * 100) : 0

    const risks = (children || []).reduce((acc: any, curr) => {
        const level = (curr.current_risk_level || 'low').toLowerCase()
        acc[level] = (acc[level] || 0) + 1
        return acc
    }, { low: 0, medium: 0, high: 0, critical: 0 })

    const riskDistribution = [
        { name: 'Low', value: risks.low, color: '#22c55e' },
        { name: 'Med', value: risks.medium, color: '#eab308' },
        { name: 'High', value: risks.high, color: '#f97316' },
        { name: 'Critical', value: risks.critical, color: '#ef4444' },
    ]

    const childIds = (children || []).map(c => c.id)
    const [flagsCount, referralsCount] = await Promise.all([
        supabase.from('flags').select('*', { count: 'exact', head: true }).in('child_id', childIds).in('status', ['raised', 'acknowledged', 'in_progress']),
        supabase.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds).in('status', ['created', 'informed', 'scheduled'])
    ])

    const awcToMandalId = (awcs || []).reduce((acc: any, curr) => { acc[curr.id] = curr.mandal_id; return acc }, {})
    const metricsByMandal = mandals!.reduce((acc: any, m) => { acc[m.id] = { t: 0, s: 0, name: m.name }; return acc }, {})
    children?.forEach(c => {
        const mId = awcToMandalId[c.awc_id]
        if (mId && metricsByMandal[mId]) {
            metricsByMandal[mId].t++
            if (c.last_screening_date) metricsByMandal[mId].s++
        }
    })

    const regionalPerformance = Object.values(metricsByMandal).map((m: any) => {
        const cov = m.t ? Math.round((m.s / m.t) * 100) : 0
        return { name: m.name, coverage: cov, color: cov < 50 ? '#ef4444' : cov < 80 ? '#222222' : '#000000', path: '' }
    }).sort((a, b) => b.coverage - a.coverage).slice(0, 5)

    const screeningTrend = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({ name: m, val: 0 }))
    children?.forEach(c => {
        if (c.last_screening_date) {
            const date = new Date(c.last_screening_date)
            if (date.getFullYear() === new Date().getFullYear()) screeningTrend[date.getMonth()].val++
        }
    })

    return { totalChildren, screenedChildren, coverageRate, highRiskCount: risks.high, criticalRiskCount: risks.critical, escalationsCount: flagsCount.count || 0, activeReferralsCount: referralsCount.count || 0, riskDistribution, screeningTrend, regionalPerformance }
}

export async function getDpoRiskAnalysisData(): Promise<RiskAnalysisStats> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase.from('profiles').select('district_id').eq('id', user.id).single()
    let districtId = profile?.district_id
    if (!districtId) {
        const { data: dists } = await supabase.from('districts').select('id').limit(5)
        if (dists) {
            for (const d of dists) {
                const { count } = await supabase.from('mandals').select('*', { count: 'exact', head: true }).eq('district_id', d.id)
                if (count && count > 0) {
                    districtId = d.id;
                    break;
                }
            }
            if (!districtId && dists.length > 0) districtId = dists[0].id
        }
    }

    const emptyState: RiskAnalysisStats = { treemapData: [], demographicData: [], riskHistory: [], domainHeatmap: [], highRiskChildren: [] }
    if (!districtId) return emptyState

    const { data: mandals } = await supabase.from('mandals').select('id, name').eq('district_id', districtId)
    const mandalIds = mandals?.map(m => m.id) || []
    if (mandalIds.length === 0) return emptyState

    const { data: awcs } = await supabase.from('awcs').select('id, mandal_id, sector_id, panchayat_id').in('mandal_id', mandalIds).limit(10000)
    const awcIds = awcs?.map(a => a.id) || []
    if (awcIds.length === 0) return emptyState

    const { data: children, error: dbErr } = await supabase.from('children')
        .select(`id, name, dob, current_risk_level, last_screening_date, awc_id, awcs (name, mandals (name))`)
        .in('awc_id', awcIds)
        .eq('is_active', true)
        .limit(30000)
        
    if (!children || children.length === 0) return emptyState

    const childIds = children.map(c => c.id)
    const { data: sessions } = childIds.length
        ? await supabase.from('questionnaire_sessions').select('id, child_id, domain_scores').in('child_id', childIds).eq('status', 'complete')
        : { data: [] }
    const sessionsArr = sessions || []

    const awcToMandalId = (awcs || []).reduce((acc: any, curr) => { acc[curr.id] = curr.mandal_id; return acc }, {})
    const metricsByMandal = mandals!.reduce((acc: any, m) => { acc[m.id] = { total: 0, screened: 0, name: m.name }; return acc }, {})
    children.forEach(c => {
        const mId = awcToMandalId[c.awc_id]
        if (mId && metricsByMandal[mId]) {
            metricsByMandal[mId].total++
            if (c.last_screening_date) metricsByMandal[mId].screened++
        }
    })

    const treemapData = Object.entries(metricsByMandal).map(([id, m]: [string, any]) => ({ id, name: m.name, size: m.total, coverage: m.total ? Math.round((m.screened / m.total) * 100) : 0, color: '' })).filter(d => d.size > 0)

    const now = new Date()
    const ageMetrics = { '0-1Y': { s: 0, t: 0 }, '1-2Y': { s: 0, t: 0 }, '2-3Y': { s: 0, t: 0 }, '3-4Y': { s: 0, t: 0 }, '4-5Y': { s: 0, t: 0 }, '5Y+': { s: 0, t: 0 } }
    children.forEach(c => {
        const dateOfBirth = new Date(c.dob)
        const years = now.getFullYear() - dateOfBirth.getFullYear()
        const key = years <= 0 ? '0-1Y' : years >= 5 ? '5Y+' : `${years}-${years + 1}Y`
        if (ageMetrics[key as keyof typeof ageMetrics]) {
            ageMetrics[key as keyof typeof ageMetrics].t++
            if (c.last_screening_date) ageMetrics[key as keyof typeof ageMetrics].s++
        }
    })
    const demographicData = Object.entries(ageMetrics).map(([age, m]) => ({ age, screened: m.s, total: m.t }))

    const highRiskChildren = children.filter(c => ['high', 'critical'].includes((c.current_risk_level || '').toLowerCase())).sort((a, b) => new Date(b.last_screening_date || 0).getTime() - new Date(a.last_screening_date || 0).getTime()).slice(0, 10).map(c => ({ id: c.id, shortId: c.id.substring(0, 8).toUpperCase(), name: c.name, age: `${now.getFullYear() - new Date(c.dob).getFullYear()}y`, awc: (c.awcs as any)?.name || 'N/A', mandal: (c.awcs as any)?.mandals?.name || 'N/A', cdpo: 'Regional', risk: c.current_risk_level || 'Low', score: 88, conditions: 'Monitored State', status: c.last_screening_date ? 'Screened' : 'Pending' }))

    const risks = children.reduce((acc: any, c) => {
        const l = (c.current_risk_level || 'low').toLowerCase()
        acc[l] = (acc[l] || 0) + 1
        return acc
    }, { low: 0, medium: 0, high: 0, critical: 0 })
    const riskHistory = [{ name: 'Current', Low: risks.low, Med: risks.medium, High: risks.high, Crit: risks.critical }]

    // Dynamic Domain Heatmap
    const domains = ['GM', 'FM', 'LC', 'COG', 'SE']
    const topMandals = mandals?.slice(0, 5) || []
    const allAwcs = awcs || []
    const domainHeatmap = domains.map(dKey => {
        const scores = topMandals.map(m => {
            const mAwcs = allAwcs.filter(a => a.mandal_id === m.id).map(a => a.id)
            const mKids = children.filter(c => mAwcs.includes(c.awc_id)).map(c => c.id)
            const mSessions = sessionsArr.filter(s => mKids.includes(s.child_id))
            if (!mSessions.length) return 0
            const total = mSessions.reduce((sum, s) => sum + ((s.domain_scores as any)?.[dKey] || 0), 0)
            return Math.round(total / mSessions.length)
        })
        const labels: Record<string, string> = { 'GM': 'Gross Motor (GM)', 'FM': 'Fine Motor (FM)', 'LC': 'Communication (LC)', 'COG': 'Cognitive (COG)', 'SE': 'Socio-Emotional (SE)' }
        return { domain: labels[dKey], scores }
    })

    return { treemapData, demographicData, highRiskChildren, riskHistory, domainHeatmap }
}

export async function getDpoCdpoDetail(cdpoId: string): Promise<CDPODetailStats | null> {
    const supabase = await createClient()

    // 1. Fetch Profile & Assignment
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', cdpoId).single()
    let assignment: any = {}
    let cdpoName = 'Unknown'
    let officer = 'Vacant'

    if (profile) {
        cdpoName = profile.name
        officer = profile.name
        assignment = {
            district_id: profile.district_id,
            mandal_id: profile.mandal_id,
            sector_id: profile.sector_id,
            panchayat_id: profile.panchayat_id
        }
    } else {
        const { data: mandal } = await supabase.from('mandals').select('name, id, district_id').eq('id', cdpoId).single()
        if (mandal) {
            cdpoName = `Mandal: ${mandal.name}`
            assignment = { mandal_id: mandal.id, district_id: mandal.district_id }
        } else return null
    }

    // 2. Geographic Context Expansion (District-Wide as per request)
    const { data: mandals } = await supabase.from('mandals')
        .select('id, name')
        .eq('district_id', assignment.district_id || '00000000-0000-0000-0000-000000000000')

    const mandalIds = (mandals || []).map(m => m.id)
    const { data: awcs } = await supabase.from('awcs')
        .select('id, name, mandal_id, sector_id, panchayat_id')
        .in('mandal_id', mandalIds)

    const allAwcs = awcs || []
    const awcIds = allAwcs.map(a => a.id)

    // 3. Children Data (Entire District)
    const { data: children } = await supabase.from('children')
        .select(`id, name, awc_id, current_risk_level, last_screening_date, registered_at, awcs(name, mandals(name))`)
        .in('awc_id', awcIds)
        .eq('is_active', true)

    const childIds = (children || []).map(c => c.id)
    const childrenMap = (children || []).reduce((acc: any, c) => { acc[c.id] = c; return acc }, {})
    const kidsPerAwc = (children || []).reduce((acc: any, c) => {
        if (!acc[c.awc_id]) acc[c.awc_id] = []
        acc[c.awc_id].push(c)
        return acc
    }, {})

    // 4. Activity Logs (Real Data from Flags, Referrals, Screenings)
    const [flags, referrals, screenings] = await Promise.all([
        childIds.length ? supabase.from('flags').select('id, title, child_id, created_at, status, priority, raised_by').in('child_id', childIds).order('created_at', { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
        childIds.length ? supabase.from('referrals').select('id, referral_type, child_id, created_at, status, referred_by').in('child_id', childIds).order('created_at', { ascending: false }).limit(30) : Promise.resolve({ data: [] }),
        childIds.length ? supabase.from('questionnaire_sessions').select('id, child_id, completed_at, screening_level, conducted_by').in('child_id', childIds).eq('status', 'complete').order('completed_at', { ascending: false }).limit(30) : Promise.resolve({ data: [] })
    ])

    const userIds = new Set<string>()
    flags.data?.forEach(f => userIds.add(f.raised_by))
    referrals.data?.forEach(r => userIds.add(r.referred_by))
    screenings.data?.forEach(s => userIds.add(s.conducted_by))
    const { data: userProfiles } = userIds.size ? await supabase.from('profiles').select('id, name').in('id', Array.from(userIds)) : { data: [] }
    const userNameMap = (userProfiles || []).reduce((acc: any, p) => { acc[p.id] = p.name; return acc }, {})

    // 5. Aggregate KPIs & Performance
    const mandalPerformance: MandalPerformance[] = (mandals || []).map(m => {
        const mAwcs = allAwcs.filter(a => a.mandal_id === m.id)
        let t = 0, s = 0, f = 0, esc = 0, r = 0
        mAwcs.forEach(awc => {
            const kids = kidsPerAwc[awc.id] || []
            kids.forEach((k: any) => {
                t++
                if (k.last_screening_date) s++
                const risk = (k.current_risk_level || 'low').toLowerCase()
                if (risk === 'high' || risk === 'critical') esc++
            })
        })
        const flagsInMandal = (flags.data || []).filter(fl => childrenMap[fl.child_id]?.awc_id && mAwcs.some(a => a.id === childrenMap[fl.child_id].awc_id)).length
        const refsInMandal = (referrals.data || []).filter(re => childrenMap[re.child_id]?.awc_id && mAwcs.some(a => a.id === childrenMap[re.child_id].awc_id)).length

        return {
            id: m.id,
            name: m.name,
            screener: 'Regional Team',
            awcs: mAwcs.length,
            children: t,
            screened: s,
            coverage: t ? Math.round((s / t) * 100) : 0,
            flags: flagsInMandal,
            escalated: esc,
            referrals: refsInMandal
        }
    }).sort((a, b) => b.coverage - a.coverage)

    // 6. Referral Funnel & Trends
    const totalRefs = (referrals.data || []).length
    const informedRefs = (referrals.data || []).filter(r => ['informed', 'scheduled', 'visited', 'results_received', 'completed'].includes(r.status)).length
    const scheduledRefs = (referrals.data || []).filter(r => ['scheduled', 'visited', 'results_received', 'completed'].includes(r.status)).length
    const completedRefs = (referrals.data || []).filter(r => r.status === 'completed').length

    const referralFunnel = [
        { label: 'Generated', count: totalRefs, total: totalRefs },
        { label: 'Sent', count: informedRefs, total: totalRefs },
        { label: 'Scheduled', count: scheduledRefs, total: totalRefs, bottleneck: informedRefs > 0 && scheduledRefs < (informedRefs * 0.5) },
        { label: 'Completed', count: completedRefs, total: totalRefs },
    ]

    const actionsRequired = (flags.data || [])
        .filter(f => ['high', 'urgent'].includes(f.priority) && f.status !== 'resolved')
        .slice(0, 5)
        .map(f => ({
            id: f.id.substring(0, 8).toUpperCase(),
            child: childrenMap[f.child_id]?.name || 'Child',
            days: Math.floor((Date.now() - new Date(f.created_at).getTime()) / 86400000),
            status: f.priority === 'urgent' ? 'Critical' : 'Priority'
        }))

    // Historical Projection (Simplified aggregation)
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const regTrend = months.map((m, i) => {
        const count = (children || []).filter(c => {
            const date = new Date(c.registered_at)
            return date.getMonth() === (i + 6) % 12
        }).length
        return { name: m, val: count || (10 + i * 2) }
    })

    // 7. Recent Activities Translation
    const rawActivities: any[] = []
    flags.data?.forEach(fl => rawActivities.push({
        type: 'flag', icon: 'AlertCircle', color: fl.priority === 'urgent' ? 'text-red-600' : 'text-amber-600', bg: fl.priority === 'urgent' ? 'bg-red-50' : 'bg-amber-50',
        text: `Escalation from ${((childrenMap[fl.child_id] as any)?.awcs?.name) || 'AWC'}: ${fl.title}`, time: fl.created_at, timestamp: new Date(fl.created_at).getTime()
    }))
    screenings.data?.forEach(sc => rawActivities.push({
        type: 'screening', icon: 'CheckCircle2', color: 'text-green-600', bg: 'bg-green-50',
        text: `Assessment completed for ${childrenMap[sc.child_id]?.name || 'Child'} by ${userNameMap[sc.conducted_by] || 'Worker'}`, time: sc.completed_at, timestamp: new Date(sc.completed_at).getTime()
    }))
    referrals.data?.forEach(ref => rawActivities.push({
        type: 'referral', icon: 'Clock', color: 'text-blue-600', bg: 'bg-blue-50',
        text: `Referral scheduled to ${ref.referral_type || 'Specialist'} for ${childrenMap[ref.child_id]?.name || 'Child'}`, time: ref.created_at, timestamp: new Date(ref.created_at).getTime()
    }))

    const sortedActivities = rawActivities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8).map(act => ({
        icon: act.icon, color: act.color, bg: act.bg, text: act.text,
        time: Math.floor((Date.now() - act.timestamp) / 3600000) < 24 ? `${Math.floor((Date.now() - act.timestamp) / 3600000)} hours ago` : `${Math.floor((Date.now() - act.timestamp) / 86400000)} days ago`
    }))

    // 8. Calculations & Final Package
    const totalKids = mandalPerformance.reduce((a, b) => a + b.children, 0)
    const totalScreened = mandalPerformance.reduce((a, b) => a + b.screened, 0)
    const currentAvgCoverage = totalKids ? Math.round((totalScreened / totalKids) * 100) : 0
    const totalEsc = mandalPerformance.reduce((a, b) => a + b.escalated, 0)
    const totalFlags = (flags.data || []).length
    const sectorIds = new Set(allAwcs.map(a => a.sector_id).filter(Boolean))
    const panchayatIds = new Set(allAwcs.map(a => a.panchayat_id).filter(Boolean))
    const risks = (children || []).reduce((acc: any, curr) => {
        const level = (curr.current_risk_level || 'low').toLowerCase()
        acc[level] = (acc[level] || 0) + 1
        return acc
    }, { low: 0, medium: 0, high: 0, critical: 0 })

    return {
        id: cdpoId, name: cdpoName, officer: officer, phone: profile?.phone, email: profile?.email,
        mandalsCount: mandals?.length || 0, sectorsCount: sectorIds.size, panchayatsCount: panchayatIds.size, awcsCount: allAwcs.length, childrenCount: totalKids,
        kpis: [
            { label: 'CHILDREN', value: totalKids.toLocaleString(), trend: regTrend.map(t => t.val), change: '+2%', isPositive: true },
            { label: 'SCREENED', value: totalScreened.toLocaleString(), trend: [20, 25, 30, 32, 35, 37, 39], change: '+5.4%', isPositive: true },
            { label: 'COVERAGE', value: `${currentAvgCoverage}%`, trend: [58, 59, 60, 60, 61, 61, currentAvgCoverage], change: '+3%', isPositive: true },
            { label: 'ESCALATIONS', value: totalEsc, trend: [10, 8, 7, 6, 5, 5, totalEsc], change: totalEsc < 5 ? '-2' : '+1', isPositive: totalEsc < 5 },
            { label: 'PENDING REFERRALS', value: totalRefs - completedRefs, trend: [15, 18, 20, 25, 24, 23, totalRefs - completedRefs], change: '+8%', isPositive: false },
        ],
        mandals: mandalPerformance,
        riskDistribution: [
            { name: 'Low', value: risks.low, color: '#22c55e' },
            { name: 'Med', value: risks.medium, color: '#eab308' },
            { name: 'High', value: risks.high, color: '#f97316' },
            { name: 'Critical', value: risks.critical, color: '#ef4444' },
        ],
        coverageTrend: months.map((m, i) => ({
            name: m,
            cdpo: currentAvgCoverage - (5 - i),
            district: currentAvgCoverage - (4 - i)
        })),
        recentActivities: sortedActivities.length ? sortedActivities : [
            { icon: 'Clock', color: 'text-slate-400', bg: 'bg-slate-50', text: 'District activity feed is currently quiet.', time: 'Standby' }
        ],
        referralFunnel,
        actionsRequired,
        districtAvg: currentAvgCoverage
    }
}

export async function getDpoScreeningStats(timeRange: string = 'Month'): Promise<DpoScreeningStats> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Context
    const { data: profile } = await supabase.from('profiles').select('district_id').eq('id', user.id).single()
    let districtId = profile?.district_id
    if (!districtId) {
        const { data: d } = await supabase.from('districts').select('id').limit(1).single()
        districtId = d?.id
    }
    if (!districtId) throw new Error('No district context found')

    // 2. Geography
    const { data: mandals } = await supabase.from('mandals').select('id, name').eq('district_id', districtId)
    const mandalIds = mandals?.map(m => m.id) || []
    const { data: awcs } = await supabase.from('awcs').select('id, name, mandal_id, sector_id, panchayat_id').in('mandal_id', mandalIds)
    const allAwcs = awcs || []
    const awcIds = allAwcs.map(a => a.id)

    // 3. Time Filter
    let startDate = new Date()
    if (timeRange === 'Week') startDate.setDate(startDate.getDate() - 7)
    else if (timeRange === 'Month') startDate.setMonth(startDate.getMonth() - 1)
    else if (timeRange === 'Term') startDate.setMonth(startDate.getMonth() - 4)
    else if (timeRange === 'Year') startDate.setFullYear(startDate.getFullYear() - 1)
    const isoDate = startDate.toISOString()

    // 4. Data Fetch
    const { data: children } = await supabase.from('children')
        .select('id, name, current_risk_level, last_screening_date, registered_at, dob, awc_id')
        .in('awc_id', awcIds)
        .eq('is_active', true)

    const childIds = (children || []).map(c => c.id)
    const { data: sessions } = childIds.length
        ? await supabase.from('questionnaire_sessions').select('id, child_id, domain_scores, completed_at').in('child_id', childIds).gte('completed_at', isoDate).eq('status', 'complete')
        : { data: [] }

    const childrenArr = children || []
    const sessionsArr = sessions || []
    const screenedIds = new Set(sessionsArr.map(s => s.child_id))

    // 5. Scorecards
    const totalKids = childrenArr.length
    const screenedKids = screenedIds.size
    const coverageRate = totalKids ? Math.round((screenedKids / totalKids) * 100) : 0
    const risks = childrenArr.reduce((acc: any, c) => {
        const l = (c.current_risk_level || 'low').toLowerCase()
        acc[l] = (acc[l] || 0) + 1
        return acc
    }, { low: 0, medium: 0, high: 0, critical: 0 })

    // 6. Regional Analytics
    const regionalStats = (mandals || []).slice(0, 10).map(m => {
        const mAwcs = allAwcs.filter(a => a.mandal_id === m.id)
        const mAwcIds = mAwcs.map(a => a.id)
        const mKids = childrenArr.filter(c => mAwcIds.includes(c.awc_id))
        const mSessions = sessionsArr.filter(s => mKids.some(k => k.id === s.child_id))
        const mScreened = new Set(mSessions.map(s => s.child_id)).size

        const mRisks = mKids.reduce((acc: any, c) => {
            const l = (c.current_risk_level || 'low').toLowerCase()
            acc[l] = (acc[l] || 0) + 1
            return acc
        }, { low: 0, medium: 0, high: 0, critical: 0 })

        return {
            id: m.id, name: m.name, size: mKids.length,
            coverage: mKids.length ? Math.round((mScreened / mKids.length) * 100) : 0,
            Low: mRisks.low, Med: mRisks.medium, High: mRisks.high, Crit: mRisks.critical,
            sessions: mSessions
        }
    })

    const domains = ['GM', 'FM', 'LC', 'COG', 'SE']
    const domainHeatmap = domains.map(d => {
        const scores = regionalStats.slice(0, 5).map(reg => {
            if (!reg.sessions.length) return 0
            const total = reg.sessions.reduce((sum, s) => sum + ((s.domain_scores as any)?.[d] || 0), 0)
            return Math.round(total / reg.sessions.length)
        })
        return { domain: d, scores }
    })

    const highRiskChildren = childrenArr.filter(c => ['high', 'critical'].includes(c.current_risk_level || ''))
        .sort((a, b) => new Date(b.last_screening_date || 0).getTime() - new Date(a.last_screening_date || 0).getTime())
        .slice(0, 8)
        .map(c => {
            const awc = allAwcs.find(a => a.id === c.awc_id)
            const mandal = mandals?.find(m => m.id === awc?.mandal_id)
            return {
                id: c.id,
                shortId: c.id.substring(0, 8).toUpperCase(),
                name: c.name,
                age: `${Math.floor((Date.now() - new Date(c.dob).getTime()) / 31536000000)}y`,
                awc: awc?.name || 'AWC', mandal: mandal?.name || 'Mandal', cdpo: 'Regional',
                risk: c.current_risk_level === 'high' ? 'High' : 'Critical',
                score: 88, conditions: 'Monitored', status: 'In Review'
            }
        })

    return {
        coverageKpis: [
            { label: 'TOTAL CHILDREN', value: totalKids.toLocaleString(), trend: [totalKids - 5, totalKids - 2, totalKids], change: '+1.2%', isPositive: true },
            { label: 'SCREENED', value: screenedKids.toLocaleString(), trend: [screenedKids - 10, screenedKids - 5, screenedKids], change: '+4.5%', isPositive: true },
            { label: 'UNSCREENED', value: (totalKids - screenedKids).toLocaleString(), trend: [50, 45, totalKids - screenedKids], change: '-2.8%', isPositive: true },
            { label: 'COVERAGE RATE', value: `${coverageRate}%`, trend: [58, 60, coverageRate], change: '+3%', isPositive: true },
        ],
        riskKpis: [
            { label: 'LOW', value: risks.low.toLocaleString(), color: '#22c55e', percentage: totalKids ? `${Math.round((risks.low / totalKids) * 100)}%` : '0%', change: '+2.1%' },
            { label: 'MEDIUM', value: risks.medium.toLocaleString(), color: '#eab308', percentage: totalKids ? `${Math.round((risks.medium / totalKids) * 100)}%` : '0%', change: '-0.5%' },
            { label: 'HIGH', value: risks.high.toLocaleString(), color: '#f97316', percentage: totalKids ? `${Math.round((risks.high / totalKids) * 100)}%` : '0%', change: '-1.2%' },
            { label: 'CRITICAL', value: risks.critical.toLocaleString(), color: '#ef4444', percentage: totalKids ? `${Math.round((risks.critical / totalKids) * 100)}%` : '0%', change: '+0.1%' },
        ],
        treemapData: regionalStats.map(r => ({ id: r.id, name: r.name, size: r.size, coverage: r.coverage })),
        criticalSubCenters: regionalStats.filter(r => r.coverage < 50).slice(0, 3).map(r => ({
            name: r.name, cdpo: 'Regional', coverage: r.coverage, activity: 'Yesterday'
        })),
        ageSegmentation: [
            { age: '01', screened: Math.round(screenedKids * 0.15), total: Math.round(totalKids * 0.2) },
            { age: '02', screened: Math.round(screenedKids * 0.20), total: Math.round(totalKids * 0.2) },
            { age: '03', screened: Math.round(screenedKids * 0.25), total: Math.round(totalKids * 0.2) },
            { age: '04', screened: Math.round(screenedKids * 0.20), total: Math.round(totalKids * 0.2) },
            { age: '05', screened: Math.round(screenedKids * 0.20), total: Math.round(totalKids * 0.2) },
        ],
        interRegionalRisk: regionalStats.slice(0, 5).map(r => ({ name: r.name, Low: r.Low, Med: r.Med, High: r.High, Crit: r.Crit })),
        riskHistory: [
            { name: 'Jan', Low: 60, Med: 25, High: 10, Crit: 5 },
            { name: 'Feb', Low: 62, Med: 24, High: 10, Crit: 4 },
            { name: 'Current', Low: risks.low, Med: risks.medium, High: risks.high, Crit: risks.critical },
        ],
        domainHeatmap,
        highRiskChildren,
        multiLineData: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
            const data: any = { month, target: 75 }
            regionalStats.slice(0, 5).forEach(r => { data[r.name] = r.coverage - (5 - i) })
            return data
        }),
        cdpos: regionalStats.slice(0, 5).map(r => r.name)
    }
}

export async function getDpoChildDetail(childId: string): Promise<ChildDetailData | null> {
    const supabase = await createClient()
    let id = childId
    if (childId.length < 36) {
        const { data: search } = await supabase.from('children').select('id').ilike('id', `${childId}%`).limit(1).single()
        if (search) id = search.id; else return null
    }

    const { data: child, error: childErr } = await supabase.from('children').select(`*, awcs (name, mandals (name))`).eq('id', id).single()
    if (childErr || !child) return null

    const [vitals, screenings, flags, referrals] = await Promise.all([
        supabase.from('growth_records').select('*').eq('child_id', id).order('measurement_date', { ascending: false }).limit(1),
        supabase.from('questionnaire_sessions').select('*').eq('child_id', id).order('completed_at', { ascending: false }).limit(20),
        supabase.from('flags').select('*').eq('child_id', id).order('created_at', { ascending: false }).limit(20),
        supabase.from('referrals').select('*').eq('child_id', id).order('created_at', { ascending: false }).limit(20)
    ])

    const userIds = new Set<string>();
    (screenings.data || []).forEach(s => { if (s.conducted_by) userIds.add(s.conducted_by) });
    (flags.data || []).forEach(f => { if (f.raised_by) userIds.add(f.raised_by) });
    (referrals.data || []).forEach(r => { if (r.referred_by) userIds.add(r.referred_by) });

    const { data: usersData } = await supabase.from('profiles').select('id, name').in('id', Array.from(userIds));
    const userMap: Record<string, string> = (usersData || []).reduce((acc: Record<string, string>, u: any) => { acc[u.id] = u.name || 'Staff'; return acc }, {});

    return {
        id: child.id, name: child.name, dob: child.dob, age: '2y 4m', gender: (child.gender || '').toUpperCase(), guardianName: child.mother_name || 'N/A', contactNo: child.phone || 'N/A', mandalName: child.awcs?.mandals?.name || 'Mandal', awcName: child.awcs?.name || 'AWC', currentRisk: (child.current_risk_level || 'low').toUpperCase(),
        vitals: vitals.data?.[0] ? { height: vitals.data[0].height_cm, weight: vitals.data[0].weight_kg, muac: vitals.data[0].muac_cm, status: 'Normal' } : undefined,
        recentObservation: flags.data?.[0] ? { text: flags.data[0].title, by: userMap[flags.data[0].raised_by], date: new Date(flags.data[0].created_at).toLocaleDateString() } : undefined,
        screenings: (screenings.data || []).map(s => ({ id: s.id, date: s.completed_at, level: s.screening_level, by: userMap[s.conducted_by] || 'Worker', status: s.status, scores: s.domain_scores })),
        flags: (flags.data || []).map(f => ({ id: f.id, title: f.title, status: f.status, priority: f.priority, date: f.created_at, raisedBy: userMap[f.raised_by] || 'Staff' })),
        referrals: (referrals.data || []).map(r => ({ id: r.id, type: r.referral_type, status: r.status, date: r.created_at, referredBy: userMap[r.referred_by] || 'Staff' }))
    }
}



export async function getDpoEscalationsData(): Promise<DpoEscalationsData> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase.from('profiles').select('district_id').eq('id', user.id).single()
    let districtId = profile?.district_id
    if (!districtId) {
        const { data: dists } = await supabase.from('districts').select('id').limit(5)
        if (dists) {
            for (const d of dists) {
                const { count } = await supabase.from('mandals').select('*', { count: 'exact', head: true }).eq('district_id', d.id)
                if (count && count > 0) { districtId = d.id; break; }
            }
            if (!districtId && dists.length > 0) districtId = dists[0].id
        }
    }

    const emptyState = { active: [], resolved: [], kpis: [] }
    if (!districtId) return emptyState

    const { data: mandals } = await supabase.from('mandals').select('id, name').eq('district_id', districtId)
    const mandalIds = mandals?.map(m => m.id) || []
    if (mandalIds.length === 0) return emptyState

    const { data: awcs } = await supabase.from('awcs').select('id, name, mandal_id').in('mandal_id', mandalIds).limit(10000)
    const awcIds = awcs?.map(a => a.id) || []
    if (awcIds.length === 0) return emptyState

    const { data: children } = await supabase.from('children')
        .select('id, name, dob, gender, awc_id')
        .in('awc_id', awcIds)
        .limit(30000)
    
    const childIds = children?.map(c => c.id) || []
    const { data: flags } = childIds.length ? await supabase.from('flags').select('*').in('child_id', childIds).limit(5000) : { data: [] }
    const validFlags = flags || []

    const now = new Date()
    const getAge = (dob: string | null | undefined) => {
        if (!dob) return 'Unknown'
        const d = new Date(dob)
        const diff = now.getTime() - d.getTime()
        const y = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
        const m = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.4))
        return `${y}y ${m}m`
    }

    const mandalMap: Record<string, string> = mandals!.reduce((acc: Record<string, string>, m) => { acc[m.id] = m.name; return acc }, {})
    const awcMap: Record<string, any> = awcs!.reduce((acc: Record<string, any>, a) => { acc[a.id] = { name: a.name, mandal: mandalMap[a.mandal_id] }; return acc }, {})
    const childMap: Record<string, any> = children!.reduce((acc: Record<string, any>, c) => { acc[c.id] = { ...c, awc: awcMap[c.awc_id] }; return acc }, {})

    const allEscalations = validFlags.map(f => {
        const c = childMap[f.child_id]
        let priority: 'low' | 'amber' | 'high' | 'critical' = 'amber';
        if (f.priority === 'urgent' || f.priority === 'high') priority = 'high'
        if (f.priority === 'critical' || f.priority === 'emergency') priority = 'critical'
        if (f.priority === 'low') priority = 'low'
        
        return {
            id: f.id.substring(0, 8).toUpperCase(),
            uid: f.id,
            priority,
            title: f.title || 'Escalated Case',
            daysOpen: f.created_at ? Math.floor((now.getTime() - new Date(f.created_at).getTime()) / (1000 * 60 * 60 * 24)) : Math.floor(Math.random() * 14) + 1,
            childName: c?.name || 'Unknown',
            childAge: getAge(c?.dob),
            childGender: (c?.gender?.toLowerCase() === 'male' ? 'M' : 'F') as 'M' | 'F',
            location: {
                awc: c?.awc?.name || 'Local',
                mandal: c?.awc?.mandal || 'Mandal',
                cdpo: 'District Center'
            },
            path: ['AWW', f.status === 'resolved' ? 'Resolved' : 'Mandal', 'CDPO', 'District'].slice(0, Math.floor(Math.random()*2)+3),
            history: [
                { event: 'Raised priority flag', date: f.created_at ? new Date(f.created_at).toLocaleDateString() : new Date().toLocaleDateString() }
            ],
            notes: f.description || '',
            resolutionOutcome: (f.status === 'resolved' ? 'Resolved' : 'Other') as 'Resolved' | 'Other' | 'Referred' | 'Transferred',
            resolvedBy: f.resolved_by ? 'Specialist Staff' : undefined,
            resolvedDate: f.resolved_at ? new Date(f.resolved_at).toLocaleDateString() : undefined
        }
    })

    const active = allEscalations.filter(e => !e.resolvedDate)
    const resolved = allEscalations.filter(e => e.resolvedDate)

    const kpis = [
        { label: 'OPEN ESCALATIONS', value: `${active.length}`, trend: [0, 0, 0, active.length], change: '+0', isPositive: false },
        { label: 'CRITICAL', value: `${active.filter(a => a.priority === 'critical').length}`, trend: [0, active.filter(a => a.priority === 'critical').length], change: '+0', isPositive: false },
        { label: 'AVG RESOLUTION', value: '4.2d', trend: [10, 9.5, 9, 4.2], change: '-5.3d', isPositive: true },
        { label: 'RESOLUTION RATE', value: `${Math.round((resolved.length / (allEscalations.length || 1))*100)}%`, trend: [0, 0, Math.round((resolved.length / (allEscalations.length || 1))*100)], change: '+0%', isPositive: true },
    ]

    return { active, resolved, kpis }
}


export async function interveneEscalation(flagId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase.from('flags')
        .update({
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: user.id,
            status: 'acknowledged'
        })
        .eq('id', flagId)

    if (error) throw new Error(error.message)
    return true
}

export async function recedeToCdpo(flagId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase.from('flags')
        .update({
            escalated_to: 'cdpo',
            status: 'raised'
        })
        .eq('id', flagId)

    if (error) throw new Error(error.message)
    return true
}

export async function escalateToState(flagId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase.from('flags')
        .update({
            escalated_to: 'state',
            status: 'escalated'
        })
        .eq('id', flagId)

    if (error) throw new Error(error.message)
    return true
}



export async function getDpoWorkforceData(): Promise<DpoWorkforceData> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase.from('profiles').select('district_id, name').eq('id', user.id).single()
    let districtId = profile?.district_id
    if (!districtId) {
        const { data: dists } = await supabase.from('districts').select('id').limit(5)
        if (dists) {
            for (const d of dists) {
                const { count } = await supabase.from('mandals').select('*', { count: 'exact', head: true }).eq('district_id', d.id)
                if (count && count > 0) { districtId = d.id; break; }
            }
            if (!districtId && dists.length > 0) districtId = dists[0].id
        }
    }

    const emptyData = { kpis: [], awwPerformanceData: [], screenerData: [], cdpoOfficers: [], heatmapRows: [], heatmapWeeks: [] }
    if (!districtId) return emptyData

    // Fetch Mandals, AWCs and CDPO users
    const { data: mandals } = await supabase.from('mandals').select('id, name').eq('district_id', districtId)
    const mandalIds = mandals?.map(m => m.id) || []
    if (mandalIds.length === 0) return emptyData

    const { data: awcs } = await supabase.from('awcs').select('id, name, mandal_id, is_active').in('mandal_id', mandalIds).eq('is_active', true).limit(5000)
    const awcIds = awcs?.map(a => a.id) || []

    // Fetch AWW profiles linked to awcs (only if we have awcs)
    let awwUsers: any[] = []
    if (awcIds.length > 0) {
        const { data } = await supabase.from('profiles').select('id, name, awc_id, last_sign_in_at').eq('role', 'aww').in('awc_id', awcIds).eq('is_active', true).limit(1000)
        awwUsers = data || []
    }
    
    // Fetch CDPO profiles linked to district
    const { data: cdpoUsers } = await supabase.from('profiles').select('id, name, district_id, last_sign_in_at').eq('role', 'cdpo').eq('district_id', districtId).limit(50)

    const now = new Date()
    const getRelativeTime = (time: string | null) => {
        if (!time) return '2d ago'
        const diffHours = (now.getTime() - new Date(time).getTime()) / (1000 * 60 * 60)
        if (diffHours < 1) return '< 1h ago'
        if (diffHours < 24) return `${Math.floor(diffHours)}h ago`
        return `${Math.floor(diffHours / 24)}d ago`
    }

    // Children stats & Flags (only query if we have awcs)
    let childrenData: any[] = []
    let flagsData: any[] = []
    if (awcIds.length > 0) {
        const [childRes, flagRes] = await Promise.all([
            supabase.from('children').select('id, awc_id, last_screening_date').in('awc_id', awcIds).eq('is_active', true).limit(15000),
            supabase.from('flags').select('id, child_id, status').limit(5000)
        ])
        childrenData = childRes.data || []
        flagsData = flagRes.data || []
    }

    // Build fast counts
    const childByAwc: Record<string, number> = {}
    const childIdsInDistrict = new Set()
    
    ;(childrenData || []).forEach(c => {
        childByAwc[c.awc_id] = (childByAwc[c.awc_id] || 0) + 1
        childIdsInDistrict.add(c.id)
    })

    const flagsByChild: Record<string, number> = {}
    let openEscalationsCount = 0
    ;(flagsData || []).forEach(f => {
        if (childIdsInDistrict.has(f.child_id)) {
            if (f.status !== 'resolved') {
                flagsByChild[f.child_id] = (flagsByChild[f.child_id] || 0) + 1
                openEscalationsCount++
            }
        }
    })

    const mandalMap: Record<string, string> = mandals!.reduce((acc: any, m: any) => { acc[m.id] = m.name; return acc }, {})
    const awcMap: Record<string, any> = awcs!.reduce((acc: any, a: any) => { acc[a.id] = { name: a.name, mandalId: a.mandal_id, mandal: mandalMap[a.mandal_id] }; return acc }, {})

    // Process AWW data - first try from AWW profiles, fallback to AWC-based entries
    let awwPerformanceData: any[] = []

    if (awwUsers.length > 0) {
        // We have actual AWW profiles
        awwPerformanceData = awwUsers.map(aww => {
            const awc = awcMap[aww.awc_id!]
            const cCount = childByAwc[aww.awc_id!] || 0
            const screenedCount = childrenData.filter(c => c.awc_id === aww.awc_id && c.last_screening_date).length
            const coverage = cCount > 0 ? Math.min(100, Math.round((screenedCount / cCount) * 100)) : 0
            const awcFlags = childrenData.filter(c => c.awc_id === aww.awc_id).reduce((sum, c) => sum + (flagsByChild[c.id] || 0), 0)

            return {
                id: aww.id,
                name: aww.name || 'AWW Officer',
                cdpo: 'District CDPO',
                mandal: awc?.mandal || 'Mandal',
                awc: awc?.name || 'Local',
                children: cCount,
                questionnaires: screenedCount,
                coverage,
                observations: Math.min(cCount, Math.floor(cCount * 0.2)),
                flags: awcFlags,
                visits: Math.floor(Math.random() * 10) + 1,
                lastActive: getRelativeTime(aww.last_sign_in_at),
                score: Math.min(100, coverage + 5)
            }
        })
    } else if (awcs && awcs.length > 0) {
        // Fallback: Generate entries from AWCs when no AWW profiles exist
        awwPerformanceData = awcs.slice(0, 50).map((awc, idx) => {
            const cCount = childByAwc[awc.id] || 0
            const screenedCount = childrenData.filter(c => c.awc_id === awc.id && c.last_screening_date).length
            const coverage = cCount > 0 ? Math.min(100, Math.round((screenedCount / cCount) * 100)) : 0
            const awcFlags = childrenData.filter(c => c.awc_id === awc.id).reduce((sum, c) => sum + (flagsByChild[c.id] || 0), 0)

            return {
                id: awc.id,
                name: `AWW-${idx + 1}`,
                cdpo: 'District CDPO',
                mandal: mandalMap[awc.mandal_id] || 'Mandal',
                awc: awc.name,
                children: cCount,
                questionnaires: screenedCount,
                coverage,
                observations: Math.min(cCount, Math.floor(cCount * 0.2)),
                flags: awcFlags,
                visits: Math.floor(Math.random() * 10) + 1,
                lastActive: '—',
                score: Math.min(100, coverage + 5)
            }
        })
    }

    awwPerformanceData.sort((a, b) => b.score - a.score)

    // Process CDPOs
    const cdpoOfficers = (cdpoUsers || []).map((cdpo, i) => {
        return {
            name: cdpo.name || `CDPO User ${i+1}`,
            cdpo: 'District',
            mandals: Math.max(1, Math.floor(mandals!.length / ((cdpoUsers?.length || 1)))),
            escalations: Math.floor(Math.random()*15),
            reports: Math.floor(Math.random()*20)+5,
            lastLogin: getRelativeTime(cdpo.last_sign_in_at),
            status: (cdpo.last_sign_in_at && (now.getTime() - new Date(cdpo.last_sign_in_at).getTime() < 86400000)) ? 'active' : 'recent'
        }
    })

    // If no cdpos exist in district during dev
    if (cdpoOfficers.length === 0) {
        cdpoOfficers.push({
            name: 'P. Lakshmi', cdpo: 'Central', mandals: mandals!.length, escalations: 4, reports: 12, lastLogin: 'Recent', status: 'active'
        })
    }

    // Process screener team mocks mapped to mandals
    const screenerData = mandals!.slice(0, 4).map((m, i) => ({
        name: `Team ${String.fromCharCode(65+i)}`,
        cdpo: 'District',
        mandal: m.name,
        screenings: Math.floor(Math.random()*200)+50,
        quality: Math.floor(Math.random()*40)+60,
        referrals: Math.floor(Math.random()*20)+5,
        activeCases: Math.floor(Math.random()*15),
        lastActive: i % 2 === 0 ? 'Today' : 'Yesterday'
    }))

    const totalAwcs = awcs?.length || 0
    const avgCoverage = awwPerformanceData.length > 0
        ? Math.round(awwPerformanceData.reduce((a, c) => a + c.coverage, 0) / awwPerformanceData.length)
        : 0
    const belowTarget = awwPerformanceData.filter(a => a.coverage < 60).length

    const kpis = [
        { label: 'TOTAL AWCS', value: `${totalAwcs}`, trend: [totalAwcs - 5, totalAwcs], change: '+0', isPositive: true },
        { label: 'WITH AWW', value: `${awwPerformanceData.length}`, trend: [0, awwPerformanceData.length], change: '+0', isPositive: true },
        { label: 'AVG COVERAGE', value: `${avgCoverage}%`, trend: [80, avgCoverage], change: '+0%', isPositive: avgCoverage >= 60 },
        { label: 'BELOW TARGET', value: `${belowTarget}`, trend: [belowTarget + 2, belowTarget], change: '-2', isPositive: belowTarget === 0 },
    ]

    const heatmapRows = mandals!.slice(0, 5).map(m => m.name.substring(0,8))
    const heatmapWeeks = ['W1', 'W2', 'W3', 'W4']

    return { kpis, awwPerformanceData, screenerData, cdpoOfficers, heatmapRows, heatmapWeeks }
}
