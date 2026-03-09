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

    const { data: mandals } = await adminSb.from('mandals').select('id, name, district_id').in('district_id', districtIds)
    const mandalIds = mandals?.map((m: any) => m.id) || []

    const { data: awcs } = await adminSb.from('awcs').select('id, name, mandal_id').in('mandal_id', mandalIds)
    const awcIds = awcs?.map((a: any) => a.id) || []

    return {
        stateId, districts: districts || [], districtIds,
        mandals: mandals || [], mandalIds,
        awcs: awcs || [], awcIds
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminSb = createAdminClient()

    try {
        const scope = await getStateScope(adminSb)
        if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { districts, districtIds, mandals, mandalIds, awcs, awcIds } = scope

        // Shared geographic maps
        const awcToMandal = new Map(awcs.map((a: any) => [a.id, a.mandal_id]))
        const mandalToDistrict = new Map(mandals.map((m: any) => [m.id, m.district_id]))
        const awcNameMap = new Map(awcs.map((a: any) => [a.id, a.name]))
        const mandalNameMap = new Map(mandals.map((m: any) => [m.id, m.name]))
        const districtNameMap = new Map(districts.map((d: any) => [d.id, d.name]))

        switch (type) {
            // ═══════════════════════════════════════════════════════
            // SUMMARY
            // ═══════════════════════════════════════════════════════
            case 'summary': {
                if (awcIds.length === 0) {
                    return NextResponse.json({ total: 0, screened: 0, highRisk: 0, referred: 0, districts: 0 })
                }

                const [totalRes, screenedRes, highRiskRes] = await Promise.all([
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds),
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds).not('last_screening_date', 'is', null),
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds).in('current_risk_level', ['high', 'critical']),
                ])

                // Children with referrals
                const { data: childIds } = await adminSb.from('children').select('id').in('awc_id', awcIds)
                const allChildIds = childIds?.map((c: any) => c.id) || []
                let referredCount = 0
                if (allChildIds.length > 0) {
                    const { data: referredChildren } = await adminSb
                        .from('referrals').select('child_id')
                        .in('child_id', allChildIds)
                    const uniqueReferred = new Set(referredChildren?.map((r: any) => r.child_id) || [])
                    referredCount = uniqueReferred.size
                }

                const total = totalRes.count || 0
                return NextResponse.json({
                    total,
                    screenedPct: total > 0 ? Math.round(((screenedRes.count || 0) / total) * 100) : 0,
                    highRiskPct: total > 0 ? Math.round(((highRiskRes.count || 0) / total) * 100) : 0,
                    referredPct: total > 0 ? Math.round((referredCount / total) * 100) : 0,
                    districts: districtIds.length
                })
            }

            // ═══════════════════════════════════════════════════════
            // FILTERS
            // ═══════════════════════════════════════════════════════
            case 'filters': {
                // CDPOs in state
                const { data: cdpos } = await adminSb
                    .from('profiles').select('name, district_id')
                    .eq('state_id', scope.stateId).eq('is_active', true)
                    .in('role', ['cdpo'])

                return NextResponse.json({
                    districts: districts.map(d => ({ id: d.id, name: d.name })),
                    cdpos: cdpos?.map((c: any) => ({ name: c.name, districtId: c.district_id })) || [],
                    mandals: mandals.map(m => ({ id: m.id, name: m.name, districtId: m.district_id })),
                    awcs: awcs.map(a => ({ id: a.id, name: a.name, mandalId: a.mandal_id }))
                })
            }

            // ═══════════════════════════════════════════════════════
            // PAGINATED LIST
            // ═══════════════════════════════════════════════════════
            case 'list': {
                const page = parseInt(searchParams.get('page') || '1')
                const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100)
                const search = searchParams.get('search') || ''
                const districtFilter = searchParams.get('district') || ''
                const riskFilter = searchParams.get('risk') || ''
                const statusFilter = searchParams.get('status') || ''
                const ageFilter = searchParams.get('age') || ''

                // Determine AWC scope based on district filter
                let filteredAwcIds = awcIds
                if (districtFilter) {
                    const filteredMandals = mandals.filter(m => m.district_id === districtFilter).map(m => m.id)
                    filteredAwcIds = awcs.filter(a => filteredMandals.includes(a.mandal_id)).map(a => a.id)
                }

                if (filteredAwcIds.length === 0) {
                    return NextResponse.json({ children: [], total: 0, page, pageSize, totalPages: 0 })
                }

                // Build query
                let query = adminSb
                    .from('children')
                    .select('id, name, dob, gender, guardian_name, awc_id, current_risk_level, last_screening_date, updated_at', { count: 'exact' })
                    .in('awc_id', filteredAwcIds)
                    .order('updated_at', { ascending: false })

                // Search filter
                if (search) {
                    query = query.or(`name.ilike.%${search}%,guardian_name.ilike.%${search}%`)
                }

                // Risk filter
                if (riskFilter) {
                    const riskMap: Record<string, string> = { 'Low': 'low', 'Medium': 'medium', 'High': 'high', 'Critical': 'critical' }
                    const mappedRisk = riskMap[riskFilter] || riskFilter.toLowerCase()
                    query = query.eq('current_risk_level', mappedRisk)
                }

                // Status filter
                if (statusFilter === 'Screened') {
                    query = query.not('last_screening_date', 'is', null)
                } else if (statusFilter === 'Unscreened') {
                    query = query.is('last_screening_date', null)
                }
                // 'In Intervention' handled client-side via referral data

                // Age filter (compute date range from DOB)
                if (ageFilter) {
                    const ageMatch = ageFilter.match(/(\d+)-(\d+)/)
                    if (ageMatch) {
                        const now = new Date()
                        const maxAge = parseInt(ageMatch[2])
                        const minAge = parseInt(ageMatch[1])
                        const dobStart = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate()).toISOString()
                        const dobEnd = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate()).toISOString()
                        query = query.gte('dob', dobStart).lt('dob', dobEnd)
                    }
                }

                // Pagination
                const from = (page - 1) * pageSize
                query = query.range(from, from + pageSize - 1)

                const { data: children, count: totalCount } = await query

                if (!children?.length) {
                    return NextResponse.json({ children: [], total: totalCount || 0, page, pageSize, totalPages: Math.ceil((totalCount || 0) / pageSize) })
                }

                // Enrich with flags, referrals counts
                const childIds = children.map(c => c.id)

                const [flagsRes, referralsRes] = await Promise.all([
                    adminSb.from('flags').select('child_id').in('child_id', childIds),
                    adminSb.from('referrals').select('child_id').in('child_id', childIds),
                ])

                const flagCounts: Record<string, number> = {}
                flagsRes.data?.forEach((f: any) => { flagCounts[f.child_id] = (flagCounts[f.child_id] || 0) + 1 })

                const referralCounts: Record<string, number> = {}
                referralsRes.data?.forEach((r: any) => { referralCounts[r.child_id] = (referralCounts[r.child_id] || 0) + 1 })

                // Build enriched response
                const enriched = children.map(c => {
                    const awcName = awcNameMap.get(c.awc_id) || 'Unknown'
                    const mandalId = awcToMandal.get(c.awc_id)
                    const mandalName = mandalId ? mandalNameMap.get(mandalId) : 'Unknown'
                    const distId = mandalId ? mandalToDistrict.get(mandalId) : null
                    const districtName = distId ? districtNameMap.get(distId) : 'Unknown'

                    // Compute age
                    let ageStr = 'N/A'
                    if (c.dob) {
                        const dob = new Date(c.dob)
                        const now = new Date()
                        const ageMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
                        const years = Math.floor(ageMonths / 12)
                        const months = ageMonths % 12
                        ageStr = `${years}y ${months}m`
                    }

                    // Status
                    let status: string = 'Unscreened'
                    if (referralCounts[c.id] > 0) status = 'In Intervention'
                    else if (c.last_screening_date) status = 'Screened'

                    // Risk mapping
                    const riskMap: Record<string, string> = { 'low': 'Low', 'medium': 'Medium', 'high': 'High', 'critical': 'Critical' }
                    const riskStatus = riskMap[c.current_risk_level] || 'Low'

                    // Last activity
                    const lastScreened = c.last_screening_date
                        ? new Date(c.last_screening_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Unscreened'
                    const lastActivity = c.updated_at
                        ? new Date(c.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A'

                    return {
                        id: c.id,
                        name: c.name || 'Unknown',
                        age: ageStr,
                        gender: c.gender || 'Unknown',
                        parentName: c.guardian_name || 'N/A',
                        awc: awcName,
                        mandal: mandalName,
                        district: districtName,
                        districtId: distId,
                        riskStatus,
                        flags: flagCounts[c.id] || 0,
                        referrals: referralCounts[c.id] || 0,
                        lastScreened,
                        lastActivity,
                        status
                    }
                })

                return NextResponse.json({
                    children: enriched,
                    total: totalCount || 0,
                    page,
                    pageSize,
                    totalPages: Math.ceil((totalCount || 0) / pageSize)
                })
            }

            default:
                return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('Children API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
