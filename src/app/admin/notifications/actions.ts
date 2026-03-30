'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface NotificationRule {
    id: string
    event: string
    recipients: string
    channels: ('push' | 'email' | 'sms' | 'in-app')[]
    enabled: boolean
}

const DEFAULT_RULES: NotificationRule[] = [
    { id: '1', event: 'Flag raised (Urgent)',       recipients: 'All Mandal Screeners in mandal', channels: ['push', 'sms'],          enabled: true },
    { id: '2', event: 'Flag escalated to CDPO',     recipients: 'CDPO officer',                  channels: ['push', 'email'],         enabled: true },
    { id: '3', event: 'Flag escalated to District', recipients: 'DPO',                           channels: ['email', 'sms'],          enabled: true },
    { id: '4', event: 'Flag escalated to State',    recipients: 'Commissioner',                  channels: ['email', 'sms', 'in-app'], enabled: true },
    { id: '5', event: 'Referral overdue (>14 days)',recipients: 'Mandal Screener + CDPO',        channels: ['push'],                  enabled: true },
    { id: '6', event: 'Facility at capacity',       recipients: 'DPO + Commissioner',            channels: ['email'],                 enabled: true },
    { id: '7', event: 'AWW inactive >7 days',       recipients: 'CDPO',                          channels: ['in-app'],                enabled: true },
    { id: '8', event: 'Coverage drops below 50%',   recipients: 'CDPO + DPO',                   channels: ['email'],                 enabled: true },
    { id: '9', event: 'New user account created',   recipients: 'Admin',                         channels: ['in-app'],                enabled: true },
    { id: '10', event: 'Password reset',            recipients: 'Target user',                   channels: ['email', 'sms'],          enabled: true },
]

const SETTING_KEY = 'notification_rules'

export async function getNotificationRules(): Promise<NotificationRule[]> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', SETTING_KEY)
        .maybeSingle()

    if (data?.setting_value && Array.isArray(data.setting_value)) {
        return data.setting_value as NotificationRule[]
    }
    return DEFAULT_RULES
}

export async function saveNotificationRules(rules: NotificationRule[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('system_settings').upsert({
        setting_key: SETTING_KEY,
        setting_value: rules,
        description: 'System notification routing rules',
        category: 'notifications',
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'setting_key' })

    if (error) throw error
    revalidatePath('/admin/notifications')
}
