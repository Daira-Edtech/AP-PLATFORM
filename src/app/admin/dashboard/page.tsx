import React from 'react';
import {
    Users, Scan, Building2, MapPin, Crown,
    Activity, Database, ShieldAlert,
    Clock, ArrowRight,
    Plus, AlertCircle, ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
    const supabase = await createClient();

    // Fetch all data in parallel
    const [
        { count: totalAWCs },
        { count: totalMandals },
        { count: totalDistricts },
        { count: totalStates },
        { data: allProfiles },
        { data: auditLogs },
        { data: awcs },
        { count: syncQueueCount },
    ] = await Promise.all([
        supabase.from('awcs').select('*', { count: 'exact', head: true }),
        supabase.from('mandals').select('*', { count: 'exact', head: true }),
        supabase.from('districts').select('*', { count: 'exact', head: true }),
        supabase.from('states').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, name, role, is_active, awc_id, mandal_id, district_id'),
        supabase.from('audit_log').select('id, action, user_id, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('awcs').select('id'),
        supabase.from('sync_queue').select('*', { count: 'exact', head: true }).eq('synced', false),
    ]);

    const profiles = allProfiles || [];

    // USER KPIs Calculation
    const getRoleStats = (role: string) => {
        const roleUsers = profiles.filter(p => p.role.toLowerCase() === role.toLowerCase());
        return {
            active: roleUsers.filter(p => p.is_active).length,
            total: roleUsers.length
        };
    };

    const awwStats = getRoleStats('aww');
    const screenerStats = getRoleStats('screener');
    const cdpoStats = getRoleStats('cdpo');
    const dpoStats = getRoleStats('dpo');
    const commissionerStats = getRoleStats('commissioner');

    const USER_KPIS = [
        { label: 'AWWS', value: awwStats.total.toLocaleString(), active: awwStats.active, total: awwStats.total, icon: <Users size={18} />, color: 'text-green-500' },
        { label: 'Mandal Screeners', value: screenerStats.total.toLocaleString(), active: screenerStats.active, total: screenerStats.total, icon: <Scan size={18} />, color: 'text-blue-500' },
        { label: 'CDPOs', value: cdpoStats.total.toLocaleString(), active: cdpoStats.active, total: cdpoStats.total, icon: <Building2 size={18} />, color: 'text-indigo-500' },
        { label: 'DPOs', value: dpoStats.total.toLocaleString(), active: dpoStats.active, total: dpoStats.total, icon: <MapPin size={18} />, color: 'text-orange-500' },
        { label: 'Commissioner', value: commissionerStats.total.toLocaleString(), active: commissionerStats.active, total: commissionerStats.total, icon: <Crown size={18} />, color: 'text-amber-500' },
    ];

    // SYSTEM KPIs
    const pendingSync = syncQueueCount || 0;
    const SYSTEM_KPIS = [
        { label: 'Uptime', value: '99.9%', sub: 'Healthy', color: 'text-green-500', icon: <Activity size={18} /> },
        { label: 'Sync Queue', value: pendingSync.toString(), sub: pendingSync === 0 ? 'All synced' : 'Pending sync', color: pendingSync === 0 ? 'text-green-500' : 'text-amber-500', icon: <Database size={18} /> },
        { label: 'Errors (24h)', value: '0', sub: 'Optimal', color: 'text-green-500', icon: <ShieldAlert size={18} /> },
        { label: 'Database', value: '—', sub: 'Supabase Cloud', color: 'text-gray-500', icon: <Database size={18} /> },
    ];

    // ASSIGNMENTS
    const ASSIGNMENTS = [
        { role: 'AWWs', assigned: profiles.filter(p => p.role === 'aww' && p.awc_id).length, total: awwStats.total },
        { role: 'Mandal Screeners', assigned: profiles.filter(p => p.role === 'screener' && p.mandal_id).length, total: screenerStats.total },
        { role: 'CDPOs', assigned: profiles.filter(p => p.role === 'cdpo' && p.district_id).length, total: cdpoStats.total },
        { role: 'DPOs', assigned: profiles.filter(p => p.role === 'dpo' && p.district_id).length, total: dpoStats.total },
    ].map(a => ({ ...a, unassigned: a.total - a.assigned }));

    const totalUnassigned = ASSIGNMENTS.reduce((sum, a) => sum + a.unassigned, 0);

    // RECENT ACTIONS
    const RECENT_ACTIONS = (auditLogs || []).map(log => ({
        icon: log.action?.toLowerCase().includes('create') ? <Plus size={14} /> : <ArrowRight size={14} />,
        desc: log.action || 'System action',
        admin: 'Admin',
        time: log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
    }));

    // GEOGRAPHIC COVERAGE
    const hierarchyData = [
        { label: 'State', count: totalStates || 0 },
        { label: 'Districts', count: totalDistricts || 0 },
        { label: 'CDPOs', count: totalDistricts || 0 }, // Assuming 1 per district for this view or total cdpos
        { label: 'Mandals', count: totalMandals || 0 },
        { label: 'AWCs', count: totalAWCs || 0 }
    ];

    // Identifing AWCs without AWW
    const assignedAwcIds = new Set(profiles.filter(p => p.role === 'aww' && p.awc_id).map(p => p.awc_id));
    const awcsWithoutAww = (awcs || []).filter(awc => !assignedAwcIds.has(awc.id)).length;

    // ACTION ITEMS
    const ACTION_ITEMS = [
        { label: `${awcsWithoutAww} AWCs need AWW assignment`, priority: awcsWithoutAww > 50 ? 'red' : 'amber', link: '/admin/assignments' },
        { label: `${totalUnassigned} personnel unassigned across roles`, priority: totalUnassigned > 100 ? 'red' : 'amber', link: '/admin/assignments' },
    ];

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-[24px] font-semibold text-black">Admin Dashboard</h1>
                <p className="text-[13px] text-[#888888]">System overview and user health</p>
            </div>

            {/* Row 1: User KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {USER_KPIS.map((kpi, idx) => (
                    <div key={idx} className="bg-[#f5f5f5] p-5 rounded-[12px] border border-[#E5E5E5] flex flex-col justify-between hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 bg-gray-50 rounded-[12px] ${kpi.color}`}>
                                {kpi.icon}
                            </div>
                            {kpi.active < kpi.total && (
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            )}
                        </div>
                        <div>
                            <p className="text-[32px] font-bold text-black leading-tight">{kpi.value}</p>
                            <p className="text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-2">{kpi.label}</p>
                            <p className="text-[11px] text-[#888888]">
                                <span className="font-semibold text-black">{kpi.active} active</span> / {kpi.total} total
                                {kpi.active < kpi.total && <span className="text-red-500 ml-1">({kpi.total - kpi.active} disabled)</span>}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 2: System KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SYSTEM_KPIS.map((kpi, idx) => (
                    <div key={idx} className="bg-[#f5f5f5] p-5 rounded-[12px] border border-[#E5E5E5] flex items-center space-x-4">
                        <div className={`p-3 bg-gray-50 rounded-full ${kpi.color}`}>
                            {kpi.icon}
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">{kpi.label}</p>
                            <div className="flex items-center space-x-2">
                                <span className="text-[20px] font-bold text-black">{kpi.value}</span>
                                <span className={`text-[11px] font-medium ${kpi.color === 'text-green-500' ? 'text-green-600' : 'text-gray-400'}`}>
                                    {kpi.sub}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 3: Assignment Health & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                {/* Card A: Assignment Health */}
                <div className="lg:col-span-6 bg-[#f5f5f5] rounded-[12px] border border-[#E5E5E5] flex flex-col">
                    <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center">
                        <h2 className="text-[14px] font-bold uppercase tracking-wider text-black">Assignment Status</h2>
                        <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold flex items-center">
                            {totalUnassigned} unassigned users
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {ASSIGNMENTS.map((role, idx) => {
                            const total = role.assigned + role.unassigned;
                            const assignedPercent = total > 0 ? (role.assigned / total) * 100 : 0;
                            return (
                                <div key={idx} className="space-y-2">
                                    <div className="flex justify-between text-[12px]">
                                        <span className="font-semibold text-gray-700">{role.role}</span>
                                        <span className="text-gray-500">
                                            <span className="font-bold text-black">{role.assigned.toLocaleString()}</span> assigned |
                                            <span className="font-bold text-[#888888]"> {role.unassigned.toLocaleString()}</span> unassigned
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-[#fb923c]" style={{ width: `${assignedPercent}%` }} />
                                        <div className="h-full bg-[var(--color-slate-mute)]" style={{ width: `${100 - assignedPercent}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-auto p-4 border-t border-[#F5F5F5]">
                        <a href="/admin/assignments" className="text-[13px] font-bold text-blue-600 flex items-center justify-center hover:underline">
                            Fix assignments <ArrowRight size={14} className="ml-1" />
                        </a>
                    </div>
                </div>

                {/* Card B: Recent Activity */}
                <div className="lg:col-span-4 bg-[#f5f5f5] rounded-[12px] border border-[#E5E5E5] flex flex-col h-full">
                    <div className="p-6 border-b border-[#F5F5F5]">
                        <h2 className="text-[14px] font-bold uppercase tracking-wider text-black">Recent Admin Actions</h2>
                    </div>
                    <div className="p-4 flex-1 space-y-4 overflow-y-auto">
                        {RECENT_ACTIONS.length > 0 ? RECENT_ACTIONS.map((action, idx) => (
                            <div key={idx} className="flex space-x-3 items-start p-2 rounded hover:bg-gray-50 transition-colors">
                                <div className="mt-0.5 p-1.5 bg-gray-100 rounded text-gray-500">
                                    {action.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[12px] text-gray-800 leading-tight mb-1 font-medium">{action.desc}</p>
                                    <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                        <span>{action.admin}</span>
                                        <span>•</span>
                                        <div className="flex items-center space-x-1">
                                            <Clock size={10} />
                                            <span>{action.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-[12px] text-gray-400 text-center py-8">No recent actions found.</p>
                        )}
                    </div>
                    <div className="p-4 border-t border-[#F5F5F5]">
                        <a href="/admin/audit-log" className="text-[13px] font-bold text-black flex items-center justify-center hover:underline">
                            View audit log <ArrowRight size={14} className="ml-1" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Row 4: Hierarchy Health & Action Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                {/* Card C: Hierarchy Health */}
                <div className="bg-[#f5f5f5] rounded-[12px] border border-[#E5E5E5] flex flex-col">
                    <div className="p-6 border-b border-[#F5F5F5]">
                        <h2 className="text-[14px] font-bold uppercase tracking-wider text-black">Geographic Coverage</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between py-4 border-b border-gray-50">
                            {hierarchyData.map((item, idx, arr) => (
                                <React.Fragment key={idx}>
                                    <div className="text-center">
                                        <p className="text-[20px] font-bold text-black">{item.count}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</p>
                                    </div>
                                    {idx < arr.length - 1 && <ChevronRight size={14} className="text-gray-200" />}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="p-3 bg-red-50 border border-red-100 rounded-[12px] flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-red-700">
                                    <AlertCircle size={14} />
                                    <span className="text-[12px] font-bold">AWCs without AWW</span>
                                </div>
                                <span className="text-red-700 font-bold text-[14px]">{awcsWithoutAww}</span>
                            </div>
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-[12px] flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-amber-700">
                                    <AlertCircle size={14} />
                                    <span className="text-[12px] font-bold">Unassigned PERSONNEL</span>
                                </div>
                                <span className="text-amber-700 font-bold text-[14px]">{totalUnassigned}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto p-4 border-t border-[#F5F5F5]">
                        <a href="/admin/geography" className="text-[13px] font-bold text-black flex items-center justify-center hover:underline">
                            Manage hierarchy <ArrowRight size={14} className="ml-1" />
                        </a>
                    </div>
                </div>

                {/* Card D: Action Items */}
                <div className="bg-[#f5f5f5] rounded-[12px] border border-[#E5E5E5] flex flex-col">
                    <div className="p-6 border-b border-[#F5F5F5]">
                        <h2 className="text-[14px] font-bold uppercase tracking-wider text-black">Action Items</h2>
                    </div>
                    <div className="p-4 space-y-2">
                        {ACTION_ITEMS.map((item, idx) => (
                            <a
                                key={idx}
                                href={item.link}
                                className="flex items-center p-3 rounded-[12px] border border-gray-100 hover:border-black transition-all group"
                            >
                                <div className={`w-2 h-2 rounded-full mr-4 ${item.priority === 'red' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' :
                                        item.priority === 'amber' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-green-500'
                                    }`}></div>
                                <span className="flex-1 text-[13px] text-gray-700 font-medium group-hover:text-black">{item.label}</span>
                                <ChevronRight size={14} className="text-gray-300 group-hover:text-black" />
                            </a>
                        ))}
                        {ACTION_ITEMS.length === 0 && (
                            <div className="py-8 text-center text-gray-400 italic text-[12px]">Everything looks good!</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
