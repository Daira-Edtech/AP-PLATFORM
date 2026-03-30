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

    // Check for admin permissions
    if (!profile || (profile.role !== 'system_admin' && profile.role !== 'super_admin')) {
        console.log(`Access Denied to ${user.email}. Role: ${profile?.role || 'none'}`)
        redirect('/login?error=Unauthorized')
    }


    return (
        <div className="min-h-screen bg-app-bg font-sans text-dark-slate">
            <Sidebar />

            <div className="pl-64 flex flex-col min-h-screen transition-all duration-300 bg-app-bg">
                <Header user={user} profile={profile as Profile} />

                <main className="flex-1 p-8 overflow-y-auto bg-app-bg">
                    {children}
                </main>
            </div>
        </div>
    )
}
