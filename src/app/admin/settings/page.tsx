import { createClient } from '@/lib/supabase/server';
import Settings from '@/components/admin/Settings';

export const metadata = {
    title: 'Settings | Admin',
};

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const [{ data: profile }, { data: otherAdminProfiles }] = await Promise.all([
        supabase
            .from('profiles')
            .select('name, email, phone, role, last_login_at')
            .eq('id', user.id)
            .single(),
        supabase
            .from('profiles')
            .select('id, name, email, role, is_active, last_login_at')
            .in('role', ['system_admin', 'super_admin'])
            .neq('id', user.id),
    ]);

    const currentUser = {
        name: profile?.name || user.email || 'Admin',
        email: profile?.email || user.email || '',
        phone: profile?.phone || '',
        role: profile?.role || 'system_admin',
    };

    const otherAdmins = (otherAdminProfiles || []).map(a => ({
        id: a.id as string,
        name: a.name as string,
        email: (a.email as string) || '',
        status: (a.is_active ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
        lastLogin: a.last_login_at
            ? new Date(a.last_login_at as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
            : '—',
    }));

    return <Settings currentUser={currentUser} otherAdmins={otherAdmins} />;
}
