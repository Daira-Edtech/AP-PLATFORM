'use client';

import React from 'react';
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
} from 'recharts';
import { Scorecard, FunnelStep, AlertItem } from './DpoUI';
import { KPI, DpoDashboardStats } from '@/lib/dpo/types';
import { TrendingUp, TrendingDown, ChevronRight, AlertCircle, AlertTriangle, Map, Send, Activity, ShieldCheck, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DpoDashboard({ stats }: { stats: DpoDashboardStats }) {
    const router = useRouter();

    const kpis: KPI[] = [
        { label: 'TOTAL CHILDREN', value: stats.totalChildren.toLocaleString(), trend: [], change: '', isPositive: true },
        { label: 'SCREENED', value: stats.screenedChildren.toLocaleString(), trend: [], change: '', isPositive: true },
        { label: 'COVERAGE', value: `${stats.coverageRate}%`, trend: [], change: '', isPositive: true },
        { label: 'HIGH/CRITICAL', value: (stats.highRiskCount + stats.criticalRiskCount).toLocaleString(), trend: [], change: '', isPositive: false },
        { label: 'ESCALATIONS', value: stats.escalationsCount.toLocaleString(), trend: [], change: '', isPositive: false },
        { label: 'ACTIVE REFERRALS', value: stats.activeReferralsCount.toLocaleString(), trend: [], change: '', isPositive: true },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-[32px] font-bold text-black tracking-tighter uppercase">District Dashboard</h1>
                    <p className="text-[14px] text-[#888888] font-medium flex items-center gap-2">
                        <Map size={14} />
                        Active District Monitoring • Real-time Data
                    </p>
                </div>
                <div className="flex bg-white shadow-sm border border-[#E5E5E5] rounded-xl p-1">
                    {['Realtime', 'History', 'Forecast'].map((pill) => (
                        <button
                            key={pill}
                            className={`px-6 py-1.5 text-[11px] font-bold uppercase rounded-lg transition-all ${pill === 'Realtime' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-[#888] hover:text-black hover:bg-gray-50'}`}
                        >
                            {pill}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-nowrap gap-5 overflow-x-auto pb-4 scrollbar-hide">
                {kpis.map((kpi) => (
                    <Scorecard key={kpi.label} kpi={kpi} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-110 transition-transform">
                        <Map size={240} />
                    </div>
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <h3 className="text-[14px] font-black uppercase tracking-widest text-black flex items-center gap-2">
                            <Activity size={16} /> Regional Performance Density
                        </h3>
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-[#888888]">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-gray-100" /> Lower Cov.</div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-black" /> Optimal</div>
                        </div>
                    </div>
                    <div className="h-[380px] bg-[#fcfcfc] rounded-2xl border border-[#F5F5F5] relative overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner">
                        {stats.regionalPerformance.length > 0 ? (
                            <div className="w-full space-y-4">
                                {stats.regionalPerformance.map((region, idx) => (
                                    <div key={idx} className="flex items-center justify-between group/item cursor-pointer" onClick={() => router.push('/dpo/cdpos')}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-tighter">
                                                {region.name.slice(0, 3)}
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-black uppercase tracking-tighter text-black">{region.name}</div>
                                                <div className="text-[10px] text-[#888] font-bold uppercase tracking-widest">Regional Node</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-[18px] font-black text-black leading-none">{region.coverage}%</div>
                                                <div className="text-[9px] text-[#888] font-black uppercase tracking-widest mt-1">Coverage</div>
                                            </div>
                                            <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-black transition-all group-hover/item:bg-black/80" style={{ width: `${region.coverage}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[#888] font-black uppercase tracking-widest text-[11px]">No Regional Data Found</div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-5 bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-gray-50 rounded-full group-hover:scale-110 transition-transform duration-1000" />
                    <h3 className="text-[14px] font-black uppercase tracking-widest text-black mb-10 relative z-10">Risk Composition Registry</h3>
                    <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                        <div className="relative h-[240px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.riskDistribution}
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.riskDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute flex flex-col items-center justify-center text-center">
                                <span className="text-[32px] font-black text-black leading-none">
                                    {stats.screenedChildren > 1000 ? `${(stats.screenedChildren / 1000).toFixed(1)}K` : stats.screenedChildren}
                                </span>
                                <span className="text-[10px] text-[#888] font-black uppercase tracking-widest mt-1">Screened</span>
                            </div>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-4 mt-10">
                            {stats.riskDistribution.map((risk) => (
                                <div key={risk.name} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-transparent hover:border-black/5 transition-all">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: risk.color }} />
                                    <div>
                                        <p className="text-[12px] text-black font-black uppercase tracking-tighter">{risk.name}</p>
                                        <p className="text-[10px] text-[#888] font-bold">
                                            {stats.screenedChildren ? Math.round(risk.value / stats.screenedChildren * 100) : 0}% Index
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="w-full mt-10 pt-8 border-t border-[#F9F9F9]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#888]">Gov Coverage Performance</span>
                                <span className="px-3 py-1 bg-black text-white text-[10px] font-black rounded-lg border border-black shadow-sm shadow-black/5">Live Status</span>
                            </div>
                            <div className="h-2 w-full bg-[#f0f0f0] rounded-full overflow-hidden">
                                <div className="h-full bg-black transition-all duration-1000 shadow-[0_0_10px_black]" style={{ width: `${stats.coverageRate}%` }} />
                            </div>
                            <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest">
                                <span className="text-[#CCC]">Baseline: 50%</span>
                                <span className="text-black">Actual: {stats.coverageRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm group">
                    <h3 className="text-[14px] font-black uppercase tracking-widest text-black mb-10">Temporal Screening Velocity</h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.screeningTrend}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#F0F0F0" />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} fontWeight="black" />
                                <YAxis fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="val"
                                    stroke="#000000"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorVal)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm flex flex-col group">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-[14px] font-black uppercase tracking-widest text-black flex items-center gap-2">
                            <ShieldCheck size={16} /> Governance Lifecycle
                        </h3>
                        <button onClick={() => router.push('/dpo/escalations')} className="text-[10px] font-black uppercase tracking-widest text-black hover:underline group-hover:translate-x-1 transition-transform flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            Drill Down <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="space-y-6 flex-1 flex flex-col justify-center px-4">
                        <div className="space-y-6">
                            <FunnelStep label="Escalations (Raised/Active)" count={stats.escalationsCount} total={stats.escalationsCount || 100} />
                            <FunnelStep label="Clinical Referrals (Active)" count={stats.activeReferralsCount} total={stats.activeReferralsCount || 100} />
                            <div className="p-10 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-[#AAA]">Real-time audit active</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12 bg-black border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Send size={120} color="white" />
                    </div>
                    <div className="flex justify-between items-center mb-1 relative z-10">
                        <h3 className="text-[14px] font-black uppercase tracking-widest text-white">Live Monitoring Status</h3>
                    </div>
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Database State</div>
                        <div className="text-[14px] font-bold text-white uppercase tracking-widest">
                            Showing data for {stats.totalChildren.toLocaleString()} Children across monitored regions
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
