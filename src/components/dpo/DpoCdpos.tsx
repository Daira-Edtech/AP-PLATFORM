'use client'

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid
} from 'recharts';
import { Download, Table as TableIcon, BarChart2, Filter } from 'lucide-react';
import { CDPOPerformance } from '@/lib/dpo/types';
import { PerformanceRing, CoverageMiniBar } from './DpoUI';

export default function DpoCdpos({ initialData = [] }: { initialData?: CDPOPerformance[] }) {
    const router = useRouter();
    const [view, setView] = useState<'table' | 'chart'>('table');
    const [sortKey, setSortKey] = useState<keyof CDPOPerformance>('performanceScore');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [highlights, setHighlights] = useState<string[]>([]);
    const [data, setData] = useState<CDPOPerformance[]>(initialData);

    const sortedData = useMemo(() => {
        return [...data].sort((a: any, b: any) => {
            if (a[sortKey] < b[sortKey]) return sortOrder === 'asc' ? -1 : 1;
            if (a[sortKey] > b[sortKey]) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [sortKey, sortOrder, data]);

    const toggleHighlight = (id: string) => {
        setHighlights(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    const totals = useMemo(() => {
        return data.reduce((acc, curr) => ({
            children: acc.children + curr.children,
            screened: acc.screened + curr.screened,
            lowRisk: acc.lowRisk + curr.lowRisk,
            medRisk: acc.medRisk + curr.medRisk,
            highRisk: acc.highRisk + curr.highRisk,
            critRisk: acc.critRisk + curr.critRisk,
            escalations: acc.escalations + curr.escalations,
            coverage: Math.round(data.reduce((a, b) => a + b.coverage, 0) / (data.length || 1))
        }), { children: 0, screened: 0, lowRisk: 0, medRisk: 0, highRisk: 0, critRisk: 0, escalations: 0, coverage: 0 });
    }, [data]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold tracking-tight text-black">CDPO Comparison</h1>
                    <p className="text-[14px] text-[#888888] font-medium">{data.length} CDPOs in district</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-[#E5E5E5] rounded-full p-1 shadow-sm">
                        <button
                            onClick={() => setView('table')}
                            className={`p-2 rounded-full transition-all ${view === 'table' ? 'bg-black text-white shadow-md' : 'text-[#888888] hover:bg-[#F5F5F5]'}`}
                        >
                            <TableIcon size={16} />
                        </button>
                        <button
                            onClick={() => setView('chart')}
                            className={`p-2 rounded-full transition-all ${view === 'chart' ? 'bg-black text-white shadow-md' : 'text-[#888888] hover:bg-[#F5F5F5]'}`}
                        >
                            <BarChart2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-[11px] font-black text-[#888888] uppercase tracking-widest flex items-center gap-2">
                    <Filter size={14} /> Filter Insights:
                </span>
                {[
                    { id: 'Below Target', color: 'border-amber-400 text-amber-700 bg-amber-50 shadow-amber-100/50' },
                    { id: 'High Escalations', color: 'border-red-400 text-red-700 bg-red-50 shadow-red-100/50' },
                    { id: 'Overdue Referrals', color: 'border-orange-400 text-orange-700 bg-orange-50 shadow-orange-100/50' }
                ].map((chip) => (
                    <button
                        key={chip.id}
                        onClick={() => toggleHighlight(chip.id)}
                        className={`px-4 py-1.5 rounded-full border text-[12px] font-black transition-all shadow-sm ${highlights.includes(chip.id) ? `${chip.color} scale-105` : 'bg-white text-[#555555] border-[#E5E5E5] hover:bg-white hover:border-black hover:text-black'
                            }`}
                    >
                        {chip.id}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-[16px] shadow-xl shadow-black/5 overflow-hidden flex flex-col">
                {view === 'table' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-4 py-4 border-r border-white/10 text-center">#</th>
                                    <th className="px-4 py-4 border-r border-white/10 cursor-pointer hover:bg-white/10" onClick={() => setSortKey('name')}>CDPO Name</th>
                                    <th className="px-4 py-4 border-r border-white/10">Officer</th>
                                    <th className="px-4 py-4 border-r border-white/10 text-center">AWCs</th>
                                    <th className="px-4 py-4 border-r border-white/10 cursor-pointer hover:bg-white/10" onClick={() => setSortKey('coverage')}>Coverage</th>
                                    <th className="px-3 py-4 border-r border-white/10 text-center">Crit</th>
                                    <th className="px-4 py-4 border-r border-white/10 text-center cursor-pointer hover:bg-white/10" onClick={() => setSortKey('escalations')}>Esc</th>
                                    <th className="px-4 py-4 cursor-pointer hover:bg-white/10 text-center" onClick={() => setSortKey('performanceScore')}>Score</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] text-black">
                                {sortedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-20 text-center text-[#888] font-medium italic">
                                            No CDPO data found. Please ensure your account has a District assigned.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedData.map((row, idx) => {
                                        const isBelowTarget = row.coverage < 50;
                                        const hasHighEscalations = row.escalations > 10;
                                        const isHighlighted = (highlights.includes('Below Target') && isBelowTarget) ||
                                            (highlights.includes('High Escalations') && hasHighEscalations);

                                        return (
                                            <tr
                                                key={row.id}
                                                onClick={() => router.push(`/dpo/cdpos/${row.id}`)}
                                                className={`border-b border-[#F0F0F0] hover:bg-gray-50/80 cursor-pointer transition-colors ${isHighlighted ? 'bg-amber-50/50' : ''}`}
                                            >
                                                <td className="px-4 py-5 text-[#888888] font-black text-center">{idx + 1}</td>
                                                <td className="px-4 py-5 font-black">{row.name}</td>
                                                <td className="px-4 py-5 font-medium text-[#555]">{row.officer}</td>
                                                <td className="px-4 py-5 text-center font-bold">{row.awcs}</td>
                                                <td className="px-4 py-5">
                                                    <div className="flex flex-col gap-1.5 w-32">
                                                        <div className="flex justify-between items-end">
                                                            <span className={`font-black tracking-tighter ${row.coverage < 50 ? 'text-amber-600' : 'text-black'}`}>{row.coverage}%</span>
                                                            <span className="text-[10px] font-bold text-[#888]">{row.screened.toLocaleString()} / {row.children.toLocaleString()}</span>
                                                        </div>
                                                        <CoverageMiniBar coverage={row.coverage} />
                                                    </div>
                                                </td>
                                                <td className="px-3 py-5 text-center text-red-600 font-black">{row.critRisk.toLocaleString()}</td>
                                                <td className={`px-4 py-5 text-center ${row.escalations > 10 ? 'text-red-600 font-black scale-110' : 'font-bold'}`}>
                                                    {row.escalations}
                                                </td>
                                                <td className="px-4 py-5">
                                                    <div className="flex justify-center">
                                                        <PerformanceRing score={row.performanceScore} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-10 h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECECEC" />
                                <XAxis dataKey="name" fontSize={11} fontWeight="black" tickLine={false} axisLine={false} dy={15} />
                                <YAxis fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                                    itemStyle={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}
                                    labelStyle={{ fontWeight: 'black', marginBottom: '8px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '12px', paddingBottom: '20px' }} />
                                <Bar dataKey="coverage" name="Coverage %" fill="#000000" radius={[6, 6, 0, 0]} barSize={40} />
                                <Bar dataKey="performanceScore" name="Performance Index" fill="#AAAAAA" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button className="flex items-center gap-2 px-6 py-2.5 border border-[#E5E5E5] bg-white rounded-full text-[13px] font-black hover:bg-black hover:text-white hover:border-black transition-all shadow-sm">
                    <Download size={16} /> EXPORT DATASHEET
                </button>
            </div>
        </div>
    );
}
