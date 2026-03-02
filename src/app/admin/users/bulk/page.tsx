import React from 'react';
import BulkOps from '@/components/admin/BulkOps';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function BulkUsersPage() {
    const supabase = createAdminClient();

    const [usersRes, authRes, statesRes] = await Promise.all([
        supabase
            .from('profiles')
            .select(`
                *,
                awcs(name),
                mandals(name),
                districts(name),
                states(name)
            `),
        supabase.auth.admin.listUsers(),
        supabase.from('states').select('id, name').order('name')
    ]);

    if (usersRes.error) {
        console.error('Error fetching users:', {
            message: usersRes.error.message,
            code: usersRes.error.code,
            details: usersRes.error.details,
            hint: usersRes.error.hint
        });
    }
    if (authRes.error) console.error('Error fetching auth users:', authRes.error);
    if (statesRes.error) console.error('Error fetching states:', statesRes.error);

    const users = usersRes.data || [];
    const authData = authRes.data;
    const states = statesRes.data || [];

    const authUserMap = new Map();
    authData?.users.forEach(u => {
        authUserMap.set(u.id, { last_sign_in_at: u.last_sign_in_at });
    });

    const enrichedUsers = users.map(u => ({
        ...u,
        last_active: authUserMap.get(u.id)?.last_sign_in_at || null
    }));

    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <BulkOps users={enrichedUsers} states={states || []} />
        </React.Suspense>
    );
}

