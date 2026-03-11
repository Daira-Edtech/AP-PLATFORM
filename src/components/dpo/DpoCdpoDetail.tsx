'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
    PieChart,
    Pie,
    CartesianGrid,
    Legend
} from 'recharts';
import {
    Phone,
    Mail,
    Search,
    ArrowLeft,
    ChevronRight,
    AlertCircle,
    Clock,
    CheckCircle2,
    MoreHorizontal
} from 'lucide-react';
import { Scorecard, FunnelStep } from './DpoUI';
import { CDPODetailStats } from '@/lib/dpo/types';

export default function DpoCdpoDetail({ data }: { data: CDPODetailStats }) {
    const router = useRouter();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <button
                        onClick={() => router.back()}
                        className="mt-1 p-2 bg-white border border-[#E5E5E5] rounded-full hover:bg-black hover:text-white transition-all shadow-sm"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-[28px] font-bold tracking-tight text-black">{data.name}</h1>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-[14px] text-[#333333] font-medium flex items-center gap-2">
                                Officer: {data.officer}
                                {data.phone && <Phone size={14} className="text-[#888888] cursor-pointer hover:text-black transition-colors" />}
                                {data.email && <Mail size={14} className="text-[#888888] cursor-pointer hover:text-black transition-colors" />}
                            </span>
                        </div>
                        <p className="text-[13px] text-[#888888] font-medium mt-1 uppercase tracking-widest">
                            {data.mandalsCount} MANDALS — {data.sectorsCount} SECTORS — {data.panchayatsCount} PANCHAYATS — {data.awcsCount} AWCS — {data.childrenCount.toLocaleString()} CHILDREN
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI ROW */}
            <div className="flex flex-nowrap gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {data.kpis.map((kpi) => (
                    <div key={kpi.label} className="min-w-[200px] flex-1">
                        <Scorecard kpi={kpi} />
                    </div>
                ))}
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                <div className="lg:col-span-6 bg-white border border-[#E5E5E5] rounded-[20px] p-6 shadow-xl shadow-black/5 overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-black">Mandal Breakdown</h3>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA]" />
                            <input
                                type="text"
                                placeholder="Search mandal..."
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-[#E5E5E5] rounded-xl text-[12px] focus:outline-none focus:border-black transition-all"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[12px]">
                            <thead>
                                <tr className="text-[#888888] border-b border-[#F0F0F0] font-black uppercase tracking-widest text-[10px]">
                                    <th className="pb-4 px-2">Mandal</th>
                                    <th className="pb-4 px-2 text-center">AWCs</th>
                                    <th className="pb-4 px-2 text-center">Children</th>
                                    <th className="pb-4 px-2 text-center">Screened</th>
                                    <th className="pb-4 px-2">Coverage</th>
                                    <th className="pb-4 px-2 text-center">Flags</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F0F0F0]">
                                {data.mandals.map((m) => (
                                    <tr key={m.id} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                                        <td className="py-4 px-2 font-black text-black">{m.name}</td>
                                        <td className="py-4 px-2 text-center font-medium">{m.awcs}</td>
                                        <td className="py-4 px-2 text-center font-medium">{m.children}</td>
                                        <td className="py-4 px-2 text-center font-semibold text-slate-600">{m.screened}</td>
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${m.coverage < 60 ? 'bg-amber-400' : 'bg-black'}`} style={{ width: `${m.coverage}%` }} />
                                                </div>
                                                <span className="font-black text-[13px]">{m.coverage}%</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-center">
                                            {m.escalated > 0 ? (
                                                <div className="flex items-center justify-center gap-1 text-red-600 font-black">
                                                    <AlertCircle size={12} />
                                                    {m.escalated}
                                                </div>
                                            ) : (
                                                <span className="text-[#AAAAAA] font-bold">0</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-white border border-[#E5E5E5] rounded-[20px] p-6 shadow-xl shadow-black/5 flex flex-col">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-black mb-6">CDPO Risk Distribution</h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="relative h-[220px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.riskDistribution}
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.riskDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute flex flex-col items-center justify-center text-center">
                                <span className="text-[24px] font-black text-black leading-tight tracking-tighter">
                                    {data.mandals.reduce((a, b) => a + b.screened, 0).toLocaleString()}
                                </span>
                                <span className="text-[10px] font-black text-[#888888] uppercase tracking-[0.1em]">screened</span>
                            </div>
                        </div>
                        <div className="w-full mt-6 space-y-3">
                            <div className="flex justify-between items-center text-[12px]">
                                <span className="font-black text-[#555555] uppercase">vs District Average</span>
                                <span className="text-red-600 font-bold">-2% below avg</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full relative overflow-hidden">
                                <div className="h-full bg-black rounded-full transition-all duration-1000" style={{ width: '62%' }} />
                                <div className="absolute top-0 bottom-0 left-[64%] w-[2px] bg-red-500 z-10" />
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-[#888888] uppercase tracking-wider text-center">
                                <span>This CDPO: 62%</span>
                                <span>Dist Avg: 64%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ROW 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E5E5E5] rounded-[20px] p-6 shadow-xl shadow-black/5">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-black mb-6">Coverage Trend</h3>
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.coverageTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                                <XAxis dataKey="name" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                                <YAxis fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} domain={[40, 70]} dx={-10} />
                                <Tooltip />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Area type="monotone" dataKey="cdpo" name="This CDPO" stroke="#000000" strokeWidth={3} fillOpacity={0.05} fill="#000000" />
                                <Area type="monotone" dataKey="district" name="District Avg" stroke="#AAAAAA" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E5E5] rounded-[20px] p-6 shadow-xl shadow-black/5 flex flex-col">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-black mb-6">Recent Activity</h3>
                    <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                        {data.recentActivities.map((activity, idx) => {
                            const Icon = activity.icon === 'AlertCircle' ? AlertCircle
                                : activity.icon === 'CheckCircle2' ? CheckCircle2
                                    : activity.icon === 'Clock' ? Clock
                                        : MoreHorizontal;

                            return (
                                <div key={idx} className="flex gap-4 relative">
                                    {idx !== data.recentActivities.length - 1 && (
                                        <div className="absolute left-[15px] top-[30px] bottom-[-20px] w-[2px] bg-slate-100" />
                                    )}
                                    <div className={`w-8 h-8 ${activity.bg} ${activity.color} rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm border border-black/5`}>
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[14px] text-black font-semibold leading-tight">{activity.text}</p>
                                        <p className="text-[11px] text-[#888888] font-black uppercase tracking-widest mt-1">{activity.time}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* LEGACY FUNNEL ROW IMITATION */}
            <div className="bg-white border border-[#E5E5E5] rounded-[20px] p-8 shadow-xl shadow-black/5">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-black">Referral Pipeline Health</h3>
                    <button className="text-[11px] text-black font-black uppercase tracking-widest hover:underline flex items-center gap-1 group">
                        View Detailed Pipeline
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-6">
                        <FunnelStep label="Generated" count={23} total={23} />
                        <FunnelStep label="Sent" count={18} total={23} />
                        <FunnelStep label="Scheduled" count={12} total={23} bottleneck />
                        <FunnelStep label="Completed" count={8} total={23} />
                    </div>
                    <div className="lg:border-l border-[#F0F0F0] lg:pl-10 flex flex-col justify-center">
                        <div className="text-[10px] font-black text-[#888888] uppercase tracking-[0.2em] mb-6">Action Required</div>
                        <div className="space-y-4">
                            {[
                                { id: 'REF-001', child: 'Arun K.', days: 14, status: 'Critical' },
                                { id: 'REF-042', child: 'Sita M.', days: 9, status: 'Overdue' }
                            ].map(ref => (
                                <div key={ref.id} className="p-4 bg-slate-50 border border-[#F0F0F0] rounded-[14px] hover:border-black transition-all cursor-pointer shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[13px] font-black text-black">{ref.child}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${ref.status === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {ref.status}
                                        </span>
                                    </div>
                                    <div className="text-[11px] font-medium text-[#555555] uppercase tracking-widest leading-none">
                                        {ref.id} • {ref.days} days pending
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
