import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { StateKPIs, RiskDistribution, Alert } from '@/lib/commissioner/types-db'

export async function GET(request: Request) {
    try {
        const supabase = createAdminClient()
        const { searchParams } = new URL(request.url)
        const endpoint = searchParams.get('endpoint')

        if (endpoint === 'kpis') {
            // Total active children
            const { count: totalChildren } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('is_active', true)
            // Screened children
            const { count: screened } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('is_active', true).not('last_screening_date', 'is', null)
            // Risk levels
            const { count: highRisk } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('current_risk_level', 'high')
            const { count: criticalRisk } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('current_risk_level', 'critical')
            // Active referrals
            const { count: activeReferrals } = await supabase.from('referrals').select('*', { count: 'exact', head: true }).in('status', ['generated', 'sent', 'scheduled'])
            // Open flags
            const { count: openFlags } = await supabase.from('flags').select('*', { count: 'exact', head: true }).in('status', ['raised', 'acknowledged', 'in_progress'])

            const total = totalChildren || 0
            const scr = screened || 0
            const result: StateKPIs = {
                total_children: total,
                screened: scr,
                coverage_pct: total > 0 ? Math.round((scr / total) * 1000) / 10 : 0,
                high_risk: highRisk || 0,
                critical_risk: criticalRisk || 0,
                active_referrals: activeReferrals || 0,
                open_flags: openFlags || 0,
            }
            return NextResponse.json(result)
        }

        if (endpoint === 'risk-distribution') {
            const { count: total } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('is_active', true).not('last_screening_date', 'is', null)
            const { count: low } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('current_risk_level', 'low')
            const { count: medium } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('current_risk_level', 'medium')
            const { count: high } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('current_risk_level', 'high')
            const { count: critical } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('current_risk_level', 'critical')
            const { count: allChildren } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('is_active', true)

            const result: RiskDistribution = {
                total: total || 0,
                low: low || 0,
                medium: medium || 0,
                high: high || 0,
                critical: critical || 0,
                unscreened: (allChildren || 0) - (total || 0),
            }
            return NextResponse.json(result)
        }

        if (endpoint === 'alerts') {
            const limitParam = searchParams.get('limit')
            const limit = limitParam ? parseInt(limitParam) : 10
            const { data, error } = await supabase
                .from('alerts')
                .select('*')
                .in('severity', ['critical', 'high'])
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json(data || [])
        }

        if (endpoint === 'escalation-summary') {
            const { count: total } = await supabase.from('flags').select('*', { count: 'exact', head: true }).eq('status', 'escalated')
            const { count: critical } = await supabase.from('flags').select('*', { count: 'exact', head: true }).eq('status', 'escalated').eq('priority', 'urgent')
            const { count: stateLevel } = await supabase.from('flags').select('*', { count: 'exact', head: true }).eq('escalated_to', 'state')

            return NextResponse.json({ total: total || 0, critical: critical || 0, stateLevel: stateLevel || 0 })
        }

        if (endpoint === 'historical-kpis') {
            // Try kpi_cache
            const { data: cached } = await supabase.from('kpi_cache').select('period, metrics').eq('level', 'state').order('period', { ascending: true })
            if (cached && cached.length > 0) {
                return NextResponse.json(cached.map((row: any) => ({
                    name: row.period,
                    value: row.metrics?.screened || row.metrics?.total_screened || 0,
                    target: row.metrics?.target || row.metrics?.total_children || 0,
                })))
            }
            // Fallback: assessments
            const { data: assessments } = await supabase.from('assessments').select('assessed_at').order('assessed_at', { ascending: true })
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
