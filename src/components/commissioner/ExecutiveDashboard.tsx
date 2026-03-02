'use client'

import React, { useState } from 'react';
import KPICard from '@/components/commissioner/KPICard';
import StateMap from '@/components/commissioner/StateMap';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Download, AlertCircle, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { KPI } from '@/lib/commissioner/types';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import type { StateKPIs, RiskDistribution, DistrictSummary, Alert } from '@/lib/commissioner/types-db';

function formatNumber(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1).replace(/\.0$/, '')},${String(Math.floor((n % 100000) / 1000)).padStart(2, '0')},${String(n % 1000).padStart(3, '0')}`;
  if (n >= 1000) return n.toLocaleString('en-IN');
  return String(n);
}

const ExecutiveDashboard: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState('Quarter');

  const { data: kpis, loading: kpisLoading } = useSupabaseQuery<StateKPIs>(
    async () => { const r = await fetch('/api/commissioner/dashboard?endpoint=kpis'); return r.json(); }, []
  );
  const { data: riskDist, loading: riskLoading } = useSupabaseQuery<RiskDistribution>(
    async () => { const r = await fetch('/api/commissioner/dashboard?endpoint=risk-distribution'); return r.json(); }, []
  );
  const { data: districts, loading: districtsLoading } = useSupabaseQuery<DistrictSummary[]>(
    async () => { const r = await fetch('/api/commissioner/districts'); return r.json(); }, []
  );
  const { data: alerts } = useSupabaseQuery<Alert[]>(
    async () => { const r = await fetch('/api/commissioner/dashboard?endpoint=alerts&limit=5'); return r.json(); }, []
  );
  const { data: escalation } = useSupabaseQuery<{ total: number; critical: number; stateLevel: number }>(
    async () => { const r = await fetch('/api/commissioner/dashboard?endpoint=escalation-summary'); return r.json(); }, []
  );
  const { data: historicalTrend } = useSupabaseQuery<{ name: string; value: number; target: number }[]>(
    async () => { const r = await fetch('/api/commissioner/dashboard?endpoint=historical-kpis'); return r.json(); }, []
  );

  const isLoading = kpisLoading || riskLoading || districtsLoading;

  // Build KPI cards from live data
  const executiveKPIs: KPI[] = kpis ? [
    { id: '1', label: 'TOTAL CHILDREN', value: formatNumber(kpis.total_children), delta: 0, trend: [], accent: '#3B82F6' },
    { id: '2', label: 'SCREENED', value: formatNumber(kpis.screened), delta: 0, trend: [], accent: '#22C55E' },
    { id: '3', label: 'COVERAGE', value: `${kpis.coverage_pct}%`, delta: 0, trend: [], accent: '#000000' },
    { id: '4', label: 'HIGH RISK', value: formatNumber(kpis.high_risk), delta: 0, trend: [], accent: '#EF4444' },
    { id: '5', label: 'CRITICAL', value: formatNumber(kpis.critical_risk), delta: 0, trend: [], accent: '#000000' },
    { id: '6', label: 'ACTIVE REFERRALS', value: formatNumber(kpis.active_referrals), delta: 0, trend: [], accent: '#6B7280' },
  ] : [];

  // Risk pie chart data from live distribution
  const riskData = riskDist ? [
    { name: 'Low', value: riskDist.low, color: '#22C55E' },
    { name: 'Med', value: riskDist.medium, color: '#F59E0B' },
    { name: 'High', value: riskDist.high, color: '#EF4444' },
    { name: 'Critical', value: riskDist.critical, color: '#000000' },
  ] : [];

  const totalScreened = riskDist ? riskDist.low + riskDist.medium + riskDist.high + riskDist.critical : 0;
  const highCritPct = riskDist && totalScreened > 0
    ? Math.round(((riskDist.high + riskDist.critical) / totalScreened) * 100)
    : 0;

  // District ranking from live data
  const rankingData = districts
    ? [...districts]
      .sort((a, b) => b.coverage_pct - a.coverage_pct)
      .map(d => ({
        name: d.name,
        score: d.coverage_pct,
        color: d.coverage_pct > 80 ? '#000000' : (d.coverage_pct < 50 ? '#FEE2E2' : '#94A3B8')
      }))
    : [];

  // Trend data — live from kpi_cache or assessments
  const trendData = historicalTrend && historicalTrend.length > 0
    ? historicalTrend
    : kpis
      ? [{ name: 'Current', value: kpis.screened, target: kpis.total_children }]
      : [];

  // Escalation stats from live data
  const escTotal = escalation?.total || 0;
  const escCritical = escalation?.critical || 0;
  const escStateLevel = escalation?.stateLevel || 0;

  // District counts
  const totalDistricts = districts?.length || 0;
  const totalMandals = districts?.reduce((s, d) => s + d.mandal_count, 0) || 0;
  const totalAWCs = districts?.reduce((s, d) => s + d.awc_count, 0) || 0;

  return (
    <div className="animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">State Dashboard</h1>
          <p className="text-[14px] text-[#888888] font-medium">
            Andhra Pradesh — {totalDistricts} Districts, {totalMandals} Mandals, {formatNumber(totalAWCs)} AWCs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#E5E5E5] rounded p-1 flex">
            {['Week', 'Month', 'Quarter', 'Year', 'FY'].map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-1.5 text-[12px] font-bold rounded-sm transition-all ${timeFilter === f ? 'bg-black text-white' : 'text-[#888] hover:text-black'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY CARD */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm mb-8 relative overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-black" />
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="animate-spin text-[#888]" size={20} />
                <span className="text-[14px] text-[#888]">Loading programme data...</span>
              </div>
            ) : (
              <>
                <h2 className="text-[22px] font-bold text-black mb-3 tracking-tight">
                  Programme Reach: {formatNumber(kpis?.screened || 0)} children screened <span className="text-[#888] font-medium">({kpis?.coverage_pct || 0}% of target)</span>
                </h2>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider">High/Critical Identified</span>
                    <span className="text-[18px] font-bold">
                      {formatNumber((kpis?.high_risk || 0) + (kpis?.critical_risk || 0))} <span className="text-[13px] font-medium text-[#888]">({highCritPct}%)</span>
                    </span>
                  </div>
                  <div className="h-8 w-[1px] bg-[#EEE]" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Referred</span>
                    <span className="text-[18px] font-bold">{formatNumber(kpis?.active_referrals || 0)}</span>
                  </div>
                  <div className="h-8 w-[1px] bg-[#EEE]" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Open Flags</span>
                    <span className="text-[18px] font-bold">{formatNumber(kpis?.open_flags || 0)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col items-end shrink-0">
            <button className="flex items-center gap-2 text-black font-bold text-[14px] group-hover:gap-3 transition-all">
              View full analysis <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI ROW */}
      {executiveKPIs.length > 0 && (
        <div className="flex flex-nowrap overflow-x-auto gap-4 mb-8 pb-2 scrollbar-hide">
          {executiveKPIs.map(kpi => (
            <KPICard key={kpi.id} {...kpi} />
          ))}
        </div>
      )}

      {/* ROW 2 - MAP & RISK */}
      <div className="grid grid-cols-10 gap-6 mb-8">
        <div className="col-span-10 lg:col-span-6">
          <StateMap onDistrictSelect={(d) => console.log('Drill down:', d.name)} />
        </div>
        <div className="col-span-10 lg:col-span-4 flex flex-col h-full">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-[16px] font-bold text-black uppercase tracking-tight mb-6">Statewide Risk Distribution</h3>
            {riskLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#888]" size={24} />
              </div>
            ) : (
              <>
                <div className="flex-1 flex flex-col items-center justify-center relative">
                  <div className="w-[240px] h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskData}
                          innerRadius={80}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {riskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <span className="text-[12px] font-bold text-[#888] uppercase block">Total</span>
                      <span className="text-[20px] font-black">{totalScreened > 1000 ? `${(totalScreened / 1000).toFixed(1)}k` : totalScreened}</span>
                      <span className="text-[10px] text-[#AAA] block">Screened</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 w-full max-w-[300px]">
                    {riskData.map((r) => (
                      <div key={r.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: r.color }} />
                          <span className="text-[12px] text-[#555] font-medium">{r.name}</span>
                        </div>
                        <span className="text-[12px] font-bold">{totalScreened > 0 ? Math.round((r.value / totalScreened) * 100) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-[#F5F5F5]">
                  <div className="flex justify-between items-center bg-amber-50 border border-amber-100 p-3 rounded-lg">
                    <span className="text-[12px] text-amber-800 font-medium">National Benchmark: &lt;8%</span>
                    <span className="text-[12px] font-bold text-amber-600">State: {highCritPct}%</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3 - TREND & RANKING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-black uppercase tracking-tight">Quarterly Screening Trend</h3>
            <div className="flex items-center gap-4 text-[11px] font-bold text-[#888]">
              <div className="flex items-center gap-1.5"><div className="w-3 h-[1px] bg-black" /> Actual</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-[1px] bg-[#AAA] border-t border-dashed" /> Target</div>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.05} />
                    <stop offset="95%" stopColor="#000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                <YAxis fontSize={11} axisLine={false} tickLine={false} tick={{ fill: '#888' }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                <Area type="monotone" dataKey="target" stroke="#AAA" strokeWidth={1} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
          <h3 className="text-[16px] font-bold text-black uppercase tracking-tight mb-6">District Performance Ranking</h3>
          {districtsLoading ? (
            <div className="h-[280px] flex items-center justify-center">
              <Loader2 className="animate-spin text-[#888]" size={24} />
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F1F1" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" fontSize={10} width={80} axisLine={false} tickLine={false} tick={{ fill: '#555', fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: '#F9F9F9' }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
                    {rankingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ROW 4 - ESCALATIONS & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-black uppercase tracking-tight">State Escalations</h3>
            <button className="text-[12px] font-bold text-[#888] hover:text-black">View all →</button>
          </div>
          <div className="flex gap-8 mb-6 p-4 bg-[#F9F9F9] rounded-lg">
            <div><span className="text-[10px] font-bold text-[#888] uppercase block">Total</span><span className="text-[20px] font-black">{escTotal}</span></div>
            <div className="w-[1px] bg-[#E5E5E5]" />
            <div><span className="text-[10px] font-bold text-[#888] uppercase block">Critical</span><span className="text-[20px] font-black text-red-600">{escCritical}</span></div>
            <div className="w-[1px] bg-[#E5E5E5]" />
            <div><span className="text-[10px] font-bold text-[#888] uppercase block">State Level</span><span className="text-[20px] font-black">{escStateLevel}</span></div>
          </div>
          <div className="space-y-4">
            {(districts || []).slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center gap-4">
                <span className="text-[12px] font-bold w-20 truncate">{d.name}</span>
                <div className="flex-1 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                  <div className="h-full bg-black rounded-full" style={{ width: `${escTotal > 0 ? Math.min(100, (d.escalations / escTotal) * 300) : 0}%` }} />
                </div>
                <span className="text-[11px] font-bold text-[#888]">{d.escalations}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-black uppercase tracking-tight">Critical Alerts</h3>
            <button className="text-[12px] font-bold text-[#888] hover:text-black">View all →</button>
          </div>
          <div className="space-y-3">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className={`flex gap-3 p-3 rounded border-l-4 ${alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                  alert.severity === 'high' ? 'bg-amber-50 border-amber-500' :
                    'bg-[#F9F9F9] border-[#888]'
                  }`}>
                  <AlertCircle className={`shrink-0 ${alert.severity === 'critical' ? 'text-red-500' :
                    alert.severity === 'high' ? 'text-amber-500' :
                      'text-[#888]'
                    }`} size={18} />
                  <p className={`text-[13px] leading-tight ${alert.severity === 'critical' ? 'text-red-900' :
                    alert.severity === 'high' ? 'text-amber-900' :
                      'text-[#555]'
                    }`}>
                    {alert.message}
                  </p>
                </div>
              ))
            ) : (
              <>
                <div className="flex gap-3 p-3 bg-[#F9F9F9] border-l-4 border-[#888] rounded">
                  <Calendar className="text-[#888] shrink-0" size={18} />
                  <p className="text-[13px] text-[#555] leading-tight">
                    No critical alerts at this time. System is operating normally.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
