import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Cache for state scope data
const scopeCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60000

interface StateScope {
    stateId: string
    districts: { id: string; name: string }[]
    districtIds: string[]
    mandalIds: string[]
    awcIds: string[]
    // Mapping for efficient district lookups
    awcToDistrict: Map<string, string>
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

    // Fetch all scope data
    const { data: districts } = await adminSb.from('districts').select('id, name').eq('state_id', stateId)
    const districtIds = districts?.map(d => d.id) || []

    if (districtIds.length === 0) {
        const emptyScope: StateScope = { stateId, districts: [], districtIds: [], mandalIds: [], awcIds: [], awcToDistrict: new Map() }
        scopeCache.set(stateId, { data: emptyScope, timestamp: Date.now() })
        return emptyScope
    }

    const { data: mandals } = await adminSb.from('mandals').select('id, district_id').in('district_id', districtIds)
    const mandalIds = mandals?.map(m => m.id) || []

    if (mandalIds.length === 0) {
        const emptyScope: StateScope = { stateId, districts: districts || [], districtIds, mandalIds: [], awcIds: [], awcToDistrict: new Map() }
        scopeCache.set(stateId, { data: emptyScope, timestamp: Date.now() })
        return emptyScope
    }

    const mandalToDistrict = new Map((mandals || []).map(m => [m.id, m.district_id]))

    const { data: awcs } = await adminSb.from('awcs').select('id, mandal_id').in('mandal_id', mandalIds).eq('is_active', true)
    const awcIds = awcs?.map(a => a.id) || []

    // Build AWC → District mapping for efficient lookups
    const awcToDistrict = new Map<string, string>()
    ;(awcs || []).forEach(a => {
        const distId = mandalToDistrict.get(a.mandal_id)
        if (distId) awcToDistrict.set(a.id, distId)
    })

    const scope: StateScope = { stateId, districts: districts || [], districtIds, mandalIds, awcIds, awcToDistrict }
    scopeCache.set(stateId, { data: scope, timestamp: Date.now() })
    return scope
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

        const { districts, awcIds, awcToDistrict, mandalIds } = scope

        if (awcIds.length === 0) {
            // Return empty results immediately based on type
            switch (type) {
                case 'coverage-kpis': return NextResponse.json({ total: 0, screened: 0, unscreened: 0, rate: 0 })
                case 'district-coverage': return NextResponse.json(districts.map(d => ({ id: d.id, name: d.name, total: 0, screened: 0, coverage: 0 })))
                case 'age-bands': return NextResponse.json([])
                case 'coverage-trends': return NextResponse.json({ months: [], districtNames: [] })
                case 'risk-kpis': return NextResponse.json({ high: 0, critical: 0, medium: 0, normal: 0 })
                case 'risk-by-district': return NextResponse.json(districts.map(d => ({ name: d.name, Low: 0, Medium: 0, High: 0, Critical: 0 })))
                case 'conditions': return NextResponse.json({ conditions: [], total: 0 })
                case 'condition-heatmap': return NextResponse.json({ heatmap: [], districts: [], categories: [] })
                case 'condition-trends': return NextResponse.json([])
                default: return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
            }
        }

