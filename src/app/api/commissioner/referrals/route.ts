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

    const { data: mandals } = await adminSb.from('mandals').select('id').in('district_id', districtIds)
    const mandalIds = mandals?.map((m: any) => m.id) || []

    const { data: awcs } = await adminSb.from('awcs').select('id').in('mandal_id', mandalIds)
    const awcIds = awcs?.map((a: any) => a.id) || []

    return { stateId, districts: districts || [], districtIds, mandalIds, awcIds }
}

async function getStateChildIds(adminSb: ReturnType<typeof createAdminClient>, awcIds: string[]) {
    if (awcIds.length === 0) return []
    const { data } = await adminSb.from('children').select('id').in('awc_id', awcIds)
    return data?.map((c: any) => c.id) || []
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminSb = createAdminClient()

    try {
        const scope = await getStateScope(adminSb)
        if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { districts, districtIds, awcIds } = scope
        const childIds = await getStateChildIds(adminSb, awcIds)

        switch (type) {
            // ═══════════════════════════════════════════════════════
            // KPIs
            // ═══════════════════════════════════════════════════════
            case 'kpis': {
                if (childIds.length === 0) {
                    return NextResponse.json({ total: 0, active: 0, scheduled: 0, completed: 0, overdue: 0, avgWait: 0 })
                }

                const [totalRes, activeRes, scheduledRes, completedRes] = await Promise.all([
                    adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds),
                    adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds).in('status', ['created', 'informed']),
                    adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds).eq('status', 'scheduled'),
                    adminSb.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds).eq('status', 'completed'),
                ])

                // Overdue: follow_up_date passed and not completed/cancelled
                const now = new Date().toISOString().split('T')[0]
                const { count: overdueCount } = await adminSb
                    .from('referrals').select('*', { count: 'exact', head: true })
                    .in('child_id', childIds)
                    .not('status', 'in', '("completed","cancelled")')
                    .lt('follow_up_date', now)

                // Avg wait time
                const { data: completedRefs } = await adminSb
                    .from('referrals').select('created_at, completed_at')
                    .in('child_id', childIds).eq('status', 'completed')
                    .not('completed_at', 'is', null)

                let avgWait = 0
                if (completedRefs?.length) {
                    const totalDays = completedRefs.reduce((sum: number, r: any) => {
                        return sum + (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
                    }, 0)
                    avgWait = Math.round(totalDays / completedRefs.length)
                }

                return NextResponse.json({
                    total: totalRes.count || 0,
                    active: activeRes.count || 0,
                    scheduled: scheduledRes.count || 0,
                    completed: completedRes.count || 0,
                    overdue: overdueCount || 0,
                    avgWait
                })
            }

            // ═══════════════════════════════════════════════════════
            // PIPELINE FUNNEL
            // ═══════════════════════════════════════════════════════
            case 'pipeline': {
                if (childIds.length === 0) return NextResponse.json([])

                const { count: generated } = await adminSb
                    .from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds)

                const { count: sent } = await adminSb
                    .from('referrals').select('*', { count: 'exact', head: true })
                    .in('child_id', childIds).not('status', 'eq', 'created')

                const { count: scheduled } = await adminSb
                    .from('referrals').select('*', { count: 'exact', head: true })
                    .in('child_id', childIds)
                    .in('status', ['scheduled', 'visited', 'results_received', 'completed'])

                const { count: completed } = await adminSb
                    .from('referrals').select('*', { count: 'exact', head: true })
                    .in('child_id', childIds).eq('status', 'completed')

                const g = generated || 0, s = sent || 0, sc = scheduled || 0, c = completed || 0
                const steps = [
                    { label: 'GENERATED', value: g, pct: '100%', time: 'Day 0' },
                    { label: 'SENT', value: s, pct: g > 0 ? `${Math.round((s / g) * 100)}%` : '0%', time: '' },
                    { label: 'SCHEDULED', value: sc, pct: g > 0 ? `${Math.round((sc / g) * 100)}%` : '0%', time: '' },
                    { label: 'COMPLETED', value: c, pct: g > 0 ? `${Math.round((c / g) * 100)}%` : '0%', time: '' },
                ]

                // Compute avg time between stages for completed referrals
                const { data: timeData } = await adminSb
                    .from('referrals').select('created_at, completed_at')
                    .in('child_id', childIds).eq('status', 'completed').not('completed_at', 'is', null).limit(100)

                if (timeData?.length) {
                    const avgDays = timeData.reduce((sum: number, r: any) => {
                        return sum + (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
                    }, 0) / timeData.length
                    steps[3].time = `+${Math.round(avgDays)} Days`
                }

                return NextResponse.json(steps)
            }

            // ═══════════════════════════════════════════════════════
            // BY SPECIALIST TYPE
            // ═══════════════════════════════════════════════════════
            case 'by-specialist': {
                if (childIds.length === 0) return NextResponse.json([])

                const { data: refs } = await adminSb
                    .from('referrals').select('referral_type, status, follow_up_date')
                    .in('child_id', childIds)

                const now = new Date()
                const typeMap: Record<string, { active: number; completed: number; overdue: number }> = {}

                refs?.forEach((r: any) => {
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

                const result = Object.entries(typeMap)
                    .map(([name, counts]) => ({
                        name: name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                        ...counts
                    }))
                    .sort((a, b) => (b.active + b.completed + b.overdue) - (a.active + a.completed + a.overdue))

                return NextResponse.json(result)
            }

            // ═══════════════════════════════════════════════════════
            // BY DISTRICT
            // ═══════════════════════════════════════════════════════
            case 'by-district': {
                if (childIds.length === 0) return NextResponse.json([])

                // Build child → AWC → mandal → district mapping
                const { data: stateChildren } = await adminSb.from('children').select('id, awc_id').in('awc_id', awcIds)
                const childToAwc = new Map(stateChildren?.map((c: any) => [c.id, c.awc_id]) || [])

                const { data: awcList } = await adminSb.from('awcs').select('id, mandal_id').in('id', awcIds)
                const { data: mandalList } = await adminSb.from('mandals').select('id, district_id').in('id', scope.mandalIds)
                const awcToMandal = new Map(awcList?.map((a: any) => [a.id, a.mandal_id]) || [])
                const mandalToDistrict = new Map(mandalList?.map((m: any) => [m.id, m.district_id]) || [])
                const districtNameMap = new Map(districts.map(d => [d.id, d.name]))

                const { data: refs } = await adminSb
                    .from('referrals').select('child_id, status')
                    .in('child_id', childIds)

                const distData: Record<string, { name: string; active: number; completed: number }> = {}
                districts.forEach(d => { distData[d.id] = { name: d.name, active: 0, completed: 0 } })

                refs?.forEach((r: any) => {
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

            // ═══════════════════════════════════════════════════════
            // MONTHLY TRENDS
            // ═══════════════════════════════════════════════════════
            case 'trends': {
                if (childIds.length === 0) return NextResponse.json([])

                const twelveMonthsAgo = new Date()
                twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

                const { data: refs } = await adminSb
                    .from('referrals').select('created_at, completed_at, status')
                    .in('child_id', childIds)
                    .gte('created_at', twelveMonthsAgo.toISOString())

                const months: string[] = []
                const now = new Date()
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                    months.push(d.toLocaleDateString('en-US', { month: 'short' }))
                }

                const data = months.map(m => ({ month: m, generated: 0, completed: 0, rate: 0 }))

                refs?.forEach((r: any) => {
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

            // ═══════════════════════════════════════════════════════
            // FACILITY GRID
            // ═══════════════════════════════════════════════════════
            case 'facility-grid': {
                const { data: facilities } = await adminSb
                    .from('referral_directory')
                    .select('id, name, type, specialties, district_id, accepts_referrals, is_active')
                    .in('district_id', districtIds)
                    .eq('is_active', true)

                if (!facilities?.length) {
                    return NextResponse.json({ grid: [], totalNodes: 0, atCapacity: 0 })
                }

                const facilityTypes = ['DEIC', 'district_hospital', 'PHC', 'CHC', 'therapy_center', 'private_hospital', 'special_school']
                const districtNameMap = new Map(districts.map(d => [d.id, d.name]))

                // Count referrals per facility to estimate load
                const { data: refsByDir } = await adminSb
                    .from('referrals').select('referral_directory_id')
                    .in('child_id', childIds)
                    .not('status', 'in', '("completed","cancelled")')

                const loadMap = new Map<string, number>()
                refsByDir?.forEach((r: any) => {
                    if (r.referral_directory_id) {
                        loadMap.set(r.referral_directory_id, (loadMap.get(r.referral_directory_id) || 0) + 1)
                    }
                })

                // Build grid: district × facility type
                const grid = districts.map(d => {
                    const distFacilities = facilities.filter(f => f.district_id === d.id)
                    const statuses: Record<string, string> = {}

                    facilityTypes.forEach(ft => {
                        const matching = distFacilities.filter(f => f.type === ft)
                        if (matching.length === 0) {
                            statuses[ft] = 'None'
                        } else {
                            const totalLoad = matching.reduce((sum, f) => sum + (loadMap.get(f.id) || 0), 0)
                            const avgLoad = totalLoad / matching.length
                            if (avgLoad > 20) statuses[ft] = 'Capacity'
                            else if (avgLoad > 10) statuses[ft] = 'Limited'
                            else statuses[ft] = 'Available'
                        }
                    })

                    return { districtId: d.id, districtName: d.name, statuses }
                })

                const totalNodes = facilities.length
                const atCapacity = grid.reduce((sum, row) => {
                    return sum + Object.values(row.statuses).filter(s => s === 'Capacity').length
                }, 0)

                return NextResponse.json({ grid, totalNodes, atCapacity, facilityTypes })
            }

            // ═══════════════════════════════════════════════════════
            // OVERDUE REFERRALS TABLE
            // ═══════════════════════════════════════════════════════
            case 'overdue': {
                if (childIds.length === 0) return NextResponse.json([])

                const now = new Date().toISOString().split('T')[0]
                const { data: overdueRefs } = await adminSb
                    .from('referrals')
                    .select('id, child_id, referral_type, status, follow_up_date, created_at')
                    .in('child_id', childIds)
                    .not('status', 'in', '("completed","cancelled")')
                    .lt('follow_up_date', now)
                    .order('follow_up_date', { ascending: true })
                    .limit(50)

                if (!overdueRefs?.length) return NextResponse.json([])

                // Get child details
                const overdueChildIds = overdueRefs.map(r => r.child_id)
                const { data: childDetails } = await adminSb
                    .from('children').select('id, name, awc_id')
                    .in('id', overdueChildIds)

                // Build child → district name mapping
                const childAwcMap = new Map(childDetails?.map((c: any) => [c.id, c.awc_id]) || [])
                const { data: awcList } = await adminSb.from('awcs').select('id, mandal_id').in('id', [...new Set(childDetails?.map((c: any) => c.awc_id) || [])])
                const { data: mandalList } = await adminSb.from('mandals').select('id, district_id').in('id', awcList?.map((a: any) => a.mandal_id) || [])
                const awcToMandal = new Map(awcList?.map((a: any) => [a.id, a.mandal_id]) || [])
                const mandalToDistrict = new Map(mandalList?.map((m: any) => [m.id, m.district_id]) || [])
                const districtNameMap = new Map(districts.map(d => [d.id, d.name]))
                const childNameMap = new Map(childDetails?.map((c: any) => [c.id, c.name]) || [])

                const result = overdueRefs.map(r => {
                    const awcId = childAwcMap.get(r.child_id)
                    const mandalId = awcId ? awcToMandal.get(awcId) : null
                    const distId = mandalId ? mandalToDistrict.get(mandalId) : null
                    const distName = distId ? districtNameMap.get(distId) : 'Unknown'
                    const daysOverdue = Math.round((Date.now() - new Date(r.follow_up_date).getTime()) / (1000 * 60 * 60 * 24))

                    return {
                        id: r.id.slice(0, 8).toUpperCase(),
                        childName: childNameMap.get(r.child_id) || 'Unknown',
                        district: distName,
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
