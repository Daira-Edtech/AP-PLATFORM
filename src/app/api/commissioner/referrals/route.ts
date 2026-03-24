import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Cache for state scope data (AWC IDs, district info)
const scopeCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60000 // 60 seconds

interface StateScope {
    stateId: string
    districts: { id: string; name: string }[]
    districtIds: string[]
    mandalIds: string[]
    awcIds: string[]
    childIds: string[]
}

async function getStateScope(adminSb: ReturnType<typeof createAdminClient>): Promise<StateScope | null> {
    const userSb = await createClient()
    const { data: { user } } = await userSb.auth.getUser()
    if (!user) return null

    const { data: profile } = await adminSb.from('profiles').select('state_id').eq('id', user.id).single()
    if (!profile?.state_id) return null

    const stateId = profile.state_id

    // Check cache
    const cached = scopeCache.get(stateId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }

    // Fetch scope data in parallel
    const { data: districts } = await adminSb.from('districts').select('id, name').eq('state_id', stateId)
    const districtIds = districts?.map((d: any) => d.id) || []

    if (districtIds.length === 0) {
        const emptyScope = { stateId, districts: [], districtIds: [], mandalIds: [], awcIds: [], childIds: [] }
        scopeCache.set(stateId, { data: emptyScope, timestamp: Date.now() })
        return emptyScope
    }

    const { data: mandals } = await adminSb.from('mandals').select('id').in('district_id', districtIds)
    const mandalIds = mandals?.map((m: any) => m.id) || []

    if (mandalIds.length === 0) {
        const emptyScope = { stateId, districts: districts || [], districtIds, mandalIds: [], awcIds: [], childIds: [] }
        scopeCache.set(stateId, { data: emptyScope, timestamp: Date.now() })
        return emptyScope
    }

    const { data: awcs } = await adminSb.from('awcs').select('id').in('mandal_id', mandalIds).eq('is_active', true)
    const awcIds = awcs?.map((a: any) => a.id) || []

    if (awcIds.length === 0) {
        const emptyScope = { stateId, districts: districts || [], districtIds, mandalIds, awcIds: [], childIds: [] }
        scopeCache.set(stateId, { data: emptyScope, timestamp: Date.now() })
        return emptyScope
    }

    // Fetch all children IDs at once
    const { data: children } = await adminSb.from('children').select('id').in('awc_id', awcIds).eq('is_active', true)
    const childIds = children?.map((c: any) => c.id) || []

    const scope = { stateId, districts: districts || [], districtIds, mandalIds, awcIds, childIds }
    scopeCache.set(stateId, { data: scope, timestamp: Date.now() })
    return scope
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminSb = createAdminClient()

    try {
        const scope = await getStateScope(adminSb)
        if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { districts, districtIds, awcIds, childIds, mandalIds } = scope

        if (childIds.length === 0) {
            // Return empty results immediately
            switch (type) {
                case 'kpis': return NextResponse.json({ total: 0, active: 0, scheduled: 0, completed: 0, overdue: 0, avgWait: 0 })
                case 'pipeline': return NextResponse.json([])
                case 'by-specialist': return NextResponse.json([])
                case 'by-district': return NextResponse.json([])
                case 'trends': return NextResponse.json([])
                case 'facility-grid': return NextResponse.json({ grid: [], totalNodes: 0, atCapacity: 0 })
                case 'overdue': return NextResponse.json([])
                default: return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
            }
        }

        switch (type) {
            case 'kpis': {
                // Fetch all referrals once and aggregate in memory
                const { data: refs } = await adminSb
                    .from('referrals')
                    .select('status, follow_up_date, created_at, completed_at')
                    .in('child_id', childIds)

                const now = new Date()
                const nowStr = now.toISOString().split('T')[0]
                let total = 0, active = 0, scheduled = 0, completed = 0, overdue = 0
                let totalWaitDays = 0, completedCount = 0

                ;(refs || []).forEach((r: any) => {
                    total++
                    if (r.status === 'completed') {
                        completed++
                        if (r.completed_at && r.created_at) {
                            totalWaitDays += (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
                            completedCount++
                        }
                    } else if (r.status === 'scheduled') {
                        scheduled++
                    } else if (r.status === 'created' || r.status === 'informed') {
                        active++
                    }

                    if (r.follow_up_date && r.follow_up_date < nowStr && r.status !== 'completed' && r.status !== 'cancelled') {
                        overdue++
                    }
                })

                return NextResponse.json({
                    total,
                    active,
                    scheduled,
                    completed,
                    overdue,
                    avgWait: completedCount > 0 ? Math.round(totalWaitDays / completedCount) : 0
                })
            }

            case 'pipeline': {
                // Single query + memory aggregation
                const { data: refs } = await adminSb
                    .from('referrals')
                    .select('status, created_at, completed_at')
                    .in('child_id', childIds)

                let generated = 0, sent = 0, scheduled = 0, completed = 0
                let totalDays = 0, completedWithDates = 0

                ;(refs || []).forEach((r: any) => {
                    generated++
                    if (r.status !== 'created') sent++
                    if (['scheduled', 'visited', 'results_received', 'completed'].includes(r.status)) scheduled++
                    if (r.status === 'completed') {
                        completed++
                        if (r.completed_at && r.created_at) {
                            totalDays += (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
                            completedWithDates++
                        }
                    }
                })

                const avgDays = completedWithDates > 0 ? Math.round(totalDays / completedWithDates) : 0

                return NextResponse.json([
                    { label: 'GENERATED', value: generated, pct: '100%', time: 'Day 0' },
                    { label: 'SENT', value: sent, pct: generated > 0 ? `${Math.round((sent / generated) * 100)}%` : '0%', time: '' },
                    { label: 'SCHEDULED', value: scheduled, pct: generated > 0 ? `${Math.round((scheduled / generated) * 100)}%` : '0%', time: '' },
                    { label: 'COMPLETED', value: completed, pct: generated > 0 ? `${Math.round((completed / generated) * 100)}%` : '0%', time: avgDays > 0 ? `+${avgDays} Days` : '' },
                ])
            }

            case 'by-specialist': {
                const { data: refs } = await adminSb
                    .from('referrals')
                    .select('referral_type, status, follow_up_date')
                    .in('child_id', childIds)

                const now = new Date()
                const typeMap: Record<string, { active: number; completed: number; overdue: number }> = {}

                ;(refs || []).forEach((r: any) => {
                    const t = r.referral_type || 'other'
                    if (!typeMap[t]) typeMap[t] = { active: 0, completed: 0, overdue: 0 }

                    if (r.status === 'completed') {
                        typeMap[t].completed++
                    } else if (r.follow_up_date && new Date(r.follow_up_date) < now && r.status !== 'cancelled') {
                        typeMap[t].overdue++
                    } else if (r.status !== 'cancelled') {
                        typeMap[t].active++
                    }
                })

                return NextResponse.json(
                    Object.entries(typeMap)
                        .map(([name, counts]) => ({
                            name: name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                            ...counts
                        }))
                        .sort((a, b) => (b.active + b.completed + b.overdue) - (a.active + a.completed + a.overdue))
                )
            }

            case 'by-district': {
                // Fetch children with AWC in single query
                const { data: stateChildren } = await adminSb
                    .from('children')
                    .select('id, awc_id')
                    .in('awc_id', awcIds)
                    .eq('is_active', true)

                const childToAwc = new Map((stateChildren || []).map((c: any) => [c.id, c.awc_id]))

                // Fetch AWC→mandal and mandal→district mappings
                const [awcRes, mandalRes] = await Promise.all([
                    adminSb.from('awcs').select('id, mandal_id').in('id', awcIds),
                    adminSb.from('mandals').select('id, district_id').in('id', mandalIds)
                ])

                const awcToMandal = new Map((awcRes.data || []).map((a: any) => [a.id, a.mandal_id]))
                const mandalToDistrict = new Map((mandalRes.data || []).map((m: any) => [m.id, m.district_id]))

                const { data: refs } = await adminSb
                    .from('referrals')
                    .select('child_id, status')
                    .in('child_id', childIds)

                const distData: Record<string, { name: string; active: number; completed: number }> = {}
                districts.forEach(d => { distData[d.id] = { name: d.name, active: 0, completed: 0 } })

                ;(refs || []).forEach((r: any) => {
                    const awcId = childToAwc.get(r.child_id)
                    const mandalId = awcId ? awcToMandal.get(awcId) : null
                    const distId = mandalId ? mandalToDistrict.get(mandalId) : null
                    if (distId && distData[distId]) {
                        if (r.status === 'completed') distData[distId].completed++
                        else if (r.status !== 'cancelled') distData[distId].active++
                    }
                })

                return NextResponse.json(Object.values(distData).filter(d => d.active > 0 || d.completed > 0))
            }

            case 'trends': {
                const twelveMonthsAgo = new Date()
                twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

                const { data: refs } = await adminSb
                    .from('referrals')
                    .select('created_at, completed_at, status')
                    .in('child_id', childIds)
                    .gte('created_at', twelveMonthsAgo.toISOString())

                const months: string[] = []
                const now = new Date()
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                    months.push(d.toLocaleDateString('en-US', { month: 'short' }))
                }

                const data = months.map(m => ({ month: m, generated: 0, completed: 0, rate: 0 }))

                ;(refs || []).forEach((r: any) => {
                    const createdMonth = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short' })
                    const genEntry = data.find(d => d.month === createdMonth)
                    if (genEntry) genEntry.generated++

                    if (r.status === 'completed' && r.completed_at) {
                        const completedMonth = new Date(r.completed_at).toLocaleDateString('en-US', { month: 'short' })
                        const compEntry = data.find(d => d.month === completedMonth)
                        if (compEntry) compEntry.completed++
                    }
                })

                data.forEach(d => {
                    d.rate = d.generated > 0 ? Math.round((d.completed / d.generated) * 100) : 0
                })

                return NextResponse.json(data)
            }

            case 'facility-grid': {
                const [facilitiesRes, refsRes] = await Promise.all([
                    adminSb
                        .from('referral_directory')
                        .select('id, name, type, district_id')
                        .in('district_id', districtIds)
                        .eq('is_active', true),
                    adminSb
                        .from('referrals')
                        .select('referral_directory_id')
                        .in('child_id', childIds)
                        .not('status', 'in', '("completed","cancelled")')
                ])

                const facilities = facilitiesRes.data || []
                if (facilities.length === 0) {
                    return NextResponse.json({ grid: [], totalNodes: 0, atCapacity: 0 })
                }

                const loadMap = new Map<string, number>()
                ;(refsRes.data || []).forEach((r: any) => {
                    if (r.referral_directory_id) {
                        loadMap.set(r.referral_directory_id, (loadMap.get(r.referral_directory_id) || 0) + 1)
                    }
                })

                const facilityTypes = ['DEIC', 'district_hospital', 'PHC', 'CHC', 'therapy_center', 'private_hospital', 'special_school']

                const grid = districts.map(d => {
                    const distFacilities = facilities.filter((f: any) => f.district_id === d.id)
                    const statuses: Record<string, string> = {}

                    facilityTypes.forEach(ft => {
                        const matching = distFacilities.filter((f: any) => f.type === ft)
                        if (matching.length === 0) {
                            statuses[ft] = 'None'
                        } else {
                            const totalLoad = matching.reduce((sum: number, f: any) => sum + (loadMap.get(f.id) || 0), 0)
                            const avgLoad = totalLoad / matching.length
                            if (avgLoad > 20) statuses[ft] = 'Capacity'
                            else if (avgLoad > 10) statuses[ft] = 'Limited'
                            else statuses[ft] = 'Available'
                        }
                    })

                    return { districtId: d.id, districtName: d.name, statuses }
                })

                return NextResponse.json({
                    grid,
                    totalNodes: facilities.length,
                    atCapacity: grid.reduce((sum, row) => sum + Object.values(row.statuses).filter(s => s === 'Capacity').length, 0),
                    facilityTypes
                })
            }

            case 'overdue': {
                const now = new Date().toISOString().split('T')[0]
                const { data: overdueRefs } = await adminSb
                    .from('referrals')
                    .select('id, child_id, referral_type, status, follow_up_date')
                    .in('child_id', childIds)
                    .not('status', 'in', '("completed","cancelled")')
                    .lt('follow_up_date', now)
                    .order('follow_up_date', { ascending: true })
                    .limit(50)

                if (!overdueRefs?.length) return NextResponse.json([])

                const overdueChildIds = [...new Set(overdueRefs.map(r => r.child_id))]

                // Fetch child details and location mappings in parallel
                const [childRes, awcRes, mandalRes] = await Promise.all([
                    adminSb.from('children').select('id, name, awc_id').in('id', overdueChildIds),
                    adminSb.from('awcs').select('id, mandal_id').in('id', awcIds),
                    adminSb.from('mandals').select('id, district_id').in('id', mandalIds)
                ])

                const childMap = new Map((childRes.data || []).map((c: any) => [c.id, { name: c.name, awcId: c.awc_id }]))
                const awcToMandal = new Map((awcRes.data || []).map((a: any) => [a.id, a.mandal_id]))
                const mandalToDistrict = new Map((mandalRes.data || []).map((m: any) => [m.id, m.district_id]))
                const districtNameMap = new Map(districts.map(d => [d.id, d.name]))

                const result = overdueRefs.map(r => {
                    const child = childMap.get(r.child_id)
                    const mandalId = child?.awcId ? awcToMandal.get(child.awcId) : null
                    const distId = mandalId ? mandalToDistrict.get(mandalId) : null
                    const daysOverdue = Math.round((Date.now() - new Date(r.follow_up_date).getTime()) / (1000 * 60 * 60 * 24))

                    return {
                        id: r.id.slice(0, 8).toUpperCase(),
                        childName: child?.name || 'Unknown',
                        district: distId ? districtNameMap.get(distId) : 'Unknown',
                        type: (r.referral_type || 'other').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                        daysOverdue,
                        status: r.status === 'scheduled' ? 'Scheduled' : 'Active'
                    }
                })

                return NextResponse.json(result)
            }

            default:
                return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('Referrals API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
