'use client'

import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Treemap, Legend
} from 'recharts';
import { Download, AlertCircle, TrendingUp, Info, ChevronRight, Filter } from 'lucide-react';
import { KPI } from '@/lib/commissioner/types';
import KPICard from '@/components/commissioner/KPICard';

// Loading skeleton
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

const ScreeningRiskView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Coverage');
  const [timeFilter, setTimeFilter] = useState('Financial Year');

  const tabs = ['Coverage', 'Risk Distribution', 'Trends', 'Conditions'];

  // ═══ STATE FOR LIVE DATA ═══
  const [loading, setLoading] = useState(true);
  const [coverageData, setCoverageData] = useState<any>(null);
  const [districtCoverage, setDistrictCoverage] = useState<any[]>([]);
  const [ageBands, setAgeBands] = useState<any[]>([]);
  const [coverageTrends, setCoverageTrends] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [riskByDistrict, setRiskByDistrict] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any>(null);
  const [conditionHeatmap, setConditionHeatmap] = useState<any>(null);
  const [conditionTrends, setConditionTrends] = useState<any>(null);

  // Fetch helper
  const fetchData = async (type: string) => {
    const res = await fetch(`/api/commissioner/screening?type=${type}`);
    if (!res.ok) throw new Error(`Failed to fetch ${type}`);
    return res.json();
  };

  // Load data based on active tab
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        switch (activeTab) {
          case 'Coverage': {
            const [kpis, districts, bands, trends] = await Promise.all([
              fetchData('coverage-kpis'),
              fetchData('district-coverage'),
              fetchData('age-bands'),
              fetchData('coverage-trends')
            ]);
            if (!cancelled) {
              setCoverageData(kpis);
              setDistrictCoverage(districts);
              setAgeBands(bands);
              setCoverageTrends(trends);
            }
            break;
          }
          case 'Risk Distribution': {
            const [kpis, byDistrict] = await Promise.all([
              fetchData('risk-kpis'),
              fetchData('risk-by-district')
            ]);
            if (!cancelled) {
              setRiskData(kpis);
              setRiskByDistrict(byDistrict);
            }
            break;
          }
          case 'Trends': {
            const trends = await fetchData('coverage-trends');
            if (!cancelled) setCoverageTrends(trends);
            break;
          }
          case 'Conditions': {
            const [conds, heatmap, trends] = await Promise.all([
              fetchData('conditions'),
              fetchData('condition-heatmap'),
              fetchData('condition-trends')
            ]);
            if (!cancelled) {
              setConditions(conds);
              setConditionHeatmap(heatmap);
              setConditionTrends(trends);
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error loading screening data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [activeTab]);

  // ═══ DERIVED DATA ═══
  const coverageKPIs: KPI[] = coverageData ? [
    { id: 'c1', label: 'TOTAL CHILDREN', value: coverageData.total.toLocaleString(), delta: 0, trend: [], accent: '#3B82F6' },
    { id: 'c2', label: 'SCREENED', value: coverageData.screened.toLocaleString(), delta: 0, trend: [], accent: '#22C55E' },
    { id: 'c3', label: 'UNSCREENED', value: coverageData.unscreened.toLocaleString(), delta: 0, trend: [], accent: '#94A3B8' },
    { id: 'c4', label: 'COVERAGE RATE', value: `${coverageData.rate}%`, delta: 0, trend: [], accent: '#000000' },
  ] : [];

  const belowTargetDistricts = useMemo(() => {
    return districtCoverage
      .filter((d: any) => d.coverage < 70)
      .sort((a: any, b: any) => a.coverage - b.coverage);
  }, [districtCoverage]);

  const riskKPIs: KPI[] = riskData ? [
    { id: 'r1', label: 'HIGH RISK (SAM)', value: riskData.high.toLocaleString(), delta: 0, trend: [], accent: '#EF4444' },
    { id: 'r2', label: 'CRITICAL FLAGS', value: riskData.critical.toLocaleString(), delta: 0, trend: [], accent: '#000000' },
    { id: 'r3', label: 'MEDIUM RISK', value: riskData.medium.toLocaleString(), delta: 0, trend: [], accent: '#F59E0B' },
    { id: 'r4', label: 'HEALTHY / NORMAL', value: riskData.normal.toLocaleString(), delta: 0, trend: [], accent: '#22C55E' },
  ] : [];

  const riskPieData = riskData ? [
    { name: 'Critical', value: riskData.critical, color: '#000000' },
    { name: 'High', value: riskData.high, color: '#EF4444' },
    { name: 'Medium', value: riskData.medium, color: '#F59E0B' },
    { name: 'Low/Normal', value: riskData.normal, color: '#22C55E' },
  ] : [];

  const totalRisk = riskData ? (riskData.high + riskData.medium + riskData.normal + riskData.critical) : 0;
  const samRate = totalRisk > 0 ? Math.round((riskData?.high / totalRisk) * 100) : 0;

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">Screening & Risk Overview</h1>
          <p className="text-[14px] text-[#888888] font-medium">Statewide diagnostic reach and risk profile analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#E5E5E5] rounded p-1 flex">
            {['Quarter', 'Year', 'Financial Year'].map((f) => (
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
            <Download size={16} /> Export Data
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-[#E5E5E5] mb-8 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 text-[13px] font-bold transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-black' : 'text-[#888] hover:text-[#555]'
              }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />}
          </button>
        ))}
      </div>

      {/* CONTENT: COVERAGE */}
      {activeTab === 'Coverage' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loading ? (
            <div className="space-y-6">
              <div className="flex gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 flex-1" />)}</div>
              <div className="grid grid-cols-2 gap-6"><Skeleton className="h-[380px]" /><Skeleton className="h-[380px]" /></div>
            </div>
          ) : (
            <>
              <div className="flex flex-nowrap overflow-x-auto gap-4 scrollbar-hide">
                {coverageKPIs.map(kpi => <KPICard key={kpi.id} {...kpi} />)}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-6">District Coverage Intensity</h3>
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={districtCoverage.map((d: any) => ({ name: d.name, size: d.coverage }))}
                        dataKey="size"
                        stroke="#fff"
                        fill="#000"
                      >
                        <Tooltip content={<CustomTreemapTooltip />} />
                      </Treemap>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-[#888] mt-4 font-bold uppercase tracking-widest text-center">Block size represents relative coverage percentage</p>
                </div>

                <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[16px] font-black uppercase tracking-tight">Below Target Districts</h3>
                    <span className="text-[11px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-1 rounded tracking-widest">Target: 70%</span>
                  </div>
                  <div className="overflow-x-auto">
                    {belowTargetDistricts.length > 0 ? (
                      <table className="w-full text-left">
                        <thead className="text-[10px] font-black text-[#888] uppercase tracking-widest border-b border-[#F5F5F5]">
                          <tr>
                            <th className="pb-3 px-2">District</th>
                            <th className="pb-3 text-right">Coverage</th>
                            <th className="pb-3 text-right">Gap</th>
                            <th className="pb-3"></th>
                          </tr>
                        </thead>
                        <tbody className="text-[13px]">
                          {belowTargetDistricts.map((d: any) => (
                            <tr key={d.id} className="border-b border-[#F9F9F9] hover:bg-[#FBFBFB] transition-all group cursor-pointer">
                              <td className="py-3 px-2 font-bold">{d.name}</td>
                              <td className="py-3 text-right font-black">{d.coverage}%</td>
                              <td className="py-3 text-right text-red-600 font-bold">-{(70 - d.coverage).toFixed(1)}%</td>
                              <td className="py-3 text-right">
                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-[#AAA] transition-all" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-12 text-center text-[#888] text-[13px] font-medium">
                        ✅ All districts are at or above the 70% target
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-6">Age Band Reach</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageBands} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="band" type="category" axisLine={false} tickLine={false} fontSize={11} width={60} />
                        <Tooltip />
                        <Bar dataKey="screened" stackId="a" fill="#000" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="unscreened" stackId="a" fill="#EEE" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-black rounded-sm" /><span className="text-[10px] font-black text-[#888] uppercase">Screened</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#EEE] rounded-sm" /><span className="text-[10px] font-black text-[#888] uppercase">Gap</span></div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-6">Coverage by District (12 Months)</h3>
                  <div className="h-[280px]">
                    {coverageTrends?.months ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={coverageTrends.months}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                          <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip />
                          {coverageTrends.districtNames?.map((name: string, i: number) => (
                            <Line key={name} type="monotone" dataKey={name} stroke={i % 2 === 0 ? '#CCC' : '#EEE'} strokeWidth={1} dot={false} />
                          ))}
                          <Line type="monotone" dataKey="State Avg" stroke="#000" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#888] text-[13px]">No trend data available</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* CONTENT: RISK DISTRIBUTION */}
      {activeTab === 'Risk Distribution' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loading ? (
            <div className="space-y-6">
              <div className="flex gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 flex-1" />)}</div>
              <Skeleton className="h-[400px]" />
            </div>
          ) : (
            <>
              <div className="flex flex-nowrap overflow-x-auto gap-4 scrollbar-hide">
                {riskKPIs.map(kpi => <KPICard key={kpi.id} {...kpi} />)}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                <div className="lg:col-span-7 bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-6">Risk by District (Relative Volume)</h3>
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskByDistrict}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 20, textTransform: 'uppercase', fontWeight: 'bold' }} />
                        <Bar dataKey="Low" fill="#22C55E" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Medium" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="High" fill="#EF4444" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Critical" fill="#000000" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-3 bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-8 w-full">State Risk Profile</h3>
                  <div className="relative w-full h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={riskPieData} innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value">
                          {riskPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest">SAM Rate</span>
                      <span className="text-[28px] font-black">{samRate}%</span>
                    </div>
                  </div>
                  <div className="w-full mt-6 space-y-2">
                    <div className="flex justify-between items-center bg-black text-white p-3 rounded">
                      <span className="text-[11px] font-black uppercase tracking-widest">Critical Flags</span>
                      <span className="text-[18px] font-black">{riskData?.critical || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Domain Concern Heatmap - from condition-heatmap */}
              <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[16px] font-black uppercase tracking-tight">Domain Concern Heatmap</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-50 border border-gray-100" /><span className="text-[10px] font-bold text-[#888]">LOW</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-800" /><span className="text-[10px] font-bold text-[#888]">CRITICAL</span></div>
                  </div>
                </div>
                {conditionHeatmap ? (
                  <div className="overflow-x-auto">
                    <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${conditionHeatmap.districts?.length || 1}, 1fr)`, gap: '2px' }}>
                      <div />
                      {conditionHeatmap.districts?.map((d: string) => (
                        <div key={d} className="text-[10px] font-black text-[#888] uppercase tracking-tighter text-center h-12 flex items-end justify-center pb-2">
                          <span className="truncate">{d}</span>
                        </div>
                      ))}
                      {conditionHeatmap.categories?.map((cat: string, idx: number) => (
                        <React.Fragment key={cat}>
                          <div className="flex items-center pr-4 text-[11px] font-black text-black uppercase tracking-tight h-12">{cat}</div>
                          {conditionHeatmap.districts?.map((dist: string) => {
                            const rawCat = Object.keys(conditionHeatmap.heatmap || {})[idx]
                            const val = rawCat ? (conditionHeatmap.heatmap[rawCat]?.[dist] || 0) : 0
                            const maxVal = Math.max(1, ...Object.values(conditionHeatmap.heatmap?.[rawCat] || {}) as number[])
                            const opacity = maxVal > 0 ? 0.05 + (val / maxVal) * 0.95 : 0.05
                            return (
                              <div
                                key={`${cat}-${dist}`}
                                className="h-12 border border-white hover:border-black transition-all group relative cursor-help"
                                style={{ backgroundColor: `rgba(185, 28, 28, ${opacity})` }}
                              >
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/80 text-white text-[9px] font-bold z-10 transition-opacity">
                                  {val}
                                </div>
                              </div>
                            )
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Skeleton className="h-[200px]" />
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* CONTENT: TRENDS */}
      {activeTab === 'Trends' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loading ? (
            <Skeleton className="h-[520px]" />
          ) : (
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-2">Multi-District Trend Comparison</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2"><div className="w-4 h-[2px] bg-black" /><span className="text-[11px] font-black uppercase text-black">State Average</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-[2px] bg-[#CCC]" /><span className="text-[11px] font-bold uppercase text-[#888]">Districts ({coverageTrends?.districtNames?.length || 0})</span></div>
                  </div>
                </div>
              </div>

              <div className="h-[460px] relative">
                {coverageTrends?.months ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={coverageTrends.months}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                      <XAxis dataKey="month" fontSize={12} axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                      <YAxis fontSize={11} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomLineTooltip />} />
                      {coverageTrends.districtNames?.map((name: string, i: number) => (
                        <Line
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stroke={i % 2 === 0 ? '#DDD' : '#EEE'}
                          strokeWidth={1.5}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                      <Line type="monotone" dataKey="State Avg" stroke="#000" strokeWidth={4} dot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#888] text-[13px]">No trend data available</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENT: CONDITIONS */}
      {activeTab === 'Conditions' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loading ? (
            <div className="grid grid-cols-2 gap-6"><Skeleton className="h-[400px]" /><Skeleton className="h-[400px]" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
                <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">Condition Prevalence (Statewide)</h3>
                <div className="space-y-6">
                  {conditions?.conditions?.length > 0 ? (
                    conditions.conditions.map((stat: any) => {
                      const maxCount = conditions.conditions[0]?.count || 1
                      return (
                        <div key={stat.condition} className="flex items-center gap-6">
                          <div className="w-[180px] text-[13px] font-bold text-[#555] uppercase tracking-tight">{stat.condition}</div>
                          <div className="flex-1 h-8 flex items-center">
                            <div className="h-full bg-black rounded transition-all duration-1000" style={{ width: `${(stat.count / maxCount) * 100}%` }} />
                          </div>
                          <div className="w-20 text-right">
                            <span className="text-[16px] font-black block">{stat.count.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-[#888] uppercase">{stat.rate} per 1000</span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-12 text-center text-[#888] text-[13px]">No condition data available</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm flex-1">
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-6">Condition by District Heatmap</h3>
                  {conditionHeatmap && conditionHeatmap.districts?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="min-w-[400px]">
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${conditionHeatmap.districts.length}, 1fr)`, gap: '2px', marginBottom: '8px' }}>
                          {conditionHeatmap.districts.map((d: string) => (
                            <div key={d} className="text-[9px] font-black text-[#AAA] text-center truncate">{d.substring(0, 3)}</div>
                          ))}
                        </div>
                        {conditionHeatmap.categories?.map((cat: string, i: number) => {
                          const rawCat = Object.keys(conditionHeatmap.heatmap || {})[i]
                          return (
                            <div key={cat} style={{ display: 'grid', gridTemplateColumns: `repeat(${conditionHeatmap.districts.length}, 1fr)`, gap: '2px', height: '24px', marginBottom: '2px' }}>
                              {conditionHeatmap.districts.map((d: string) => {
                                const val = rawCat ? (conditionHeatmap.heatmap[rawCat]?.[d] || 0) : 0
                                const maxVal = Math.max(1, ...Object.values(conditionHeatmap.heatmap?.[rawCat] || {}) as number[])
                                const intensity = maxVal > 0 ? Math.floor((val / maxVal) * 4) : 0
                                return (
                                  <div key={d} className={`h-full border border-white rounded-sm ${intensity >= 4 ? 'bg-red-800' : intensity === 3 ? 'bg-red-600' : intensity === 2 ? 'bg-red-400' : intensity === 1 ? 'bg-red-200' : 'bg-red-100'}`} />
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-[#888] text-[13px]">No heatmap data</div>
                  )}

                  {/* Dynamic prevalence alert */}
                  {conditions?.conditions?.[0] && (
                    <div className="mt-8 p-4 bg-red-50 rounded border border-red-100">
                      <div className="flex gap-2 items-center mb-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <span className="text-[13px] font-black text-red-700 uppercase">Prevalence Alert</span>
                      </div>
                      <p className="text-[12px] text-red-900 leading-snug font-medium">
                        {conditions.conditions[0].condition} is the most prevalent condition with {conditions.conditions[0].count.toLocaleString()} cases ({conditions.conditions[0].rate} per 1,000 children).
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm h-64">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[16px] font-black uppercase tracking-tight">Condition Trend Line</h3>
                  </div>
                  <div className="h-32">
                    {conditionTrends?.data ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={conditionTrends.data}>
                          {conditionTrends.categories?.slice(0, 3).map((cat: string, i: number) => (
                            <Line key={cat} type="stepAfter" dataKey={cat} stroke={i === 0 ? '#000' : i === 1 ? '#888' : '#CCC'} strokeWidth={2} dot={false} />
                          ))}
                          <Tooltip />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#888] text-[13px]">No trend data</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Tooltip Components
const CustomTreemapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white p-4 rounded shadow-2xl border border-[#333]">
        <p className="text-[14px] font-black uppercase tracking-tight">{payload[0].payload.name}</p>
        <p className="text-[12px] font-bold text-[#888]">Coverage: <span className="text-white">{payload[0].value}%</span></p>
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const sorted = [...payload].sort((a: any, b: any) => b.value - a.value);
    return (
      <div className="bg-black text-white p-4 rounded shadow-2xl border border-[#333] max-h-[300px] overflow-y-auto w-56 scrollbar-hide">
        <p className="text-[12px] font-black mb-3 border-b border-[#333] pb-2 uppercase tracking-widest">{label}</p>
        <div className="space-y-1.5">
          {sorted.map((p: any) => (
            <div key={p.name} className="flex justify-between items-center gap-4">
              <span className={`text-[11px] font-bold truncate flex-1 ${p.name === 'State Avg' ? 'text-white underline' : 'text-[#888]'}`}>{p.name}</span>
              <span className={`text-[12px] font-black ${p.name === 'State Avg' ? 'text-white' : 'text-[#888]'}`}>{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default ScreeningRiskView;
