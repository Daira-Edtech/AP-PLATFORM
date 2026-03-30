'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface SyncQueueStats {
    total: number
    byTable: { table_name: string; count: number }[]
    recentErrors: { table_name: string; operation: string; error_message: string; created_at: string }[]
}

export interface HealthCheck {
    check_type: string
    status: 'healthy' | 'degraded' | 'down' | 'unknown'
    response_time_ms: number | null
    details: Record<string, unknown>
    error_message: string | null
    checked_at: string
}

export interface HealthStats {
    syncQueue: SyncQueueStats
    healthChecks: HealthCheck[]
    auditCount24h: number
}

export async function getHealthStats(): Promise<HealthStats> {
    const supabase = createAdminClient()

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [
        { count: totalPending },
        { data: pendingRows },
        { data: errorRows },
        { data: healthRows },
        { count: auditCount },
    ] = await Promise.all([
        supabase
            .from('sync_queue')
            .select('*', { count: 'exact', head: true })
            .eq('synced', false),
        supabase
            .from('sync_queue')
            .select('table_name')
            .eq('synced', false),
        supabase
            .from('sync_queue')
            .select('table_name, operation, error_message, created_at')
            .not('error_message', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10),
        supabase
            .from('system_health_checks')
            .select('check_type, status, response_time_ms, details, error_message, checked_at')
            .order('checked_at', { ascending: false })
            .limit(50),
        supabase
            .from('audit_log')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', since24h),
    ])

    // Count by table_name in JS (no group-by in PostgREST without RPC)
    const tableCounts: Record<string, number> = {}
    for (const row of pendingRows ?? []) {
        tableCounts[row.table_name] = (tableCounts[row.table_name] || 0) + 1
    }
    const byTable = Object.entries(tableCounts)
        .map(([table_name, count]) => ({ table_name, count }))
        .sort((a, b) => b.count - a.count)

    // Deduplicate health checks: keep latest per check_type
    const latestByType = new Map<string, HealthCheck>()
    for (const row of healthRows ?? []) {
        if (!latestByType.has(row.check_type)) {
            latestByType.set(row.check_type, row as HealthCheck)
        }
    }

    return {
        syncQueue: {
            total: totalPending ?? 0,
            byTable,
            recentErrors: (errorRows ?? []) as SyncQueueStats['recentErrors'],
        },
        healthChecks: Array.from(latestByType.values()),
        auditCount24h: auditCount ?? 0,
    }
}
