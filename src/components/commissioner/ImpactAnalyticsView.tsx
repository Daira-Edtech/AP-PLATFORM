'use client'

import React, { useState, useEffect } from 'react';
import {
   AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
   Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
   TrendingUp, Calendar, ChevronDown, Download, CheckCircle2,
   ArrowRight, AlertTriangle, Target, Zap
} from 'lucide-react';
import KPICard from '@/components/commissioner/KPICard';

const Skeleton = ({ className = '' }: { className?: string }) => (
   <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

const ImpactAnalyticsView: React.FC = () => {
   const [activeTab, setActiveTab] = useState('Programme Impact');
   const [selectedCohort, setSelectedCohort] = useState('');

   const tabs = ['Programme Impact', 'Cohort Tracking', 'Before / After'];

   // ═══ STATE ═══
   const [loading, setLoading] = useState(true);
   const [impactData, setImpactData] = useState<any>(null);
   const [longitudinalData, setLongitudinalData] = useState<any[]>([]);
   const [pipelineData, setPipelineData] = useState<any[]>([]);
   const [cohortData, setCohortData] = useState<any>(null);
   const [beforeAfterData, setBeforeAfterData] = useState<any[]>([]);

   const fetchData = async (type: string, params?: Record<string, string>) => {
      const qs = new URLSearchParams({ type, ...params });
      const res = await fetch(`/api/commissioner/analytics?${qs}`);
      if (!res.ok) throw new Error(`Failed to fetch ${type}`);
      return res.json();
   };

   useEffect(() => {
      let cancelled = false;
      async function load() {
         setLoading(true);
         try {
            switch (activeTab) {
               case 'Programme Impact': {
                  const [impact, longitudinal, pipeline] = await Promise.all([
                     fetchData('impact-summary'),
                     fetchData('longitudinal'),
                     fetchData('pipeline')
                  ]);
                  if (!cancelled) {
                     setImpactData(impact);
                     setLongitudinalData(longitudinal);
                     setPipelineData(pipeline);
                  }
                  break;
               }
               case 'Cohort Tracking': {
                  const cohort = await fetchData('cohort', selectedCohort ? { quarter: selectedCohort } : undefined);
                  if (!cancelled) {
                     setCohortData(cohort);
                     if (!selectedCohort && cohort.availableQuarters?.length > 0) {
                        setSelectedCohort(cohort.availableQuarters[cohort.availableQuarters.length - 1]);
                     }
                  }
                  break;
               }
               case 'Before / After': {
                  const ba = await fetchData('before-after');
                  if (!cancelled) setBeforeAfterData(ba);
                  break;
               }
            }
         } catch (err) {
            console.error('Error loading analytics:', err);
         } finally {
            if (!cancelled) setLoading(false);
         }
      }
      load();
      return () => { cancelled = true; };
   }, [activeTab, selectedCohort]);

   // ═══ DERIVED ═══
   const impactKPIs = impactData ? [
      { id: 'i1', label: 'IDENTIFICATION IMPROVEMENT', value: `${impactData.kpis.identificationImprovement}%`, delta: impactData.kpis.identificationImprovement > 0 ? 1 : 0, trend: [], accent: '#22C55E' },
      { id: 'i2', label: 'SCREENING GROWTH (YoY)', value: `${impactData.kpis.screeningGrowthYoY > 0 ? '+' : ''}${impactData.kpis.screeningGrowthYoY}%`, delta: impactData.kpis.screeningGrowthYoY, trend: [], accent: '#3B82F6' },
      { id: 'i3', label: 'REFERRAL COMPLETION', value: `${impactData.kpis.referralCompletion}%`, delta: 0, trend: [], accent: '#000000' },
      { id: 'i4', label: 'AVG TIME TO INTERVENTION', value: impactData.kpis.avgTimeToIntervention > 0 ? `${impactData.kpis.avgTimeToIntervention} days` : 'N/A', delta: 0, trend: [], accent: '#F59E0B' },
   ] : [];

   const maxPipelineValue = Math.max(1, ...pipelineData.map((p: any) => p.value));

   return (
      <div className="animate-in fade-in duration-700 pb-20">
         {/* HEADER */}
         <div className="flex justify-between items-end mb-8">
            <div>
               <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">Impact Analytics</h1>
               <p className="text-[14px] text-[#888888] font-medium">Measuring longitudinal programme outcomes and effectiveness since launch</p>
            </div>
            <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
                  <Download size={16} /> Impact Report (PDF)
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

         {/* CONTENT: PROGRAMME IMPACT */}
         {activeTab === 'Programme Impact' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {loading ? (
                  <div className="space-y-6">
                     <Skeleton className="h-40" />
                     <div className="flex gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 flex-1" />)}</div>
                     <Skeleton className="h-[420px]" />
                  </div>
               ) : (
                  <>
                     {/* Headline Impact Card */}
                     <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-black" />
                        <div className="flex flex-col gap-4">
                           <h2 className="text-[18px] font-semibold text-black tracking-tight leading-relaxed">
                              <span className="font-black text-[22px]">{(impactData?.headline.riskChildren || 0).toLocaleString()}</span> children identified as High/Critical risk —
                              <span className="font-black text-[22px]"> {(impactData?.headline.referred || 0).toLocaleString()}</span> referred —
                              <span className="font-black text-[22px]"> {(impactData?.headline.intervened || 0).toLocaleString()}</span> received intervention
                              <span className="text-[#888] ml-2">({impactData?.headline.completionRate || 0}% completion rate)</span>
                           </h2>
                           {impactData?.kpis.identificationImprovement > 0 && (
                              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                                 <Zap className="text-green-600" size={20} />
                                 <p className="text-[14px] text-green-900 font-medium leading-relaxed">
                                    Estimated early identification rate improved by <span className="font-black">{impactData.kpis.identificationImprovement}%</span> compared to the pre-programme baseline.
                                 </p>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex flex-nowrap overflow-x-auto gap-4 scrollbar-hide">
                        {impactKPIs.map(kpi => <KPICard key={kpi.id} {...kpi} />)}
                     </div>

                     {/* Longitudinal Chart */}
                     <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-10">
                           <h3 className="text-[16px] font-black uppercase tracking-tight">Early Identification Over Time</h3>
                           <div className="flex gap-6">
                              <div className="flex items-center gap-2">
                                 <div className="w-3 h-3 bg-[#F0F0F0] rounded-sm" />
                                 <span className="text-[11px] font-bold text-[#888] uppercase">Children Registered</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-4 h-[2px] bg-black" />
                                 <span className="text-[11px] font-bold text-black uppercase">High-Risk Rate (per 1k)</span>
                              </div>
                           </div>
                        </div>
                        <div className="h-[380px]">
                           {longitudinalData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                 <AreaChart data={longitudinalData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                                    <XAxis dataKey="q" fontSize={11} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${Math.round(v)}`} />
                                    <YAxis yAxisId="right" orientation="right" fontSize={11} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Area yAxisId="left" type="monotone" dataKey="volume" stroke="none" fill="#F0F0F0" fillOpacity={1} />
                                    <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#000" strokeWidth={3} dot={{ r: 4, fill: '#000' }} />
                                 </AreaChart>
                              </ResponsiveContainer>
                           ) : (
                              <div className="h-full flex items-center justify-center text-[#888] text-[13px]">No longitudinal data yet</div>
                           )}
                        </div>
                     </div>

                     {/* Intervention Pipeline */}
                     <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-10">
                           <div>
                              <h3 className="text-[16px] font-black uppercase tracking-tight">Intervention Pipeline Health</h3>
                              <p className="text-[12px] text-[#888]">Tracking drop-off rates from screening to outcome resolution</p>
                           </div>
                           {pipelineData.some((p: any) => p.drop > 80) && (
                              <div className="flex items-center gap-2">
                                 <AlertTriangle size={16} className="text-red-600" />
                                 <span className="text-[11px] font-black text-red-700 uppercase">High Drop-off Detected</span>
                              </div>
                           )}
                        </div>

                        {pipelineData.length > 0 ? (
                           <div className="space-y-4">
                              {pipelineData.map((item: any, idx: number) => (
                                 <div key={item.stage} className="flex items-center gap-6">
                                    <div className="w-[180px] text-[13px] font-bold text-[#555] uppercase tracking-tight">{item.stage}</div>
                                    <div className="flex-1 h-10 flex items-center relative">
                                       <div
                                          className={`h-full rounded transition-all duration-1000 flex items-center px-4 ${idx > 2 ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}
                                          style={{ width: `${Math.max(2, (item.value / maxPipelineValue) * 100)}%`, minWidth: '40px' }}
                                       >
                                          <span className="text-[11px] font-black">{item.value.toLocaleString()}</span>
                                       </div>
                                       {idx < pipelineData.length - 1 && item.drop > 0 && (
                                          <div className="absolute -bottom-4 left-0 right-0 flex justify-center">
                                             <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${item.drop > 30 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-[#888] border-gray-200'}`}>
                                                {item.drop}% Drop
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="py-12 text-center text-[#888] text-[13px]">No pipeline data — referrals and interventions will appear here once recorded.</div>
                        )}
                     </div>
                  </>
               )}
            </div>
         )}

         {/* CONTENT: COHORT TRACKING */}
         {activeTab === 'Cohort Tracking' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {loading ? (
                  <Skeleton className="h-[600px]" />
               ) : (
                  <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
                     <div className="flex justify-between items-center mb-10">
                        <div>
                           <h3 className="text-[16px] font-black uppercase tracking-tight mb-1">Cohort Analysis</h3>
                           <div className="flex items-center gap-2 text-[13px] text-[#888]">
                              Cohort:
                              <div className="relative">
                                 <select
                                    value={selectedCohort}
                                    onChange={(e) => setSelectedCohort(e.target.value)}
                                    className="appearance-none bg-[#F9F9F9] border border-[#E5E5E5] pl-3 pr-8 py-1 rounded font-bold text-black focus:outline-none cursor-pointer"
                                 >
                                    {(cohortData?.availableQuarters || []).map((q: string) => (
                                       <option key={q} value={q}>{q}</option>
                                    ))}
                                    {(!cohortData?.availableQuarters?.length) && (
                                       <option value="">No cohorts available</option>
                                    )}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-4">
                           <div className="p-3 bg-gray-50 rounded border border-gray-100 flex flex-col items-center min-w-[120px]">
                              <span className="text-[10px] font-bold text-[#888] uppercase">Cohort Size</span>
                              <span className="text-[20px] font-black">{(cohortData?.size || 0).toLocaleString()}</span>
                           </div>
                           <div className="p-3 bg-black text-white rounded flex flex-col items-center min-w-[120px]">
                              <span className="text-[10px] font-bold text-[#888] uppercase">Retention</span>
                              <span className="text-[20px] font-black">{cohortData?.retention || 0}%</span>
                           </div>
                        </div>
                     </div>

                     {/* Outcome Distribution */}
                     {cohortData?.outcomes?.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                           <div>
                              <h4 className="text-[14px] font-black uppercase tracking-widest text-[#AAA] mb-6">Outcome Distribution</h4>
                              <div className="h-[280px]">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                       <Pie data={cohortData.outcomes} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                          {cohortData.outcomes.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                                       </Pie>
                                       <Tooltip />
                                    </PieChart>
                                 </ResponsiveContainer>
                              </div>
                           </div>
                           <div className="space-y-4">
                              {cohortData.outcomes.map((item: any) => (
                                 <div key={item.name} className="flex items-center justify-between p-4 bg-[#FBFBFB] rounded border border-[#F5F5F5]">
                                    <div className="flex items-center gap-3">
                                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                       <span className="text-[13px] font-bold text-[#555]">{item.name}</span>
                                    </div>
                                    <span className="text-[16px] font-black">{item.value}%</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ) : (
                        <div className="py-16 text-center text-[#888] text-[13px]">
                           {cohortData?.size === 0 ? 'No children registered in this cohort period.' : 'No outcome data available yet.'}
                        </div>
                     )}
                  </div>
               )}
            </div>
         )}

         {/* CONTENT: BEFORE / AFTER */}
         {activeTab === 'Before / After' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               {loading ? (
                  <Skeleton className="h-[500px]" />
               ) : (
                  <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
                     <div className="p-8 border-b border-[#F5F5F5] bg-black text-white flex justify-between items-center">
                        <div>
                           <h3 className="text-[20px] font-black uppercase tracking-tight mb-1">Pre vs Post Programme Benchmark</h3>
                           <p className="text-[13px] text-[#888]">Comparative analysis of statewide ICDS metrics (ICDS Baseline vs Jiveesha Platform)</p>
                        </div>
                        <Target className="opacity-20" size={40} />
                     </div>

                     <div className="grid grid-cols-5 bg-[#F9F9F9] text-[11px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                        <div className="col-span-2 px-8 py-4">Operational Metric</div>
                        <div className="px-8 py-4">Before Jiveesha</div>
                        <div className="px-8 py-4">After Jiveesha</div>
                        <div className="px-8 py-4 text-center">Impact Delta</div>
                     </div>

                     <div className="divide-y divide-[#F5F5F5]">
                        {beforeAfterData.length > 0 ? (
                           beforeAfterData.map((item: any, i: number) => (
                              <div key={i} className="grid grid-cols-5 items-center hover:bg-[#FBFBFB] transition-colors group">
                                 <div className="col-span-2 px-8 py-6">
                                    <span className="text-[15px] font-black text-black">{item.label}</span>
                                 </div>
                                 <div className="px-8 py-6">
                                    <span className="text-[14px] text-[#888] font-bold">{item.before}</span>
                                 </div>
                                 <div className="px-8 py-6">
                                    <span className="text-[16px] text-black font-black">{item.after}</span>
                                 </div>
                                 <div className="px-8 py-6 flex justify-center">
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-[12px] ${item.positive ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                                       <TrendingUp size={14} /> {item.delta}
                                    </div>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="px-8 py-12 text-center text-[#888] text-[13px]">No comparison data available</div>
                        )}
                     </div>

                     <div className="p-8 bg-[#F9F9F9] flex justify-between items-start">
                        <p className="text-[11px] text-[#AAA] font-medium max-w-lg leading-relaxed italic">
                           Note: Baseline data (Before Jiveesha) is extracted from historical ICDS records prior to programme launch. Jiveesha metrics are real-time and platform-verified.
                        </p>
                        <button className="flex items-center gap-2 text-black font-black text-[12px] uppercase tracking-widest hover:gap-3 transition-all">
                           Full Baseline Study <ArrowRight size={16} />
                        </button>
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export default ImpactAnalyticsView;