        switch (type) {
            case 'coverage-kpis': {
                // Single query + memory aggregation
                const { data: children } = await adminSb
                    .from('children')
                    .select('last_screening_date')
                    .in('awc_id', awcIds)
                    .eq('is_active', true)

                let total = 0, screened = 0
                ;(children || []).forEach(c => {
                    total++
                    if (c.last_screening_date) screened++
                })

                return NextResponse.json({
                    total,
                    screened,
                    unscreened: total - screened,
                    rate: total > 0 ? Math.round((screened / total) * 1000) / 10 : 0
                })
            }

            case 'district-coverage': {
                // OPTIMIZED: Single query, then aggregate by district in memory
                const { data: children } = await adminSb
                    .from('children')
                    .select('awc_id, last_screening_date')
                    .in('awc_id', awcIds)
                    .eq('is_active', true)

                // Initialize district counters
                const distData: Record<string, { total: number; screened: number }> = {}
                districts.forEach(d => { distData[d.id] = { total: 0, screened: 0 } })

                // Aggregate
                ;(children || []).forEach(c => {
                    const distId = awcToDistrict.get(c.awc_id)
                    if (distId && distData[distId]) {
                        distData[distId].total++
                        if (c.last_screening_date) distData[distId].screened++
                    }
                })

                return NextResponse.json(districts.map(d => ({
                    id: d.id,
                    name: d.name,
                    total: distData[d.id].total,
                    screened: distData[d.id].screened,
                    coverage: distData[d.id].total > 0
                        ? Math.round((distData[d.id].screened / distData[d.id].total) * 1000) / 10
                        : 0
                })))
            }

            case 'age-bands': {
                const { data: children } = await adminSb
                    .from('children')
                    .select('dob, last_screening_date')
                    .in('awc_id', awcIds)
                    .eq('is_active', true)

                const bands = [
                    { band: '0-1 yr', min: 0, max: 12, screened: 0, unscreened: 0 },
                    { band: '1-2 yr', min: 12, max: 24, screened: 0, unscreened: 0 },
                    { band: '2-3 yr', min: 24, max: 36, screened: 0, unscreened: 0 },
                    { band: '3-4 yr', min: 36, max: 48, screened: 0, unscreened: 0 },
                    { band: '4-5 yr', min: 48, max: 60, screened: 0, unscreened: 0 },
                    { band: '5-6 yr', min: 60, max: 72, screened: 0, unscreened: 0 },
                ]

                const now = new Date()
                ;(children || []).forEach(c => {
                    if (!c.dob) return
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
                const { data: children } = await adminSb
                    .from('children')
                    .select('last_screening_date, awc_id')
                    .in('awc_id', awcIds)
                    .eq('is_active', true)
                    .not('last_screening_date', 'is', null)

                const districtNames = new Map(districts.map(d => [d.id, d.name]))

                // Generate last 12 months
                const months: string[] = []
                const now = new Date()
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                    months.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
                }

                const data = months.map(month => {
                    const entry: Record<string, any> = { month }
                    districts.forEach(d => { entry[d.name] = 0 })
                    entry['State Avg'] = 0
                    return entry
                })

                ;(children || []).forEach(c => {
                    if (!c.last_screening_date) return
                    const sd = new Date(c.last_screening_date)
                    const monthLabel = sd.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    const dataPoint = data.find(d => d.month === monthLabel)
                    if (!dataPoint) return

                    const distId = awcToDistrict.get(c.awc_id)
                    const distName = distId ? districtNames.get(distId) : null
                    if (distName && dataPoint[distName] !== undefined) {
                        dataPoint[distName]++
                    }
                })

                // Compute state avg
                data.forEach(entry => {
                    let sum = 0
                    districts.forEach(d => { sum += entry[d.name] || 0 })
                    entry['State Avg'] = districts.length > 0 ? Math.round(sum / districts.length) : 0
                })

                return NextResponse.json({ months: data, districtNames: districts.map(d => d.name) })
            }

            case 'risk-kpis': {
                // Single query + aggregation
                const { data: children } = await adminSb
                    .from('children')
                    .select('id, current_risk_level')
                    .in('awc_id', awcIds)
                    .eq('is_active', true)

                let high = 0, medium = 0, normal = 0
                const childIds: string[] = []

                ;(children || []).forEach(c => {
                    childIds.push(c.id)
                    switch (c.current_risk_level) {
                        case 'high': high++; break
                        case 'medium': medium++; break
                        default: normal++
                    }
                })

                // Count critical flags for these children
                let critical = 0
                if (childIds.length > 0) {
                    const { count } = await adminSb
                        .from('flags')
                        .select('*', { count: 'exact', head: true })
                        .in('child_id', childIds)
                        .eq('priority', 'critical')
                    critical = count || 0
                }

                return NextResponse.json({ high, medium, normal, critical })
            }

            case 'risk-by-district': {
                // OPTIMIZED: Single query, then aggregate by district
                const { data: children } = await adminSb
                    .from('children')
                    .select('awc_id, current_risk_level')
                    .in('awc_id', awcIds)
                    .eq('is_active', true)

                const distData: Record<string, { Low: number; Medium: number; High: number; Critical: number }> = {}
                districts.forEach(d => { distData[d.id] = { Low: 0, Medium: 0, High: 0, Critical: 0 } })

                ;(children || []).forEach(c => {
                    const distId = awcToDistrict.get(c.awc_id)
                    if (!distId || !distData[distId]) return

                    switch (c.current_risk_level) {
                        case 'high': distData[distId].High++; break
                        case 'medium': distData[distId].Medium++; break
                        case 'critical': distData[distId].Critical++; break
                        default: distData[distId].Low++
                    }
                })

                return NextResponse.json(districts.map(d => ({ name: d.name, ...distData[d.id] })))
            }

            case 'conditions': {
                const { data: stateChildren } = await adminSb
                    .from('children')
                    .select('id')
                    .in('awc_id', awcIds)
                    .eq('is_active', true)

                const childIds = (stateChildren || []).map(c => c.id)
                if (childIds.length === 0) return NextResponse.json({ conditions: [], total: 0 })

                const { data: flags } = await adminSb
                    .from('flags')
                    .select('category')
                    .in('child_id', childIds)

                const counts: Record<string, number> = {}
                ;(flags || []).forEach(f => {
                    const cat = f.category || 'other'
                    counts[cat] = (counts[cat] || 0) + 1
                })

                const total = childIds.length
                const conditions = Object.entries(counts)
                    .map(([condition, count]) => ({
                        condition: condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        count,
                        rate: Math.round((count / total) * 10000) / 10
                    }))
                    .sort((a, b) => b.count - a.count)

                return NextResponse.json({ conditions, total })
            }

            case 'condition-heatmap': {
                const { data: stateChildren } = await adminSb
                    .from('children')
                    .select('id, awc_id')
                    .in('awc_id', awcIds)
                    .eq('is_active', true)

                const childIds = (stateChildren || []).map(c => c.id)
                if (childIds.length === 0) return NextResponse.json({ heatmap: {}, districts: [], categories: [] })

                const childToAwc = new Map((stateChildren || []).map(c => [c.id, c.awc_id]))
                const districtNameMap = new Map(districts.map(d => [d.id, d.name]))

                const { data: flags } = await adminSb
                    .from('flags')
                    .select('category, child_id')
                    .in('child_id', childIds)

                const categories = [...new Set((flags || []).map(f => f.category || 'other'))]

                // Build cross-tab
                const heatmap: Record<string, Record<string, number>> = {}
                categories.forEach(cat => { heatmap[cat] = {} })

                ;(flags || []).forEach(f => {
                    const cat = f.category || 'other'
                    const awcId = childToAwc.get(f.child_id)
                    const distId = awcId ? awcToDistrict.get(awcId) : null
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
                    .from('children')
                    .select('id')
                    .in('awc_id', awcIds)
                    .eq('is_active', true)

                const childIds = (stateChildren || []).map(c => c.id)
                if (childIds.length === 0) return NextResponse.json({ data: [], categories: [] })

                const sixMonthsAgo = new Date()
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

                const { data: flags } = await adminSb
                    .from('flags')
                    .select('category, created_at')
                    .in('child_id', childIds)
                    .gte('created_at', sixMonthsAgo.toISOString())

                const months: string[] = []
                const now = new Date()
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                    months.push(d.toLocaleDateString('en-US', { month: 'short' }))
                }

                const categories = [...new Set((flags || []).map(f => f.category || 'other'))]
                const data = months.map(month => {
                    const entry: Record<string, any> = { name: month }
                    categories.forEach(c => {
                        entry[c.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())] = 0
                    })
                    return entry
                })

                ;(flags || []).forEach(f => {
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
