import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const adminSb = createAdminClient()

    const userSb = await createClient()
    const { data: { user } } = await userSb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { data: profile } = await adminSb
            .from('profiles')
            .select('*, districts(name), states(name)')
            .eq('id', user.id)
            .single()

        if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

        switch (type) {
            case 'profile': {
                return NextResponse.json({
                    id: profile.id,
                    name: profile.name,
                    email: profile.email || user.email || 'N/A',
                    phone: profile.phone || 'N/A',
                    role: profile.role,
                    avatarUrl: profile.avatar_url,
                    stateName: (profile as any).states?.name || 'N/A',
                    lastLoginAt: profile.last_login_at,
                    loginCount: profile.login_count || 0,
                    createdAt: profile.created_at,
                })
            }

            case 'data-stats': {
                const stateId = profile.state_id
                if (!stateId) return NextResponse.json({ totalChildren: 0, totalProfiles: 0, totalAwcs: 0, totalSessions: 0 })

                const { data: districts } = await adminSb.from('districts').select('id').eq('state_id', stateId)
                const districtIds = districts?.map(d => d.id) || []

                const { data: mandals } = await adminSb.from('mandals').select('id').in('district_id', districtIds.length > 0 ? districtIds : ['_'])
                const mandalIds = mandals?.map(m => m.id) || []

                const { data: awcs } = await adminSb.from('awcs').select('id').in('mandal_id', mandalIds.length > 0 ? mandalIds : ['_'])
                const awcIds = awcs?.map(a => a.id) || []

                const [childRes, profileRes, sessionRes] = await Promise.all([
                    adminSb.from('children').select('*', { count: 'exact', head: true }).in('awc_id', awcIds.length > 0 ? awcIds : ['_']),
                    adminSb.from('profiles').select('*', { count: 'exact', head: true }).eq('state_id', stateId).eq('is_active', true),
                    adminSb.from('questionnaire_sessions').select('*', { count: 'exact', head: true }).in('awc_id', awcIds.length > 0 ? awcIds : ['_']),
                ])

                return NextResponse.json({
                    totalChildren: childRes.count || 0,
                    totalProfiles: profileRes.count || 0,
                    totalAwcs: awcIds.length,
                    totalSessions: sessionRes.count || 0,
                    totalDistricts: districtIds.length,
                })
            }

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('Settings API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
