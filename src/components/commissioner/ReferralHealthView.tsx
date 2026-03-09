'use client'

import React, { useState, useEffect } from 'react';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   LineChart, Line, Legend, Cell, ComposedChart
} from 'recharts';
import {
   ArrowRight, Clock, MapPin, Phone, MessageSquare, AlertTriangle,
   CheckCircle2, Building2, Download, Filter, ChevronRight, Search
} from 'lucide-react';
import KPICard from '@/components/commissioner/KPICard';

type FacilityStatus = 'Available' | 'Limited' | 'Capacity' | 'None';

const Skeleton = ({ className = '' }: { className?: string }) => (
   <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
);

const ReferralHealthView: React.FC = () => {
   const [timeFilter, setTimeFilter] = useState('Month');

   // ═══ STATE ═══
   const [loading, setLoading] = useState(true);
   const [kpis, setKpis] = useState<any>(null);
   const [pipeline, setPipeline] = useState<any[]>([]);
   const [specialistData, setSpecialistData] = useState<any[]>([]);
   const [districtData, setDistrictData] = useState<any[]>([]);
   const [trendData, setTrendData] = useState<any[]>([]);
   const [facilityGrid, setFacilityGrid] = useState<any>(null);
   const [overdueData, setOverdueData] = useState<any[]>([]);
   const [searchTerm, setSearchTerm] = useState('');

   const fetchData = async (type: string) => {
      const res = await fetch(`/api/commissioner/referrals?type=${type}`);
      if (!res.ok) throw new Error(`Failed to fetch ${type}`);
      return res.json();
   };

   useEffect(() => {
      let cancelled = false;
      async function load() {
         setLoading(true);
         try {
            const [kpiRes, pipeRes, specRes, distRes, trendRes, gridRes, overdueRes] = await Promise.all([
               fetchData('kpis'),
               fetchData('pipeline'),
               fetchData('by-specialist'),
               fetchData('by-district'),
               fetchData('trends'),
               fetchData('facility-grid'),
               fetchData('overdue'),
            ]);
            if (!cancelled) {
               setKpis(kpiRes);
               setPipeline(pipeRes);
               setSpecialistData(specRes);
               setDistrictData(distRes);
               setTrendData(trendRes);
               setFacilityGrid(gridRes);
               setOverdueData(overdueRes);
            }
         } catch (err) {
            console.error('Error loading referral data:', err);
         } finally {
            if (!cancelled) setLoading(false);
         }
      }
      load();
      return () => { cancelled = true; };
   }, []);

   // ═══ DERIVED ═══
   const referralKPIs = kpis ? [
      { id: 'r1', label: 'TOTAL REFERRALS', value: (kpis.total || 0).toLocaleString(), delta: 0, trend: [], accent: '#000000' },
      { id: 'r2', label: 'ACTIVE (PENDING)', value: (kpis.active || 0).toLocaleString(), delta: 0, trend: [], accent: '#3B82F6' },
      { id: 'r3', label: 'SCHEDULED', value: (kpis.scheduled || 0).toLocaleString(), delta: 0, trend: [], accent: '#22C55E' },
      { id: 'r4', label: 'COMPLETED', value: (kpis.completed || 0).toLocaleString(), delta: 0, trend: [], accent: '#000000' },
      { id: 'r5', label: 'OVERDUE', value: (kpis.overdue || 0).toLocaleString(), delta: 0, trend: [], accent: '#EF4444' },
      { id: 'r6', label: 'AVG WAIT TIME', value: kpis.avgWait > 0 ? `${kpis.avgWait} days` : 'N/A', delta: 0, trend: [], accent: '#F59E0B' },
   ] : [];

   const filteredOverdue = overdueData.filter((r: any) =>
      !searchTerm || r.childName.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const facilityTypes = facilityGrid?.facilityTypes || ['DEIC', 'district_hospital', 'PHC', 'CHC', 'therapy_center', 'private_hospital', 'special_school'];
   const facilityTypeLabels: Record<string, string> = {
      'DEIC': 'DEIC', 'district_hospital': 'Hospital', 'PHC': 'PHC', 'CHC': 'CHC',
      'therapy_center': 'Therapy', 'private_hospital': 'Private', 'special_school': 'Spl. School'
   };

   const getStatusColor = (status: FacilityStatus) => {
      switch (status) {
         case 'Available': return 'bg-green-500';
         case 'Limited': return 'bg-amber-500';
         case 'Capacity': return 'bg-red-500';
         case 'None': return 'bg-gray-200';
         default: return 'bg-gray-100';
      }
   };

   if (loading) {
      return (
         <div className="animate-in fade-in duration-700 pb-20 space-y-8">
            <div className="flex justify-between items-end mb-8">
               <div><Skeleton className="h-10 w-64 mb-2" /><Skeleton className="h-4 w-96" /></div>
            </div>
            <div className="flex gap-4">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 flex-1" />)}</div>
            <Skeleton className="h-40" />
            <div className="grid grid-cols-2 gap-8"><Skeleton className="h-[380px]" /><Skeleton className="h-[380px]" /></div>
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[420px]" />
         </div>
      );
   }

   return (
      <div className="animate-in fade-in duration-700 pb-20">
         {/* HEADER */}
         <div className="flex justify-between items-end mb-8">
            <div>
               <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">Referral Health</h1>
               <p className="text-[14px] text-[#888888] font-medium">Statewide referral pipeline efficiency and diagnostic facility capacity</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="bg-white border border-[#E5E5E5] rounded p-1 flex">
                  {['Week', 'Month', 'Quarter', 'Year'].map((f) => (
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
                  <Download size={16} /> Data Export
               </button>
            </div>
         </div>

         {/* KPI ROW */}
         <div className="flex flex-nowrap overflow-x-auto gap-4 mb-10 pb-2 scrollbar-hide">
            {referralKPIs.map(kpi => <KPICard key={kpi.id} {...kpi} />)}
         </div>

         {/* PIPELINE FUNNEL */}
         <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm mb-8">
            <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">Statewide Referral Pipeline</h3>
            {pipeline.length > 0 ? (
               <>
                  <div className="flex items-center">
                     {pipeline.map((step: any, i: number) => (
                        <React.Fragment key={step.label}>
                           <div className="flex-1 group">
                              <div className="relative h-16 bg-[#F9F9F9] border border-[#EEE] rounded-lg flex flex-col items-center justify-center transition-all group-hover:bg-black group-hover:text-white group-hover:scale-105 z-10">
                                 <span className="text-[10px] font-black uppercase opacity-60 group-hover:opacity-100">{step.label}</span>
                                 <span className="text-[22px] font-black">{step.value.toLocaleString()}</span>
                                 {step.time && (
                                    <div className="absolute -bottom-6 flex flex-col items-center">
                                       <span className="text-[10px] font-bold text-[#888]">{step.time}</span>
                                    </div>
                                 )}
                              </div>
                           </div>
                           {i < pipeline.length - 1 && (
                              <div className="w-12 h-[2px] bg-[#EEE] flex items-center justify-center relative">
                                 <div className="absolute top-1/2 -translate-y-1/2 text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded-full z-20">
                                    {step.pct}
                                 </div>
                                 <ArrowRight size={14} className="text-[#CCC] ml-2" />
                              </div>
                           )}
                        </React.Fragment>
                     ))}
                  </div>
                  <div className="mt-12 flex justify-center">
                     <div className="flex items-center gap-8 bg-black text-white px-8 py-3 rounded-full text-[12px] font-black uppercase tracking-widest shadow-2xl">
                        <span className="opacity-50">Operational Goal:</span>
                        <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> 75% Completion</span>
                        <span className="w-[1px] h-4 bg-white/20" />
                        <span className="flex items-center gap-2"><Clock size={16} className="text-amber-500" /> &lt;7 Day Wait</span>
                     </div>
                  </div>
               </>
            ) : (
               <div className="py-12 text-center text-[#888] text-[13px]">No referral pipeline data yet — referrals will appear here once recorded.</div>
            )}
         </div>

         {/* CHARTS ROW */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
               <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">Referrals by Specialist Type</h3>
               <div className="h-[340px]">
                  {specialistData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={specialistData} layout="vertical">
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={11} width={80} />
                           <Tooltip />
                           <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 20, textTransform: 'uppercase', fontWeight: 'bold' }} />
                           <Bar dataKey="completed" stackId="a" fill="#000" radius={[0, 0, 0, 0]} />
                           <Bar dataKey="active" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                           <Bar dataKey="overdue" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="h-full flex items-center justify-center text-[#888] text-[13px]">No specialist referral data yet</div>
                  )}
               </div>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
               <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">Referrals by District (Status Breakdown)</h3>
               <div className="h-[340px]">
                  {districtData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={districtData} layout="vertical">
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={11} width={80} />
                           <Tooltip />
                           <Bar dataKey="completed" name="Completed" stackId="b" fill="#000" />
                           <Bar dataKey="active" name="Active" stackId="b" fill="#CCC" radius={[0, 4, 4, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="h-full flex items-center justify-center text-[#888] text-[13px]">No district referral data yet</div>
                  )}
               </div>
            </div>
         </div>

         {/* FACILITY STATUS GRID */}
         <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="p-8 border-b border-[#F5F5F5] flex justify-between items-center bg-black text-white">
               <div>
                  <h3 className="text-[20px] font-black uppercase tracking-tight mb-1">Facility Status Across State</h3>
                  <p className="text-[13px] opacity-70">Capacity monitoring of referral nodes. Red circles indicate critical bottlenecks.</p>
               </div>
               <div className="flex gap-6">
                  <div className="flex flex-col items-center">
                     <span className="text-[24px] font-black">{facilityGrid?.totalNodes || 0}</span>
                     <span className="text-[9px] font-black uppercase opacity-60">Total Nodes</span>
                  </div>
                  <div className="w-[1px] h-10 bg-white/20" />
                  <div className="flex flex-col items-center text-red-400">
                     <span className="text-[24px] font-black">{facilityGrid?.atCapacity || 0}</span>
                     <span className="text-[9px] font-black uppercase">At Capacity</span>
                  </div>
               </div>
            </div>

            {facilityGrid?.grid?.length > 0 ? (
               <>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                              <th className="px-8 py-4 sticky left-0 bg-[#F9F9F9] z-10 border-r border-[#EEE]">District</th>
                              {facilityTypes.map((type: string) => (
                                 <th key={type} className="px-4 py-4 text-center">{facilityTypeLabels[type] || type}</th>
                              ))}
                           </tr>
                        </thead>
                        <tbody className="text-[13px] divide-y divide-[#F5F5F5]">
                           {facilityGrid.grid.map((row: any) => (
                              <tr key={row.districtId} className="hover:bg-[#FBFBFB] transition-colors group">
                                 <td className="px-8 py-4 font-bold text-black sticky left-0 bg-white group-hover:bg-[#FBFBFB] z-10 border-r border-[#F5F5F5]">{row.districtName}</td>
                                 {facilityTypes.map((type: string) => {
                                    const status = row.statuses[type] || 'None';
                                    return (
                                       <td key={type} className="px-4 py-4 text-center group/cell relative">
                                          <div className="flex flex-col items-center justify-center">
                                             {status === 'None' ? (
                                                <span className="text-[10px] font-bold text-[#DDD] uppercase italic">None</span>
                                             ) : (
                                                <div className={`w-3 h-3 rounded-full ${getStatusColor(status as FacilityStatus)} shadow-sm transition-transform hover:scale-150 cursor-pointer`} />
                                             )}
                                          </div>
                                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 hidden group-hover/cell:block z-50 pointer-events-none">
                                             <div className="bg-black text-white p-2 rounded text-[10px] whitespace-nowrap shadow-xl">
                                                <span className="font-bold">{facilityTypeLabels[type] || type}</span> • {status}
                                             </div>
                                          </div>
                                       </td>
                                    );
                                 })}
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  <div className="p-6 bg-[#F9F9F9] border-t border-[#EEE] flex justify-between items-center">
                     <div className="flex gap-6">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /><span className="text-[10px] font-black text-[#888] uppercase">Available</span></div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-[10px] font-black text-[#888] uppercase">Limited Capacity</span></div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-[10px] font-black text-[#888] uppercase">At Capacity</span></div>
                        <div className="flex items-center gap-2"><span className="text-[10px] font-black text-[#DDD] uppercase italic">None</span><span className="text-[10px] font-black text-[#888] uppercase">Service Desert</span></div>
                     </div>
                     <button className="flex items-center gap-2 text-black font-black text-[12px] uppercase tracking-widest hover:gap-4 transition-all">
                        Specialist Desert Map <ChevronRight size={18} />
                     </button>
                  </div>
               </>
            ) : (
               <div className="py-12 text-center text-[#888] text-[13px]">No facility directory data — add referral facilities to see capacity status.</div>
            )}
         </div>

         {/* OVERDUE TABLE */}
         <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center">
               <div>
                  <h3 className="text-[16px] font-black uppercase tracking-tight">Critical Overdue Referrals</h3>
                  <p className="text-[12px] text-[#888]">Top 50 high-priority cases exceeding state protocol limits</p>
               </div>
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
                  <input
                     type="text"
                     placeholder="Search child / ID..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-9 pr-4 py-2 bg-[#F9F9F9] border border-[#E5E5E5] rounded text-[12px] w-64 outline-none focus:ring-1 focus:ring-black"
                  />
               </div>
            </div>
            <div className="overflow-x-auto">
               {filteredOverdue.length > 0 ? (
                  <table className="w-full text-left">
                     <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                        <tr>
                           <th className="px-8 py-4">Ref ID</th>
                           <th className="px-4 py-4">Child Name</th>
                           <th className="px-4 py-4">District</th>
                           <th className="px-4 py-4">Type</th>
                           <th className="px-4 py-4 text-center">Days Overdue</th>
                           <th className="px-4 py-4 text-center">Status</th>
                           <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="text-[13px] divide-y divide-[#F5F5F5]">
                        {filteredOverdue.map((ref: any) => (
                           <tr key={ref.id} className="hover:bg-[#FBFBFB] transition-colors group">
                              <td className="px-8 py-4 font-bold text-[#888]">REF-{ref.id}</td>
                              <td className="px-4 py-4 font-black text-black">{ref.childName}</td>
                              <td className="px-4 py-4 font-bold text-[#555]">{ref.district}</td>
                              <td className="px-4 py-4">
                                 <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-bold text-[#555] uppercase">{ref.type}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                 <div className="flex flex-col items-center">
                                    <span className="text-red-600 font-black text-[15px]">{ref.daysOverdue}d</span>
                                    <span className="text-[9px] font-black text-red-600/50 uppercase tracking-widest">Protocol limit: 7d</span>
                                 </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                 <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${ref.status === 'Active' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                    {ref.status}
                                 </span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 bg-black text-white rounded hover:bg-zinc-800 transition-all"><Phone size={14} /></button>
                                    <button className="p-2 bg-white border border-[#E5E5E5] rounded hover:bg-gray-50 transition-all"><ArrowRight size={14} /></button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               ) : (
                  <div className="py-12 text-center text-[#888] text-[13px]">
                     {overdueData.length === 0 ? '✅ No overdue referrals — all within protocol limits.' : 'No results matching your search.'}
                  </div>
               )}
            </div>
         </div>

         {/* MONTHLY TREND */}
         <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-[16px] font-black uppercase tracking-tight">Referral Intake vs Resolution</h3>
                  <p className="text-[12px] text-[#888]">12-month longitudinal tracking of referral conversion efficiency</p>
               </div>
               <div className="flex gap-6">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-black rounded-sm" /><span className="text-[10px] font-black text-[#888] uppercase">Generated</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded-sm" /><span className="text-[10px] font-black text-[#888] uppercase">Completed</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-[2px] bg-blue-500" /><span className="text-[10px] font-black text-blue-500 uppercase">Rate %</span></div>
               </div>
            </div>
            <div className="h-[380px]">
               {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                        <XAxis dataKey="month" fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar yAxisId="left" dataKey="generated" fill="#000" barSize={30} />
                        <Bar yAxisId="left" dataKey="completed" fill="#F0F0F0" barSize={30} />
                        <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} />
                     </ComposedChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-full flex items-center justify-center text-[#888] text-[13px]">No trend data yet — referral activity will appear here over time.</div>
               )}
            </div>
         </div>
      </div>
   );
};

export default ReferralHealthView;
