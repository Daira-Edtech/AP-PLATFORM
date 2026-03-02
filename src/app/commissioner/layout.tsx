import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CommissionerShell from '@/components/commissioner/CommissionerShell'

export default async function CommissionerLayout({
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

    if (!profile || profile.role !== 'commissioner') {
        redirect('/login?error=Unauthorized: Commissioner access required')
    }

    return (
        <CommissionerShell
            userName={profile.name}
            userEmail={profile.email || ''}
            avatarUrl={profile.avatar_url}
        >
            {children}
        </CommissionerShell>
    )
}
