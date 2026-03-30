import { createClient } from '@/lib/supabase/server';
import AuditLog, { type AuditEvent } from '@/components/admin/AuditLog';

export const metadata = {
    title: 'Audit Log | Admin',
    description: 'System-wide administrative action logs',
};

const PAGE_SIZE = 50;

export default async function AuditLogPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string>>;
}) {
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page || '1'));
    const actionFilter = params.action || '';
    const dateFrom = params.dateFrom || '';
    const dateTo = params.dateTo || '';
    const search = params.search || '';

    const supabase = await createClient();

    let query = supabase
        .from('audit_log')
        .select('id, user_id, action, table_name, record_id, old_data, new_data, ip_address, purpose, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (actionFilter) query = query.ilike('action', `%${actionFilter}%`);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);
    if (search) {
        query = query.or(`table_name.ilike.%${search}%,purpose.ilike.%${search}%,action.ilike.%${search}%`);
    }

    const { data: logs, count } = await query;

    // Enrich logs with admin names from profiles
    const userIds = [...new Set((logs || []).filter(l => l.user_id).map(l => l.user_id as string))];
    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
        profileMap = Object.fromEntries((profiles || []).map(p => [p.id as string, p.name as string]));
    }

    const enrichedLogs: AuditEvent[] = (logs || []).map(log => {
        const oldStr = log.old_data ? summariseJson(log.old_data as Record<string, unknown>) : undefined;
        const newStr = log.new_data ? summariseJson(log.new_data as Record<string, unknown>) : undefined;
        const target = log.table_name
            ? `${log.table_name}${log.record_id ? ` · ${(log.record_id as string).slice(0, 8)}…` : ''}`
            : '—';

        return {
            id: log.id as string,
            timestamp: log.created_at as string,
            adminName: log.user_id ? (profileMap[log.user_id as string] || 'Unknown') : 'System',
            action: log.action as string,
            description: (log.purpose as string) || (log.action as string),
            target,
            ip: (log.ip_address as string) || '—',
            before: oldStr,
            after: newStr,
        };
    });

    return (
        <AuditLog
            logs={enrichedLogs}
            totalCount={count || 0}
            currentPage={page}
            pageSize={PAGE_SIZE}
            initialFilters={{ actionFilter, dateFrom, dateTo, search }}
        />
    );
}

function summariseJson(obj: Record<string, unknown>): string {
    const entries = Object.entries(obj).slice(0, 3);
    return entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(' | ');
}
