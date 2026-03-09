'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Search, Users, UserCheck, Shield, MapPin,
    ChevronRight, Phone, Activity, BarChart3, X
} from 'lucide-react'

const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
)

interface DistrictWorkforceViewProps {
    districtId: string
}

const DistrictWorkforceView: React.FC<DistrictWorkforceViewProps> = ({ districtId }) => {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState<any>(null)
    const [personnel, setPersonnel] = useState<any[]>([])
    const [mandalData, setMandalData] = useState<any[]>([])
    const [activityData, setActivityData] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [activeSection, setActiveSection] = useState<'roster' | 'mandals'>('roster')

    const fetchApi = async (type: string, params?: Record<string, string>) => {
        const url = new URL(`/api/commissioner/workforce/${districtId}`, window.location.origin)
        url.searchParams.set('type', type)
        if (params) Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v) })
        const res = await fetch(url.toString())
        if (!res.ok) throw new Error(`Failed to fetch ${type}`)
        return res.json()
    }

    useEffect(() => {
        let cancelled = false
        async function load() {
            setLoading(true)
            try {
                const [summaryRes, mandalRes, activityRes] = await Promise.all([
                    fetchApi('summary'),
                    fetchApi('mandal-breakdown'),
                    fetchApi('activity'),
                ])
                if (!cancelled) {
                    setSummary(summaryRes)
                    setMandalData(mandalRes)
                    setActivityData(activityRes)
                }
            } catch (err) { console.error(err) }
            finally { if (!cancelled) setLoading(false) }
        }
        load()
        return () => { cancelled = true }
    }, [districtId])

    // Load personnel with search/filter
    const loadPersonnel = useCallback(async () => {
        try {
            const res = await fetchApi('personnel', { search: searchTerm, role: roleFilter })
            setPersonnel(res)
        } catch (err) { console.error(err) }
    }, [districtId, searchTerm, roleFilter])

    useEffect(() => {
        const timer = setTimeout(() => loadPersonnel(), 300)
        return () => clearTimeout(timer)
    }, [loadPersonnel])

    if (loading && !summary) {
        return (
            <div className="animate-in fade-in duration-700 pb-20 space-y-8">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-12 w-96" />
                <div className="grid grid-cols-6 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28" />)}</div>
                <Skeleton className="h-[500px]" />
            </div>
        )
    }

    if (!summary) {
        return (
            <div className="animate-in fade-in duration-700 pb-20">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-[13px] font-bold text-[#888] hover:text-black mb-8">
                    <ArrowLeft size={16} /> Back to Overview
                </button>
                <div className="text-center py-20 text-[#888]">District not found.</div>
            </div>
        )
    }

    const kpis = [
        { label: 'Total AWWs', value: summary.totalAwws, icon: Users, sub: `of ${summary.totalAwcs} positions` },
        { label: 'Supervisors', value: summary.totalSupervisors, icon: UserCheck, sub: `across ${summary.totalMandals} mandals` },
        { label: 'CDPOs / DPOs', value: summary.totalCdpos, icon: Shield },
        { label: 'Positions Filled', value: `${summary.positionsFilled}%`, icon: BarChart3, alert: summary.positionsFilled < 80 },
        { label: 'Training Compliance', value: `${summary.trainingCompliance}%`, icon: Activity, alert: summary.trainingCompliance < 80 },
        { label: 'AWW:Child Ratio', value: `1:${summary.avgChildRatio}`, icon: Users, alert: summary.avgChildRatio > 45, sub: 'Bench: 1:40' },
    ]

    const roleColors: Record<string, string> = {
        'CDPO': 'bg-black text-white',
        'District Officer': 'bg-black text-white',
        'Supervisor': 'bg-zinc-700 text-white',
        'AWW': 'bg-zinc-100 text-black',
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* BACK NAV */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-[13px] font-bold text-[#888] hover:text-black mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Workforce Overview
            </button>

            {/* HEADER */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">{summary.districtName} District</h1>
                    <p className="text-[14px] text-[#888] font-medium">
                        Workforce Detail • {summary.totalMandals} Mandals • {summary.totalAwcs} AWCs
                    </p>
                </div>
                {activityData && (
                    <div className="flex gap-4 text-[12px] font-bold">
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded">Active: {activityData.active}</span>
                        <span className="px-3 py-1 bg-red-50 text-red-700 rounded">Inactive: {activityData.inactive}</span>
                    </div>
                )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {kpis.map((kpi, i) => (
                    <div key={i} className="bg-white border border-[#E5E5E5] p-5 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-[#888] uppercase tracking-widest">{kpi.label}</span>
                            <kpi.icon size={14} className="text-[#CCC]" />
                        </div>
                        <span className={`text-[24px] font-black block ${kpi.alert ? 'text-red-600' : ''}`}>{kpi.value}</span>
                        {kpi.sub && <span className="text-[10px] text-[#AAA] font-bold">{kpi.sub}</span>}
                    </div>
                ))}
            </div>

            {/* SECTION TOGGLE */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveSection('roster')}
                    className={`px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all ${activeSection === 'roster' ? 'bg-black text-white' : 'bg-white border border-[#E5E5E5] text-[#888] hover:text-black'
                        }`}
                >
                    <div className="flex items-center gap-2"><Users size={14} /> Personnel Roster ({personnel.length})</div>
                </button>
                <button
                    onClick={() => setActiveSection('mandals')}
                    className={`px-6 py-2.5 rounded-lg text-[13px] font-bold transition-all ${activeSection === 'mandals' ? 'bg-black text-white' : 'bg-white border border-[#E5E5E5] text-[#888] hover:text-black'
                        }`}
                >
                    <div className="flex items-center gap-2"><MapPin size={14} /> Mandal Breakdown ({mandalData.length})</div>
                </button>
            </div>

            {/* ═══ PERSONNEL ROSTER ═══ */}
            {activeSection === 'roster' && (
                <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
                    {/* Search & Filter */}
                    <div className="p-6 border-b border-[#F5F5F5] flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg text-[13px] focus:ring-1 focus:ring-black focus:bg-white outline-none"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="h-10 px-4 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg text-[12px] font-bold focus:ring-1 focus:ring-black outline-none cursor-pointer"
                        >
                            <option value="">All Roles</option>
                            <option value="aww">AWWs</option>
                            <option value="supervisor">Supervisors</option>
                            <option value="cdpo">CDPOs</option>
                        </select>
                        <button onClick={() => { setSearchTerm(''); setRoleFilter('') }} className="text-[13px] text-[#888] hover:text-black flex items-center gap-1">
                            <X size={14} /> Clear
                        </button>
                    </div>

                    {/* Personnel Table */}
                    <div className="overflow-x-auto">
                        {personnel.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                                    <tr>
                                        <th className="px-6 py-3">#</th>
                                        <th className="px-4 py-3 min-w-[160px]">Name</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Phone</th>
                                        <th className="px-4 py-3">Mandal</th>
                                        <th className="px-4 py-3">AWC</th>
                                        <th className="px-4 py-3 text-center">Sessions (30d)</th>
                                        <th className="px-4 py-3 text-center">Children</th>
                                        <th className="px-6 py-3 text-right">Last Login</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[13px] divide-y divide-[#F5F5F5]">
                                    {personnel.map((p, i) => (
                                        <tr key={p.id} className="hover:bg-[#FBFBFB] transition-colors">
                                            <td className="px-6 py-3 font-bold text-[#AAA]">{i + 1}</td>
                                            <td className="px-4 py-3 font-bold text-black">{p.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${roleColors[p.role] || 'bg-gray-100'}`}>
                                                    {p.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[#555]">
                                                {p.phone !== 'N/A' ? (
                                                    <div className="flex items-center gap-1"><Phone size={11} className="text-[#AAA]" />{p.phone}</div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-[#555]">{p.mandal}</td>
                                            <td className="px-4 py-3 text-[#555]">{p.awc}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-black ${p.sessions30d === 0 ? 'text-red-500' : p.sessions30d >= 10 ? 'text-green-600' : 'text-black'}`}>
                                                    {p.sessions30d}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold">{p.childCount > 0 ? p.childCount : <span className="text-[#DDD]">-</span>}</td>
                                            <td className="px-6 py-3 text-right text-[12px] font-medium text-[#888]">{p.lastLogin}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-16 text-center text-[#888] text-[13px]">No personnel found matching your filters.</div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ MANDAL BREAKDOWN ═══ */}
            {activeSection === 'mandals' && (
                <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        {mandalData.length > 0 ? (
                            <table className="w-full text-left">
                                <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                                    <tr>
                                        <th className="px-6 py-4">Mandal</th>
                                        <th className="px-4 py-4 text-center">AWWs (Filled/Target)</th>
                                        <th className="px-4 py-4 text-center">Supervisors</th>
                                        <th className="px-4 py-4 text-center">Vacancy %</th>
                                        <th className="px-4 py-4 text-center">Training %</th>
                                        <th className="px-4 py-4 text-center">Children</th>
                                        <th className="px-4 py-4 text-center">AWW:Child Ratio</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[13px] divide-y divide-[#F5F5F5]">
                                    {mandalData.map((m) => (
                                        <tr key={m.id} className="hover:bg-[#FBFBFB] transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-black">{m.name}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="font-bold text-black">{m.awwsFilled}</span> / <span className="text-[#888]">{m.awwsTarget}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold">{m.supervisors}</td>
                                            <td className={`px-4 py-4 text-center font-black ${m.vacancyRate > 10 ? 'text-red-600' : ''}`}>
                                                {m.vacancyRate}%
                                            </td>
                                            <td className={`px-4 py-4 text-center font-black ${m.trainingCompliance < 80 ? 'text-amber-600' : ''}`}>
                                                {m.trainingCompliance}%
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold">{m.childCount}</td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={`font-black ${m.childToAwwRatio > 45 ? 'text-red-600' : ''}`}>1:{m.childToAwwRatio}</span>
                                                    <span className="text-[9px] font-black text-[#CCC] uppercase tracking-widest">Bench: 1:40</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-16 text-center text-[#888] text-[13px]">No mandal data available.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default DistrictWorkforceView
