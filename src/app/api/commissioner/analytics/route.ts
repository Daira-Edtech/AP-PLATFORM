import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Pre-programme baseline constants (ICDS historical data)
const BASELINE = {
    identificationRate: 2.8,    // per 1000
    timeToIdentificationMonths: 14.2,
    referralCompletion: 12,      // %
    coverageRate: 18,            // %
    specialistAccess: 'Low (Manual)',
}

async function getStateScope(adminSb: ReturnType<typeof createAdminClient>) {
    const userSb = await createClient()
    const { data: { user } } = await userSb.auth.getUser()
    if (!user) return null

    const { data: profile } = await adminSb.from('profiles').select('state_id').eq('id', user.id).single()
    if (!profile?.state_id) return null

    const stateId = profile.state_id
    const { data: districts } = await adminSb.from('districts').select('id, name').eq('state_id', stateId)
    const districtIds = districts?.map((d: any) => d.id) || []

    const { data: mandals } = await adminSb.from('mandals').select('id').in('district_id', districtIds)
    const mandalIds = mandals?.map((m: any) => m.id) || []

    const { data: awcs } = await adminSb.from('awcs').select('id').in('mandal_id', mandalIds)
    const awcIds = awcs?.map((a: any) => a.id) || []

    return { stateId, districtIds, mandalIds, awcIds }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminSb = createAdminClient()

    try {
        const scope = await getStateScope(adminSb)
        if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { awcIds } = scope

        switch (type) {
            // ═══════════════════════════════════════════════════════
            // PROGRAMME IMPACT TAB
            // ═══════════════════════════════════════════════════════
            case 'impact-summary': {
                if (awcIds.length === 0) {
                    return NextResponse.json({
                        headline: { riskChildren: 0, referred: 0, intervened: 0, completionRate: 0 },
                        kpis: { identificationImprovement: 0, screeningGrowthYoY: 0, referralCompletion: 0, avgTimeToIntervention: 0 }
                    })
                }

                // Parallelize initial counts
                const [totalChildrenRes, screenedRes, riskChildrenRes, allChildrenRes] = await Promise.all([
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds).eq('is_active', true),
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds).eq('is_active', true).not('last_screening_date', 'is', null),
                    adminSb.from('children').select('id').in('awc_id', awcIds).eq('is_active', true).in('current_risk_level', ['high', 'critical']),
                    adminSb.from('children').select('id').in('awc_id', awcIds).eq('is_active', true)
                ])

                const totalChildren = totalChildrenRes.count || 0
                const screened = screenedRes.count || 0
                const riskCount = riskChildrenRes.data?.length || 0
                const childIds = allChildrenRes.data?.map((c: any) => c.id) || []

                let referred = 0, intervened = 0, completedReferrals = 0, totalReferrals = 0, avgDays = 0
                
                if (childIds.length > 0) {
                    // Parallelize referral and intervention counts
                    const [refCountReq, completedRefReq, intCountReq, refDatesReq, intDatesReq] = await Promise.all([
                        adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds),
                        adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds).eq('status', 'completed'),
                        adminSb.from('interventions').select('*', { count: 'exact', head: true }).in('child_id', childIds).in('status', ['in_progress', 'completed']),
                        adminSb.from('referrals').select('child_id, created_at').in('child_id', childIds).eq('status', 'completed'),
                        adminSb.from('interventions').select('child_id, created_at').in('child_id', childIds)
                    ])

                    totalReferrals = refCountReq.count || 0
                    referred = totalReferrals
                    completedReferrals = completedRefReq.count || 0
                    intervened = intCountReq.count || 0

                    if (refDatesReq.data?.length && intDatesReq.data?.length) {
                        const intMap = new Map(intDatesReq.data.map((i: any) => [i.child_id, new Date(i.created_at).getTime()]))
                        let totalDiff = 0, count = 0
                        refDatesReq.data.forEach((r: any) => {
                            const intTime = intMap.get(r.child_id)
                            if (intTime) {
                                totalDiff += (intTime - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
                                count++
                            }
                        })
                        avgDays = count > 0 ? Math.round(totalDiff / count) : 0
                    }
                }

                const completionRate = totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0
                const currentRate = totalChildren > 0 ? Math.round((riskCount / totalChildren) * 10000) / 10 : 0
                const improvement = BASELINE.identificationRate > 0
                    ? Math.round(((currentRate - BASELINE.identificationRate) / BASELINE.identificationRate) * 100)
                    : 0

                // YoY screening growth - parallelize these too
                const now = new Date()
                const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())

                const [thisYearRes, lastYearRes] = await Promise.all([
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds).gte('last_screening_date', oneYearAgo.toISOString().split('T')[0]),
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds).gte('last_screening_date', twoYearsAgo.toISOString().split('T')[0]).lt('last_screening_date', oneYearAgo.toISOString().split('T')[0])
                ])

                const thisY = thisYearRes.count || 0
                const lastY = lastYearRes.count || 0
                const yoyGrowth = lastY > 0 ? Math.round(((thisY - lastY) / lastY) * 100) : (thisY > 0 ? 100 : 0)

                return NextResponse.json({
                    headline: { riskChildren: riskCount, referred, intervened, completionRate },
                    kpis: {
                        identificationImprovement: improvement,
                        screeningGrowthYoY: yoyGrowth,
                        referralCompletion: completionRate,
                        avgTimeToIntervention: avgDays,
                        totalScreened: screened || 0
                    }
                })
            }

            case 'longitudinal': {
                if (awcIds.length === 0) return NextResponse.json([])

                // Get children with registration dates for quarterly grouping
                const { data: children } = await adminSb
                    .from('children').select('registered_at, current_risk_level')
                    .in('awc_id', awcIds).eq('is_active', true)

                // Group by quarter
                const quarters = new Map<string, { volume: number, highRisk: number }>()
                children?.forEach((c: any) => {
                    const d = new Date(c.registered_at)
                    const q = `Q${Math.ceil((d.getMonth() + 1) / 3)}-${d.getFullYear().toString().slice(-2)}`
                    const existing = quarters.get(q) || { volume: 0, highRisk: 0 }
                    existing.volume++
                    if (c.current_risk_level === 'high' || c.current_risk_level === 'critical') existing.highRisk++
                    quarters.set(q, existing)
                })

                // Sort chronologically and compute rate
                const result = [...quarters.entries()]
                    .sort((a, b) => {
                        const [aq, ay] = [parseInt(a[0][1]), parseInt(a[0].split('-')[1])]
                        const [bq, by] = [parseInt(b[0][1]), parseInt(b[0].split('-')[1])]
                        return ay !== by ? ay - by : aq - bq
                    })
                    .map(([q, data]) => ({
                        q,
                        volume: data.volume,
                        rate: data.volume > 0 ? Math.round((data.highRisk / data.volume) * 10000) / 10 : 0
                    }))

                return NextResponse.json(result)
            }

            case 'pipeline': {
                if (awcIds.length === 0) return NextResponse.json([])

                const [screenedRes, allChildrenRes] = await Promise.all([
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds).eq('is_active', true).not('last_screening_date', 'is', null),
                    adminSb.from('children').select('id').in('awc_id', awcIds)
                ])

                const screened = screenedRes.count || 0
                const childIds = allChildrenRes.data?.map((c: any) => c.id) || []

                if (childIds.length === 0) return NextResponse.json([])

                // Parallelize remaining pipeline metrics
                const [flaggedRes, referredRes, interventionRes, completedRes, followupRes] = await Promise.all([
                    adminSb.from('flags').select('child_id').in('child_id', childIds),
                    adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds),
                    adminSb.from('interventions').select('*', { count: 'exact', head: true }).in('child_id', childIds),
                    adminSb.from('interventions').select('*', { count: 'exact', head: true }).in('child_id', childIds).eq('status', 'completed'),
                    adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds).eq('follow_up_status', 'completed')
                ])

                const identifiedIds = [...new Set(flaggedRes.data?.map((f: any) => f.child_id) || [])]
                const referredCount = referredRes.count || 0
                const interventionCount = interventionRes.count || 0
                const completedCount = completedRes.count || 0
                const followupCount = followupRes.count || 0

                const s = screened || 0
                const stages = [
                    { stage: 'Screened', value: s, drop: 0 },
                    { stage: 'Identified', value: identifiedIds.length, drop: s > 0 ? Math.round(((s - identifiedIds.length) / s) * 100) : 0 },
                    { stage: 'Referred', value: referredCount, drop: identifiedIds.length > 0 ? Math.round(((identifiedIds.length - referredCount) / identifiedIds.length) * 100) : 0 },
                    { stage: 'Intervention Started', value: interventionCount, drop: referredCount > 0 ? Math.round(((referredCount - interventionCount) / referredCount) * 100) : 0 },
                    { stage: 'Completed', value: completedCount, drop: interventionCount > 0 ? Math.round(((interventionCount - completedCount) / interventionCount) * 100) : 0 },
                    { stage: 'Follow-up Normal', value: followupCount, drop: completedCount > 0 ? Math.round(((completedCount - followupCount) / completedCount) * 100) : 0 },
                ]

                return NextResponse.json(stages)
            }

            // ═══════════════════════════════════════════════════════
            // COHORT TRACKING TAB
            // ═══════════════════════════════════════════════════════
            case 'cohort': {
                const quarter = searchParams.get('quarter') || 'Q1-2025'
                if (awcIds.length === 0) {
                    return NextResponse.json({
                        size: 0, retention: 0, outcomes: [],
                        timeline: [], availableQuarters: []
                    })
                }

                // Parse quarter → date range
                const [qPart, yPart] = quarter.split('-')
                const qNum = parseInt(qPart.replace('Q', ''))
                const year = 2000 + parseInt(yPart)
                const startMonth = (qNum - 1) * 3
                const startDate = new Date(year, startMonth, 1)
                const endDate = new Date(year, startMonth + 3, 1)

                // Parallelize cohort children and all registrations for quarter list
                const [cohortChildrenRes, allRegRes] = await Promise.all([
                    adminSb.from('children').select('id, is_active, current_risk_level').in('awc_id', awcIds).gte('registered_at', startDate.toISOString()).lt('registered_at', endDate.toISOString()),
                    adminSb.from('children').select('registered_at').in('awc_id', awcIds).order('registered_at', { ascending: true })
                ])

                const cohortChildren = cohortChildrenRes.data || []
                const size = cohortChildren.length
                const active = cohortChildren.filter((c: any) => c.is_active).length
                const retention = size > 0 ? Math.round((active / size) * 100) : 0

                let outcomes: any[] = []
                if (size > 0) {
                    const cohortIds = cohortChildren.map((c: any) => c.id)

                    // Parallelize outcome counts
                    const [resolvedRefsRes, activeIntRes, lostRes] = await Promise.all([
                        adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', cohortIds).eq('status', 'completed'),
                        adminSb.from('interventions').select('*', { count: 'exact', head: true }).in('child_id', cohortIds).eq('status', 'in_progress'),
                        adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', cohortIds).eq('follow_up_status', 'lost_to_followup')
                    ])

                    const normalDev = cohortChildren.filter((c: any) => !c.current_risk_level || c.current_risk_level === 'normal').length
                    const referred = resolvedRefsRes.count || 0
                    const underIntervention = activeIntRes.count || 0
                    const lostFollowup = lostRes.count || 0
                    const pending = Math.max(0, size - normalDev - referred - underIntervention - lostFollowup)

                    outcomes = [
                        { name: 'Normal Development', value: Math.round((normalDev / size) * 100), color: '#22C55E' },
                        { name: 'Referred & Resolved', value: Math.round((referred / size) * 100), color: '#000000' },
                        { name: 'Under Intervention', value: Math.round((underIntervention / size) * 100), color: '#3B82F6' },
                        { name: 'Lost to Follow-up', value: Math.round((lostFollowup / size) * 100), color: '#EF4444' },
                        { name: 'Still Pending', value: Math.round((pending / size) * 100), color: '#F59E0B' },
                    ]
                }

                const quarterSet = new Set<string>()
                allRegRes.data?.forEach((c: any) => {
                    const d = new Date(c.registered_at)
                    quarterSet.add(`Q${Math.ceil((d.getMonth() + 1) / 3)}-${d.getFullYear().toString().slice(-2)}`)
                })

                return NextResponse.json({
                    size, retention, outcomes,
                    availableQuarters: [...quarterSet].sort()
                })
            }

            // ═══════════════════════════════════════════════════════
            // BEFORE / AFTER TAB
            // ═══════════════════════════════════════════════════════
            case 'before-after': {
                if (awcIds.length === 0) return NextResponse.json([])

                const [totalRes, screenedRes, riskKidsRes] = await Promise.all([
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds).eq('is_active', true),
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds).eq('is_active', true).not('last_screening_date', 'is', null),
                    adminSb.from('children').select('id').in('awc_id', awcIds).in('current_risk_level', ['high', 'critical'])
                ])

                const t = totalRes.count || 0
                const s = screenedRes.count || 0
                const riskCount = riskKidsRes.data?.length || 0
                const currentIdRate = t > 0 ? Math.round((riskCount / t) * 10000) / 10 : 0
                const currentCoverage = t > 0 ? Math.round((s / t) * 100) : 0

                // Referral completion
                const childIds = riskKidsRes.data?.map((c: any) => c.id) || []
                let refCompletion = 0
                if (childIds.length > 0) {
                    const [totalRefRes, completedRefRes] = await Promise.all([
                        adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds),
                        adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds).eq('status', 'completed')
                    ])
                    refCompletion = (totalRefRes.count || 0) > 0 ? Math.round(((completedRefRes.count || 0) / (totalRefRes.count || 0)) * 100) : 0
                }

                const delta = (before: number, after: number) => {
                    if (before === 0) return after > 0 ? '+∞' : '0%'
                    const pct = Math.round(((after - before) / before) * 100)
                    return pct >= 0 ? `+${pct}%` : `${pct}%`
                }

                const result = [
                    {
                        label: 'analytics.ba.metric.idRate',
                        before: `${BASELINE.identificationRate} / 1000`,
                        after: `${currentIdRate} / 1000`,
                        delta: delta(BASELINE.identificationRate, currentIdRate),
                        positive: currentIdRate > BASELINE.identificationRate
                    },
                    {
                        label: 'analytics.ba.metric.refCompletion',
                        before: `${BASELINE.referralCompletion}%`,
                        after: `${refCompletion}%`,
                        delta: delta(BASELINE.referralCompletion, refCompletion),
                        positive: refCompletion > BASELINE.referralCompletion
                    },
                    {
                        label: 'analytics.ba.metric.specialistAccess',
                        before: BASELINE.specialistAccess,
                        after: 'High (Digital)',
                        delta: 'Managed',
                        positive: true
                    },
                    {
                        label: 'analytics.ba.metric.coverageRate',
                        before: `${BASELINE.coverageRate}%`,
                        after: `${currentCoverage}%`,
                        delta: delta(BASELINE.coverageRate, currentCoverage),
                        positive: currentCoverage > BASELINE.coverageRate
                    },
                ]

                return NextResponse.json(result)
            }

            default:
                return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('Analytics API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
