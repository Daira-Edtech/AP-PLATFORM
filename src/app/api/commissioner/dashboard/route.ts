import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { StateKPIs, RiskDistribution } from '@/lib/commissioner/types-db'

// Cache AWC IDs per state for 60 seconds to avoid repeated expensive joins
const awcCache = new Map<string, { ids: string[], timestamp: number }>()
const CACHE_TTL = 60000 // 60 seconds

async function getStateAwcIds(supabase: any, stateId: string): Promise<string[]> {
    const cached = awcCache.get(stateId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.ids
    }

    const { data: awcs } = await supabase
        .from('awcs')
        .select('id, mandals!inner(id, districts!inner(id))')
        .eq('mandals.districts.state_id', stateId)
        .eq('is_active', true)

    const ids = (awcs || []).map((a: any) => a.id)
    awcCache.set(stateId, { ids, timestamp: Date.now() })
    return ids
}

export async function GET(request: Request) {
    try {
        const supabaseServer = await createClient()
        const { data: { user } } = await supabaseServer.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const supabase = createAdminClient()
        const { searchParams } = new URL(request.url)
        const endpoint = searchParams.get('endpoint')

        const { data: profile } = await supabase.from('profiles').select('state_id').eq('id', user.id).single()
        const stateId = profile?.state_id

        if (!stateId) return NextResponse.json({ error: 'Commissioner not assigned to a state' }, { status: 403 })

        // Use cached AWC IDs
        const awcIds = await getStateAwcIds(supabase, stateId)
        if (awcIds.length === 0) {
            // Return empty/zero results immediately
            if (endpoint === 'kpis') {
                return NextResponse.json({ total_children: 0, screened: 0, coverage_pct: 0, high_risk: 0, critical_risk: 0, active_referrals: 0, open_flags: 0 })
            }
            if (endpoint === 'risk-distribution') {
                return NextResponse.json({ total: 0, low: 0, medium: 0, high: 0, critical: 0, unscreened: 0 })
            }
            if (endpoint === 'alerts' || endpoint === 'historical-kpis') {
                return NextResponse.json([])
            }
            if (endpoint === 'escalation-summary') {
                return NextResponse.json({ total: 0, critical: 0, stateLevel: 0 })
            }
        }

        // BATCH endpoint - fetches all critical data in ONE call
        if (endpoint === 'batch') {
            // Single query to get all children with their risk levels
            const { data: children } = await supabase
                .from('children')
                .select('id, current_risk_level, last_screening_date')
                .in('awc_id', awcIds)
                .eq('is_active', true)

            const childrenArr = children || []
            const childIds = childrenArr.map(c => c.id)

            // Aggregate in memory (much faster than multiple DB round-trips)
            let total = 0, screened = 0, low = 0, medium = 0, high = 0, critical = 0
            childrenArr.forEach(c => {
                total++
                if (c.last_screening_date) screened++
                const risk = (c.current_risk_level || '').toLowerCase()
                if (risk === 'low') low++
                else if (risk === 'medium') medium++
                else if (risk === 'high') high++
                else if (risk === 'critical') critical++
            })

            // Fetch flags and referrals in parallel
            let activeReferrals = 0, openFlags = 0, escalatedTotal = 0, escalatedCritical = 0, escalatedState = 0

            if (childIds.length > 0) {
                const [refRes, flagRes, escRes] = await Promise.all([
                    supabase.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds).in('status', ['generated', 'sent', 'scheduled']),
                    supabase.from('flags').select('*', { count: 'exact', head: true }).in('child_id', childIds).in('status', ['raised', 'acknowledged', 'in_progress']),
                    supabase.from('flags').select('status, priority, escalated_to').in('child_id', childIds).eq('status', 'escalated')
                ])
                activeReferrals = refRes.count || 0
                openFlags = flagRes.count || 0

                // Aggregate escalations
                const escData = escRes.data || []
                escalatedTotal = escData.length
                escalatedCritical = escData.filter((f: any) => f.priority === 'urgent').length
                escalatedState = escData.filter((f: any) => f.escalated_to === 'state').length
            }

            return NextResponse.json({
                kpis: {
                    total_children: total,
                    screened,
                    coverage_pct: total > 0 ? Math.round((screened / total) * 1000) / 10 : 0,
                    high_risk: high,
                    critical_risk: critical,
                    active_referrals: activeReferrals,
                    open_flags: openFlags,
                },
                riskDistribution: {
                    total: screened,
                    low,
                    medium,
                    high,
                    critical,
                    unscreened: total - screened,
                },
                escalationSummary: {
                    total: escalatedTotal,
                    critical: escalatedCritical,
                    stateLevel: escalatedState,
                }
            })
        }

        if (endpoint === 'kpis') {
            // Single query approach - fetch all children and aggregate in memory
            const { data: children } = await supabase
                .from('children')
                .select('id, current_risk_level, last_screening_date')
                .in('awc_id', awcIds)
                .eq('is_active', true)

            const childrenArr = children || []
            const childIds = childrenArr.map(c => c.id)

            let total = 0, screened = 0, high = 0, critical = 0
            childrenArr.forEach(c => {
                total++
                if (c.last_screening_date) screened++
                const risk = (c.current_risk_level || '').toLowerCase()
                if (risk === 'high') high++
                else if (risk === 'critical') critical++
            })

            let activeReferrals = 0, openFlags = 0
            if (childIds.length > 0) {
                const [refRes, flagRes] = await Promise.all([
                    supabase.from('referrals').select('*', { count: 'exact', head: true }).in('child_id', childIds).in('status', ['generated', 'sent', 'scheduled']),
                    supabase.from('flags').select('*', { count: 'exact', head: true }).in('child_id', childIds).in('status', ['raised', 'acknowledged', 'in_progress'])
                ])
                activeReferrals = refRes.count || 0
                openFlags = flagRes.count || 0
            }

            const result: StateKPIs = {
                total_children: total,
                screened,
                coverage_pct: total > 0 ? Math.round((screened / total) * 1000) / 10 : 0,
                high_risk: high,
                critical_risk: critical,
                active_referrals: activeReferrals,
                open_flags: openFlags,
            }
            return NextResponse.json(result)
        }

        if (endpoint === 'risk-distribution') {
            const { data: children } = await supabase
                .from('children')
                .select('current_risk_level, last_screening_date')
                .in('awc_id', awcIds)
                .eq('is_active', true)

            let total = 0, screened = 0, low = 0, medium = 0, high = 0, critical = 0
            ;(children || []).forEach((c: any) => {
                total++
                if (c.last_screening_date) screened++
                const risk = (c.current_risk_level || '').toLowerCase()
                if (risk === 'low') low++
                else if (risk === 'medium') medium++
                else if (risk === 'high') high++
                else if (risk === 'critical') critical++
            })

            const result: RiskDistribution = {
                total: screened,
                low,
                medium,
                high,
                critical,
                unscreened: total - screened,
            }
            return NextResponse.json(result)
        }

        if (endpoint === 'alerts') {
            const limitParam = searchParams.get('limit')
            const limit = limitParam ? parseInt(limitParam) : 10

            // Get child IDs first
            const { data: children } = await supabase
                .from('children')
                .select('id')
                .in('awc_id', awcIds)
                .eq('is_active', true)
                .limit(10000) // Limit to avoid huge queries

            const childIds = (children || []).map((c: any) => c.id)
            if (childIds.length === 0) return NextResponse.json([])

            const { data, error } = await supabase
                .from('alerts')
                .select('*')
                .in('severity', ['critical', 'high'])
                .eq('is_read', false)
                .in('related_child_id', childIds)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json(data || [])
        }

        if (endpoint === 'escalation-summary') {
            const { data: children } = await supabase
                .from('children')
                .select('id')
                .in('awc_id', awcIds)
                .eq('is_active', true)

            const childIds = (children || []).map((c: any) => c.id)
            if (childIds.length === 0) {
                return NextResponse.json({ total: 0, critical: 0, stateLevel: 0 })
            }

            // Single query to get all escalated flags, then aggregate
            const { data: flags } = await supabase
                .from('flags')
                .select('priority, escalated_to')
                .in('child_id', childIds)
                .eq('status', 'escalated')

            const flagsArr = flags || []
            return NextResponse.json({
                total: flagsArr.length,
                critical: flagsArr.filter((f: any) => f.priority === 'urgent').length,
                stateLevel: flagsArr.filter((f: any) => f.escalated_to === 'state').length
            })
        }

        if (endpoint === 'historical-kpis') {
            // Try cache first
            const { data: cached } = await supabase
                .from('kpi_cache')
                .select('period, metrics')
                .eq('level', 'state')
                .eq('entity_id', stateId)
                .order('period', { ascending: true })

            if (cached && cached.length > 0) {
                return NextResponse.json(cached.map((row: any) => ({
                    name: row.period,
                    value: row.metrics?.screened || row.metrics?.total_screened || 0,
                    target: row.metrics?.target || row.metrics?.total_children || 0,
                })))
            }

            // Fallback: compute from assessments (limit to last 12 months for speed)
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

            const { data: children } = await supabase
                .from('children')
                .select('id')
                .in('awc_id', awcIds)
                .eq('is_active', true)
                .limit(50000)

            const childIds = (children || []).map((c: any) => c.id)
            if (childIds.length === 0) return NextResponse.json([])

            const { data: assessments } = await supabase
                .from('assessments')
                .select('assessed_at')
                .in('child_id', childIds)
                .gte('assessed_at', oneYearAgo.toISOString())
                .order('assessed_at', { ascending: true })
                .limit(100000)

            if (!assessments || assessments.length === 0) return NextResponse.json([])

            const monthMap: Record<string, number> = {}
            assessments.forEach((a: any) => {
                const d = new Date(a.assessed_at)
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                monthMap[key] = (monthMap[key] || 0) + 1
            })

            const months = Object.keys(monthMap).sort()
            let cumulative = 0
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

            return NextResponse.json(months.map(m => {
                cumulative += monthMap[m]
                const [year, month] = m.split('-')
                return { name: `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`, value: cumulative, target: 0 }
            }))
        }

        return NextResponse.json({ error: 'Unknown endpoint parameter' }, { status: 400 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
