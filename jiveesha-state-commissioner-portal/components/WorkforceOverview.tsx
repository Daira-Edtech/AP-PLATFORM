
import React from 'react';
import { 
  Users, UserCheck, Shield, GraduationCap, Search, 
  ArrowUpRight, ArrowDownRight, ChevronRight, Info,
  AlertTriangle, Filter, Download, Calendar
} from 'lucide-react';
import { 
  WORKFORCE_DISTRICT_DATA, 
  TRAINING_HEATMAP_DATA 
} from '../constants';
import KPICard from './KPICard';

const WorkforceOverview: React.FC = () => {
  const workforceKPIs = [
    { id: 'w1', label: 'TOTAL AWWS', value: '8,500', delta: 0, trend: [8400, 8450, 8500, 8500], accent: '#000000' },
    { id: 'w2', label: 'MANDAL SCREENERS', value: '420', delta: 5, trend: [400, 410, 415, 420], accent: '#3B82F6' },
    { id: 'w3', label: 'CDPOs / DPOs', value: '81', delta: 0, trend: [81, 81, 81, 81], accent: '#000000' },
    { id: 'w4', label: 'POSITIONS FILLED', value: '94%', delta: 2, trend: [91, 92, 93, 94], accent: '#22C55E' },
    { id: 'w5', label: 'TRAINING COMPLIANCE', value: '78%', delta: -4, trend: [82, 80, 79, 78], accent: '#F59E0B' },
    { id: 'w6', label: 'AVG AWW:CHILD', value: '1:44', delta: 0, trend: [45, 44, 44, 44], accent: '#6B7280' },
  ];

  const getComplianceColor = (pct: number) => {
    if (pct > 90) return 'bg-green-500';
    if (pct > 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">Workforce Overview</h1>
          <p className="text-[14px] text-[#888888] font-medium">Statewide Human Resource Health & Operational Capacity</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
            <Download size={16} /> HR Roster
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
            <h3 className="text-[16px] font-black uppercase tracking-tight">Workforce by District</h3>
            <p className="text-[12px] text-[#888]">Comprehensive headcount and compliance metrics</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
            <input type="text" placeholder="Search districts..." className="pl-9 pr-4 py-2 bg-white border border-[#E5E5E5] rounded text-[12px] w-64 outline-none focus:ring-1 focus:ring-black" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
              <tr>
                <th className="px-8 py-4">District</th>
                <th className="px-4 py-4 text-center">AWWs (Filled/Target)</th>
                <th className="px-4 py-4 text-center">Screeners</th>
                <th className="px-4 py-4 text-center">CDPOs</th>
                <th className="px-4 py-4 text-center">Vacancy %</th>
                <th className="px-4 py-4 text-center">Training %</th>
                <th className="px-4 py-4 text-center">AWW:Child Ratio</th>
                <th className="px-8 py-4 text-right">Comp. Score</th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-[#F5F5F5]">
              {WORKFORCE_DISTRICT_DATA.map(d => (
                <tr key={d.id} className="hover:bg-[#FBFBFB] transition-colors group cursor-pointer">
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
        </div>
        <div className="p-6 bg-[#F9F9F9] border-t border-[#EEE] flex justify-between items-center">
           <div className="flex gap-6">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-[10px] font-black text-[#888] uppercase tracking-widest">High Vacancy (&gt;10%)</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-[10px] font-black text-[#888] uppercase tracking-widest">Training Lag (&lt;80%)</span></div>
           </div>
           <button className="text-[12px] font-black text-black uppercase tracking-widest hover:gap-2 transition-all flex items-center">
              View All 13 Districts <ChevronRight size={16} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TRAINING HEATMAP CARD */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h3 className="text-[16px] font-black uppercase tracking-tight">Training Compliance Heatmap</h3>
                 <p className="text-[12px] text-[#888]">Monthly curriculum completion by district</p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm" /><span className="text-[9px] font-bold text-[#888]">90%+</span></div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-sm" /><span className="text-[9px] font-bold text-[#888]">70-90%</span></div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm" /><span className="text-[9px] font-bold text-[#888]">&lt;70%</span></div>
              </div>
           </div>
           <div className="space-y-1">
              <div className="grid grid-cols-7 gap-1 mb-2">
                 <div className="col-span-1" />
                 {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                   <div key={m} className="text-[10px] font-black text-[#AAA] uppercase text-center">{m}</div>
                 ))}
              </div>
              {TRAINING_HEATMAP_DATA.map(row => (
                <div key={row.district} className="grid grid-cols-7 gap-1 h-8">
                   <div className="col-span-1 flex items-center text-[11px] font-bold text-[#555] truncate pr-2">{row.district}</div>
                   {row.months.map((val, idx) => (
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
        </div>

        {/* ACTIVITY DISTRIBUTION */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h3 className="text-[16px] font-black uppercase tracking-tight">Workforce Activity Frequency</h3>
                 <p className="text-[12px] text-[#888]">Aggregated statewide screening frequency (Past 12 weeks)</p>
              </div>
              <Calendar size={20} className="text-[#DDD]" />
           </div>
           
           <div className="flex flex-col gap-1">
              <div className="grid grid-cols-12 gap-1 h-20">
                 {Array.from({ length: 84 }).map((_, i) => {
                    const intensity = Math.random();
                    const color = intensity > 0.8 ? 'bg-black' : intensity > 0.5 ? 'bg-zinc-600' : intensity > 0.2 ? 'bg-zinc-300' : 'bg-zinc-100';
                    return <div key={i} className={`rounded-sm ${color} transition-all hover:ring-1 hover:ring-black cursor-help`} />;
                 })}
              </div>
              <div className="flex justify-between text-[10px] font-black text-[#AAA] uppercase tracking-widest mt-2 px-1">
                 <span>12 Weeks Ago</span>
                 <span>Today</span>
              </div>
           </div>

           <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#F9F9F9] rounded-lg border border-[#EEE]">
                 <span className="text-[10px] font-bold text-[#888] uppercase block mb-1">Peak Activity Day</span>
                 <span className="text-[16px] font-black">Wednesday</span>
              </div>
              <div className="p-4 bg-[#F9F9F9] rounded-lg border border-[#EEE]">
                 <span className="text-[10px] font-bold text-[#888] uppercase block mb-1">Avg Sessions / AWW</span>
                 <span className="text-[16px] font-black">4.2 / week</span>
              </div>
           </div>
        </div>
      </div>

      {/* VACANCY MAP CARD - SIMPLIFIED REUSE OF MAP PATTERN */}
      <div className="mt-8 bg-black text-white rounded-xl p-8 shadow-2xl relative overflow-hidden group">
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
            <div className="flex-1">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                     <AlertTriangle size={20} />
                  </div>
                  <h3 className="text-[20px] font-black uppercase tracking-tight">Vacancy Risk Mapping</h3>
               </div>
               <p className="text-[15px] text-zinc-400 leading-relaxed mb-8 max-w-xl">
                  Strategic vacancy tracking identifies 3 high-risk corridors where recruitment lag is impacting screening coverage by up to <span className="text-red-500 font-bold">18%</span>. Priority recruitment directive recommended for Kurnool and Guntur zones.
               </p>
               <div className="flex gap-6">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-[#666] uppercase">Open Positions</span>
                     <span className="text-[24px] font-black text-red-500">510</span>
                  </div>
                  <div className="w-[1px] h-10 bg-zinc-800" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-[#666] uppercase">Est. Coverage Loss</span>
                     <span className="text-[24px] font-black">12.4%</span>
                  </div>
               </div>
            </div>
            <div className="shrink-0 w-64 h-64 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
               <svg viewBox="0 0 400 400" className="w-full h-full">
                  <path d="M 50 200 Q 100 50 350 20 Q 380 150 200 380 Q 50 350 50 200" fill="none" stroke="#333" strokeWidth="2" />
                  <circle cx="155" cy="225" r="30" fill="#EF4444" fillOpacity="0.4" />
                  <circle cx="65" cy="235" r="40" fill="#EF4444" fillOpacity="0.6" />
                  <text x="65" y="235" textAnchor="middle" fill="white" className="text-[12px] font-black">KURNOOL</text>
                  <text x="155" y="225" textAnchor="middle" fill="white" className="text-[12px] font-black">GUNTUR</text>
               </svg>
            </div>
         </div>
         <button className="absolute bottom-8 right-8 bg-white text-black px-6 py-2 rounded font-black text-[12px] uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95">
            Open Vacancy Dashboard
         </button>
      </div>
    </div>
  );
};

export default WorkforceOverview;
