'use client';

import React, { useState, useMemo, useEffect } from 'react';
import * as actions from '@/app/admin/assignments/actions';

// Internal Icons as SVG components to maintain zero-dependency design
const Icons = {
    Users: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    User: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Search: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    ChevronDown: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    ChevronRight: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    MapPin: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
    ),
    AlertCircle: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    Clock: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    ShieldAlert: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    UserCheck: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
        </svg>
    ),
    Loader2: ({ size = 40, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}>
            <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
    ),
    Building2: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" /><path d="M10 22v-4a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v4" /><path d="M10 8h4" /><path d="M10 12h4" /><path d="M10 16h4" />
        </svg>
    ),
    MoreHorizontal: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
        </svg>
    ),
    Filter: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    Plus: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    ArrowRight: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
    ),
    ShieldCheck: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
        </svg>
    ),
    Layers: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
        </svg>
    ),
    Home: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
};

interface AssignmentNode {
    id: string;
    name: string;
    title: string;
    role: string;
    type: 'STATE' | 'DISTRICT' | 'MANDAL' | 'SECTOR' | 'PANCHAYAT' | 'AWC';
    status: 'ASSIGNED' | 'VACANT' | 'INACTIVE';
    childrenCount?: number;
    unassignedCount?: number;
    children?: AssignmentNode[];
}

