'use client'

import React, { useState, useMemo } from 'react';
import { DistrictSummary } from '@/lib/commissioner/types-db';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import {
  Download, LayoutList, Radar as RadarIcon,
  ArrowUpDown, Copy, Filter, ChevronRight, Loader2
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line
} from 'recharts';
import { useLanguage } from '@/lib/commissioner/LanguageContext';

interface DistrictComparisonProps {
  onDistrictSelect: (id: string) => void;
}

const DistrictComparison: React.FC<DistrictComparisonProps> = ({ onDistrictSelect }) => {
  const [viewMode, setViewMode] = useState<'table' | 'radar'>('table');
  const [activeToggles, setActiveToggles] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
    key: 'performance',
    direction: 'desc'
  });
  const { t } = useLanguage();

  const { data: districts, loading } = useSupabaseQuery<DistrictSummary[]>(
    async () => {
      const res = await fetch('/api/commissioner/districts');
      if (!res.ok) throw new Error('Failed to fetch districts');
      return res.json();
    },
    []
  );

  const stateAvgCoverage = useMemo(() => {
    if (!districts || districts.length === 0) return 0;
    return Math.round(districts.reduce((s, d) => s + d.coverage_pct, 0) / districts.length);
  }, [districts]);

  const toggleFilter = (id: string) => {
    setActiveToggles(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const sortedAndFilteredData = useMemo(() => {
    if (!districts) return [];
    let data = [...districts];

    if (activeToggles.includes('below-target')) {
      data = data.filter(d => d.coverage_pct < stateAvgCoverage);
    }
    if (activeToggles.includes('high-escalations')) {
      data = data.filter(d => d.escalations > 0);
    }
    if (activeToggles.includes('low-referral')) {
      const total = (d: DistrictSummary) => d.referrals_active + d.referrals_done;
      data = data.filter(d => total(d) > 0 && (d.referrals_done / total(d)) < 0.7);
    }

    data.sort((a, b) => {
      let aValue: number = 0;
      let bValue: number = 0;

      switch (sortConfig.key) {
        case 'coverage': aValue = a.coverage_pct; bValue = b.coverage_pct; break;
        case 'performance': aValue = a.performance; bValue = b.performance; break;
        case 'children': aValue = a.total_children; bValue = b.total_children; break;
        case 'screened': aValue = a.screened; bValue = b.screened; break;
        case 'escalations': aValue = a.escalations; bValue = b.escalations; break;
        case 'referral_rate':
          const aTotal = a.referrals_active + a.referrals_done;
          const bTotal = b.referrals_active + b.referrals_done;
          aValue = aTotal > 0 ? a.referrals_done / aTotal : 0;
          bValue = bTotal > 0 ? b.referrals_done / bTotal : 0;
          break;
        default: aValue = a.performance; bValue = b.performance;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [districts, activeToggles, sortConfig, stateAvgCoverage]);

  const radarData = useMemo(() => {
    if (!districts) return [];
    return districts.slice(0, 5).map(d => {
      const refTotal = d.referrals_active + d.referrals_done;
      return {
        name: d.name,
        'Coverage': d.coverage_pct,
        'Risk': d.total_children > 0 ? Math.max(0, 100 - (d.risk_critical / d.total_children * 1000)) : 100,
        'Resolution': Math.max(0, 100 - (d.avg_wait * 5)),
        'Referral': refTotal > 0 ? Math.round((d.referrals_done / refTotal) * 100) : 0,
        'Workforce': d.performance
      };
    });
  }, [districts]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Derive top performer and priority attention for radar insight
  const topPerformer = useMemo(() => {
    if (!districts || districts.length === 0) return null;
    return [...districts].sort((a, b) => b.performance - a.performance)[0];
  }, [districts]);

  const priorityAttention = useMemo(() => {
    if (!districts || districts.length === 0) return null;
    return [...districts].sort((a, b) => a.coverage_pct - b.coverage_pct)[0];
  }, [districts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px] gap-3">
        <Loader2 className="animate-spin text-[#888]" size={24} />
        <span className="text-[14px] text-[#888]">{t('district.loadingData')}</span>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-black tracking-tight mb-1">{t('district.title')}</h1>
          <p className="text-[14px] text-[#888888]">{districts?.length || 0} {t('district.districtsIn')} • {t('district.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#E5E5E5] rounded p-1 flex">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-sm transition-all ${viewMode === 'table' ? 'bg-black text-white' : 'text-[#888] hover:text-black'}`}
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`p-2 rounded-sm transition-all ${viewMode === 'radar' ? 'bg-black text-white' : 'text-[#888] hover:text-black'}`}
            >
              <RadarIcon size={18} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
            <Download size={16} /> {t('district.exportCSV')}
          </button>
        </div>
      </div>

      {/* HIGHLIGHT TOGGLES */}
      <div className="flex gap-3 mb-6">
        {[
          { id: 'below-target', label: `${t('district.belowAvg')} (${stateAvgCoverage}%)`, color: 'bg-amber-100 text-amber-900 border-amber-200' },
          { id: 'high-escalations', label: t('district.hasEscalations'), color: 'bg-red-100 text-red-900 border-red-200' },
          { id: 'low-referral', label: t('district.lowReferral'), color: 'bg-orange-100 text-orange-900 border-orange-200' }
        ].map(tog => (
          <button
            key={tog.id}
            onClick={() => toggleFilter(tog.id)}
            className={`px-4 py-2 rounded-full border text-[12px] font-bold transition-all ${activeToggles.includes(tog.id) ? tog.color : 'bg-white text-[#888] border-[#E5E5E5] hover:border-[#CCC]'
              }`}
          >
            {tog.label}
          </button>
        ))}
        <button className="ml-auto text-[13px] font-bold text-[#888] flex items-center gap-2 hover:text-black transition-colors">
          <Filter size={14} /> {t('district.moreFilters')}
        </button>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-white text-[10px] uppercase font-bold tracking-widest">
                  <th className="px-4 py-3 border-r border-[#333]">{t('table.rank')}</th>
                  <th className="px-4 py-3 min-w-[140px] border-r border-[#333]">{t('table.district')}</th>
                  <th className="px-4 py-3 border-r border-[#333]">{t('table.dpoOfficer')}</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">{t('table.cdpos')}</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">{t('table.mandals')}</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">{t('table.awcs')}</th>
                  <th className="px-4 py-3 text-right border-r border-[#333]">{t('table.children')}</th>
                  <th className="px-4 py-3 text-right border-r border-[#333]">{t('table.screened')}</th>
                  <th className="px-4 py-3 min-w-[150px] border-r border-[#333]">
                    <div className="flex items-center justify-between">
                      {t('table.coveragePct')} <ArrowUpDown size={12} className="cursor-pointer" onClick={() => handleSort('coverage')} />
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center border-r border-[#333] bg-[#22C55E]/10">L</th>
                  <th className="px-2 py-3 text-center border-r border-[#333] bg-[#F59E0B]/10">M</th>
                  <th className="px-2 py-3 text-center border-r border-[#333] bg-[#EF4444]/10">H</th>
                  <th className="px-2 py-3 text-center border-r border-[#333] bg-black/10">C</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">{t('table.escalations')}</th>
                  <th className="px-4 py-3 min-w-[120px] border-r border-[#333]">{t('table.referralsAD')}</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">{t('table.avgWait')}</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">{t('table.loadPct')}</th>
                  <th className="px-4 py-3 text-center min-w-[100px]">{t('table.perfScore')}</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {sortedAndFilteredData.map((d, index) => {
                  const isBelowAvg = d.coverage_pct < stateAvgCoverage;
                  const isBelow50 = d.coverage_pct < 50;
                  const waitColor = d.avg_wait < 7 ? 'text-green-600' : (d.avg_wait > 14 ? 'text-red-600' : 'text-amber-600');
                  const loadColor = d.facility_load < 70 ? 'text-green-600' : (d.facility_load > 90 ? 'text-red-600' : 'text-amber-600');
                  const scoreColor = d.performance > 80 ? 'text-green-600' : (d.performance < 50 ? 'text-red-600' : 'text-amber-600');

                  return (
                    <tr
                      key={d.id}
                      onClick={() => onDistrictSelect(d.id)}
                      className="border-b border-[#F5F5F5] hover:bg-[#F9F9F9] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-bold text-[#AAA]">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-black border-r border-[#F5F5F5]">
                        <div className="flex items-center justify-between">
                          {d.name} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-[#AAA]" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#555] border-r border-[#F5F5F5]">{d.dpo_name}</td>
                      <td className="px-4 py-3 text-center border-r border-[#F5F5F5]">{d.cdpo_count}</td>
                      <td className="px-4 py-3 text-center border-r border-[#F5F5F5]">{d.mandal_count}</td>
                      <td className="px-4 py-3 text-center border-r border-[#F5F5F5] font-medium">{d.awc_count}</td>
                      <td className="px-4 py-3 text-right border-r border-[#F5F5F5] font-medium">{d.total_children.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right border-r border-[#F5F5F5] font-medium">{d.screened.toLocaleString()}</td>
                      <td className="px-4 py-3 border-r border-[#F5F5F5]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-black ${isBelow50 ? 'text-red-600' : (isBelowAvg ? 'text-amber-600' : 'text-black')}`}>
                            {d.coverage_pct}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[#E5E5E5] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isBelow50 ? 'bg-red-500' : (isBelowAvg ? 'bg-amber-500' : 'bg-black')}`} style={{ width: `${d.coverage_pct}%` }} />
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center border-r border-[#F5F5F5] font-bold text-green-700">{d.risk_low}</td>
                      <td className="px-2 py-3 text-center border-r border-[#F5F5F5] font-bold text-amber-700">{d.risk_medium}</td>
                      <td className="px-2 py-3 text-center border-r border-[#F5F5F5] font-bold text-red-700">{d.risk_high}</td>
                      <td className="px-2 py-3 text-center border-r border-[#F5F5F5] font-bold bg-black/5">{d.risk_critical}</td>
                      <td className={`px-4 py-3 text-center border-r border-[#F5F5F5] font-black ${d.escalations > 0 ? 'text-red-600' : 'text-black'}`}>
                        {d.escalations}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-[#F5F5F5]">
                        <span className="text-[#888] font-bold">{d.referrals_active}</span> / <span className="text-black font-bold">{d.referrals_done}</span>
                      </td>
                      <td className={`px-4 py-3 text-center border-r border-[#F5F5F5] font-black ${waitColor}`}>
                        {d.avg_wait}d
                      </td>
                      <td className={`px-4 py-3 text-center border-r border-[#F5F5F5] font-black ${loadColor}`}>
                        {d.facility_load}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 relative">
                            <svg viewBox="0 0 36 36" className="w-5 h-5 transform -rotate-90">
                              <circle cx="18" cy="18" r="16" fill="none" stroke="#E5E5E5" strokeWidth="4" />
                              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="4" className={scoreColor} strokeDasharray={`${d.performance}, 100`} />
                            </svg>
                          </div>
                          <span className={`font-black ${scoreColor}`}>{d.performance}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
            <h3 className="text-[16px] font-bold text-black uppercase tracking-tight mb-8">{t('radar.title')}</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#EEE" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#888', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                  {radarData.map((d, i) => (
                    <Radar
                      key={d.name}
                      name={d.name}
                      dataKey="Coverage"
                      stroke={['#000', '#3B82F6', '#22C55E', '#EF4444', '#F59E0B'][i % 5]}
                      fill={['#000', '#3B82F6', '#22C55E', '#EF4444', '#F59E0B'][i % 5]}
                      fillOpacity={0.1}
                    />
                  ))}
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-black uppercase tracking-tight mb-4">{t('radar.insight')}</h3>
              <p className="text-[14px] text-[#555] leading-relaxed mb-6">
                {t('radar.description')}
              </p>
              <div className="space-y-4">
                {topPerformer && (
                  <div className="p-4 bg-[#F9F9F9] rounded border-l-4 border-black">
                    <span className="text-[11px] font-bold text-[#888] uppercase block mb-1">{t('radar.topPerformer')}</span>
                    <span className="text-[15px] font-bold">{topPerformer.name}</span>
                    <p className="text-[12px] text-[#555] mt-1">
                      {t('radar.coverage')}: {topPerformer.coverage_pct}% • {t('radar.performanceScore')}: {topPerformer.performance}
                    </p>
                  </div>
                )}
                {priorityAttention && (
                  <div className="p-4 bg-[#F9F9F9] rounded border-l-4 border-red-500">
                    <span className="text-[11px] font-bold text-[#888] uppercase block mb-1">{t('radar.priorityAttention')}</span>
                    <span className="text-[15px] font-bold">{priorityAttention.name}</span>
                    <p className="text-[12px] text-[#555] mt-1">
                      {t('radar.lowestCoverage')} {priorityAttention.coverage_pct}% • {priorityAttention.risk_critical} {t('radar.criticalRiskCases')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button className="flex-1 py-3 bg-black text-white font-bold rounded text-[13px] hover:bg-[#333] transition-colors flex items-center justify-center gap-2">
                <Copy size={16} /> {t('radar.copyPresentation')}
              </button>
              <button className="flex-1 py-3 border border-black font-bold rounded text-[13px] hover:bg-[#F9F9F9] transition-colors">
                {t('radar.exportPDF')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictComparison;
