'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
   Users, UserCheck, Shield, GraduationCap, Search,
   ArrowUpRight, ArrowDownRight, ChevronRight, Info,
   AlertTriangle, Filter, Download, Calendar
} from 'lucide-react';
import KPICard from '@/components/commissioner/KPICard';
import { useLanguage } from '@/lib/commissioner/LanguageContext';

const Skeleton = ({ className = '' }: { className?: string }) => (
   <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

const WorkforceOverview: React.FC = () => {
   // ═══ STATE ═══
   const router = useRouter();
   const { t } = useLanguage();
   const [loading, setLoading] = useState(true);
   const [kpis, setKpis] = useState<any>(null);
   const [districtData, setDistrictData] = useState<any[]>([]);
   const [heatmapData, setHeatmapData] = useState<any>(null);
   const [activityData, setActivityData] = useState<any>(null);
   const [vacancyData, setVacancyData] = useState<any>(null);
   const [searchTerm, setSearchTerm] = useState('');

   const fetchData = async (type: string) => {
      const res = await fetch(`/api/commissioner/workforce?type=${type}`);
      if (!res.ok) throw new Error(`Failed to fetch ${type}`);
      return res.json();
   };

   useEffect(() => {
      let cancelled = false;
      async function load() {
         setLoading(true);
         try {
            const [kpiRes, distRes, heatRes, actRes, vacRes] = await Promise.all([
               fetchData('kpis'),
               fetchData('district-table'),
               fetchData('training-heatmap'),
               fetchData('activity'),
               fetchData('vacancy'),
            ]);
            if (!cancelled) {
               setKpis(kpiRes);
               setDistrictData(distRes);
               setHeatmapData(heatRes);
               setActivityData(actRes);
               setVacancyData(vacRes);
            }
         } catch (err) {
            console.error('Error loading workforce data:', err);
         } finally {
            if (!cancelled) setLoading(false);
         }
      }
      load();
      return () => { cancelled = true; };
   }, []);

   // ═══ DERIVED ═══
   const workforceKPIs = kpis ? [
      { id: 'w1', label: t('workforce.kpi.totalAWWs'), value: (kpis.totalAwws || 0).toLocaleString(), delta: 0, trend: [], accent: '#000000' },
      { id: 'w2', label: t('workforce.kpi.screeners'), value: (kpis.supervisors || 0).toLocaleString(), delta: 0, trend: [], accent: '#3B82F6' },
      { id: 'w3', label: t('workforce.kpi.cdpos'), value: (kpis.cdpos || 0).toLocaleString(), delta: 0, trend: [], accent: '#000000' },
      { id: 'w4', label: t('workforce.kpi.filled'), value: `${kpis.positionsFilled || 0}%`, delta: 0, trend: [], accent: '#22C55E' },
      { id: 'w5', label: t('workforce.kpi.training'), value: `${kpis.trainingCompliance || 0}%`, delta: 0, trend: [], accent: '#F59E0B' },
      { id: 'w6', label: t('workforce.kpi.ratio'), value: kpis.avgChildRatio > 0 ? `1:${kpis.avgChildRatio}` : 'N/A', delta: 0, trend: [], accent: '#6B7280' },
   ] : [];

   const filteredDistricts = districtData.filter((d: any) =>
      !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const getComplianceColor = (pct: number) => {
      if (pct > 90) return 'bg-green-500';
      if (pct > 70) return 'bg-amber-500';
      return 'bg-red-500';
   };

   const getIntensityColor = (intensity: number) => {
      if (intensity > 0.8) return 'bg-black';
      if (intensity > 0.5) return 'bg-zinc-600';
      if (intensity > 0.2) return 'bg-zinc-300';
      return 'bg-zinc-100';
   };

   if (loading) {
      return (
         <div className="animate-in fade-in duration-700 pb-20 space-y-8">
            <div className="flex justify-between items-end mb-8">
               <div><Skeleton className="h-10 w-64 mb-2" /><Skeleton className="h-4 w-96" /></div>
            </div>
            <div className="flex gap-4">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 flex-1" />)}</div>
            <Skeleton className="h-[400px]" />
            <div className="grid grid-cols-2 gap-8"><Skeleton className="h-[320px]" /><Skeleton className="h-[320px]" /></div>
            <Skeleton className="h-[200px]" />
         </div>
      );
   }

   return (
      <div className="animate-in fade-in duration-700 pb-20">
         {/* HEADER */}
         <div className="flex justify-between items-end mb-8">
            <div>
               <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">{t('workforce.title')}</h1>
               <p className="text-[14px] text-[#888888] font-medium">{t('workforce.subtitle')}</p>
            </div>
            <div className="flex gap-3">
               <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
                  <Download size={16} /> {t('workforce.hrRoster')}
               </button>
            </div>
         </div>

         {/* KPI ROW */}
         <div className="flex flex-nowrap overflow-x-auto gap-4 mb-10 pb-2 scrollbar-hide">
            {workforceKPIs.map(kpi => <KPICard key={kpi.id} {...kpi} />)}
         </div>

         {/* WORKFORCE TABLE */}
         <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center bg-[#F9F9F9]/50">
               <div>
                  <h3 className="text-[16px] font-black uppercase tracking-tight">{t('workforce.byDistrict')}</h3>
                  <p className="text-[12px] text-[#888]">{t('workforce.metricsDesc')}</p>
               </div>
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
                  <input
                     type="text"
                     placeholder={t('workforce.searchDist')}
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-9 pr-4 py-2 bg-white border border-[#E5E5E5] rounded text-[12px] w-64 outline-none focus:ring-1 focus:ring-black"
                  />
               </div>
            </div>
            <div className="overflow-x-auto">
               {filteredDistricts.length > 0 ? (
                  <table className="w-full text-left">
                     <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                        <tr>
                           <th className="px-8 py-4">{t('table.district')}</th>
                           <th className="px-4 py-4 text-center">{t('table.awwsFilled')}</th>
                           <th className="px-4 py-4 text-center">{t('table.screeners')}</th>
                           <th className="px-4 py-4 text-center">{t('table.cdpos')}</th>
                           <th className="px-4 py-4 text-center">{t('table.vacancyPct')}</th>
                           <th className="px-4 py-4 text-center">{t('table.trainingPct')}</th>
                           <th className="px-4 py-4 text-center">{t('table.awwRatio')}</th>
                           <th className="px-8 py-4 text-right">{t('table.compScore')}</th>
                        </tr>
                     </thead>
                     <tbody className="text-[13px] divide-y divide-[#F5F5F5]">
                        {filteredDistricts.map((d: any) => (
                           <tr key={d.id} onClick={() => router.push(`/commissioner/workforce/${d.id}`)} className="hover:bg-[#FBFBFB] transition-colors group cursor-pointer">
                              <td className="px-8 py-4">
                                 <div className="flex items-center gap-2">
                                    <span className="font-bold text-black">{d.name}</span>
                                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#AAA]" />
                                 </div>
                              </td>
                              <td className="px-4 py-4 text-center font-medium">
                                 <span className="text-black font-bold">{d.awwsFilled}</span> / <span className="text-[#888]">{d.awwsTarget}</span>
                              </td>
                              <td className="px-4 py-4 text-center font-medium">
                                 <span className="text-black font-bold">{d.screenersFilled}</span> / <span className="text-[#888]">{d.screenersTarget}</span>
                              </td>
                              <td className="px-4 py-4 text-center font-bold text-black">{d.cdposCount}</td>
                              <td className={`px-4 py-4 text-center font-black ${d.vacancyRate > 10 ? 'text-red-600' : 'text-black'}`}>
                                 {d.vacancyRate}%
                              </td>
                              <td className={`px-4 py-4 text-center font-black ${d.trainingCompliance < 80 ? 'text-amber-600' : 'text-black'}`}>
                                 {d.trainingCompliance}%
                              </td>
                              <td className="px-4 py-4 text-center">
                                 <div className="flex flex-col items-center">
                                    <span className={`font-black ${d.childToAwwRatio > 45 ? 'text-red-600' : 'text-black'}`}>1:{d.childToAwwRatio}</span>
                                    <span className="text-[9px] font-black text-[#CCC] uppercase tracking-widest">Bench: 1:40</span>
                                 </div>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                                       <div className={`h-full rounded-full ${d.complianceScore > 85 ? 'bg-green-500' : 'bg-black'}`} style={{ width: `${d.complianceScore}%` }} />
                                    </div>
                                    <span className="font-black w-8">{d.complianceScore}</span>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               ) : (
                  <div className="py-12 text-center text-[#888] text-[13px]">
                     {districtData.length === 0 ? t('workforce.noData') : t('workforce.noSearch')}
                  </div>
               )}
            </div>
            <div className="p-6 bg-[#F9F9F9] border-t border-[#EEE] flex justify-between items-center">
               <div className="flex gap-6">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-[10px] font-black text-[#888] uppercase tracking-widest">{t('workforce.highVacancy')}</span></div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-[10px] font-black text-[#888] uppercase tracking-widest">{t('workforce.trainingLag')}</span></div>
               </div>
               <button className="text-[12px] font-black text-black uppercase tracking-widest hover:gap-2 transition-all flex items-center">
                  {t('workforce.viewAll')} {districtData.length} {t('workforce.districts')} <ChevronRight size={16} />
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* TRAINING HEATMAP CARD */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
               <div className="flex justify-between items-center mb-8">
                  <div>
                     <h3 className="text-[16px] font-black uppercase tracking-tight">{t('workforce.trainingHeatmap')}</h3>
                     <p className="text-[12px] text-[#888]">{t('workforce.monthlySession')}</p>
                  </div>
                  <div className="flex gap-2">
                     <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm" /><span className="text-[9px] font-bold text-[#888]">90%+</span></div>
                     <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-sm" /><span className="text-[9px] font-bold text-[#888]">70-90%</span></div>
                     <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm" /><span className="text-[9px] font-bold text-[#888]">&lt;70%</span></div>
                  </div>
               </div>
               {heatmapData?.data?.length > 0 ? (
                  <div className="space-y-1">
                     <div className="grid grid-cols-7 gap-1 mb-2">
                        <div className="col-span-1" />
                        {(heatmapData.monthLabels || []).map((m: string) => (
                           <div key={m} className="text-[10px] font-black text-[#AAA] uppercase text-center">{m}</div>
                        ))}
                     </div>
                     {heatmapData.data.map((row: any) => (
                        <div key={row.district} className="grid grid-cols-7 gap-1 h-8">
                           <div className="col-span-1 flex items-center text-[11px] font-bold text-[#555] truncate pr-2">{row.district}</div>
                           {row.months.map((val: number, idx: number) => (
                              <div
                                 key={idx}
                                 className={`rounded-sm transition-all hover:scale-105 hover:z-10 group relative ${getComplianceColor(val)}`}
                              >
                                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[9px] font-black rounded-sm transition-opacity">
                                    {val}%
                                 </div>
                              </div>
                           ))}
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="py-12 text-center text-[#888] text-[13px]">No training data available yet.</div>
               )}
            </div>

            {/* ACTIVITY DISTRIBUTION */}
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
               <div className="flex justify-between items-center mb-8">
                  <div>
                     <h3 className="text-[16px] font-black uppercase tracking-tight">{t('workforce.activityFreq')}</h3>
                     <p className="text-[12px] text-[#888]">{t('workforce.activityDesc')}</p>
                  </div>
                  <Calendar size={20} className="text-[#DDD]" />
               </div>

               <div className="flex flex-col gap-1">
                  <div className="grid grid-cols-12 gap-1 h-20">
                     {(activityData?.intensities || new Array(84).fill(0)).map((intensity: number, i: number) => (
                        <div key={i} className={`rounded-sm ${getIntensityColor(intensity)} transition-all hover:ring-1 hover:ring-black cursor-help`} />
                     ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-[#AAA] uppercase tracking-widest mt-2 px-1">
                     <span>{t('workforce.12Weeks')}</span>
                     <span>{t('workforce.today')}</span>
                  </div>
               </div>

               <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F9F9F9] rounded-lg border border-[#EEE]">
                     <span className="text-[10px] font-bold text-[#888] uppercase block mb-1">{t('workforce.peakDay')}</span>
                     <span className="text-[16px] font-black">{activityData?.peakDay || 'N/A'}</span>
                  </div>
                  <div className="p-4 bg-[#F9F9F9] rounded-lg border border-[#EEE]">
                     <span className="text-[10px] font-bold text-[#888] uppercase block mb-1">{t('workforce.avgSessions')}</span>
                     <span className="text-[16px] font-black">{activityData?.avgSessionsPerWeek || 0} / {t('workforce.week')}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* VACANCY MAP CARD */}
         <div className="mt-8 bg-black text-white rounded-xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <AlertTriangle size={20} />
                     </div>
                     <h3 className="text-[20px] font-black uppercase tracking-tight">{t('workforce.vacancyRisk')}</h3>
                  </div>
                  <p className="text-[15px] text-zinc-400 leading-relaxed mb-8 max-w-xl">
                     {t('workforce.vacancyDesc')} <span className="text-red-500 font-bold">{vacancyData?.coverageLoss || 0}%</span>. {t('workforce.priorityRecruit')} {vacancyData?.topVacancyDistricts?.map((d: any) => d.name).join(' and ') || 'N/A'} zones.
                  </p>
                  <div className="flex gap-6">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#666] uppercase">{t('workforce.openPos')}</span>
                        <span className="text-[24px] font-black text-red-500">{vacancyData?.openPositions || 0}</span>
                     </div>
                     <div className="w-[1px] h-10 bg-zinc-800" />
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#666] uppercase">{t('workforce.estLoss')}</span>
                        <span className="text-[24px] font-black">{vacancyData?.coverageLoss || 0}%</span>
                     </div>
                  </div>
               </div>
               <div className="shrink-0 w-64 h-64 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                  <svg viewBox="0 0 400 400" className="w-full h-full">
                     <path d="M 50 200 Q 100 50 350 20 Q 380 150 200 380 Q 50 350 50 200" fill="none" stroke="#333" strokeWidth="2" />
                     {vacancyData?.topVacancyDistricts?.map((d: any, i: number) => (
                        <React.Fragment key={d.name}>
                           <circle cx={i === 0 ? 65 : 155} cy={i === 0 ? 235 : 225} r={30 + d.vacancy} fill="#EF4444" fillOpacity={0.4 + i * 0.2} />
                           <text x={i === 0 ? 65 : 155} y={i === 0 ? 235 : 225} textAnchor="middle" fill="white" className="text-[10px] font-black">{d.name.toUpperCase()}</text>
                        </React.Fragment>
                     ))}
                  </svg>
               </div>
            </div>
            <button className="absolute bottom-8 right-8 bg-white text-black px-6 py-2 rounded font-black text-[12px] uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95">
               {t('workforce.openDash')}
            </button>
         </div>
      </div>
   );
};

export default WorkforceOverview;
