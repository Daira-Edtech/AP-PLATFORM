'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateUserRole(userId: string, role: string) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)

    if (error) throw error

    // Audit log
    await supabase.from('audit_log').insert({
        user_id: userId,
        action: 'role_update',
        resource_type: 'profile',
        resource_id: userId,
        details: { new_role: role },
        purpose: 'Administrative action'
    })

    revalidatePath('/admin/users')
    return { success: true }
}

export async function updateUserStatus(userId: string, is_active: boolean) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('profiles')
        .update({ is_active })
        .eq('id', userId)

    if (error) throw error

    await supabase.from('audit_log').insert({
        user_id: userId,
        action: 'status_update',
        resource_type: 'profile',
        resource_id: userId,
        details: { is_active },
        purpose: 'Administrative action'
    })

    revalidatePath('/admin/users')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabase = createAdminClient()

    // Audit log before deletion as user_id link might break
    await supabase.from('audit_log').insert({
        user_id: userId,
        action: 'user_deletion',
        resource_type: 'user',
        resource_id: userId,
        purpose: 'Administrative action'
    })

    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) throw authError

    const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (profileError) console.error('Error deleting profile:', profileError)

    revalidatePath('/admin/users')
    return { success: true }
}

export async function forceLogout(userId: string) {
    const supabase = createAdminClient()
    const { error } = await supabase.auth.admin.signOut(userId)

    if (error) throw error

    await supabase.from('audit_log').insert({
        user_id: userId,
        action: 'force_logout',
        resource_type: 'session',
        resource_id: userId,
        purpose: 'Security action'
    })

    return { success: true }
}

export async function reassignUser(userId: string, assignment: {
    state_id?: string | null,
    district_id?: string | null,
    mandal_id?: string | null,
    sector_id?: string | null,
    panchayat_id?: string | null,
    awc_id?: string | null
}) {
    const supabase = createAdminClient()

    // Filter out null/undefined values to avoid schema cache errors for missing columns
    const updateData: any = {};
    if (assignment.state_id !== undefined) updateData.state_id = assignment.state_id;
    if (assignment.district_id !== undefined) updateData.district_id = assignment.district_id;
    if (assignment.mandal_id !== undefined) updateData.mandal_id = assignment.mandal_id;
    if (assignment.sector_id !== undefined) updateData.sector_id = assignment.sector_id;
    if (assignment.panchayat_id !== undefined) updateData.panchayat_id = assignment.panchayat_id;
    if (assignment.awc_id !== undefined) updateData.awc_id = assignment.awc_id;

    if (Object.keys(updateData).length === 0) return { success: true };

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

    if (error) throw error

    await supabase.from('audit_log').insert({
        user_id: userId,
        action: 'reassignment',
        resource_type: 'assignment',
        resource_id: userId,
        details: assignment,
        purpose: 'Administrative action'
    })

    revalidatePath('/admin/users')
    return { success: true }
}

export async function updateProfile(userId: string, data: { name?: string, phone?: string, email?: string }) {
    const supabase = createAdminClient()

    const { error: profileError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)

    if (profileError) throw profileError

    if (data.email) {
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, { email: data.email, user_metadata: { name: data.name } })
        if (authError) console.warn('Auth update warning:', authError)
    }

    await supabase.from('audit_log').insert({
        user_id: userId,
        action: 'profile_update',
        resource_type: 'profile',
        resource_id: userId,
        details: data,
        purpose: 'Administrative action'
    })

    revalidatePath('/admin/users')
    return { success: true }
}

export async function bulkReassign(userIds: string[], assignment: {
    state_id?: string | null,
    district_id?: string | null,
    mandal_id?: string | null,
    sector_id?: string | null,
    panchayat_id?: string | null,
    awc_id?: string | null
}) {
    const supabase = createAdminClient()

    // Filter out null/undefined values to avoid schema cache errors for missing columns
    const updateData: any = {};
    if (assignment.state_id) updateData.state_id = assignment.state_id;
    if (assignment.district_id) updateData.district_id = assignment.district_id;
    if (assignment.mandal_id) updateData.mandal_id = assignment.mandal_id;
    if (assignment.sector_id) updateData.sector_id = assignment.sector_id;
    if (assignment.panchayat_id) updateData.panchayat_id = assignment.panchayat_id;
    if (assignment.awc_id) updateData.awc_id = assignment.awc_id;

    // Check if we have anything to update
    if (Object.keys(updateData).length === 0) return { success: true };

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .in('id', userIds)

    if (error) {
        console.error('Bulk reassign error:', error);
        throw error;
    }

    await supabase.from('audit_log').insert(userIds.map(id => ({
        user_id: id,
        action: 'bulk_reassignment',
        resource_type: 'assignment',
        resource_id: id,
        details: assignment,
        purpose: 'Bulk administrative action'
    })))

    revalidatePath('/admin/users')
    return { success: true }
}


export async function bulkUpdateStatus(userIds: string[], is_active: boolean) {
    const supabase = createAdminClient()
    const { error } = await supabase
        .from('profiles')
        .update({ is_active })
        .in('id', userIds)

    if (error) throw error

    await supabase.from('audit_log').insert(userIds.map(id => ({
        user_id: id,
        action: 'bulk_status_update',
        resource_type: 'profile',
        resource_id: id,
        details: { is_active },
        purpose: 'Bulk administrative action'
    })))

    revalidatePath('/admin/users')
    return { success: true }
}

export async function bulkDeleteUsers(userIds: string[]) {
    const supabase = createAdminClient()

    for (const userId of userIds) {
        await supabase.auth.admin.deleteUser(userId)
    }

    const { error } = await supabase
        .from('profiles')
        .delete()
        .in('id', userIds)

    if (error) throw error

    revalidatePath('/admin/users')
    return { success: true }
}
