'use client';

import React, { useState } from 'react';
import {
    AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, CartesianGrid, Legend, Treemap, LineChart, Line
} from 'recharts';
import { Scorecard } from './DpoUI';
import { DpoScreeningStats, KPI } from '@/lib/dpo/types';
import { ChevronRight, Search, ArrowUpRight, TrendingUp, Filter, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DpoScreeningProps {
    stats: DpoScreeningStats;
}

const DpoScreening: React.FC<DpoScreeningProps> = ({ stats }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'Coverage' | 'Risk' | 'Trends'>('Coverage');
    const [trendType, setTrendType] = useState<'Coverage' | 'Risk' | 'Volume'>('Coverage');

    const domainMap: Record<string, string> = {
        'GM': 'GM (Gross Motor)',
        'FM': 'FM (Fine Motor)',
        'LC': 'LC (Lang/Comm)',
        'COG': 'COG (Cognitive)',
        'SE': 'SE (Socio-Emo)'
    };

    const getColorByCoverage = (cov: number) => {
        const opacity = Math.max(0.1, cov / 100);
        return `rgba(0, 0, 0, ${opacity})`;
    };

    const getColorByConcern = (score: number) => {
        const opacity = Math.min(1, score / 40); // Scaled for intensity
        return `rgba(0, 0, 0, ${opacity})`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-[32px] font-bold text-black tracking-tighter uppercase">Screening & Risk</h1>
                    <p className="text-[14px] text-[#888888] font-medium flex items-center gap-2">
                        <Calendar size={14} />
                        District Level Overview • Q1 2026 Analytics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white shadow-sm border border-[#E5E5E5] rounded-xl p-1">
                        {['Week', 'Month', 'Term', 'Year'].map((pill) => (
                            <button
                                key={pill}
                                className={`px-5 py-1.5 text-[11px] font-bold uppercase rounded-lg transition-all ${pill === 'Month' ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-[#888] hover:text-black hover:bg-gray-50'}`}
                            >
                                {pill}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-10 border-b border-[#F0F0F0] px-2 overflow-x-auto scrollbar-hide">
                {['Coverage', 'Risk Distribution', 'Trends'].map(tab => {
                    const tabKey = tab === 'Risk Distribution' ? 'Risk' : tab;
                    const isActive = activeTab === tabKey;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tabKey as any)}
                            className={`pb-4 text-[12px] font-black uppercase tracking-widest relative transition-all whitespace-nowrap ${isActive ? 'text-black' : 'text-[#AAAAAA] hover:text-[#888]'
                                }`}
                        >
                            {tab}
                            {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'Coverage' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
                    <div className="flex flex-nowrap gap-5 overflow-x-auto pb-4 scrollbar-hide">
                        {stats.coverageKpis.map(kpi => <Scorecard key={kpi.label} kpi={kpi} />)}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-black mb-8 flex items-center gap-2">
                                <TrendingUp size={16} /> Regional Coverage Density
                            </h3>
                            <div className="h-[380px] w-full bg-[#fcfcfc] rounded-xl border border-[#F5F5F5] overflow-hidden">
                                <ResponsiveContainer width="100%" height="100%">
                                    <Treemap
                                        data={stats.treemapData}
                                        dataKey="size"
                                        aspectRatio={4 / 3}
                                        stroke="#fff"
                                        onClick={(data: any) => data && router.push(`/dpo/cdpos/${data.id}`)}
                                        content={(props: any) => {
                                            const { x, y, width, height, name, coverage } = props;
                                            return (
                                                <g className="cursor-pointer group">
                                                    <rect x={x} y={y} width={width} height={height} fill={getColorByCoverage(coverage)} stroke="#fff" strokeWidth={2} className="group-hover:opacity-90 transition-opacity" />
                                                    {width > 80 && height > 50 && (
                                                        <>
                                                            <text x={x + 15} y={y + 30} fill={coverage > 60 ? "#fff" : "#000"} fontSize={14} fontWeight="900" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{name}</text>
                                                            <text x={x + 15} y={y + 50} fill={coverage > 60 ? "#fff" : "#888"} fontSize={11} fontWeight="700">{coverage}% COVERAGE</text>
                                                        </>
                                                    )}
                                                </g>
                                            );
                                        }}
                                    />
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-white border-l-8 border-red-500 border-y border-r border-[#E5E5E5] rounded-2xl p-6 shadow-sm">
                                <h3 className="text-[12px] font-black uppercase tracking-widest text-black mb-6">CRITICAL SUB-CENTERS</h3>
                                <div className="space-y-5">
                                    {stats.criticalSubCenters.map(m => (
                                        <div key={m.name} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-all">
                                            <div>
                                                <p className="font-black text-black text-[13px] uppercase tracking-tight">{m.name}</p>
                                                <p className="text-[10px] text-[#888] uppercase font-bold">{m.cdpo} CDPO • {m.activity}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[15px] font-black ${m.coverage < 35 ? 'text-red-600' : 'text-amber-500'}`}>{m.coverage}%</span>
                                                <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                    <div className={`h-full ${m.coverage < 35 ? 'bg-red-600' : 'bg-amber-500'}`} style={{ width: `${m.coverage}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-6 py-3 border border-[#F0F0F0] rounded-xl text-[11px] font-black uppercase tracking-widest text-[#888] hover:bg-black hover:text-white hover:border-black transition-all">View All Alerts</button>
                            </div>

                            <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-sm">
                                <h3 className="text-[12px] font-black uppercase tracking-widest text-black mb-6">AGE SEGMENTATION</h3>
                                <div className="h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.ageSegmentation.map(d => ({ ...d, unscreened: d.total - d.screened }))}>
                                            <XAxis dataKey="age" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}Y`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                                labelStyle={{ fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="screened" name="Screened" stackId="a" fill="#000000" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="unscreened" name="Unscreened" stackId="a" fill="#F0F0F0" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 mt-4">
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-black rounded" /> <span className="text-[10px] uppercase font-bold text-[#888]">Screened</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#F0F0F0] rounded" /> <span className="text-[10px] uppercase font-bold text-[#888]">Total Registry</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Risk' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                        {stats.riskKpis.map(kpi => (
                            <div key={kpi.label} className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.03] -mr-4 -mt-4 transform rotate-12 group-hover:rotate-45 transition-transform" style={{ color: kpi.color }}>
                                    <TrendingUp size={64} strokeWidth={3} />
                                </div>
                                <div className="text-[11px] text-[#888888] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: kpi.color }} />
                                    {kpi.label}
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-3xl font-black text-black">{kpi.value}</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[13px] font-black" style={{ color: kpi.color }}>{kpi.percentage}</span>
                                        <span className="text-[10px] font-bold text-[#888]">{kpi.change} MoM</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-black mb-8 flex items-center gap-2">
                                <Filter size={16} /> Inter-Regional Risk Analysis
                            </h3>
                            <div className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.interRegionalRisk}>
                                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                                        <Tooltip cursor={{ fill: '#fcfcfc' }} />
                                        <Bar dataKey="Low" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="Med" fill="#eab308" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="High" fill="#f97316" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="Crit" fill="#ef4444" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="lg:col-span-5 bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-black mb-8">Composition of Risk</h3>
                            <div className="h-[320px] flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={stats.riskKpis} innerRadius={85} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                                            {stats.riskKpis.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-[11px] font-black text-[#888] uppercase tracking-widest">District</span>
                                    <span className="text-[32px] font-black text-black leading-none">{stats.riskKpis.find(k => k.label === 'LOW')?.percentage || '0%'}</span>
                                    <span className="text-[10px] font-bold text-[#888] uppercase">Secure</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-6 bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-black mb-8">Temporal Risk Trends</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.riskHistory}>
                                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#F0F0F0" />
                                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="Low" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.8} />
                                        <Area type="monotone" dataKey="Med" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.6} />
                                        <Area type="monotone" dataKey="High" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                                        <Area type="monotone" dataKey="Crit" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="lg:col-span-6 bg-white border border-[#E5E5E5] rounded-2xl p-8 shadow-sm">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-black mb-6">Developmental Concerns Map</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-center border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[11px] font-black uppercase text-[#888888] tracking-widest">Domain</th>
                                            {stats.cdpos.map(c => <th key={c} className="px-4 py-3 text-[11px] font-black uppercase text-[#888888] tracking-widest">{c}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.domainHeatmap.map(row => (
                                            <tr key={row.domain} className="border-b border-[#F9F9F9] last:border-none">
                                                <td className="px-4 py-4 text-left font-bold text-[13px] text-black bg-[#fcfcfc]">{domainMap[row.domain] || row.domain}</td>
                                                {row.scores.map((s, idx) => (
                                                    <td key={idx} className="p-1 transition-all">
                                                        <div className="h-10 rounded-lg flex items-center justify-center transition-transform hover:scale-105" style={{ backgroundColor: getColorByConcern(s) }}>
                                                            <span className={`text-[11px] font-black ${s > 10 ? 'text-white' : 'text-black'}`}>{s}%</span>
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-[#F0F0F0] bg-[#fcfcfc] flex justify-between items-center">
                            <h3 className="text-[14px] font-black uppercase tracking-widest text-black">High-Priority Cases requiring Intervention</h3>
                            <button className="text-[11px] font-black uppercase tracking-widest text-black hover:underline">Full Census</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px] border-collapse">
                                <thead className="bg-[#f9f9f9]">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-[#888]">
                                        <th className="px-8 py-4">Identity</th>
                                        <th className="px-8 py-4">Origin</th>
                                        <th className="px-8 py-4">Criticality</th>
                                        <th className="px-8 py-4">Concern</th>
                                        <th className="px-8 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0F0F0]">
                                    {stats.highRiskChildren.map(c => (
                                        <tr key={c.id} onClick={() => router.push(`/dpo/children/${c.id}`)} className="hover:bg-gray-50 cursor-pointer group transition-all">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                    <span className="font-bold text-black text-[14px]">{c.name}</span>
                                                    <ArrowUpRight size={14} className="text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-[10px] font-bold text-[#888] uppercase tracking-tighter">{c.age} • {c.id}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-black font-medium uppercase tracking-tighter text-[11px]">{c.awc}</span>
                                                    <span className="text-[11px] text-[#888] font-bold uppercase tracking-widest">{c.cdpo} CDPO</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase border ${c.risk === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                    {c.risk}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-[#555555] font-medium text-[11px] uppercase tracking-wide italic">{c.conditions}</td>
                                            <td className="px-8 py-5">
                                                <span className="text-[11px] font-black uppercase tracking-widest py-1.5 px-4 bg-black text-white rounded-lg shadow-sm">{c.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Trends' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-700">
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full -mr-32 -mt-32 z-0" />
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                <div>
                                    <h3 className="text-[18px] font-black uppercase tracking-tight text-black mb-1">Comparative Regional Trends</h3>
                                    <p className="text-[13px] text-[#888] font-medium">Monitoring cross-CDPO performance against district benchmarks</p>
                                </div>
                                <div className="flex bg-[#F9F9F9] p-1.5 rounded-xl border border-[#EEE]">
                                    {['Coverage', 'Risk', 'Volume'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTrendType(t as any)}
                                            className={`px-6 py-2 text-[11px] font-black uppercase rounded-lg transition-all ${trendType === t ? 'bg-white shadow-xl text-black border border-[#EEE]' : 'text-[#888888] hover:text-[#555555]'}`}
                                        >
                                            {t === 'Volume' ? 'Volume' : t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[450px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={stats.multiLineData}>
                                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#F0F0F0" />
                                        <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} fontWeight="black" padding={{ left: 20, right: 20 }} />
                                        <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} padding={{ top: 20, bottom: 20 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '40px' }} />
                                        <Line type="monotone" dataKey="target" name="Benchmark (75%)" stroke="#000000" strokeWidth={1.5} strokeDasharray="8 8" dot={false} />
                                        {stats.cdpos.map((name, idx) => (
                                            <Line
                                                key={name}
                                                type="monotone"
                                                dataKey={name}
                                                stroke={idx === 0 ? '#000000' : idx === 1 ? '#555555' : idx === 2 ? '#888888' : '#AAAAAA'}
                                                strokeWidth={idx === 0 ? 5 : 3}
                                                dot={idx === 0 ? { r: 4, strokeWidth: 2, fill: '#000' } : false}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-[10px] font-black text-[#888] uppercase tracking-widest mb-1">Peak Performance</p>
                                    <p className="text-[14px] font-black text-black uppercase tracking-tight">Kondapur Central • 87%</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-xl">
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Risk Warning</p>
                                    <p className="text-[14px] font-black text-red-600 uppercase tracking-tight">Nellore North • 38%</p>
                                </div>
                                <div className="p-4 bg-black rounded-xl text-white">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Growth Forecast</p>
                                    <p className="text-[14px] font-black text-white uppercase tracking-tight">+14% for Q2 Target</p>
                                </div>
                                <div className="p-4 bg-[#fcfcfc] border border-[#EEE] rounded-xl font-bold italic text-black/40 text-[12px] flex items-center justify-center">
                                    Data updated 1h ago
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DpoScreening;
