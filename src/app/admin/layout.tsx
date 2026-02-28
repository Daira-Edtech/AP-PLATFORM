import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'
import { Profile } from '@/lib/types/database'

export default async function AdminLayout({
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

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Sidebar />

            <div className="pl-64 flex flex-col min-h-screen transition-all duration-300">
                <Header user={user} profile={profile as Profile} />

                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}