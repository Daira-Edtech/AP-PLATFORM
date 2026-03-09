import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ districtId: string }> }) {
    const { districtId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminSb = createAdminClient()

    // Auth check
    const userSb = await createClient()
    const { data: { user } } = await userSb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        // Get district info
        const { data: district } = await adminSb.from('districts').select('id, name, state_id').eq('id', districtId).single()
        if (!district) return NextResponse.json({ error: 'District not found' }, { status: 404 })

        // Get mandals and AWCs for this district
        const { data: mandals } = await adminSb.from('mandals').select('id, name').eq('district_id', districtId)
        const mandalIds = mandals?.map(m => m.id) || []
        const mandalNameMap = new Map(mandals?.map(m => [m.id, m.name]) || [])

        const { data: awcs } = await adminSb.from('awcs').select('id, name, mandal_id').in('mandal_id', mandalIds.length > 0 ? mandalIds : ['_'])
        const awcIds = awcs?.map(a => a.id) || []
        const awcNameMap = new Map(awcs?.map(a => [a.id, a.name]) || [])
        const awcToMandal = new Map(awcs?.map(a => [a.id, a.mandal_id]) || [])

        // AWCs per mandal
        const awcsPerMandal: Record<string, number> = {}
        awcs?.forEach(a => { awcsPerMandal[a.mandal_id] = (awcsPerMandal[a.mandal_id] || 0) + 1 })

        // Get all profiles in this district
        const { data: allProfiles } = await adminSb
            .from('profiles')
            .select('id, name, role, phone, mandal_id, is_active, last_login_at, email')
            .eq('is_active', true)
            .or(`district_id.eq.${districtId},mandal_id.in.(${mandalIds.join(',')})`)

        // Deduplicate: profiles matched by both district_id and mandal_id
        const profileMap = new Map<string, any>()
        allProfiles?.forEach(p => profileMap.set(p.id, p))
        const profiles = Array.from(profileMap.values())

        // Profile → mandal mapping
        const getMandalForProfile = (p: any) => {
            if (p.mandal_id && mandalIds.includes(p.mandal_id)) return p.mandal_id
            return null
        }

        switch (type) {
            // ═══════════════════════════════════════════════════════
            // SUMMARY — district KPIs
            // ═══════════════════════════════════════════════════════
            case 'summary': {
                const awws = profiles.filter(p => p.role === 'aww')
                const supervisors = profiles.filter(p => p.role === 'supervisor')
                const cdpos = profiles.filter(p => ['cdpo', 'district_officer'].includes(p.role))

                const totalAwcs = awcIds.length
                const vacancyRate = totalAwcs > 0 ? Math.round(((totalAwcs - awws.length) / totalAwcs) * 1000) / 10 : 0

                // Training compliance (last 30d)
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                const awwIds = awws.map(p => p.id)
                let trainingCompliance = 0
                if (awwIds.length > 0) {
                    const { data: sessions } = await adminSb
                        .from('questionnaire_sessions').select('conducted_by')
                        .in('conducted_by', awwIds)
                        .gte('started_at', thirtyDaysAgo.toISOString())
                        .eq('status', 'complete')
                    const activeAwws = new Set(sessions?.map(s => s.conducted_by) || [])
                    trainingCompliance = Math.round((activeAwws.size / awwIds.length) * 100)
                }

                // Child:AWW ratio
                const { count: childCount } = await adminSb
                    .from('children').select('*', { count: 'exact', head: true })
                    .in('awc_id', awcIds.length > 0 ? awcIds : ['_'])
                const avgRatio = awws.length > 0 ? Math.round((childCount || 0) / awws.length) : 0

                return NextResponse.json({
                    districtName: district.name,
                    totalAwws: awws.length,
                    totalSupervisors: supervisors.length,
                    totalCdpos: cdpos.length,
                    totalAwcs,
                    totalMandals: mandalIds.length,
                    vacancyRate: Math.max(0, vacancyRate),
                    trainingCompliance,
                    avgChildRatio: avgRatio,
                    positionsFilled: totalAwcs > 0 ? Math.round((awws.length / totalAwcs) * 100) : 0,
                })
            }

            // ═══════════════════════════════════════════════════════
            // PERSONNEL — full roster
            // ═══════════════════════════════════════════════════════
            case 'personnel': {
                const search = searchParams.get('search') || ''
                const roleFilter = searchParams.get('role') || ''

                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

                // Session counts per person (last 30d)
                const personIds = profiles.map(p => p.id)
                let sessionCounts: Record<string, number> = {}
                if (personIds.length > 0) {
                    const { data: sessions } = await adminSb
                        .from('questionnaire_sessions').select('conducted_by')
                        .in('conducted_by', personIds)
                        .gte('started_at', thirtyDaysAgo.toISOString())
                        .eq('status', 'complete')
                    sessions?.forEach(s => { sessionCounts[s.conducted_by] = (sessionCounts[s.conducted_by] || 0) + 1 })
                }

                // Children per AWC
                const childrenPerAwc: Record<string, number> = {}
                if (awcIds.length > 0) {
                    const { data: children } = await adminSb
                        .from('children').select('awc_id')
                        .in('awc_id', awcIds)
                    children?.forEach(c => { childrenPerAwc[c.awc_id] = (childrenPerAwc[c.awc_id] || 0) + 1 })
                }

                // AWW → AWC assignment (find which AWC belongs to AWW's mandal)
                // Since AWW has mandal_id, their AWCs are all AWCs in that mandal
                const mandalAwcMap = new Map<string, string[]>()
                awcs?.forEach(a => {
                    const arr = mandalAwcMap.get(a.mandal_id) || []
                    arr.push(a.id)
                    mandalAwcMap.set(a.mandal_id, arr)
                })

                let result = profiles.map(p => {
                    const mandalId = getMandalForProfile(p)
                    const mandalName = mandalId ? mandalNameMap.get(mandalId) : 'Unassigned'

                    // For AWWs, find their AWC(s) and children count
                    let awcName = 'N/A'
                    let childCount = 0
                    if (p.role === 'aww' && mandalId) {
                        const mandalAwcs = mandalAwcMap.get(mandalId) || []
                        if (mandalAwcs.length > 0) {
                            awcName = awcNameMap.get(mandalAwcs[0]) || 'Unknown'
                            childCount = mandalAwcs.reduce((sum, id) => sum + (childrenPerAwc[id] || 0), 0)
                        }
                    }

                    const roleLabel: Record<string, string> = { 'aww': 'AWW', 'supervisor': 'Supervisor', 'cdpo': 'CDPO', 'district_officer': 'District Officer' }

                    return {
                        id: p.id,
                        name: p.name,
                        role: roleLabel[p.role] || p.role,
                        roleKey: p.role,
                        phone: p.phone || 'N/A',
                        mandal: mandalName,
                        awc: awcName,
                        lastLogin: p.last_login_at ? new Date(p.last_login_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never',
                        sessions30d: sessionCounts[p.id] || 0,
                        childCount,
                    }
                })

                // Apply filters
                if (roleFilter) {
                    result = result.filter(p => p.roleKey === roleFilter)
                }
                if (search) {
                    const q = search.toLowerCase()
                    result = result.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q))
                }

                // Sort: CDPOs first, then supervisors, then AWWs
                const roleOrder: Record<string, number> = { 'cdpo': 0, 'district_officer': 0, 'supervisor': 1, 'aww': 2 }
                result.sort((a, b) => (roleOrder[a.roleKey] ?? 3) - (roleOrder[b.roleKey] ?? 3))

                return NextResponse.json(result)
            }

            // ═══════════════════════════════════════════════════════
            // MANDAL BREAKDOWN — per-mandal metrics
            // ═══════════════════════════════════════════════════════
            case 'mandal-breakdown': {
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

                const awwIds = profiles.filter(p => p.role === 'aww').map(p => p.id)
                let sessionsByUser: Record<string, boolean> = {}
                if (awwIds.length > 0) {
                    const { data: sessions } = await adminSb
                        .from('questionnaire_sessions').select('conducted_by')
                        .in('conducted_by', awwIds)
                        .gte('started_at', thirtyDaysAgo.toISOString())
                        .eq('status', 'complete')
                    sessions?.forEach(s => { sessionsByUser[s.conducted_by] = true })
                }

                // Children per mandal (via AWC)
                const childrenPerMandal: Record<string, number> = {}
                if (awcIds.length > 0) {
                    const { data: children } = await adminSb
                        .from('children').select('awc_id')
                        .in('awc_id', awcIds)
                    children?.forEach(c => {
                        const mid = awcToMandal.get(c.awc_id)
                        if (mid) childrenPerMandal[mid] = (childrenPerMandal[mid] || 0) + 1
                    })
                }

                const result = (mandals || []).map(m => {
                    const mandalProfiles = profiles.filter(p => getMandalForProfile(p) === m.id)
                    const awws = mandalProfiles.filter(p => p.role === 'aww')
                    const supervisors = mandalProfiles.filter(p => p.role === 'supervisor')
                    const target = awcsPerMandal[m.id] || 0
                    const vacancy = target > 0 ? Math.round(((target - awws.length) / target) * 1000) / 10 : 0

                    const trainedAwws = awws.filter(p => sessionsByUser[p.id]).length
                    const training = awws.length > 0 ? Math.round((trainedAwws / awws.length) * 100) : 0

                    const children = childrenPerMandal[m.id] || 0
                    const ratio = awws.length > 0 ? Math.round(children / awws.length) : 0

                    return {
                        id: m.id,
                        name: m.name,
                        awwsFilled: awws.length,
                        awwsTarget: target,
                        supervisors: supervisors.length,
                        vacancyRate: Math.max(0, vacancy),
                        trainingCompliance: training,
                        childCount: children,
                        childToAwwRatio: ratio,
                    }
                })

                return NextResponse.json(result.sort((a, b) => a.name.localeCompare(b.name)))
            }

            // ═══════════════════════════════════════════════════════
            // ACTIVITY — per-worker session frequency
            // ═══════════════════════════════════════════════════════
            case 'activity': {
                const awws = profiles.filter(p => p.role === 'aww')
                const awwIds = awws.map(p => p.id)

                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

                let sessionsByPerson: Record<string, number> = {}
                if (awwIds.length > 0) {
                    const { data: sessions } = await adminSb
                        .from('questionnaire_sessions').select('conducted_by')
                        .in('conducted_by', awwIds)
                        .gte('started_at', thirtyDaysAgo.toISOString())
                        .eq('status', 'complete')
                    sessions?.forEach(s => {
                        sessionsByPerson[s.conducted_by] = (sessionsByPerson[s.conducted_by] || 0) + 1
                    })
                }

                // Activity distribution
                const active = Object.keys(sessionsByPerson).length
                const inactive = awws.length - active
                const highActivity = Object.values(sessionsByPerson).filter(c => c >= 10).length
                const medActivity = Object.values(sessionsByPerson).filter(c => c >= 3 && c < 10).length
                const lowActivity = Object.values(sessionsByPerson).filter(c => c > 0 && c < 3).length

                return NextResponse.json({
                    totalAwws: awws.length,
                    active,
                    inactive,
                    highActivity,
                    medActivity,
                    lowActivity,
                })
            }

            default:
                return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('District workforce API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
