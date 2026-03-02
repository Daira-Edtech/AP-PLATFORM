import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DPOLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'district_officer') {
        redirect('/login?error=Unauthorized: DPO access required')
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-sm rounded">J</div>
                    <div>
                        <span className="text-sm font-bold tracking-tight">District Programme Officer Portal</span>
                        <p className="text-[10px] text-zinc-400">Jiveesha ECD Platform</p>
                    </div>
                </div>
                <div className="text-xs text-zinc-500">
                    {profile.name} • <span className="uppercase text-[10px] font-bold text-blue-600">DPO</span>
                </div>
            </header>
            <main className="p-8">
                {children}
            </main>
        </div>
    )
}
