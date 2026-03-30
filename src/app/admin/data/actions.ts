'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DataStats {
    syncQueuePending: number
    lastManualBackupAt: string | null
}

export async function getDataStats(): Promise<DataStats> {
    const supabase = createAdminClient()

    const [{ count: syncQueuePending }, { data: backupSetting }] = await Promise.all([
        supabase.from('sync_queue').select('*', { count: 'exact', head: true }).eq('synced', false),
        supabase.from('system_settings').select('setting_value').eq('setting_key', 'last_manual_backup_at').maybeSingle(),
    ])

    return {
        syncQueuePending: syncQueuePending ?? 0,
        lastManualBackupAt: backupSetting?.setting_value ?? null,
    }
}

export async function recordManualBackup(): Promise<string> {
    const supabase = createAdminClient()
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()

    const now = new Date().toISOString()
    const { error } = await supabase.from('system_settings').upsert({
        setting_key: 'last_manual_backup_at',
        setting_value: now,
        description: 'Timestamp of last manual backup trigger from admin portal',
        category: 'general',
        updated_by: user?.id ?? null,
        updated_at: now,
    }, { onConflict: 'setting_key' })
    if (error) throw error
    revalidatePath('/admin/data')
    return now
}

export async function clearSyncQueue(): Promise<number> {
    const supabase = createAdminClient()
    const { count } = await supabase
        .from('sync_queue')
        .select('*', { count: 'exact', head: true })
        .eq('synced', false)
    const { error } = await supabase.from('sync_queue').delete().eq('synced', false)
    if (error) throw error
    revalidatePath('/admin/data')
    return count ?? 0
}

const TABLE_MAP: Record<string, string[]> = {
    'Users': ['profiles'],
    'Children': ['children'],
    'Questionnaires': ['questions'],
    'Screenings': ['questionnaire_sessions'],
    'Referrals': ['referrals'],
    'Flags': ['flags'],
    'Observations': ['observations'],
    'Geographic Hierarchy': ['districts', 'mandals', 'sectors', 'panchayats', 'awcs'],
    'Audit Log': ['audit_log'],
}

function rowsToCsv(data: Record<string, unknown>[]): string {
    if (!data.length) return '(no data)'
    const headers = Object.keys(data[0])
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h]
            if (val === null || val === undefined) return ''
            const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
            return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str
        }).join(',')
    )
    return [headers.join(','), ...rows].join('\n')
}

export async function exportData(
    fields: string[],
    format: 'CSV' | 'JSON'
): Promise<{ filename: string; content: string; mimeType: string }> {
    const supabase = createAdminClient()
    const combined: Record<string, unknown[]> = {}

    const tableEntries = fields.flatMap(field =>
        (TABLE_MAP[field] ?? []).map(table => ({ field, table }))
    )

    await Promise.all(
        tableEntries.map(async ({ table }) => {
            const { data } = await supabase.from(table).select('*').limit(50000)
            combined[table] = data ?? []
        })
    )

    // Log the export request
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (user) {
        const totalRows = Object.values(combined).reduce((s, rows) => s + rows.length, 0)
        await supabase.from('data_export_requests').insert({
            requested_by: user.id,
            export_type: fields.length === Object.keys(TABLE_MAP).length ? 'full_backup' : 'child_data',
            scope: { fields },
            format: format.toLowerCase(),
            status: 'completed',
            row_count: totalRows,
            completed_at: new Date().toISOString(),
        })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

    if (format === 'JSON') {
        return {
            filename: `ecd-export-${timestamp}.json`,
            content: JSON.stringify(combined, null, 2),
            mimeType: 'application/json',
        }
    }

    const sections = Object.entries(combined).map(
        ([table, rows]) => `# TABLE: ${table}\n` + rowsToCsv(rows as Record<string, unknown>[])
    )
    return {
        filename: `ecd-export-${timestamp}.csv`,
        content: sections.join('\n\n'),
        mimeType: 'text/csv',
    }
}
