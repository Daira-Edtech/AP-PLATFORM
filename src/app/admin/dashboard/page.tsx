import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()

    // Fetch all counts in parallel
    const [
        { count: totalUsers },
        { count: totalChildren },
        { count: totalAWCs },
        { count: totalFlags },
        { count: totalQuestions },
        { count: totalActivities },
        { data: recentAuditLogs },
        { data: recentAlerts },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('children').select('*', { count: 'exact', head: true }),
        supabase.from('awcs').select('*', { count: 'exact', head: true }),
        supabase.from('flags').select('*', { count: 'exact', head: true }).eq('status', 'raised'),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('activities').select('*', { count: 'exact', head: true }),
        supabase.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(5),
        supabase.from('alerts').select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(5),
    ])

    const stats = [
        {
            label: 'Total Users',
            value: totalUsers ?? 0,
            subtext: `${totalUsers ?? 0} active`,
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            dot: 'bg-blue-500'
        },
        {
            label: 'Children Enrolled',
            value: totalChildren ?? 0,
            subtext: 'Across all districts',
            icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            color: 'text-green-600',
            bg: 'bg-green-50',
            dot: 'bg-green-500'
        },
        {
            label: 'AWCs Active',
            value: totalAWCs ?? 0,
            subtext: 'Reporting daily',
            icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            dot: 'bg-purple-500'
        },
        {
            label: 'Open Flags',
            value: totalFlags ?? 0,
            subtext: 'Requires attention',
            icon: 'M3 21v-8a2 2 0 01-2-1.85V19a2 2 0 104 0v-1.85a4 4 0 008 0v1.85a2 2 0 104 0v-1.85A4 4 0 0022 19v-6a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
            color: 'text-red-600',
            bg: 'bg-red-50',
            dot: 'bg-red-500'
        },
    ]

    const systemMetrics = [
        { label: 'Uptime', value: '99.8%', status: 'Healthy', color: 'text-green-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        { label: 'Sync Queue', value: '342', status: 'Processing', color: 'text-amber-500', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
        { label: 'Errors (24h)', value: '0', status: 'Optimal', color: 'text-emerald-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Database', value: '2.1 GB', status: 'Capacity 10%', color: 'text-blue-500', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">System overview and user health</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-colors">
                        Export Report
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-zinc-800 transition-colors">
                        Add User
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                        <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${stat.dot}`}></div>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mt-2">{stat.value.toLocaleString()}</h3>
                                <p className="text-xs text-zinc-400 mt-1">{stat.subtext}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} bg-opacity-50 dark:bg-opacity-10`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {systemMetrics.map((metric) => (
                    <div key={metric.label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4">
                        <div className={`p-2 rounded-full bg-zinc-50 dark:bg-zinc-800 ${metric.color}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={metric.icon} />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{metric.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-zinc-900 dark:text-white">{metric.value}</span>
                                <span className={`text-xs ${metric.color}`}>{metric.status}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Splits: Assignment Status & Recent Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Assignment Status */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Assignment Status</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            171 unassigned users
                        </span>
                    </div>

                    <div className="space-y-6">
                        {[
                            { label: 'AWWs', total: 8500, assigned: 8340, color: 'bg-emerald-500' },
                            { label: 'Mandal Screeners', total: 420, assigned: 412, color: 'bg-emerald-500' },
                            { label: 'CDPOs', total: 68, assigned: 65, color: 'bg-emerald-500' },
                            { label: 'DPOs', total: 13, assigned: 13, color: 'bg-emerald-500' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.label}</span>
                                    <div className="text-zinc-500 text-xs">
                                        <span className="font-bold text-zinc-900 dark:text-white">{item.assigned.toLocaleString()}</span> assigned
                                        <span className="mx-1.5 text-zinc-300">|</span>
                                        <span className="text-red-500 font-medium">{(item.total - item.assigned).toLocaleString()} unassigned</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${(item.assigned / item.total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-8 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center gap-2 transition-colors">
                        Fix assignments
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>

                {/* Recent Actions */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Recent Admin Actions</h3>

                    <div className="space-y-6">
                        {recentAuditLogs?.length ? recentAuditLogs.map((log) => (
                            <div key={log.id} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700">
                                    <span className="text-xs font-bold text-zinc-500">AL</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{log.action}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-zinc-500 uppercase tracking-wider">{log.user_role || 'System'}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                        <span className="text-xs text-zinc-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-zinc-400 text-sm">No recent actions recorded</div>
                        )}

                        {/* Mock data to fill UI if empty */}
                        {!recentAuditLogs?.length && [
                            { action: 'Created AWW account: Lakshmi D.', user: 'ADMIN.RAVI', time: '2h ago', icon: '+' },
                            { action: 'Reassigned CDPO Dr. Meena', user: 'ADMIN.RAM', time: '5h ago', icon: '→' },
                            { action: 'Bulk imported 45 AWWs (CSV)', user: 'ADMIN.PRIYA', time: '1d ago', icon: '⭳' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700 text-zinc-500 font-bold text-xs">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.action}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-zinc-500 uppercase tracking-wider">{item.user}</span>
                                        <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                                        <span className="text-xs text-zinc-400">{item.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-8 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center gap-2 transition-colors">
                        View audit log
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}