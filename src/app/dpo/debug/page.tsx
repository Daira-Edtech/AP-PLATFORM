import { createClient } from '@/lib/supabase/server'

export default async function DebugPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not logged in</div>

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: districts } = await supabase.from('districts').select('id, name').limit(10)

    let mandals: any[] = []
    if (profile?.district_id) {
        const { data } = await supabase.from('mandals').select('id, name').eq('district_id', profile.district_id)
        mandals = data || []
    }

    const { count: totalChildren } = await supabase.from('children').select('*', { count: 'exact', head: true })

    return (
        <div className="p-10 font-mono text-xs whitespace-pre bg-gray-900 text-green-400 min-h-screen">
            <h1 className="text-xl font-bold mb-4">Database Diagnosis</h1>
            <hr className="border-green-800 mb-4" />

            <div><strong>USER:</strong> {user.email} ({user.id})</div>
            <div><strong>PROFILE:</strong> {JSON.stringify(profile, null, 2)}</div>

            <div className="mt-4"><strong>DISTRICTS (TOP 10):</strong></div>
            {JSON.stringify(districts, null, 2)}

            <div className="mt-4"><strong>MANDALS IN YOUR DISTRICT ({profile?.district_id}):</strong></div>
            {JSON.stringify(mandals, null, 2)}

            <div className="mt-4"><strong>TOTAL CHILDREN IN DB:</strong> {totalChildren}</div>

            <div className="mt-8 p-4 border border-green-500">
                TIP: If your "PROFILE district_id" is null, or it doesn't match any "DISTRICTS", you won't see CDPO data.
            </div>
        </div>
    )
}
