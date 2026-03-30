'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
    id: string
    user_id: string | null
    role: string | null
    alert_type: string
    title: string
    message: string
    severity: AlertSeverity
    is_read: boolean
    created_at: string
}

export async function getAlerts(): Promise<Alert[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .or("role.in.(system_admin,super_admin),alert_type.in.(system,super_admin_broadcast)")
        .order('is_read', { ascending: true })
        .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as Alert[]
}

export async function markAlertRead(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', id)
    if (error) throw error
    revalidatePath('/admin/alerts')
}

export async function markAllRead() {
    const supabase = await createClient()
    const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .or("role.in.(system_admin,super_admin),alert_type.in.(system,super_admin_broadcast)")
        .eq('is_read', false)
    if (error) throw error
    revalidatePath('/admin/alerts')
}

export async function createBroadcast(title: string, message: string, severity: AlertSeverity) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('alerts').insert({
        user_id: user?.id ?? null,
        role: 'system_admin',
        alert_type: 'super_admin_broadcast',
        title,
        message,
        severity,
        is_read: false,
    })
    if (error) throw error
    revalidatePath('/admin/alerts')
}
