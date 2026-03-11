'use client';

import React, { useState } from 'react';
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
    Legend,
    Treemap,
    LineChart,
    Line
} from 'recharts';
import { Scorecard } from './DpoUI';
import { KPI, RiskAnalysisStats } from '@/lib/dpo/types';
import {
    ChevronRight,
    Search,
    ArrowUpRight,
    AlertCircle,
    Activity,
    Thermometer,
    ShieldAlert,
    BarChart3,
    Filter,
    Layers,
    ActivitySquare,
    ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const DpoRiskAnalysis: React.FC<{ stats: RiskAnalysisStats }> = ({ stats }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Coverage' | 'Risk' | 'Trends'>('Coverage');
    const [trendType, setTrendType] = useState<'Coverage' | 'Risk' | 'Volume'>('Coverage');

    const totalStats = stats.demographicData.reduce((acc, curr) => ({
        s: acc.s + curr.screened,
        t: acc.t + curr.total
    }), { s: 0, t: 0 });

    const coverageKpis: KPI[] = [
        { label: 'TOTAL CHILDREN', value: totalStats.t.toLocaleString(), trend: [], change: '', isPositive: true },
        { label: 'SCREENED', value: totalStats.s.toLocaleString(), trend: [], change: '', isPositive: true },
        { label: 'UNSCREENED', value: (totalStats.t - totalStats.s).toLocaleString(), trend: [], change: '', isPositive: true },
        { label: 'COVERAGE RATE', value: totalStats.t ? `${Math.round((totalStats.s / totalStats.t) * 100)}%` : '0%', trend: [], change: '', isPositive: true },
    ];

    const risks = stats.riskHistory[0] || { Low: 0, Med: 0, High: 0, Crit: 0 };
    const totalRisks = risks.Low + risks.Med + risks.High + risks.Crit || 1;

    const riskKpis = [
        { label: 'LOW RISK', value: risks.Low.toLocaleString(), color: '#22c55e', percentage: `${Math.round(risks.Low / totalRisks * 100)}%`, change: '', icon: Activity },
        { label: 'MEDIUM RISK', value: risks.Med.toLocaleString(), color: '#eab308', percentage: `${Math.round(risks.Med / totalRisks * 100)}%`, change: '', icon: ActivitySquare },
        { label: 'HIGH RISK', value: risks.High.toLocaleString(), color: '#f97316', percentage: `${Math.round(risks.High / totalRisks * 100)}%`, change: '', icon: AlertCircle },
        { label: 'CRITICAL', value: risks.Crit.toLocaleString(), color: '#ef4444', percentage: `${Math.round(risks.Crit / totalRisks * 100)}%`, change: '', icon: ShieldAlert },
    ];

    const getColorByCoverage = (cov: number) => {
        if (cov < 40) return '#ef4444';
        if (cov < 60) return '#eab308';
        if (cov < 80) return '#555555';
        return '#000000';
    };

    const getColorByConcern = (score: number) => {
        const opacity = Math.min(score / 15, 1);
        return `rgba(0, 0, 0, ${opacity})`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-[32px] font-bold text-black tracking-tighter uppercase">Screening & Risk Analysis</h1>
                    <p className="text-[14px] text-[#888888] font-medium flex items-center gap-2">
                        <Activity size={14} />
                        District Vitals • Live Regional Insight
                    </p>
                </div>
            </div>

            <div className="flex gap-10 border-b border-[#F0F0F0] px-2 overflow-x-auto scrollbar-hide">
                {[
                    { id: 'Coverage', label: 'Coverage Matrix' },
                    { id: 'Risk', label: 'Risk Distribution' },
                    { id: 'Trends', label: 'Performance Trends' }
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 text-[12px] font-black uppercase tracking-widest relative transition-all whitespace-nowrap ${isActive ? 'text-black' : 'text-[#AAAAAA] hover:text-[#888]'
                                }`}
                        >
                            {tab.label}
                            {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'Coverage' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
                    <div className="flex flex-nowrap gap-5 overflow-x-auto pb-4 scrollbar-hide">
                        {coverageKpis.map(kpi => <Scorecard key={kpi.label} kpi={kpi} />)}
                    </div>

                    <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden group">
                        <div className="p-8 border-b border-[#F0F0F0] flex justify-between items-center bg-[#fcfcfc]">
                            <div>
                                <h3 className="text-[14px] font-black uppercase tracking-widest text-black">Coverage Intensity Map</h3>
                                <p className="text-[12px] text-[#888] font-medium">Regional screening efficiency by child volume</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/5 border border-[#F0F0F0]">
                                {stats.treemapData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <Treemap
                                            data={stats.treemapData}
                                            dataKey="size"
                                            aspectRatio={16 / 9}
                                            stroke="#fff"
                                            onClick={(data: any) => data && router.push(`/dpo/cdpos`)}
                                            content={(props: any) => {
                                                const { x, y, width, height, index, name, coverage } = props;
                                                return (
                                                    <g className="cursor-pointer hover:opacity-90 transition-opacity">
                                                        <rect x={x} y={y} width={width} height={height} fill={getColorByCoverage(coverage)} stroke="#fff" strokeWidth={2} />
                                                        {width > 120 && height > 60 && (
                                                            <>
                                                                <text x={x + 20} y={y + 35} fill="#fff" fontSize={14} fontWeight="black" textAnchor="start" className="uppercase tracking-widest">{name}</text>
                                                                <text x={x + 20} y={y + 55} fill="rgba(255,255,255,0.6)" fontSize={11} fontWeight="bold" textAnchor="start" className="uppercase tracking-widest">{coverage}% COVERAGE</text>
                                                            </>
                                                        )}
                                                    </g>
                                                );
                                            }}
                                        />
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[#888] font-black uppercase tracking-widest text-[11px]">No Regional Data</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-black mb-10 flex items-center gap-2">
                                <Layers size={16} /> Demographic Coverage Depth
                            </h3>
                            <div className="h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.demographicData.map(d => ({ ...d, unscreened: d.total - d.screened }))}>
                                        <XAxis dataKey="age" fontSize={10} tickLine={false} axisLine={false} fontWeight="black" />
                                        <Tooltip cursor={{ fill: '#fcfcfc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="screened" name="Screened" stackId="a" fill="#000000" radius={[0, 0, 0, 0]} barSize={40} />
                                        <Bar dataKey="unscreened" name="Unscreened" stackId="a" fill="#F0F0F0" radius={[8, 8, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm flex flex-col justify-center text-center">
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#AAA] mb-4">Total Population Monitored</div>
                            <div className="text-[64px] font-black text-black leading-none">{totalStats.t.toLocaleString()}</div>
                            <div className="text-[14px] font-black text-black uppercase tracking-widest mt-4">District Children</div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Risk' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {riskKpis.map(kpi => (
                            <div key={kpi.label} className="bg-white p-6 rounded-2xl border-t-4 border-x border-b shadow-sm hover:shadow-lg transition-all" style={{ borderTopColor: kpi.color }}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-[11px] text-[#888888] font-black uppercase tracking-widest leading-none">{kpi.label}</div>
                                    <kpi.icon size={16} style={{ color: kpi.color }} strokeWidth={3} />
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-[32px] font-black text-black leading-none">{kpi.value}</span>
                                    <span className="text-[13px] font-black text-[#555] opacity-50">{kpi.percentage}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-[#F0F0F0] flex justify-between items-center bg-[#fcfcfc]">
                            <div>
                                <h3 className="text-[14px] font-black uppercase tracking-widest text-black">High-Risk Prioritization Census</h3>
                                <p className="text-[12px] text-[#888] font-medium uppercase tracking-tight">Immediate clinical intervention requested for following nodes</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px] border-collapse">
                                <thead>
                                    <tr className="bg-black text-white font-bold uppercase tracking-widest text-[10px]">
                                        <th className="px-8 py-5">Beneficiary Node</th>
                                        <th className="px-8 py-5">Sub-Region</th>
                                        <th className="px-8 py-5">Risk State</th>
                                        <th className="px-8 py-5 text-center">Score</th>
                                        <th className="px-8 py-5 text-right">Workflow</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0F0F0]">
                                    {stats.highRiskChildren.length > 0 ? stats.highRiskChildren.map(c => (
                                        <tr key={c.id} onClick={() => router.push(`/dpo/children/${c.id}`)} className="hover:bg-gray-50 cursor-pointer group transition-all">
                                            <td className="px-8 py-6">
                                                <div className="font-black text-black text-[15px] uppercase tracking-tighter flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                    {c.name}
                                                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="text-[10px] text-[#AAA] font-black uppercase tracking-widest mt-1">{c.age} • #{c.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-black uppercase tracking-tighter text-[11px]">{c.mandal} • {c.awc}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${c.risk.toLowerCase() === 'critical' ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-100' : 'bg-orange-500 text-white border-orange-500'}`}>
                                                    {c.risk}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-center font-black text-[18px] text-black tracking-tighter underline underline-offset-4 decoration-black/10">{c.score}</td>
                                            <td className="px-8 py-6 text-right font-black text-black uppercase text-[11px] tracking-widest bg-gray-50/30 group-hover:bg-black group-hover:text-white transition-all underline underline-offset-4">{c.status}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-10 text-center text-[#888] font-black uppercase tracking-widest text-[11px]">No High-Risk Cases Detected</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Trends' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                            <Activity size={200} />
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 relative z-10 gap-8">
                            <div>
                                <h3 className="text-[16px] font-black uppercase tracking-[0.3em] text-black">District Risk Distribution</h3>
                                <p className="text-[12px] text-[#888] font-black uppercase tracking-widest mt-2">Current State Overview</p>
                            </div>
                        </div>
                        <div className="h-[450px] relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.riskHistory}>
                                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#F0F0F0" />
                                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} fontWeight="black" dy={15} />
                                    <YAxis fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" dx={-10} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', padding: '20px' }}
                                    />
                                    <Bar dataKey="Low" fill="#22c55e" />
                                    <Bar dataKey="Med" fill="#eab308" />
                                    <Bar dataKey="High" fill="#f97316" />
                                    <Bar dataKey="Crit" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DpoRiskAnalysis;
