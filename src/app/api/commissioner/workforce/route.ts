import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function getStateScope(adminSb: ReturnType<typeof createAdminClient>) {
    const userSb = await createClient()
    const { data: { user } } = await userSb.auth.getUser()
    if (!user) return null

    const { data: profile } = await adminSb.from('profiles').select('state_id').eq('id', user.id).single()
    if (!profile?.state_id) return null

    const stateId = profile.state_id
    const { data: districts } = await adminSb.from('districts').select('id, name').eq('state_id', stateId)
    const districtIds = districts?.map((d: any) => d.id) || []

    const { data: mandals } = await adminSb.from('mandals').select('id, district_id').in('district_id', districtIds)
    const mandalIds = mandals?.map((m: any) => m.id) || []

    const { data: awcs } = await adminSb.from('awcs').select('id, mandal_id').in('mandal_id', mandalIds)
    const awcIds = awcs?.map((a: any) => a.id) || []

    return { stateId, districts: districts || [], districtIds, mandals: mandals || [], mandalIds, awcs: awcs || [], awcIds }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminSb = createAdminClient()

    try {
        const scope = await getStateScope(adminSb)
        if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { districts, districtIds, mandals, mandalIds, awcs, awcIds } = scope

        // Helper: build mandal→district mapping
        const mandalToDistrict = new Map(mandals.map((m: any) => [m.id, m.district_id]))
        // Helper: build awc→mandal mapping
        const awcToMandal = new Map(awcs.map((a: any) => [a.id, a.mandal_id]))

        switch (type) {
            // ═══════════════════════════════════════════════════════
            // KPIs
            // ═══════════════════════════════════════════════════════
            case 'kpis': {
                // Count profiles by role within state
                const { data: stateProfiles } = await adminSb
                    .from('profiles').select('id, role, is_active, district_id, mandal_id')
                    .eq('state_id', scope.stateId).eq('is_active', true)

                const awwCount = stateProfiles?.filter((p: any) => p.role === 'aww').length || 0
                const supervisorCount = stateProfiles?.filter((p: any) => p.role === 'supervisor').length || 0
                const cdpoCount = stateProfiles?.filter((p: any) => ['cdpo', 'district_officer'].includes(p.role)).length || 0
                const totalAwcs = awcIds.length
                const positionsFilled = totalAwcs > 0 ? Math.round((awwCount / totalAwcs) * 100) : 0

                // Training compliance: % of AWWs who conducted ≥1 session in last 30 days
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                const awwIds = stateProfiles?.filter((p: any) => p.role === 'aww').map((p: any) => p.id) || []

                let trainingCompliance = 0
                if (awwIds.length > 0) {
                    const { data: recentSessions } = await adminSb
                        .from('questionnaire_sessions').select('conducted_by')
                        .in('conducted_by', awwIds)
                        .gte('started_at', thirtyDaysAgo.toISOString())
                        .eq('status', 'complete')
                    const activeAwws = new Set(recentSessions?.map((s: any) => s.conducted_by) || [])
                    trainingCompliance = Math.round((activeAwws.size / awwIds.length) * 100)
                }

                // AWW:Child ratio
                const { count: childCount } = await adminSb
                    .from('children').select('*', { count: 'exact', head: true })
                    .in('awc_id', awcIds).eq('is_active', true)
                const avgRatio = awwCount > 0 ? Math.round((childCount || 0) / awwCount) : 0

                return NextResponse.json({
                    totalAwws: awwCount,
                    supervisors: supervisorCount,
                    cdpos: cdpoCount,
                    positionsFilled: Math.min(positionsFilled, 100),
                    trainingCompliance,
                    avgChildRatio: avgRatio,
                    totalAwcs
                })
            }

            // ═══════════════════════════════════════════════════════
            // DISTRICT TABLE
            // ═══════════════════════════════════════════════════════
            case 'district-table': {
                const { data: stateProfiles } = await adminSb
                    .from('profiles').select('id, role, district_id, mandal_id')
                    .eq('state_id', scope.stateId).eq('is_active', true)

                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                const allAwwIds = stateProfiles?.filter((p: any) => p.role === 'aww').map((p: any) => p.id) || []

                // Session data for training compliance
                let sessionsByUser: Record<string, boolean> = {}
                if (allAwwIds.length > 0) {
                    const { data: sessions } = await adminSb
                        .from('questionnaire_sessions').select('conducted_by')
                        .in('conducted_by', allAwwIds)
                        .gte('started_at', thirtyDaysAgo.toISOString())
                        .eq('status', 'complete')
                    sessions?.forEach((s: any) => { sessionsByUser[s.conducted_by] = true })
                }

                // Children per AWC for ratios
                const { data: childrenByAwc } = await adminSb
                    .from('children').select('awc_id')
                    .in('awc_id', awcIds).eq('is_active', true)

                // Build AWC → district mapping via mandal
                const awcToDistrict = new Map<string, string>()
                awcs.forEach((a: any) => {
                    const distId = mandalToDistrict.get(a.mandal_id)
                    if (distId) awcToDistrict.set(a.id, distId)
                })

                // Count children per district
                const childrenPerDistrict: Record<string, number> = {}
                childrenByAwc?.forEach((c: any) => {
                    const distId = awcToDistrict.get(c.awc_id)
                    if (distId) childrenPerDistrict[distId] = (childrenPerDistrict[distId] || 0) + 1
                })

                // AWCs per district
                const awcsPerDistrict: Record<string, number> = {}
                awcs.forEach((a: any) => {
                    const distId = awcToDistrict.get(a.id)
                    if (distId) awcsPerDistrict[distId] = (awcsPerDistrict[distId] || 0) + 1
                })

                // Mandals per district
                const mandalsPerDistrict: Record<string, number> = {}
                mandals.forEach((m: any) => {
                    mandalsPerDistrict[m.district_id] = (mandalsPerDistrict[m.district_id] || 0) + 1
                })

                // Profile → district mapping (AWWs may not have district_id set; derive from mandal)
                const getDistrictForProfile = (p: any) => {
                    if (p.district_id && districtIds.includes(p.district_id)) return p.district_id
                    if (p.mandal_id) return mandalToDistrict.get(p.mandal_id) || null
                    return null
                }

                const result = districts.map(d => {
                    const distProfiles = stateProfiles?.filter((p: any) => getDistrictForProfile(p) === d.id) || []
                    const awwsFilled = distProfiles.filter((p: any) => p.role === 'aww').length
                    const awwsTarget = awcsPerDistrict[d.id] || 0
                    const screenersFilled = distProfiles.filter((p: any) => p.role === 'supervisor').length
                    const screenersTarget = mandalsPerDistrict[d.id] || 0
                    const cdposCount = distProfiles.filter((p: any) => ['cdpo', 'district_officer'].includes(p.role)).length
                    const vacancyRate = awwsTarget > 0 ? Math.round(((awwsTarget - awwsFilled) / awwsTarget) * 1000) / 10 : 0

                    // Training compliance for this district's AWWs
                    const distAwwIds = distProfiles.filter((p: any) => p.role === 'aww').map((p: any) => p.id)
                    const trainedAwws = distAwwIds.filter((id: string) => sessionsByUser[id]).length
                    const trainingCompliance = distAwwIds.length > 0 ? Math.round((trainedAwws / distAwwIds.length) * 100) : 0

                    const children = childrenPerDistrict[d.id] || 0
                    const childToAwwRatio = awwsFilled > 0 ? Math.round(children / awwsFilled) : 0

                    // Composite score: mix of vacancy, training, and child ratio
                    const vacScore = Math.max(0, 100 - Math.abs(vacancyRate) * 3)
                    const trainScore = trainingCompliance
                    const ratioScore = Math.max(0, 100 - Math.max(0, childToAwwRatio - 40) * 5)
                    const complianceScore = Math.round(vacScore * 0.4 + trainScore * 0.3 + ratioScore * 0.3)

                    return {
                        id: d.id, name: d.name,
                        awwsFilled, awwsTarget, screenersFilled, screenersTarget, cdposCount,
                        vacancyRate: Math.max(0, vacancyRate), trainingCompliance, childToAwwRatio,
                        complianceScore: Math.min(100, Math.max(0, complianceScore))
                    }
                })

                return NextResponse.json(result.sort((a, b) => b.complianceScore - a.complianceScore))
            }

            // ═══════════════════════════════════════════════════════
            // TRAINING HEATMAP
            // ═══════════════════════════════════════════════════════
            case 'training-heatmap': {
                const { data: stateProfiles } = await adminSb
                    .from('profiles').select('id, role, district_id, mandal_id')
                    .eq('state_id', scope.stateId).eq('is_active', true)

                const awwProfiles = stateProfiles?.filter((p: any) => p.role === 'aww') || []
                const awwIds = awwProfiles.map((p: any) => p.id)

                // Get sessions for last 6 months
                const sixMonthsAgo = new Date()
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

                let sessionData: any[] = []
                if (awwIds.length > 0) {
                    const { data } = await adminSb
                        .from('questionnaire_sessions').select('conducted_by, started_at')
                        .in('conducted_by', awwIds)
                        .gte('started_at', sixMonthsAgo.toISOString())
                        .eq('status', 'complete')
                    sessionData = data || []
                }

                // Get district for each AWW
                const getDistrictForProfile = (p: any) => {
                    if (p.district_id && districtIds.includes(p.district_id)) return p.district_id
                    if (p.mandal_id) return mandalToDistrict.get(p.mandal_id) || null
                    return null
                }

                // Build: district → month → Set of active AWW IDs
                const activity: Record<string, Record<string, Set<string>>> = {}
                const awwToDistrict = new Map(awwProfiles.map((p: any) => [p.id, getDistrictForProfile(p)]))
                const distAwwCounts: Record<string, number> = {}

                awwProfiles.forEach((p: any) => {
                    const dId = getDistrictForProfile(p)
                    if (dId) distAwwCounts[dId] = (distAwwCounts[dId] || 0) + 1
                })

                sessionData.forEach((s: any) => {
                    const distId = awwToDistrict.get(s.conducted_by)
                    if (!distId) return
                    const monthKey = new Date(s.started_at).toLocaleDateString('en-US', { month: 'short' })
                    if (!activity[distId]) activity[distId] = {}
                    if (!activity[distId][monthKey]) activity[distId][monthKey] = new Set()
                    activity[distId][monthKey].add(s.conducted_by)
                })

                // Generate month labels for last 6 months
                const monthLabels: string[] = []
                const now = new Date()
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                    monthLabels.push(d.toLocaleDateString('en-US', { month: 'short' }))
                }

                const result = districts.map(d => ({
                    district: d.name,
                    months: monthLabels.map(m => {
                        const total = distAwwCounts[d.id] || 0
                        const active = activity[d.id]?.[m]?.size || 0
                        return total > 0 ? Math.round((active / total) * 100) : 0
                    })
                }))

                return NextResponse.json({ data: result, monthLabels })
            }

            // ═══════════════════════════════════════════════════════
            // ACTIVITY GRID
            // ═══════════════════════════════════════════════════════
            case 'activity': {
                const awwIds: string[] = []
                const { data: stateProfiles } = await adminSb
                    .from('profiles').select('id, role')
                    .eq('state_id', scope.stateId).eq('is_active', true).eq('role', 'aww')
                stateProfiles?.forEach((p: any) => awwIds.push(p.id))

                const twelveWeeksAgo = new Date()
                twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

                let sessionData: any[] = []
                if (awwIds.length > 0) {
                    const { data } = await adminSb
                        .from('questionnaire_sessions').select('started_at')
                        .in('conducted_by', awwIds)
                        .gte('started_at', twelveWeeksAgo.toISOString())
                    sessionData = data || []
                }

                // Build daily counts for 84 days
                const dailyCounts: number[] = new Array(84).fill(0)
                const dayOfWeekCounts: number[] = new Array(7).fill(0)
                const now = new Date()

                sessionData.forEach((s: any) => {
                    const d = new Date(s.started_at)
                    const daysAgo = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
                    if (daysAgo >= 0 && daysAgo < 84) {
                        dailyCounts[83 - daysAgo]++
                    }
                    dayOfWeekCounts[d.getDay()]++
                })

                // Peak day
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                const peakDayIdx = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))
                const peakDay = dayNames[peakDayIdx]

                // Avg sessions per AWW per week (last 7 days)
                const last7Days = dailyCounts.slice(77, 84)
                const weekTotal = last7Days.reduce((a, b) => a + b, 0)
                const avgPerWeek = awwIds.length > 0 ? Math.round((weekTotal / awwIds.length) * 10) / 10 : 0

                // Normalize daily counts to intensity (0-1)
                const maxDaily = Math.max(1, ...dailyCounts)
                const intensities = dailyCounts.map(c => c / maxDaily)

                return NextResponse.json({
                    intensities,
                    peakDay,
                    avgSessionsPerWeek: avgPerWeek,
                    totalSessions: sessionData.length
                })
            }

            // ═══════════════════════════════════════════════════════
            // VACANCY RISK
            // ═══════════════════════════════════════════════════════
            case 'vacancy': {
                const { data: stateProfiles } = await adminSb
                    .from('profiles').select('id, role, district_id, mandal_id')
                    .eq('state_id', scope.stateId).eq('is_active', true)

                const awwCount = stateProfiles?.filter((p: any) => p.role === 'aww').length || 0
                const totalAwcs = awcIds.length
                const openPositions = Math.max(0, totalAwcs - awwCount)

                // Coverage loss estimate: % of AWCs without an AWW
                const coverageLoss = totalAwcs > 0 ? Math.round(((totalAwcs - awwCount) / totalAwcs) * 1000) / 10 : 0

                // Top 2 districts by vacancy
                const awcToDistrict = new Map<string, string>()
                awcs.forEach((a: any) => {
                    const distId = mandalToDistrict.get(a.mandal_id)
                    if (distId) awcToDistrict.set(a.id, distId)
                })

                const awcsPerDistrict: Record<string, number> = {}
                awcs.forEach((a: any) => {
                    const dId = awcToDistrict.get(a.id)
                    if (dId) awcsPerDistrict[dId] = (awcsPerDistrict[dId] || 0) + 1
                })

                const getDistrictForProfile = (p: any) => {
                    if (p.district_id && districtIds.includes(p.district_id)) return p.district_id
                    if (p.mandal_id) return mandalToDistrict.get(p.mandal_id) || null
                    return null
                }

                const awwsPerDistrict: Record<string, number> = {}
                stateProfiles?.filter((p: any) => p.role === 'aww').forEach((p: any) => {
                    const dId = getDistrictForProfile(p)
                    if (dId) awwsPerDistrict[dId] = (awwsPerDistrict[dId] || 0) + 1
                })

                const districtVacancies = districts.map(d => {
                    const target = awcsPerDistrict[d.id] || 0
                    const filled = awwsPerDistrict[d.id] || 0
                    const vacancy = target > 0 ? Math.round(((target - filled) / target) * 1000) / 10 : 0
                    return { name: d.name, vacancy: Math.max(0, vacancy), openCount: Math.max(0, target - filled) }
                }).sort((a, b) => b.vacancy - a.vacancy)

                return NextResponse.json({
                    openPositions,
                    coverageLoss: Math.max(0, coverageLoss),
                    topVacancyDistricts: districtVacancies.slice(0, 2)
                })
            }

            default:
                return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('Workforce API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
