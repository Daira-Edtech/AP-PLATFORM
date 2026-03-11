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
        table_name: 'profiles',
        record_id: userId,
        new_data: { new_role: role },
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
        table_name: 'profiles',
        record_id: userId,
        new_data: { is_active },
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
        table_name: 'profiles',
        record_id: userId,
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
        table_name: 'sessions',
        record_id: userId,
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

    const updateData: Record<string, string | null> = {};
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
        table_name: 'profiles',
        record_id: userId,
        new_data: assignment,
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
        table_name: 'profiles',
        record_id: userId,
        new_data: data,
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

    const updateData: Record<string, string | null> = {};
    if (assignment.state_id) updateData.state_id = assignment.state_id;
    if (assignment.district_id) updateData.district_id = assignment.district_id;
    if (assignment.mandal_id) updateData.mandal_id = assignment.mandal_id;
    if (assignment.sector_id) updateData.sector_id = assignment.sector_id;
    if (assignment.panchayat_id) updateData.panchayat_id = assignment.panchayat_id;
    if (assignment.awc_id) updateData.awc_id = assignment.awc_id;

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
        table_name: 'profiles',
        record_id: id,
        new_data: assignment,
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
        table_name: 'profiles',
        record_id: id,
        new_data: { is_active },
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

export async function createNewUser(data: any) {
    const supabase = createAdminClient()

    try {
        const { data: userData, error: authError } = await supabase.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: { name: data.name, role: data.role }
        })

        if (authError) throw authError
        if (!userData.user) throw new Error("Could not create auth user")

        // NOTE: sector_id and panchayat_id are NOT in the live profiles table
        const profileData: Record<string, any> = {
            id: userData.user.id,
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            role: data.role,
            state_id: data.state_id || null,
            district_id: data.district_id || null,
            mandal_id: data.mandal_id || null,
            awc_id: data.awc_id || null,
            is_active: true
        };

        if (data.sector_id) profileData.sector_id = data.sector_id;
        if (data.panchayat_id) profileData.panchayat_id = data.panchayat_id;

        const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profileData)

        if (profileError) {
            // Rollback auth user creation if profile fails
            await supabase.auth.admin.deleteUser(userData.user.id)
            throw profileError
        }

        // Audit log
        await supabase.from('audit_log').insert({
            user_id: userData.user.id,
            action: 'user_creation',
            table_name: 'profiles',
            record_id: userData.user.id,
            new_data: {
                role: data.role, assignments: {
                    state: data.state_id,
                    district: data.district_id,
                    mandal: data.mandal_id,
                    sector: data.sector_id,
                    panchayat: data.panchayat_id,
                    awc: data.awc_id
                }
            },
            purpose: 'Administrative action'
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error: any) {
        console.error('Error in createNewUser:', error)
        return { success: false, error: error.message }
    }
}