const AssignmentMap: React.FC = () => {
    const [hierarchy, setHierarchy] = useState<AssignmentNode | null>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['state-root']));
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'VACANT' | 'ASSIGNED'>('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const response = await actions.getAssignmentHierarchy();
            if (response) {
                setHierarchy(response.root);
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Failed to load hierarchy:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(expandedNodes);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedNodes(next);
    };

    const renderNode = (node: AssignmentNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isVacant = node.status === 'VACANT';

        if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase()) && !node.title.toLowerCase().includes(searchTerm.toLowerCase())) {
            if (!node.children?.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.title.toLowerCase().includes(searchTerm.toLowerCase()))) {
                return null;
            }
        }

        if (filterStatus === 'VACANT' && node.status !== 'VACANT' && !node.children?.some(c => c.status === 'VACANT')) {
            return null;
        }

        return (
            <div key={node.id} className="select-none">
                <div
                    className={`
            group flex items-center p-3 rounded-xl mb-1 transition-all border
            ${isVacant ? 'bg-red-50/50 border-red-100' : 'bg-white border-gray-100 hover:border-gray-300'}
            ${level === 0 ? 'shadow-sm py-4 mb-4' : 'ml-6'}
          `}
                >
                    <div
                        onClick={(e) => hasChildren && toggleExpand(node.id, e)}
                        className={`
              w-6 h-6 flex items-center justify-center rounded cursor-pointer transition-colors
              ${hasChildren ? 'hover:bg-gray-200' : 'opacity-0 cursor-default'}
            `}
                    >
                        {hasChildren && (isExpanded ? <Icons.ChevronDown size={14} className="text-gray-600" /> : <Icons.ChevronRight size={14} className="text-gray-400" />)}
                    </div>

                    <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0
            ${isVacant ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 group-hover:bg-black group-hover:text-white transition-colors'}
          `}>
                        {node.type === 'STATE' ? <Icons.Building2 size={20} /> :
                            node.type === 'DISTRICT' ? <Icons.MapPin size={20} /> :
                                node.type === 'MANDAL' ? <Icons.Building2 size={18} /> :
                                    node.type === 'SECTOR' ? <Icons.Layers size={18} /> :
                                        node.type === 'PANCHAYAT' ? <Icons.Home size={18} /> :
                                            node.status === 'ASSIGNED' ? <Icons.UserCheck size={20} /> : <Icons.AlertCircle size={20} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                            <h4 className={`text-[14px] font-bold truncate ${isVacant ? 'text-red-900' : 'text-black'}`}>{node.name}</h4>
                            {isVacant && (
                                <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase rounded tracking-widest">VACANT</span>
                            )}
                        </div>
                        <p className="text-[12px] text-gray-400 font-medium truncate uppercase tracking-tight">{node.title} • {node.role}</p>
                    </div>

                    <div className="flex items-center space-x-6 px-4">
                        {node.childrenCount && node.childrenCount > 0 && (
                            <div className="text-right">
                                <p className="text-[14px] font-black text-black leading-none">{node.childrenCount}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Children</p>
                            </div>
                        )}
                        <button className="p-2 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-black">
                            <Icons.MoreHorizontal size={18} />
                        </button>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="border-l-2 border-gray-100 ml-6 animate-in slide-in-from-left-2 duration-200">
                        {node.children?.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-6 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-[24px] font-bold text-black tracking-tight leading-none">Assignment Map</h1>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">Personnel gap analysis and organizational chart</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-6 h-11 bg-white border border-gray-200 rounded-xl text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                        <Icons.Filter size={18} />
                        <span>Advanced Analysis</span>
                    </button>
                    <button className="flex items-center space-x-2 px-6 h-11 bg-black text-white rounded-xl text-[14px] font-bold hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
                        <Icons.Plus size={18} />
                        <span>Launch Assignment Wizard</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                <div className="flex-1 bg-white border border-[#E5E5E5] rounded-[32px] flex flex-col overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between shrink-0">
                        <div className="relative w-72">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search and filter nodes..."
                                className="w-full h-11 pl-10 pr-4 bg-gray-50 border-none rounded-xl text-[13px] outline-none focus:ring-2 ring-black/5"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
                            {(['ALL', 'VACANT', 'ASSIGNED'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                                <Icons.Loader2 className="text-black" size={40} />
                                <p className="text-[13px] font-bold uppercase tracking-[0.2em]">Syncing Hierarchy...</p>
                            </div>
                        ) : hierarchy ? (
                            renderNode(hierarchy)
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50 text-center">
                                <Icons.AlertCircle size={40} />
                                <div>
                                    <p className="text-[16px] font-bold text-black uppercase tracking-widest">No Data Available</p>
                                    <p className="text-[12px] text-gray-400 font-medium">Please check your database connections or permissions.</p>
                                </div>
                                <button onClick={loadData} className="px-6 py-2 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all">Retry Fetch</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-[340px] flex flex-col space-y-4 shrink-0 overflow-y-auto pb-4">
                    <div className="bg-gray-900 rounded-[28px] p-8 text-white space-y-8 shadow-2xl">
                        <div>
                            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Urgent Gaps</p>
                            <div className="space-y-6">
                                <GapStat label="Vacant AWCs" count={stats?.vacantAWCs ?? 0} color="text-red-400" priority="CRITICAL" />
                                <GapStat label="Unassigned AWWs" count={stats?.unassignedAWWs ?? 0} color="text-amber-400" priority="HIGH" />
                                <GapStat label="Sector Supervisor Vacancies" count={stats?.vacantSectors ?? 0} color="text-amber-400" priority="HIGH" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#E5E5E5] rounded-[28px] p-8 space-y-6 shadow-sm flex-1">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Recommendations</h3>
                        <div className="space-y-4">
                            <div className="group p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-black transition-all cursor-pointer">
                                <p className="text-[13px] font-bold text-black">Fill District Gaps</p>
                                <p className="text-[12px] text-gray-500 mt-1 leading-snug">Multiple district officers are unassigned despite vacancies.</p>
                                <div className="flex items-center space-x-2 text-[11px] font-bold text-black mt-3 group-hover:translate-x-1 transition-transform">
                                    <span>Resolve now</span>
                                    <Icons.ArrowRight size={14} />
                                </div>
                            </div>

                            <div className="group p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-black transition-all cursor-pointer">
                                <p className="text-[13px] font-bold text-black">AWC Reassignment</p>
                                <p className="text-[12px] text-gray-500 mt-1 leading-snug">System suggests 4 local reassignments to reduce travel time.</p>
                                <div className="flex items-center space-x-2 text-[11px] font-bold text-black mt-3 group-hover:translate-x-1 transition-transform">
                                    <span>Review AI picks</span>
                                    <Icons.ArrowRight size={14} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <div className="flex items-center space-x-3 text-gray-400 opacity-60">
                                <Icons.ShieldCheck size={16} />
                                <p className="text-[11px] font-medium leading-relaxed italic">Changes logged to administrative audit history.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GapStat = ({ label, count, color, priority }: any) => (
    <div className="flex items-center justify-between group">
        <div>
            <p className={`text-[28px] font-black leading-none ${color}`}>{count}</p>
            <p className="text-[12px] font-bold text-white/60 mt-2">{label}</p>
        </div>
        <div className="flex flex-col items-end">
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border border-white/20 uppercase tracking-widest ${priority === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`}>{priority}</span>
        </div>
    </div>
);

export default AssignmentMap;
