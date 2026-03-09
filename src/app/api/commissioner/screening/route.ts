import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Helper to get the commissioner's state-scoped IDs
async function getStateScope(adminSb: ReturnType<typeof createAdminClient>) {
    const userSb = await createClient()
    const { data: { user } } = await userSb.auth.getUser()
    if (!user) return null

    const { data: profile } = await adminSb.from('profiles').select('state_id').eq('id', user.id).single()
    if (!profile?.state_id) return null

    const stateId = profile.state_id

    // Get districts in state
    const { data: districts } = await adminSb.from('districts').select('id, name').eq('state_id', stateId)
    const districtIds = districts?.map(d => d.id) || []

    // Get mandals in those districts
    const { data: mandals } = await adminSb.from('mandals').select('id').in('district_id', districtIds)
    const mandalIds = mandals?.map(m => m.id) || []

    // Get AWCs in those mandals
    const { data: awcs } = await adminSb.from('awcs').select('id').in('mandal_id', mandalIds)
    const awcIds = awcs?.map(a => a.id) || []

    return { stateId, districts: districts || [], districtIds, mandalIds, awcIds }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminSb = createAdminClient()

    try {
        const scope = await getStateScope(adminSb)
        if (!scope) {
            return NextResponse.json({ error: 'Unauthorized or no state assigned' }, { status: 401 })
        }

        const { districts, districtIds, awcIds } = scope

        switch (type) {
            // ═══════════════════════════════════════════════════════
            // COVERAGE TAB
            // ═══════════════════════════════════════════════════════
            case 'coverage-kpis': {
                if (awcIds.length === 0) {
                    return NextResponse.json({ total: 0, screened: 0, unscreened: 0, rate: 0 })
                }

                const { count: total } = await adminSb
                    .from('children').select('*', { count: 'exact', head: true })
                    .in('awc_id', awcIds).eq('is_active', true)

                const { count: screened } = await adminSb
                    .from('children').select('*', { count: 'exact', head: true })
                    .in('awc_id', awcIds).eq('is_active', true).not('last_screening_date', 'is', null)

                const t = total || 0
                const s = screened || 0
                return NextResponse.json({
                    total: t,
                    screened: s,
                    unscreened: t - s,
                    rate: t > 0 ? Math.round((s / t) * 1000) / 10 : 0
                })
            }

            case 'district-coverage': {
                // For each district, get AWC IDs, then count children/screened
                const result = await Promise.all(districts.map(async (dist) => {
                    const { data: dMandals } = await adminSb.from('mandals').select('id').eq('district_id', dist.id)
                    const dMandalIds = dMandals?.map(m => m.id) || []
                    if (dMandalIds.length === 0) return { id: dist.id, name: dist.name, total: 0, screened: 0, coverage: 0 }

                    const { data: dAwcs } = await adminSb.from('awcs').select('id').in('mandal_id', dMandalIds)
                    const dAwcIds = dAwcs?.map(a => a.id) || []
                    if (dAwcIds.length === 0) return { id: dist.id, name: dist.name, total: 0, screened: 0, coverage: 0 }

                    const { count: dTotal } = await adminSb
                        .from('children').select('*', { count: 'exact', head: true })
                        .in('awc_id', dAwcIds).eq('is_active', true)

                    const { count: dScreened } = await adminSb
                        .from('children').select('*', { count: 'exact', head: true })
                        .in('awc_id', dAwcIds).eq('is_active', true).not('last_screening_date', 'is', null)

                    const t = dTotal || 0
                    const s = dScreened || 0
                    return {
                        id: dist.id,
                        name: dist.name,
                        total: t,
                        screened: s,
                        coverage: t > 0 ? Math.round((s / t) * 1000) / 10 : 0
                    }
                }))

                return NextResponse.json(result)
            }

            case 'age-bands': {
                if (awcIds.length === 0) return NextResponse.json([])

                const { data: children } = await adminSb
                    .from('children').select('dob, last_screening_date')
                    .in('awc_id', awcIds).eq('is_active', true)

                const bands = [
                    { band: '0-1 yr', min: 0, max: 12, screened: 0, unscreened: 0 },
                    { band: '1-2 yr', min: 12, max: 24, screened: 0, unscreened: 0 },
                    { band: '2-3 yr', min: 24, max: 36, screened: 0, unscreened: 0 },
                    { band: '3-4 yr', min: 36, max: 48, screened: 0, unscreened: 0 },
                    { band: '4-5 yr', min: 48, max: 60, screened: 0, unscreened: 0 },
                    { band: '5-6 yr', min: 60, max: 72, screened: 0, unscreened: 0 },
                ]

                const now = new Date()
                children?.forEach(c => {
                    const dob = new Date(c.dob)
                    const ageMonths = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
                    const band = bands.find(b => ageMonths >= b.min && ageMonths < b.max)
                    if (band) {
                        if (c.last_screening_date) band.screened++
                        else band.unscreened++
                    }
                })

                return NextResponse.json(bands.map(b => ({ band: b.band, screened: b.screened, unscreened: b.unscreened })))
            }

            case 'coverage-trends': {
                if (awcIds.length === 0) return NextResponse.json([])

                const { data: children } = await adminSb
                    .from('children')
                    .select('last_screening_date, awc_id')
                    .in('awc_id', awcIds).eq('is_active', true)
                    .not('last_screening_date', 'is', null)

                // Build AWC → district mapping
                const { data: awcList } = await adminSb.from('awcs').select('id, mandal_id').in('id', awcIds)
                const { data: mandalList } = await adminSb.from('mandals').select('id, district_id').in('id', scope.mandalIds)

                const awcToMandal = new Map(awcList?.map(a => [a.id, a.mandal_id]) || [])
                const mandalToDistrict = new Map(mandalList?.map(m => [m.id, m.district_id]) || [])
                const districtNames = new Map(districts.map(d => [d.id, d.name]))

                // Generate last 12 months
                const months: string[] = []
                const now = new Date()
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                    months.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
                }

                // Count screenings per month per district
                const data = months.map(month => {
                    const entry: Record<string, any> = { month }
                    districts.forEach(d => { entry[d.name] = 0 })
                    entry['State Avg'] = 0
                    return entry
                })

                children?.forEach(c => {
                    if (!c.last_screening_date) return
                    const sd = new Date(c.last_screening_date)
                    const monthLabel = sd.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    const dataPoint = data.find(d => d.month === monthLabel)
                    if (!dataPoint) return

                    const mandalId = awcToMandal.get(c.awc_id)
                    const districtId = mandalId ? mandalToDistrict.get(mandalId) : null
                    const distName = districtId ? districtNames.get(districtId) : null
                    if (distName && dataPoint[distName] !== undefined) {
                        dataPoint[distName]++
                    }
                })

                // Compute state avg
                data.forEach(entry => {
                    let sum = 0, count = 0
                    districts.forEach(d => {
                        sum += entry[d.name] || 0
                        count++
                    })
                    entry['State Avg'] = count > 0 ? Math.round(sum / count) : 0
                })

                return NextResponse.json({ months: data, districtNames: districts.map(d => d.name) })
            }

            // ═══════════════════════════════════════════════════════
            // RISK DISTRIBUTION TAB
            // ═══════════════════════════════════════════════════════
            case 'risk-kpis': {
                if (awcIds.length === 0) {
                    return NextResponse.json({ high: 0, critical: 0, medium: 0, normal: 0 })
                }

                const [highRes, medRes, normalRes, critRes] = await Promise.all([
                    adminSb.from('children').select('*', { count: 'exact', head: true })
                        .in('awc_id', awcIds).eq('is_active', true).eq('current_risk_level', 'high'),
                    adminSb.from('children').select('*', { count: 'exact', head: true })
                        .in('awc_id', awcIds).eq('is_active', true).eq('current_risk_level', 'medium'),
                    adminSb.from('children').select('*', { count: 'exact', head: true })
                        .in('awc_id', awcIds).eq('is_active', true)
                        .or('current_risk_level.is.null,current_risk_level.eq.normal'),
                    adminSb.from('flags').select('*', { count: 'exact', head: true })
                        .eq('priority', 'critical').eq('status', 'raised')
                ])

                // For critical flags, filter by child's AWC
                const { data: critFlags } = await adminSb
                    .from('flags').select('child_id')
                    .eq('priority', 'critical')

                let critCount = 0
                if (critFlags) {
                    const critChildIds = critFlags.map(f => f.child_id)
                    if (critChildIds.length > 0) {
                        const { data: critChildren } = await adminSb
                            .from('children').select('id')
                            .in('id', critChildIds).in('awc_id', awcIds)
                        critCount = critChildren?.length || 0
                    }
                }

                return NextResponse.json({
                    high: highRes.count || 0,
                    medium: medRes.count || 0,
                    normal: normalRes.count || 0,
                    critical: critCount
                })
            }

            case 'risk-by-district': {
                const result = await Promise.all(districts.map(async (dist) => {
                    const { data: dMandals } = await adminSb.from('mandals').select('id').eq('district_id', dist.id)
                    const dMandalIds = dMandals?.map(m => m.id) || []
                    if (dMandalIds.length === 0) return { name: dist.name, Low: 0, Medium: 0, High: 0, Critical: 0 }

                    const { data: dAwcs } = await adminSb.from('awcs').select('id').in('mandal_id', dMandalIds)
                    const dAwcIds = dAwcs?.map(a => a.id) || []
                    if (dAwcIds.length === 0) return { name: dist.name, Low: 0, Medium: 0, High: 0, Critical: 0 }

                    const { data: dChildren } = await adminSb
                        .from('children').select('current_risk_level')
                        .in('awc_id', dAwcIds).eq('is_active', true)

                    let low = 0, med = 0, high = 0, crit = 0
                    dChildren?.forEach(c => {
                        switch (c.current_risk_level) {
                            case 'high': high++; break
                            case 'medium': med++; break
                            case 'critical': crit++; break
                            default: low++
                        }
                    })

                    return { name: dist.name, Low: low, Medium: med, High: high, Critical: crit }
                }))

                return NextResponse.json(result)
            }

            // ═══════════════════════════════════════════════════════
            // CONDITIONS TAB
            // ═══════════════════════════════════════════════════════
            case 'conditions': {
                // Get all child IDs in state
                const { data: stateChildren } = await adminSb
                    .from('children').select('id')
                    .in('awc_id', awcIds).eq('is_active', true)
                const childIds = stateChildren?.map(c => c.id) || []

                if (childIds.length === 0) return NextResponse.json({ conditions: [], total: 0 })

                const { data: flags } = await adminSb
                    .from('flags').select('category')
                    .in('child_id', childIds)

                const counts: Record<string, number> = {}
                flags?.forEach(f => {
                    const cat = f.category || 'other'
                    counts[cat] = (counts[cat] || 0) + 1
                })

                const total = childIds.length
                const conditions = Object.entries(counts)
                    .map(([condition, count]) => ({
                        condition: condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        count,
                        rate: Math.round((count / total) * 10000) / 10 // per 1000
                    }))
                    .sort((a, b) => b.count - a.count)

                return NextResponse.json({ conditions, total })
            }

            case 'condition-heatmap': {
                // Category × District cross-tab
                const { data: stateChildren } = await adminSb
                    .from('children').select('id, awc_id')
                    .in('awc_id', awcIds).eq('is_active', true)

                const childIds = stateChildren?.map(c => c.id) || []
                if (childIds.length === 0) return NextResponse.json({ heatmap: [], districts: [], categories: [] })

                const { data: flags } = await adminSb
                    .from('flags').select('category, child_id')
                    .in('child_id', childIds)

                // Build child → AWC → mandal → district mapping
                const childToAwc = new Map(stateChildren?.map(c => [c.id, c.awc_id]) || [])
                const { data: awcList } = await adminSb.from('awcs').select('id, mandal_id').in('id', awcIds)
                const { data: mandalList } = await adminSb.from('mandals').select('id, district_id').in('id', scope.mandalIds)
                const awcToMandal = new Map(awcList?.map(a => [a.id, a.mandal_id]) || [])
                const mandalToDistrict = new Map(mandalList?.map(m => [m.id, m.district_id]) || [])
                const districtNameMap = new Map(districts.map(d => [d.id, d.name]))

                const categories = [...new Set(flags?.map(f => f.category || 'other') || [])]

                // Build cross-tab: { category: { districtName: count } }
                const heatmap: Record<string, Record<string, number>> = {}
                categories.forEach(cat => { heatmap[cat] = {} })

                flags?.forEach(f => {
                    const cat = f.category || 'other'
                    const awcId = childToAwc.get(f.child_id)
                    const mandalId = awcId ? awcToMandal.get(awcId) : null
                    const distId = mandalId ? mandalToDistrict.get(mandalId) : null
                    const distName = distId ? districtNameMap.get(distId) : null
                    if (distName) {
                        heatmap[cat][distName] = (heatmap[cat][distName] || 0) + 1
                    }
                })

                return NextResponse.json({
                    heatmap,
                    districts: districts.map(d => d.name),
                    categories: categories.map(c => c.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()))
                })
            }

            case 'condition-trends': {
                const { data: stateChildren } = await adminSb
                    .from('children').select('id')
                    .in('awc_id', awcIds).eq('is_active', true)
                const childIds = stateChildren?.map(c => c.id) || []
                if (childIds.length === 0) return NextResponse.json([])

                const sixMonthsAgo = new Date()
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

                const { data: flags } = await adminSb
                    .from('flags').select('category, created_at')
                    .in('child_id', childIds)
                    .gte('created_at', sixMonthsAgo.toISOString())

                // Group by month
                const months: string[] = []
                const now = new Date()
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                    months.push(d.toLocaleDateString('en-US', { month: 'short' }))
                }

                const categories = [...new Set(flags?.map(f => f.category || 'other') || [])]
                const data = months.map(month => {
                    const entry: Record<string, any> = { name: month }
                    categories.forEach(c => { entry[c.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())] = 0 })
                    return entry
                })

                flags?.forEach(f => {
                    const d = new Date(f.created_at)
                    const monthLabel = d.toLocaleDateString('en-US', { month: 'short' })
                    const point = data.find(p => p.name === monthLabel)
                    if (point) {
                        const catLabel = (f.category || 'other').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                        if (point[catLabel] !== undefined) point[catLabel]++
                    }
                })

                return NextResponse.json({
                    data,
                    categories: categories.map(c => c.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()))
                })
            }

            default:
                return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('Screening API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
