'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ShieldAlert, Calendar, MapPin, User, Heart,
    Activity, AlertTriangle, Send, FileText, Eye, Baby,
    TrendingUp, Scale, Ruler, ChevronRight
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';

const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

interface ChildDetailViewProps {
    childId: string;
}

const ChildDetailView: React.FC<ChildDetailViewProps> = ({ childId }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Overview');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [growth, setGrowth] = useState<any[]>([]);
    const [screenings, setScreenings] = useState<any[]>([]);
    const [observations, setObservations] = useState<any[]>([]);
    const [flags, setFlags] = useState<any[]>([]);
    const [referrals, setReferrals] = useState<any[]>([]);

    const fetchApi = async (type: string) => {
        const res = await fetch(`/api/commissioner/children/${childId}?type=${type}`);
        if (!res.ok) throw new Error(`Failed to fetch ${type}`);
        return res.json();
    };

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const profileRes = await fetchApi('profile');
                if (!cancelled) setProfile(profileRes);

                // Load remaining tabs in parallel
                const [growthRes, screeningsRes, obsRes, flagsRes, referralsRes] = await Promise.all([
                    fetchApi('growth'),
                    fetchApi('screenings'),
                    fetchApi('observations'),
                    fetchApi('flags'),
                    fetchApi('referrals'),
                ]);
                if (!cancelled) {
                    setGrowth(growthRes);
                    setScreenings(screeningsRes);
                    setObservations(obsRes);
                    setFlags(flagsRes);
                    setReferrals(referralsRes);
                }
            } catch (err) {
                console.error('Error loading child detail:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [childId]);

    const tabs = [
        { name: 'Overview', icon: User },
        { name: 'Growth', icon: TrendingUp, count: growth.length },
        { name: 'Screening', icon: Activity, count: screenings.length },
        { name: 'Observations', icon: Eye, count: observations.length },
        { name: 'Flags', icon: AlertTriangle, count: flags.length },
        { name: 'Referrals', icon: Send, count: referrals.length },
    ];

    const riskColors: Record<string, string> = {
        'Critical': 'bg-red-600 text-white',
        'High': 'bg-red-100 text-red-700',
        'Medium': 'bg-amber-100 text-amber-700',
        'Low': 'bg-green-100 text-green-700',
    };

    if (!profile && loading) {
        return (
            <div className="animate-in fade-in duration-700 pb-20 space-y-8">
                <Skeleton className="h-10 w-32" />
                <div className="flex gap-6 items-center"><Skeleton className="w-20 h-20 rounded-2xl" /><div><Skeleton className="h-10 w-80 mb-2" /><Skeleton className="h-4 w-96" /></div></div>
                <div className="grid grid-cols-4 gap-6">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}</div>
                <Skeleton className="h-[500px]" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="animate-in fade-in duration-700 pb-20">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-[13px] font-bold text-[#888] hover:text-black mb-8">
                    <ArrowLeft size={16} /> Back to Directory
                </button>
                <div className="text-center py-20 text-[#888]">Child not found.</div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* BACK NAV */}
            <button onClick={() => router.back()} className="flex items-center gap-2 text-[13px] font-bold text-[#888] hover:text-black mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Directory
            </button>

            {/* HEADER */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex gap-6 items-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-[32px] shadow-lg ${profile.riskLevel === 'Critical' ? 'bg-black text-white' : 'bg-white border-2 border-black text-black'
                        }`}>
                        {profile.name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-[32px] font-bold text-black tracking-tight">{profile.name}</h2>
                            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${riskColors[profile.riskLevel] || 'bg-gray-100'}`}>
                                {profile.riskLevel} Risk
                            </span>
                        </div>
                        <p className="text-[14px] text-[#888] font-bold uppercase tracking-widest">
                            {profile.age} • {profile.gender} • {profile.district} / {profile.mandal} / {profile.awc}
                        </p>
                        <p className="text-[12px] text-[#AAA] mt-1">
                            Parent: {profile.guardianName || profile.motherName || profile.fatherName || 'N/A'} • Registered: {profile.registeredAt ? new Date(profile.registeredAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {profile.counts.flags > 0 && (
                        <button className="px-6 py-3 bg-red-600 text-white font-bold rounded flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg active:scale-95">
                            <ShieldAlert size={18} /> {profile.counts.flags} Active Flags
                        </button>
                    )}
                </div>
            </div>

            {/* TABS */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex border-b border-[#F5F5F5] overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`px-6 py-4 text-[13px] font-bold transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.name ? 'text-black' : 'text-[#888] hover:text-[#555]'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.name}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{tab.count}</span>
                            )}
                            {activeTab === tab.name && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />}
                        </button>
                    ))}
                </div>

                <div className="flex-1 p-8 bg-[#FBFBFB]">
                    {/* ═══ OVERVIEW TAB ═══ */}
                    {activeTab === 'Overview' && (
                        <div className="space-y-8">
                            {/* Growth Metrics */}
                            <div>
                                <h3 className="text-[14px] font-black uppercase tracking-widest text-[#888] mb-4">Latest Growth Metrics</h3>
                                {profile.latestGrowth ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <MetricCard label="Weight" value={profile.latestGrowth.weightKg ? `${profile.latestGrowth.weightKg} kg` : 'N/A'} sub={profile.latestGrowth.waz != null ? `WAZ: ${profile.latestGrowth.waz}` : ''} alert={profile.latestGrowth.waz < -2} />
                                        <MetricCard label="Height" value={profile.latestGrowth.heightCm ? `${profile.latestGrowth.heightCm} cm` : 'N/A'} sub={profile.latestGrowth.haz != null ? `HAZ: ${profile.latestGrowth.haz}` : ''} alert={profile.latestGrowth.haz < -2} />
                                        <MetricCard label="MUAC" value={profile.latestGrowth.muacCm ? `${profile.latestGrowth.muacCm} cm` : 'N/A'} sub={profile.latestGrowth.muacClass || ''} alert={profile.latestGrowth.muacClass === 'SAM'} />
                                        <MetricCard label="Health Flags" value={String(profile.counts.flags)} sub={profile.counts.flags > 0 ? 'Action Required' : 'No Flags'} alert={profile.counts.flags > 0} />
                                    </div>
                                ) : (
                                    <div className="text-[13px] text-[#888] bg-white border border-[#E5E5E5] rounded-lg p-6 text-center">No growth records yet.</div>
                                )}
                            </div>

                            {/* Demographics */}
                            <div>
                                <h3 className="text-[14px] font-black uppercase tracking-widest text-[#888] mb-4">Demographics</h3>
                                <div className="bg-white border border-[#E5E5E5] rounded-lg p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 text-[13px]">
                                        <InfoField label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'} />
                                        <InfoField label="Gender" value={profile.gender || 'N/A'} />
                                        <InfoField label="Mother" value={profile.motherName || 'N/A'} />
                                        <InfoField label="Father" value={profile.fatherName || 'N/A'} />
                                        <InfoField label="Guardian" value={profile.guardianName || 'N/A'} />
                                        <InfoField label="Phone" value={profile.phone || 'N/A'} />
                                        <InfoField label="Village" value={profile.village || 'N/A'} />
                                        <InfoField label="Address" value={profile.address || 'N/A'} />
                                    </div>
                                </div>
                            </div>

                            {/* Prenatal History */}
                            {profile.prenatal && (
                                <div>
                                    <h3 className="text-[14px] font-black uppercase tracking-widest text-[#888] mb-4">Prenatal History</h3>
                                    <div className="bg-white border border-[#E5E5E5] rounded-lg p-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 text-[13px]">
                                            <InfoField label="Birth Weight" value={profile.prenatal.birthWeight ? `${profile.prenatal.birthWeight}g` : 'N/A'} />
                                            <InfoField label="Gestational Age" value={profile.prenatal.gestationalAge ? `${profile.prenatal.gestationalAge} weeks` : 'N/A'} />
                                            <InfoField label="Delivery Type" value={profile.prenatal.deliveryType || 'N/A'} />
                                            <InfoField label="Birth Place" value={profile.prenatal.birthPlace || 'N/A'} />
                                            <InfoField label="APGAR (1/5 min)" value={profile.prenatal.apgar1 != null ? `${profile.prenatal.apgar1} / ${profile.prenatal.apgar5}` : 'N/A'} />
                                            <InfoField label="NICU Stay" value={profile.prenatal.nicuStay ? `Yes (${profile.prenatal.nicuDays} days)` : 'No'} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white border border-[#E5E5E5] rounded-lg p-6 text-center">
                                    <span className="text-[28px] font-black">{profile.counts.screenings}</span>
                                    <span className="block text-[11px] font-black text-[#888] uppercase tracking-widest mt-1">Screening Sessions</span>
                                </div>
                                <div className="bg-white border border-[#E5E5E5] rounded-lg p-6 text-center">
                                    <span className="text-[28px] font-black text-red-600">{profile.counts.flags}</span>
                                    <span className="block text-[11px] font-black text-[#888] uppercase tracking-widest mt-1">Active Flags</span>
                                </div>
                                <div className="bg-white border border-[#E5E5E5] rounded-lg p-6 text-center">
                                    <span className="text-[28px] font-black">{profile.counts.referrals}</span>
                                    <span className="block text-[11px] font-black text-[#888] uppercase tracking-widest mt-1">Referrals</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ GROWTH TAB ═══ */}
                    {activeTab === 'Growth' && (
                        <div className="space-y-8">
                            {growth.length > 0 ? (
                                <>
                                    <div className="bg-white border border-[#E5E5E5] rounded-lg p-6">
                                        <h3 className="text-[14px] font-black uppercase tracking-widest text-[#888] mb-6">Growth Trend</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={growth}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                                <XAxis dataKey="measurement_date" tick={{ fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })} />
                                                <YAxis tick={{ fontSize: 10 }} />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="weight_kg" stroke="#000" name="Weight (kg)" strokeWidth={2} dot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="height_cm" stroke="#3B82F6" name="Height (cm)" strokeWidth={2} dot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden">
                                        <table className="w-full text-left text-[13px]">
                                            <thead className="bg-[#F9F9F9] border-b border-[#EEE] text-[10px] font-black uppercase tracking-widest text-[#888]">
                                                <tr>
                                                    <th className="px-6 py-3">Date</th>
                                                    <th className="px-4 py-3">Age (mo)</th>
                                                    <th className="px-4 py-3">Weight</th>
                                                    <th className="px-4 py-3">Height</th>
                                                    <th className="px-4 py-3">MUAC</th>
                                                    <th className="px-4 py-3">WAZ</th>
                                                    <th className="px-4 py-3">HAZ</th>
                                                    <th className="px-4 py-3">WHZ</th>
                                                    <th className="px-4 py-3">MUAC Class</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F5F5F5]">
                                                {growth.map((r, i) => (
                                                    <tr key={i} className="hover:bg-[#FBFBFB]">
                                                        <td className="px-6 py-3 font-bold">{new Date(r.measurement_date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3">{r.age_months_at_measurement}</td>
                                                        <td className="px-4 py-3">{r.weight_kg || '-'} kg</td>
                                                        <td className="px-4 py-3">{r.height_cm || '-'} cm</td>
                                                        <td className="px-4 py-3">{r.muac_cm || '-'} cm</td>
                                                        <td className={`px-4 py-3 font-bold ${r.waz < -2 ? 'text-red-600' : ''}`}>{r.waz ?? '-'}</td>
                                                        <td className={`px-4 py-3 font-bold ${r.haz < -2 ? 'text-red-600' : ''}`}>{r.haz ?? '-'}</td>
                                                        <td className={`px-4 py-3 font-bold ${r.whz < -2 ? 'text-red-600' : ''}`}>{r.whz ?? '-'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${r.muac_class === 'SAM' ? 'bg-red-100 text-red-700' :
                                                                    r.muac_class === 'MAM' ? 'bg-amber-100 text-amber-700' :
                                                                        'bg-green-100 text-green-700'
                                                                }`}>{r.muac_class || 'N/A'}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <EmptyState text="No growth records available for this child." />
                            )}
                        </div>
                    )}

                    {/* ═══ SCREENING TAB ═══ */}
                    {activeTab === 'Screening' && (
                        <div className="space-y-4">
                            {screenings.length > 0 ? screenings.map((s, i) => (
                                <div key={i} className="bg-white border border-[#E5E5E5] rounded-lg p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-[14px] uppercase">{s.session_type?.replace(/_/g, ' ') || 'Session'}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.risk_level === 'critical' ? 'bg-red-600 text-white' :
                                                        s.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                                                            s.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-green-100 text-green-700'
                                                    }`}>{s.risk_level || 'N/A'}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.status === 'complete' ? 'bg-black text-white' : 'bg-gray-100'
                                                    }`}>{s.status}</span>
                                            </div>
                                            <p className="text-[12px] text-[#888] mt-1">
                                                {s.started_at ? new Date(s.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : ''} • Composite: <span className="font-bold text-black">{s.composite_score ?? 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    {s.domain_scores && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {Object.entries(s.domain_scores as Record<string, number>).map(([domain, score]) => (
                                                <span key={domain} className="px-3 py-1 bg-[#F5F5F5] rounded text-[11px] font-bold">
                                                    {domain}: <span className="font-black">{score}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {s.ai_narrative && (
                                        <div className="bg-[#F9F9F9] border border-[#EEE] rounded p-4 mt-3">
                                            <span className="text-[10px] font-black text-[#888] uppercase block mb-2">AI Narrative</span>
                                            <p className="text-[13px] text-[#555] leading-relaxed">{s.ai_narrative}</p>
                                        </div>
                                    )}
                                    {s.supervisor_override_risk && (
                                        <div className="mt-3 text-[12px]">
                                            <span className="font-black text-amber-600 uppercase">Supervisor Override:</span> {s.supervisor_override_risk} — {s.override_justification}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <EmptyState text="No screening sessions recorded for this child." />
                            )}
                        </div>
                    )}

                    {/* ═══ OBSERVATIONS TAB ═══ */}
                    {activeTab === 'Observations' && (
                        <div className="space-y-4">
                            {observations.length > 0 ? observations.map((o, i) => (
                                <div key={i} className="bg-white border border-[#E5E5E5] rounded-lg p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${o.concern_level === 'concern' || o.concern_level === 'high' ? 'bg-red-100 text-red-700' :
                                                        o.concern_level === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>{o.concern_level || 'normal'}</span>
                                                {o.category && <span className="text-[10px] font-bold text-[#888] uppercase">{o.category}</span>}
                                                {o.domain && <span className="text-[10px] font-bold text-[#AAA] uppercase">• {o.domain}</span>}
                                            </div>
                                            <p className="text-[13px] text-[#333] leading-relaxed">{o.observation_text}</p>
                                            <p className="text-[11px] text-[#AAA] mt-2">{o.visit_date ? new Date(o.visit_date).toLocaleDateString() : ''}</p>
                                        </div>
                                        {o.sentiment && (
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${o.sentiment === 'concern' ? 'text-red-600' : o.sentiment === 'positive' ? 'text-green-600' : 'text-[#888]'
                                                }`}>{o.sentiment}</span>
                                        )}
                                    </div>
                                    {o.auto_tags?.length > 0 && (
                                        <div className="flex gap-1 mt-3">
                                            {o.auto_tags.map((tag: string, j: number) => (
                                                <span key={j} className="px-2 py-0.5 bg-[#F5F5F5] rounded text-[10px] font-bold text-[#888]">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <EmptyState text="No observations recorded for this child." />
                            )}
                        </div>
                    )}

                    {/* ═══ FLAGS TAB ═══ */}
                    {activeTab === 'Flags' && (
                        <div className="space-y-4">
                            {flags.length > 0 ? flags.map((f, i) => (
                                <div key={i} className={`bg-white border rounded-lg p-6 ${f.priority === 'critical' ? 'border-red-300' : 'border-[#E5E5E5]'
                                    }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${f.priority === 'critical' ? 'bg-red-600 text-white' :
                                                        f.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                            f.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-green-100 text-green-700'
                                                    }`}>{f.priority}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${f.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                        f.status === 'raised' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                    }`}>{f.status}</span>
                                                {f.category && <span className="text-[10px] font-bold text-[#888] uppercase">{f.category?.replace(/_/g, ' ')}</span>}
                                            </div>
                                            <h4 className="font-black text-[14px] mt-2">{f.title}</h4>
                                            <p className="text-[13px] text-[#555] mt-1">{f.description}</p>
                                        </div>
                                        <span className="text-[11px] text-[#AAA]">{f.created_at ? new Date(f.created_at).toLocaleDateString() : ''}</span>
                                    </div>
                                    {f.resolution_notes && (
                                        <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                                            <span className="text-[10px] font-black text-green-700 uppercase block mb-1">Resolution</span>
                                            <p className="text-[12px] text-green-800">{f.resolution_notes}</p>
                                        </div>
                                    )}
                                    {f.ai_reasoning && (
                                        <div className="bg-[#F9F9F9] border border-[#EEE] rounded p-3 mt-3">
                                            <span className="text-[10px] font-black text-[#888] uppercase block mb-1">AI Reasoning</span>
                                            <p className="text-[12px] text-[#555]">{f.ai_reasoning}</p>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <EmptyState text="No flags raised for this child." />
                            )}
                        </div>
                    )}

                    {/* ═══ REFERRALS TAB ═══ */}
                    {activeTab === 'Referrals' && (
                        <div className="space-y-4">
                            {referrals.length > 0 ? referrals.map((r, i) => (
                                <div key={i} className="bg-white border border-[#E5E5E5] rounded-lg p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-black text-white">{r.referral_type?.replace(/_/g, ' ') || 'Referral'}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${r.urgency === 'emergency' ? 'bg-red-600 text-white' :
                                                        r.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-[#888]'
                                                    }`}>{r.urgency}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${r.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        r.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                    }`}>{r.status}</span>
                                            </div>
                                            <p className="text-[13px] font-bold text-black mt-2">{r.reason}</p>
                                            {r.notes && <p className="text-[12px] text-[#555] mt-1">{r.notes}</p>}
                                        </div>
                                        <span className="text-[11px] text-[#AAA]">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                                    </div>
                                    {r.referred_to_name && (
                                        <div className="text-[12px] text-[#888] mt-2">
                                            Referred to: <span className="font-bold text-black">{r.referred_to_name}</span> {r.referred_to_designation && `(${r.referred_to_designation})`}
                                        </div>
                                    )}
                                    {r.outcome_notes && (
                                        <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                                            <span className="text-[10px] font-black text-green-700 uppercase block mb-1">Outcome</span>
                                            <p className="text-[12px] text-green-800">{r.outcome_notes}</p>
                                        </div>
                                    )}
                                    {r.follow_up_date && (
                                        <div className="text-[11px] text-[#888] mt-2">
                                            Follow-up: <span className="font-bold">{new Date(r.follow_up_date).toLocaleDateString()}</span> — {r.follow_up_status || 'pending'}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <EmptyState text="No referrals created for this child." />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ═══ Helper Components ═══

const MetricCard = ({ label, value, sub, alert }: { label: string; value: string; sub: string; alert?: boolean }) => (
    <div className="bg-white p-6 rounded-lg border border-[#E5E5E5] flex flex-col items-center text-center">
        <span className="text-[11px] font-black text-[#888] uppercase mb-3 tracking-widest">{label}</span>
        <span className="text-[28px] font-black">{value}</span>
        {sub && <span className={`text-[12px] font-bold mt-1 ${alert ? 'text-red-600' : 'text-green-600'}`}>{sub}</span>}
    </div>
);

const InfoField = ({ label, value }: { label: string; value: string }) => (
    <div>
        <span className="text-[10px] font-black text-[#888] uppercase tracking-widest block mb-1">{label}</span>
        <span className="font-medium text-[#333] capitalize">{value}</span>
    </div>
);

const EmptyState = ({ text }: { text: string }) => (
    <div className="text-center py-16 text-[13px] text-[#888] bg-white border border-[#E5E5E5] rounded-lg">{text}</div>
);

export default ChildDetailView;
