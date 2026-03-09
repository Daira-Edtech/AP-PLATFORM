'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Download, ChevronRight, MoreHorizontal,
  ArrowUpDown, X, ChevronLeft, Calendar, User, MapPin,
  AlertTriangle, Send
} from 'lucide-react';

interface ChildrenDirectoryProps {
  onChildSelect: (id: string, districtId: string) => void;
}

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

const ChildrenDirectory: React.FC<ChildrenDirectoryProps> = ({ onChildSelect }) => {
  // ═══ STATE ═══
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(50);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [filters, setFilters] = useState({
    district: '',
    risk: '',
    status: '',
    age: ''
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchApi = async (type: string, params?: Record<string, string>) => {
    const url = new URL(`/api/commissioner/children`, window.location.origin);
    url.searchParams.set('type', type);
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v) });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch ${type}`);
    return res.json();
  };

  // Load summary + filters once
  useEffect(() => {
    async function loadInitial() {
      try {
        const [summaryRes, filtersRes] = await Promise.all([
          fetchApi('summary'),
          fetchApi('filters'),
        ]);
        setSummary(summaryRes);
        setFilterOptions(filtersRes);
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    }
    loadInitial();
  }, []);

  // Load paginated children when page/filters change
  const loadChildren = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('list', {
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchDebounced,
        district: filters.district,
        risk: filters.risk,
        status: filters.status,
        age: filters.age
      });
      setChildren(res.children || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      console.error('Error loading children:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchDebounced, filters]);

  useEffect(() => { loadChildren() }, [loadChildren]);

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [searchDebounced, filters]);

  const clearFilters = () => {
    setFilters({ district: '', risk: '', status: '', age: '' });
    setSearchTerm('');
  };

  // Derived stats
  const stats = summary ? {
    screenedPct: summary.screenedPct || 0,
    highRiskPct: summary.highRiskPct || 0,
    referredPct: summary.referredPct || 0,
  } : { screenedPct: 0, highRiskPct: 0, referredPct: 0 };

  if (!summary && !filterOptions) {
    return (
      <div className="animate-in fade-in duration-700 pb-20 space-y-8">
        <div className="flex justify-between items-end mb-8">
          <div><Skeleton className="h-10 w-64 mb-2" /><Skeleton className="h-4 w-96" /></div>
        </div>
        <div className="grid grid-cols-3 gap-6">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-32" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">Children Directory</h1>
          <p className="text-[14px] text-[#888888] font-medium">
            {summary ? `${(summary.total || 0).toLocaleString()} children across ${summary.districts || 0} districts` : 'Loading...'} • Statewide Registry
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
            <Download size={16} /> Filtered CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded text-[13px] font-bold hover:bg-zinc-800">
            Export Full Registry
          </button>
        </div>
      </div>

      {/* QUICK STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-[#E5E5E5] p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-1">Screened Status</span>
            <span className="text-[24px] font-black">{stats.screenedPct}%</span>
          </div>
          <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center">
            <Calendar size={20} className="text-[#888]" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-1">High/Critical Risk</span>
            <span className="text-[24px] font-black text-red-600">{stats.highRiskPct}%</span>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-1">Referred to Specialist</span>
            <span className="text-[24px] font-black">{stats.referredPct}%</span>
          </div>
          <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center">
            <Send size={20} className="text-[#888]" />
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm mb-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
              <input
                type="text"
                placeholder="Search by name or parent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg text-[14px] focus:ring-1 focus:ring-black focus:bg-white outline-none transition-all"
              />
            </div>
            <button
              onClick={clearFilters}
              className="px-4 h-12 text-[13px] font-bold text-[#888] hover:text-black transition-colors flex items-center gap-2"
            >
              <X size={16} /> Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FilterDropdown
              label="District"
              value={filters.district}
              options={(filterOptions?.districts || []).map((d: any) => ({ value: d.id, label: d.name }))}
              onChange={(v) => setFilters({ ...filters, district: v })}
            />
            <FilterDropdown
              label="Risk Level"
              value={filters.risk}
              options={['Low', 'Medium', 'High', 'Critical'].map(r => ({ value: r, label: r }))}
              onChange={(v) => setFilters({ ...filters, risk: v })}
            />
            <FilterDropdown
              label="Status"
              value={filters.status}
              options={['Screened', 'Unscreened', 'In Intervention'].map(s => ({ value: s, label: s }))}
              onChange={(v) => setFilters({ ...filters, status: v })}
            />
            <FilterDropdown
              label="Age Range"
              value={filters.age}
              options={['0-1 yr', '1-2 yr', '2-3 yr', '3-4 yr', '4-5 yr', '5-6 yr'].map(a => ({ value: a, label: a }))}
              onChange={(v) => setFilters({ ...filters, age: v })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 px-1">
        <span className="text-[13px] font-bold text-[#888]">Showing <span className="text-black">{children.length}</span> of <span className="text-black">{total.toLocaleString()}</span> results</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#888] font-medium">Page {page} of {totalPages.toLocaleString()}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-[#E5E5E5] bg-white rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-[#E5E5E5] bg-white rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* DIRECTORY TABLE */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : children.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F9F9] border-b border-[#EEE] text-[10px] font-black uppercase tracking-widest text-[#888]">
                  <th className="px-6 py-4">#</th>
                  <th className="px-4 py-4 min-w-[180px]">
                    <div className="flex items-center gap-2">Name / ID <ArrowUpDown size={12} className="cursor-pointer" /></div>
                  </th>
                  <th className="px-4 py-4">Age / Gender</th>
                  <th className="px-4 py-4">Location (AWC / Mandal)</th>
                  <th className="px-4 py-4">District</th>
                  <th className="px-4 py-4 text-center">Risk</th>
                  <th className="px-4 py-4 text-center">Flags</th>
                  <th className="px-4 py-4 text-center">Referrals</th>
                  <th className="px-6 py-4 text-right">Last Activity</th>
                </tr>
              </thead>
              <tbody className="text-[13px] divide-y divide-[#F5F5F5]">
                {children.map((child: any, i: number) => (
                  <tr
                    key={child.id}
                    onClick={() => onChildSelect(child.id, child.districtId || '')}
                    className="hover:bg-[#FBFBFB] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-bold text-[#AAA]">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-black group-hover:underline underline-offset-4 decoration-1">{child.name}</span>
                        <span className="text-[11px] text-[#888] font-bold">{child.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-[#333]">{child.age}</span>
                        <span className="text-[11px] text-[#888]">{child.gender}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-[#333]">{child.awc}</span>
                        <span className="text-[11px] text-[#888]">{child.mandal}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[11px] text-black font-black uppercase tracking-tighter">{child.district}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-widest ${child.riskStatus === 'Critical' ? 'bg-black text-white' :
                          child.riskStatus === 'High' ? 'bg-red-50 text-red-700' :
                            child.riskStatus === 'Medium' ? 'bg-amber-50 text-amber-700' :
                              'bg-green-50 text-green-700'
                        }`}>
                        {child.riskStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-black">
                      {child.flags > 0 ? (
                        <span className="bg-red-600 text-white w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px]">{child.flags}</span>
                      ) : (
                        <span className="text-[#DDD]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center font-black">
                      {child.referrals > 0 ? child.referrals : <span className="text-[#DDD]">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-black">{child.lastActivity}</span>
                        <span className="text-[11px] text-[#888]">{child.lastScreened}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-[#888] text-[13px]">
              {total === 0 ? 'No children registered in this state yet.' : 'No children matching your filters.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterDropdown: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-black text-[#888] uppercase tracking-widest pl-1">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#F9F9F9] border border-[#E5E5E5] px-3 py-2 rounded font-bold text-[12px] text-black focus:bg-white focus:ring-1 focus:ring-black outline-none cursor-pointer hover:border-[#CCC] transition-all"
    >
      <option value="">All {label}s</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export default ChildrenDirectory;
