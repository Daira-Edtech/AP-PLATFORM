import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { EXECUTIVE_KPIS } from '@/lib/commissioner/constants'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'monthly'
    const scope = searchParams.get('scope') || 'Statewide'
    const format = searchParams.get('format') || 'PDF Brief'

    const adminSb = createAdminClient()
    const userSb = await createClient()
    const { data: { user } } = await userSb.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { data: profile } = await adminSb
            .from('profiles')
            .select('state_id')
            .eq('id', user.id)
            .single()

        if (!profile || !profile.state_id) {
            return NextResponse.json({ error: 'Profile/State not found' }, { status: 404 })
        }

        const stateId = profile.state_id

        // Fetch aggregated actual data based on scope
        // If scope is 'Statewide', fetch all districts in state.
        // For simplicity in the brief, we'll aggregate top level state metrics
        const { data: districts } = await adminSb.from('districts').select('id, name').eq('state_id', stateId)

        let districtIds: string[] = []
        let selectedDistrictName = 'Statewide'

        if (scope === 'Statewide') {
            districtIds = districts?.map(d => d.id) || []
        } else {
            // Find specific district
            const matched = districts?.find(d => d.name === scope)
            if (matched) {
                districtIds = [matched.id]
                selectedDistrictName = matched.name
            } else {
                districtIds = districts?.map(d => d.id) || [] // fallback
            }
        }

        const { data: mandals } = await adminSb.from('mandals').select('id').in('district_id', districtIds.length > 0 ? districtIds : ['_'])
        const mandalIds = mandals?.map(m => m.id) || []

        const { data: awcs } = await adminSb.from('awcs').select('id').in('mandal_id', mandalIds.length > 0 ? mandalIds : ['_'])
        const awcIds = awcs?.map(a => a.id) || []

        // Total children
        const { count: totalChildren } = await adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds.length > 0 ? awcIds : ['_'])

        // High/Critical risk children
        const { count: highRiskCount } = await adminSb.from('children')
            .select('*', { count: 'exact', head: true })
            .in('awc_id', awcIds.length > 0 ? awcIds : ['_'])
            .in('risk_level', ['High', 'Critical'])

        return NextResponse.json({
            meta: {
                type,
                scope: selectedDistrictName,
                format,
                generatedAt: new Date().toISOString(),
                period: 'Current Quarter', // In a real app, parse this from the request
            },
            stats: {
                totalChildren: totalChildren || 0,
                highRiskCount: highRiskCount || 0,
                // Passing some static mock KPIs with real ones where easily calculable
                kpis: EXECUTIVE_KPIS.map(kpi => {
                    if (kpi.label === 'Target Coverage') return { ...kpi, value: '98.8%' }
                    if (kpi.label === 'High/Critical Risk') return { ...kpi, value: (highRiskCount || 0).toLocaleString('en-IN') }
                    if (kpi.label === 'Enrolled Children') return { ...kpi, value: (totalChildren || 0).toLocaleString('en-IN') }
                    return kpi
                }),
                topDistrict: 'Guntur' // Hardcoded top district for standard reporting view demo
            }
        })

    } catch (error: any) {
        console.error('Brief API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
