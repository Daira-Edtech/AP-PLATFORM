'use server'

import { createClient } from '@/lib/supabase/server'
import { CDPOPerformance, CDPODetailStats, DpoDashboardStats, MandalPerformance, RiskAnalysisStats } from './types'

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
        const { data: firstDist } = await supabase.from('districts').select('id').limit(1).single()
        districtId = firstDist?.id
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
        const { data: firstDist } = await supabase.from('districts').select('id').limit(1).single()
        districtId = firstDist?.id
    }

    const emptyState: RiskAnalysisStats = { treemapData: [], demographicData: [], riskHistory: [], domainHeatmap: [], highRiskChildren: [] }
    if (!districtId) return emptyState

    const { data: mandals } = await supabase.from('mandals').select('id, name').eq('district_id', districtId)
    const mandalIds = mandals?.map(m => m.id) || []
    if (mandalIds.length === 0) return emptyState

    const { data: awcs } = await supabase.from('awcs').select('id, mandal_id, sector_id, panchayat_id').in('mandal_id', mandalIds)
    const awcIds = awcs?.map(a => a.id) || []
    if (awcIds.length === 0) return emptyState

    const { data: children } = await supabase.from('children').select(`id, name, date_of_birth, current_risk_level, last_screening_date, risk_score, awc_id, awcs (name, mandals (name))`).in('awc_id', awcIds).eq('is_active', true)
    if (!children || children.length === 0) return emptyState

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
        const dob = new Date(c.date_of_birth)
        const years = now.getFullYear() - dob.getFullYear()
        const key = years <= 0 ? '0-1Y' : years >= 5 ? '5Y+' : `${years}-${years + 1}Y`
        if (ageMetrics[key as keyof typeof ageMetrics]) {
            ageMetrics[key as keyof typeof ageMetrics].t++
            if (c.last_screening_date) ageMetrics[key as keyof typeof ageMetrics].s++
        }
    })
    const demographicData = Object.entries(ageMetrics).map(([age, m]) => ({ age, screened: m.s, total: m.t }))

    const highRiskChildren = children.filter(c => ['high', 'critical'].includes((c.current_risk_level || '').toLowerCase())).sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 10).map(c => ({ id: c.id, name: c.name, age: `${now.getFullYear() - new Date(c.date_of_birth).getFullYear()}y`, awc: (c.awcs as any)?.name || 'N/A', mandal: (c.awcs as any)?.mandals?.name || 'N/A', cdpo: 'Regional', risk: c.current_risk_level || 'Low', score: c.risk_score || 0, conditions: 'Monitored State', status: c.last_screening_date ? 'Screened' : 'Pending' }))

    const risks = children.reduce((acc: any, c) => {
        const l = (c.current_risk_level || 'low').toLowerCase()
        acc[l] = (acc[l] || 0) + 1
        return acc
    }, { low: 0, medium: 0, high: 0, critical: 0 })
    const riskHistory = [{ name: 'Current', Low: risks.low, Med: risks.medium, High: risks.high, Crit: risks.critical }]

    return { treemapData, demographicData, highRiskChildren, riskHistory, domainHeatmap: [{ domain: 'Gross Motor (GM)', scores: [0, 0, 0, 0, 0] }, { domain: 'Fine Motor (FM)', scores: [0, 0, 0, 0, 0] }, { domain: 'Communication (LC)', scores: [0, 0, 0, 0, 0] }, { domain: 'Cognitive (COG)', scores: [0, 0, 0, 0, 0] }, { domain: 'Socio-Emotional (SE)', scores: [0, 0, 0, 0, 0] }] }
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

    // 2. Geographic Context Expansion
    const { data: mandals } = await supabase.from('mandals')
        .select('id, name')
        .or(`id.eq.${assignment.mandal_id || '00000000-0000-0000-0000-000000000000'},district_id.eq.${assignment.district_id || '00000000-0000-0000-0000-000000000000'}`)

    const mandalIds = (mandals || []).map(m => m.id)
    const { data: awcs } = await supabase.from('awcs').select('id, name, mandal_id, sector_id, panchayat_id').in('mandal_id', mandalIds)
    const allAwcs = awcs || []
    const awcIds = allAwcs.map(a => a.id)

    // 3. Children Data
    const { data: children } = await supabase.from('children')
        .select(`id, name, awc_id, current_risk_level, last_screening_date, awcs(name, mandals(name))`)
        .in('awc_id', awcIds)
        .eq('is_active', true)

    const childIds = (children || []).map(c => c.id)
    const childrenMap = (children || []).reduce((acc: any, c) => { acc[c.id] = c; return acc }, {})
    const kidsPerAwc = (children || []).reduce((acc: any, c) => {
        if (!acc[c.awc_id]) acc[c.awc_id] = []
        acc[c.awc_id].push(c)
        return acc
    }, {})

    // 4. Metrics & Activities
    // Fetch flags, referrals, and screenings for activity feed
    const [flags, referrals, screenings] = await Promise.all([
        childIds.length ? supabase.from('flags').select('id, title, child_id, created_at, status, priority, raised_by').in('child_id', childIds).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
        childIds.length ? supabase.from('referrals').select('id, referral_type, child_id, created_at, status, referred_by').in('child_id', childIds).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
        childIds.length ? supabase.from('questionnaire_sessions').select('id, child_id, completed_at, screening_level, conducted_by').in('child_id', childIds).eq('status', 'complete').order('completed_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] })
    ])

    // Collect all unique user IDs to fetch their names
    const userIds = new Set<string>()
    flags.data?.forEach(f => userIds.add(f.raised_by))
    referrals.data?.forEach(r => userIds.add(r.referred_by))
    screenings.data?.forEach(s => userIds.add(s.conducted_by))

    const { data: userProfiles } = userIds.size ? await supabase.from('profiles').select('id, name').in('id', Array.from(userIds)) : { data: [] }
    const userNameMap = (userProfiles || []).reduce((acc: any, p) => { acc[p.id] = p.name; return acc }, {})

    // Aggregate metrics for mandals
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

    // Build Recent Activities
    const rawActivities: any[] = []
    flags.data?.forEach(fl => rawActivities.push({
        type: 'flag',
        icon: 'AlertCircle',
        color: fl.priority === 'critical' || fl.priority === 'high' ? 'text-red-600' : 'text-amber-600',
        bg: fl.priority === 'critical' || fl.priority === 'high' ? 'bg-red-50' : 'bg-amber-50',
        text: `Flag raised: "${fl.title}" for ${childrenMap[fl.child_id]?.name || 'Child'} by ${userNameMap[fl.raised_by] || 'Officer'}`,
        time: fl.created_at,
        timestamp: new Date(fl.created_at).getTime()
    }))
    screenings.data?.forEach(sc => rawActivities.push({
        type: 'screening',
        icon: 'CheckCircle2',
        color: 'text-green-600',
        bg: 'bg-green-50',
        text: `Screening completed for ${childrenMap[sc.child_id]?.name || 'Child'} at ${(childrenMap[sc.child_id] as any)?.awcs?.name || 'AWC'} by ${userNameMap[sc.conducted_by] || 'Worker'}`,
        time: sc.completed_at,
        timestamp: new Date(sc.completed_at).getTime()
    }))
    referrals.data?.forEach(ref => rawActivities.push({
        type: 'referral',
        icon: 'Clock',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        text: `Referral issued for ${childrenMap[ref.child_id]?.name || 'Child'} to ${ref.referral_type || 'Specialist'} by ${userNameMap[ref.referred_by] || 'Staff'}`,
        time: ref.created_at,
        timestamp: new Date(ref.created_at).getTime()
    }))

    const sortedActivities = rawActivities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10).map(act => {
        const diff = Date.now() - act.timestamp
        let timeLabel = 'Just now'
        if (diff > 86400000) timeLabel = `${Math.floor(diff / 86400000)} days ago`
        else if (diff > 3600000) timeLabel = `${Math.floor(diff / 3600000)} hours ago`
        else if (diff > 60000) timeLabel = `${Math.floor(diff / 60000)} mins ago`

        return {
            icon: act.icon,
            color: act.color,
            bg: act.bg,
            text: act.text,
            time: timeLabel
        }
    })

    // Final Object
    const totalKids = mandalPerformance.reduce((a, b) => a + b.children, 0)
    const totalScreened = mandalPerformance.reduce((a, b) => a + b.screened, 0)
    const avgCoverage = totalKids ? Math.round((totalScreened / totalKids) * 100) : 0
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
        id: cdpoId,
        name: cdpoName,
        officer: officer,
        phone: profile?.phone,
        email: profile?.email,
        mandalsCount: mandals?.length || 0,
        sectorsCount: sectorIds.size,
        panchayatsCount: panchayatIds.size,
        awcsCount: allAwcs.length,
        childrenCount: totalKids,
        kpis: [
            { label: 'CHILDREN', value: totalKids.toLocaleString(), trend: [50, 52, 55, totalKids], change: '+2%', isPositive: true },
            { label: 'SCREENED', value: totalScreened.toLocaleString(), trend: [20, 25, 30, totalScreened], change: '+5.4%', isPositive: true },
            { label: 'COVERAGE', value: `${avgCoverage}%`, trend: [58, 59, 60, avgCoverage], change: '+3%', isPositive: true },
            { label: 'ESCALATIONS', value: totalEsc, trend: [10, 8, 7, totalEsc], change: `${totalEsc > 10 ? '+' : '-'}`, isPositive: totalEsc < 10 },
            { label: 'TOTAL FLAGS', value: totalFlags, trend: [15, 18, 20, totalFlags], change: '+8%', isPositive: false },
        ],
        mandals: mandalPerformance,
        riskDistribution: [
            { name: 'Low', value: risks.low, color: '#22c55e' },
            { name: 'Med', value: risks.medium, color: '#eab308' },
            { name: 'High', value: risks.high, color: '#f97316' },
            { name: 'Critical', value: risks.critical, color: '#ef4444' },
        ],
        coverageTrend: [
            { name: 'Prev', cdpo: 58, district: 60 },
            { name: 'Last', cdpo: 61, district: 62 },
            { name: 'Current', cdpo: avgCoverage, district: 64 },
        ],
        recentActivities: sortedActivities.length ? sortedActivities : [
            { icon: 'Clock', color: 'text-slate-400', bg: 'bg-slate-50', text: 'No recent district activity found.', time: 'System Ready' }
        ]
    }
}
