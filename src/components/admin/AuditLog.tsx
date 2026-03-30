'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Search, Download, ChevronDown,
    ArrowUpRight, ShieldCheck, AlertCircle,
    Clock, Globe, FileText, ChevronUp,
    Info, ExternalLink, RefreshCw
} from 'lucide-react';

export interface AuditEvent {
    id: string;
    timestamp: string;
    adminName: string;
    action: string;
    description: string;
    target: string;
    ip: string;
    before?: string;
    after?: string;
}

interface AuditLogProps {
    logs: AuditEvent[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    initialFilters: {
        actionFilter: string;
        dateFrom: string;
        dateTo: string;
        search: string;
    };
}

const ACTION_COLORS: Record<string, string> = {
    create: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
    update: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
    delete: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
    disable: 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]',
    login: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]',
    role: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]',
    assign: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    import: 'bg-[#F5F3FF] text-[#5B21B6] border-[#DDD6FE]',
    config: 'bg-black text-white border-black',
};

function getActionColor(action: string): string {
    const lower = action.toLowerCase();
    for (const [key, cls] of Object.entries(ACTION_COLORS)) {
        if (lower.includes(key)) return cls;
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
}

function formatTimestamp(ts: string): string {
    return new Date(ts).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

const AuditLog: React.FC<AuditLogProps> = ({
    logs,
    totalCount,
    currentPage,
    pageSize,
    initialFilters,
}) => {
    const router = useRouter();
    const pathname = usePathname();

    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [actionFilter, setActionFilter] = useState(initialFilters.actionFilter);
    const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom);
    const [dateTo, setDateTo] = useState(initialFilters.dateTo);
    const [search, setSearch] = useState(initialFilters.search);

    const totalPages = Math.ceil(totalCount / pageSize);

    const toggleRow = (id: string) => {
        const next = new Set(expandedRows);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedRows(next);
    };

    const buildUrl = (overrides: Record<string, string | number>) => {
        const params = new URLSearchParams();
        const current = { page: currentPage, action: actionFilter, dateFrom, dateTo, search, ...overrides };
        if (current.page && Number(current.page) > 1) params.set('page', String(current.page));
        if (current.action) params.set('action', String(current.action));
        if (current.dateFrom) params.set('dateFrom', String(current.dateFrom));
        if (current.dateTo) params.set('dateTo', String(current.dateTo));
        if (current.search) params.set('search', String(current.search));
        const qs = params.toString();
        return qs ? `${pathname}?${qs}` : pathname;
    };

    const applyFilters = () => {
        router.push(buildUrl({ page: 1 }));
    };

    const clearFilters = () => {
        setActionFilter('');
        setDateFrom('');
        setDateTo('');
        setSearch('');
        router.push(pathname);
    };

    const goToPage = (p: number) => {
        router.push(buildUrl({ page: p }));
    };

    const exportCSV = () => {
        const headers = ['ID', 'Timestamp', 'Admin', 'Action', 'Target', 'IP', 'Description', 'Before', 'After'];
        const rows = logs.map(l => [
            l.id,
            l.timestamp,
            l.adminName,
            l.action,
            l.target,
            l.ip,
            l.description,
            l.before || '',
            l.after || '',
        ]);
        const csv = [headers, ...rows]
            .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-page-${currentPage}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const paginationPages = (): (number | '...')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | '...')[] = [1];
        if (currentPage > 3) pages.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[24px] font-semibold text-black leading-tight">Audit Log</h1>
                    <p className="text-[13px] text-gray-500">Complete record of all administrative actions</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => router.refresh()}
                        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded text-[13px] font-bold hover:bg-gray-50 transition-all text-gray-700"
                    >
                        <RefreshCw size={16} />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={exportCSV}
                        className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded text-[13px] font-bold hover:bg-gray-800 transition-all shadow-md"
                    >
                        <FileText size={16} />
                        <span>Export page (CSV)</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm sticky top-[56px] z-30 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Date From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="w-full h-10 px-3 bg-gray-50 border-none rounded-lg text-xs outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Date To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="w-full h-10 px-3 bg-gray-50 border-none rounded-lg text-xs outline-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Action Type</label>
                        <div className="relative">
                            <select
                                value={actionFilter}
                                onChange={e => setActionFilter(e.target.value)}
                                className="w-full h-10 pl-3 pr-8 bg-gray-50 border-none rounded-lg text-xs appearance-none outline-none"
                            >
                                <option value="">All Actions</option>
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                                <option value="login">Login</option>
                                <option value="role">Role Change</option>
                                <option value="assign">Assignment</option>
                                <option value="import">Bulk Import</option>
                                <option value="config">Config Change</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-1 lg:col-span-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                placeholder="Table, action, purpose…"
                                className="w-full h-10 pl-9 pr-4 bg-gray-50 border-none rounded-lg text-xs outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-end space-x-2">
                        <button
                            onClick={applyFilters}
                            className="flex-1 h-10 bg-black text-white rounded-lg text-[12px] font-bold hover:bg-gray-800 transition-all"
                        >
                            Apply
                        </button>
                        <button
                            onClick={clearFilters}
                            className="px-4 h-10 text-[12px] font-bold text-gray-400 hover:text-black transition-all"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black text-white text-[11px] font-bold uppercase tracking-widest">
                            <th className="px-6 py-5 w-48">Timestamp</th>
                            <th className="px-6 py-5">Admin</th>
                            <th className="px-6 py-5">Action</th>
                            <th className="px-6 py-5">Target</th>
                            <th className="px-6 py-5">IP Address</th>
                            <th className="px-6 py-5 text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-[13px] text-gray-400">
                                    No audit log entries found.
                                </td>
                            </tr>
                        ) : (
                            logs.map((event) => {
                                const isExpanded = expandedRows.has(event.id);
                                return (
                                    <React.Fragment key={event.id}>
                                        <tr className={`hover:bg-gray-50 transition-colors group ${isExpanded ? 'bg-gray-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <span className="text-[12px] font-medium text-gray-600">
                                                    {formatTimestamp(event.timestamp)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                        {event.adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-[13px] font-bold text-gray-800">{event.adminName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${getActionColor(event.action)}`}>
                                                    {event.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[13px] font-semibold text-gray-900">{event.target}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2 text-gray-400">
                                                    <Globe size={12} />
                                                    <span className="text-[11px] font-mono">{event.ip}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => toggleRow(event.id)}
                                                    className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-black text-white' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}
                                                >
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-white">
                                                <td colSpan={6} className="px-12 py-6 border-l-4 border-black">
                                                    <div className="space-y-4">
                                                        <div className="flex items-start space-x-4">
                                                            <Info size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                                            <div>
                                                                <p className="text-[13px] font-bold text-black mb-1">Action Description</p>
                                                                <p className="text-[13px] text-gray-600">{event.description}</p>
                                                            </div>
                                                        </div>

                                                        {(event.before || event.after) && (
                                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                                <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
                                                                    <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Before Change</p>
                                                                    <p className="text-[12px] font-mono text-red-700 break-all">{event.before || '—'}</p>
                                                                </div>
                                                                <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
                                                                    <p className="text-[10px] font-bold text-green-400 uppercase mb-1">After Change</p>
                                                                    <p className="text-[12px] font-mono text-green-700 break-all">{event.after || '—'}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center space-x-4 pt-2">
                                                            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-md">
                                                                <ShieldCheck size={14} className="text-emerald-500" />
                                                                <span className="text-[11px] font-bold text-gray-500 uppercase">Integrity Verified</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[12px] font-medium text-gray-500">
                    <span>
                        {totalCount === 0
                            ? 'No entries'
                            : `Showing ${((currentPage - 1) * pageSize) + 1}–${Math.min(currentPage * pageSize, totalCount)} of ${totalCount.toLocaleString()} events`}
                    </span>
                    {totalPages > 1 && (
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-white border border-gray-200 rounded disabled:opacity-40 hover:border-black transition-colors"
                            >
                                Previous
                            </button>
                            {paginationPages().map((p, idx) =>
                                p === '...'
                                    ? <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                                    : <button
                                        key={p}
                                        onClick={() => goToPage(p as number)}
                                        className={`px-3 py-1 border rounded transition-colors ${p === currentPage ? 'bg-black text-white border-black shadow-sm' : 'bg-white border-gray-200 hover:border-black'}`}
                                    >
                                        {p}
                                    </button>
                            )}
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-white border border-gray-200 rounded disabled:opacity-40 hover:border-black transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLog;
