'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Activity, CheckCircle2, AlertTriangle, XCircle,
    Database, Clock, Server, ShieldCheck,
    RefreshCw, HardDrive, Info, Cpu, Network, Zap
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { HealthStats } from '@/app/admin/health/actions';

// Static fallback service list for when health checks table is empty
const STATIC_SERVICES = [
    { name: 'Supabase (Database)', check_type: 'database' },
    { name: 'Auth Service', check_type: 'api' },
    { name: 'Background Sync', check_type: 'sync' },
    { name: 'Cron Jobs', check_type: 'cron' },
    { name: 'File Storage', check_type: 'storage' },
    { name: 'AI Service', check_type: 'ai_service' },
    { name: 'Notifications', check_type: 'notification' },
]

const CHECK_TYPE_LABEL: Record<string, string> = {
    database: 'Supabase (Database)',
    api: 'Auth / API Service',
    sync: 'Background Sync',
    cron: 'Cron Jobs',
    storage: 'File Storage',
    ai_service: 'AI Models',
    notification: 'Push Notifications',
    overall: 'Overall',
}

const STATUS_CONFIG = {
    healthy:  { dot: 'bg-green-500', text: 'text-green-700', label: 'Operational' },
    degraded: { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Degraded' },
    down:     { dot: 'bg-red-500',   text: 'text-red-700',   label: 'Down' },
    unknown:  { dot: 'bg-gray-400',  text: 'text-gray-500',  label: 'Unknown' },
}

function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

interface Props {
    stats: HealthStats
}

const KPICard = ({ label, value, sub, icon, colorClass, statusIcon }: {
    label: string; value: string; sub: string; icon: React.ReactNode;
    colorClass: string; statusIcon: React.ReactNode;
}) => (
    <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 bg-gray-50 rounded-lg ${colorClass}`}>{icon}</div>
            {statusIcon}
        </div>
        <p className="text-[28px] font-bold text-black leading-tight">{value}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className={`text-[11px] font-medium mt-1 ${colorClass}`}>{sub}</p>
    </div>
)

const SystemHealth: React.FC<Props> = ({ stats }) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const { syncQueue, healthChecks, auditCount24h } = stats

    // Derive overall health from health checks
    const hasDown     = healthChecks.some(h => h.status === 'down')
    const hasDegraded = healthChecks.some(h => h.status === 'degraded')
    const overallHealth = healthChecks.length === 0
        ? 'unknown'
        : hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy'

    // Build service rows: merge static list with real health checks
    const healthByType = Object.fromEntries(healthChecks.map(h => [h.check_type, h]))
    const serviceRows = STATIC_SERVICES.map(s => {
        const real = healthByType[s.check_type]
        return {
            name: CHECK_TYPE_LABEL[s.check_type] ?? s.name,
            status: real?.status ?? 'unknown' as const,
            responseMs: real?.response_time_ms ?? null,
            checkedAt: real?.checked_at ?? null,
        }
    })

    // Sync queue breakdown chart data
    const syncChartData = syncQueue.byTable.map(r => ({
        table: r.table_name.replace('_', ' '),
        count: r.count,
    }))

    const handleRefresh = () => {
        startTransition(() => { router.refresh() })
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-[24px] font-semibold text-black leading-tight">System Health</h1>
                <button
                    onClick={handleRefresh}
                    disabled={isPending}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded text-[13px] font-bold hover:bg-gray-50 text-gray-700 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />
                    <span>{isPending ? 'Refreshing…' : 'Refresh'}</span>
                </button>
            </div>

            {/* Status Banner */}
            {overallHealth === 'unknown' && (
                <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center space-x-3 text-gray-600">
                    <Info size={20} />
                    <p className="text-[14px] font-bold uppercase tracking-tight">No health check data — checks run automatically via cron jobs.</p>
                </div>
            )}
            {overallHealth === 'healthy' && (
                <div className="w-full bg-[#DCFCE7] border border-[#BBF7D0] rounded-xl p-4 flex items-center space-x-3 text-[#166534]">
                    <CheckCircle2 size={20} />
                    <p className="text-[14px] font-bold uppercase tracking-tight">All systems operational</p>
                </div>
            )}
            {overallHealth === 'degraded' && (
                <div className="w-full bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-4 flex items-center justify-between text-[#92400E]">
                    <div className="flex items-center space-x-3">
                        <AlertTriangle size={20} />
                        <p className="text-[14px] font-bold uppercase tracking-tight">Degraded — some services below threshold</p>
                    </div>
                </div>
            )}
            {overallHealth === 'down' && (
                <div className="w-full bg-[#FEE2E2] border border-[#FECACA] rounded-xl p-4 flex items-center space-x-3 text-[#991B1B]">
                    <XCircle size={20} />
                    <p className="text-[14px] font-bold uppercase tracking-tight">Service outage detected — see service status below</p>
                </div>
            )}

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Sync Queue Pending"
                    value={syncQueue.total.toLocaleString()}
                    sub={syncQueue.total === 0 ? 'Queue clear' : syncQueue.total > 500 ? 'Elevated' : 'Normal'}
                    icon={<Activity size={18} />}
                    colorClass={syncQueue.total > 500 ? 'text-amber-600' : 'text-green-600'}
                    statusIcon={syncQueue.total > 500
                        ? <AlertTriangle size={16} className="text-amber-500" />
                        : <CheckCircle2 size={16} className="text-green-500" />}
                />
                <KPICard
                    label="Sync Errors"
                    value={syncQueue.recentErrors.length.toString()}
                    sub={syncQueue.recentErrors.length === 0 ? 'No errors' : 'Check error log'}
                    icon={<Zap size={18} />}
                    colorClass={syncQueue.recentErrors.length > 0 ? 'text-red-600' : 'text-green-600'}
                    statusIcon={syncQueue.recentErrors.length > 0
                        ? <AlertTriangle size={16} className="text-red-500" />
                        : <CheckCircle2 size={16} className="text-green-500" />}
                />
                <KPICard
                    label="Audit Events (24h)"
                    value={auditCount24h.toLocaleString()}
                    sub="Admin actions logged"
                    icon={<Clock size={18} />}
                    colorClass="text-gray-500"
                    statusIcon={<Info size={16} className="text-gray-400" />}
                />
                <KPICard
                    label="Services Monitored"
                    value={healthChecks.length === 0 ? '—' : serviceRows.filter(s => s.status === 'healthy').length + '/' + serviceRows.length}
                    sub={healthChecks.length === 0 ? 'Awaiting checks' : 'Healthy'}
                    icon={<Server size={18} />}
                    colorClass={healthChecks.length === 0 ? 'text-gray-400' : 'text-green-600'}
                    statusIcon={healthChecks.length === 0
                        ? <Info size={16} className="text-gray-400" />
                        : <CheckCircle2 size={16} className="text-green-500" />}
                />
            </div>

            {/* Row 2: Service Status & Sync Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Status */}
                <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm flex flex-col">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-[13px] font-bold text-black uppercase tracking-widest">Service Status</h3>
                        <span className="text-[11px] font-bold text-gray-400">
                            {healthChecks.length === 0 ? 'No checks run yet' : `Last checked: ${formatTime(healthChecks[0].checked_at)}`}
                        </span>
                    </div>
                    <div className="overflow-hidden flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Response</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {serviceRows.map((s, idx) => {
                                    const cfg = STATUS_CONFIG[s.status]
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-[13px] font-medium text-black">{s.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${cfg.dot} ${s.status === 'healthy' ? 'shadow-[0_0_8px_rgba(34,197,94,0.4)]' : ''}`} />
                                                    <span className={`text-[11px] font-bold uppercase tracking-tight ${cfg.text}`}>{cfg.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-[12px] font-mono font-bold text-gray-500">
                                                {s.responseMs !== null ? `${s.responseMs}ms` : '—'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sync Queue */}
                <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm flex flex-col">
                    <div className="p-5 border-b border-gray-50">
                        <h3 className="text-[13px] font-bold text-black uppercase tracking-widest">Sync Queue Breakdown</h3>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                        <div className="mb-6">
                            <p className="text-[24px] font-bold text-black">
                                {syncQueue.total.toLocaleString()} item{syncQueue.total !== 1 ? 's' : ''} pending
                            </p>
                            <p className="text-[12px] text-gray-500 mt-1">Unsynced records by table</p>
                        </div>

                        {syncQueue.total === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <CheckCircle2 size={32} className="text-green-400 mx-auto mb-2" />
                                    <p className="text-[13px] font-bold text-gray-500">Sync queue is clear</p>
                                </div>
                            </div>
                        ) : syncChartData.length > 0 ? (
                            <div className="flex-1 min-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={syncChartData}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                                        <XAxis dataKey="table" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: '#999' }} />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#999' }} />
                                        <Tooltip
                                            contentStyle={{ border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '11px' }}
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#000000" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {syncQueue.byTable.map(r => (
                                    <div key={r.table_name} className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-[13px] font-medium text-gray-700">{r.table_name}</span>
                                        <span className="text-[13px] font-bold text-black">{r.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sync Error Log */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm flex flex-col">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-black uppercase tracking-widest">
                        Sync Error Log (recent)
                    </h3>
                    <span className="text-[11px] font-bold text-gray-400">{syncQueue.recentErrors.length} errors</span>
                </div>
                {syncQueue.recentErrors.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-center">
                        <div>
                            <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
                            <p className="text-[13px] font-bold text-gray-500">No sync errors recorded</p>
                        </div>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Table</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operation</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Error</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {syncQueue.recentErrors.map((err, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-[12px] font-mono text-gray-400 whitespace-nowrap">
                                        {formatTime(err.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-[13px] font-bold text-black">{err.table_name}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                            {err.operation}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[12px] text-gray-600 max-w-sm truncate">{err.error_message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
                {[
                    { icon: <Database size={16} />, label: 'Database',   val: healthByType['database']?.status ?? 'unknown' },
                    { icon: <ShieldCheck size={16} />, label: 'Auth',    val: healthByType['api']?.status ?? 'unknown' },
                    { icon: <Cpu size={16} />, label: 'AI Service',      val: healthByType['ai_service']?.status ?? 'unknown' },
                    { icon: <Network size={16} />, label: 'Notifications', val: healthByType['notification']?.status ?? 'unknown' },
                ].map((item, idx) => {
                    const cfg = STATUS_CONFIG[item.val as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unknown
                    return (
                        <div key={idx} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="text-gray-400">{item.icon}</div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                <p className={`text-[13px] font-bold leading-none capitalize ${cfg.text}`}>{item.val}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default SystemHealth
