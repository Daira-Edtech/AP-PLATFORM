'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function syncProfiles() {
    const supabase = createAdminClient()

    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

    if (authError || !users) {
        console.error('Error listing auth users:', authError)
        return { error: authError?.message || 'No users found' }
    }

    const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
            users.map((user) => ({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                role: user.user_metadata?.role || 'system_admin', // Default fallback
                is_active: true,
                updated_at: new Date().toISOString(),
            }))
        )

    if (upsertError) {
        console.error('Error syncing profiles:', upsertError)
        return { error: upsertError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
}
