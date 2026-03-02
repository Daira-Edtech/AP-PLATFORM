'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getRolePermissions() {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'role_permissions')
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching role permissions:', error)
        return { success: false, error }
    }

    return {
        success: true,
        data: data?.setting_value || []
    }
}

export async function updateRolePermissions(permissions: any) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('system_settings')
        .upsert({
            setting_key: 'role_permissions',
            setting_value: permissions,
            category: 'security',
            description: 'Platform-wide role-based access control configuration',
            updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' })

    if (error) {
        console.error('Error updating role permissions:', error)
        throw error
    }

    revalidatePath('/admin/roles')
    return { success: true }
}
