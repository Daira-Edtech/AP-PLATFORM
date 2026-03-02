
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { 
  Info, ChevronDown, Download, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Zap, Target, Search, Users, Settings,
  // Fix: Added User as UserIcon and ChevronRight to resolve "Cannot find name" errors.
  User as UserIcon, ChevronRight
} from 'lucide-react';
import { 
  DISTRICT_MOCK_DATA, 
  POLICY_GAPS, 
  NATIONAL_BENCHMARKS, 
  AGE_PYRAMID_DATA,
  CONDITION_STATS
} from '../constants';
import { DistrictData, MetricType } from '../types';

const PolicyInsightsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Demographics');
  const [selectedCondition, setSelectedCondition] = useState('Motor Delay Pattern');

  const tabs = ['Demographics', 'Condition Mapping', 'Programme Gaps', 'Benchmarks'];

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">Policy Insights</h1>
          <p className="text-[14px] text-[#888888] font-medium">Data-driven population intelligence for statewide programme decisions</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
            <Download size={16} /> Generation Strategy (PDF)
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-[#E5E5E5] mb-8 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-4 text-[13px] font-bold transition-all relative whitespace-nowrap ${
              activeTab === tab ? 'text-black' : 'text-[#888] hover:text-[#555]'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />}
          </button>
        ))}
      </div>

      {/* TAB: DEMOGRAPHICS */}
      {activeTab === 'Demographics' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
                 <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">Child Population Pyramid</h3>
                 <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={AGE_PYRAMID_DATA} layout="vertical" stackOffset="sign">
                          <XAxis type="number" hide />
                          <YAxis dataKey="band" type="category" axisLine={false} tickLine={false} fontSize={11} width={60} />
                          <Tooltip formatter={(v: number) => Math.abs(v).toLocaleString()} />
                          <Bar dataKey="male" fill="#000" radius={[4, 0, 0, 4]} name="Male" />
                          <Bar dataKey="female" fill="#AAA" radius={[0, 4, 4, 0]} name="Female" />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="flex justify-center gap-12 mt-6">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-black rounded-sm" /><span className="text-[10px] font-black text-[#888] uppercase">Male</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#AAA] rounded-sm" /><span className="text-[10px] font-black text-[#888] uppercase">Female</span></div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm flex flex-col items-center">
                    <h4 className="text-[13px] font-black uppercase text-[#AAA] mb-6 w-full text-center">Gender Distribution</h4>
                    <div className="relative w-full h-[180px]">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie data={[{n:'M',v:51},{n:'F',v:49}]} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="v">
                                <Cell fill="#000" />
                                <Cell fill="#AAA" />
                             </Pie>
                          </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex items-center justify-center font-black text-[18px]">5,10,000</div>
                    </div>
                    <div className="mt-4 flex justify-between w-full text-[11px] font-bold px-4">
                       <span>51% M</span>
                       <span>49% F</span>
                    </div>
                 </div>

                 <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm flex flex-col items-center">
                    <h4 className="text-[13px] font-black uppercase text-[#AAA] mb-6 w-full text-center">Registration Mode</h4>
                    <div className="relative w-full h-[180px]">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie data={[{n:'Manual',v:60},{n:'OMR',v:30},{n:'Voice',v:10}]} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="v">
                                <Cell fill="#000" />
                                <Cell fill="#666" />
                                <Cell fill="#CCC" />
                             </Pie>
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-1 w-full text-[10px] font-black uppercase text-[#888]">
                       <div className="flex justify-between"><span>Manual Entry</span> <span className="text-black">60%</span></div>
                       <div className="flex justify-between"><span>OMR Scanning</span> <span className="text-black">30%</span></div>
                       <div className="flex justify-between"><span>Voice Command</span> <span className="text-black">10%</span></div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center">
                 <h3 className="text-[16px] font-black uppercase tracking-tight">Geographic Distribution Table</h3>
              </div>
              <table className="w-full text-left">
                 <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888]">
                    <tr>
                       <th className="px-8 py-4">District</th>
                       <th className="px-4 py-4 text-right">Urban Children</th>
                       <th className="px-4 py-4 text-right">Rural Children</th>
                       <th className="px-4 py-4 text-right">% Rural</th>
                       <th className="px-8 py-4 text-right">Coverage Gap (U vs R)</th>
                    </tr>
                 </thead>
                 <tbody className="text-[13px] divide-y divide-[#F5F5F5]">
                    {DISTRICT_MOCK_DATA.slice(0, 8).map(d => {
                      const ruralPct = 60 + Math.floor(Math.random() * 25);
                      const gap = 5 + Math.floor(Math.random() * 15);
                      return (
                        <tr key={d.id} className="hover:bg-[#FBFBFB] transition-colors">
                           <td className="px-8 py-4 font-bold text-black">{d.name}</td>
                           <td className="px-4 py-4 text-right font-medium">{(d.children * (1 - ruralPct/100)).toLocaleString()}</td>
                           <td className="px-4 py-4 text-right font-medium">{(d.children * (ruralPct/100)).toLocaleString()}</td>
                           <td className="px-4 py-4 text-right font-black">{ruralPct}%</td>
                           <td className="px-8 py-4 text-right">
                              <span className={`font-black text-[12px] ${gap > 12 ? 'text-red-600' : 'text-amber-600'}`}>
                                 {gap}% Lag
                              </span>
                           </td>
                        </tr>
                      )
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* TAB: CONDITION MAPPING */}
      {activeTab === 'Condition Mapping' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-[16px] font-black uppercase tracking-tight mb-2">Condition Prevalence Heatmap</h3>
                    <div className="relative w-64">
                       <select 
                         value={selectedCondition}
                         onChange={(e) => setSelectedCondition(e.target.value)}
                         className="w-full appearance-none bg-[#F9F9F9] border border-[#E5E5E5] pl-4 pr-10 py-2 rounded font-black text-[13px] text-black focus:outline-none cursor-pointer"
                       >
                          {CONDITION_STATS.map(c => <option key={c.condition} value={c.condition}>{c.condition}</option>)}
                       </select>
                       <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                 </div>
                 <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-4 max-w-md">
                    <Info size={20} className="text-[#888] shrink-0" />
                    <p className="text-[12px] text-[#555] font-medium leading-snug">
                       {selectedCondition} prevalence correlates with districts having low screening coverage. Consider prioritizing mobile screening units in coastal corridors.
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-center">
                 <div className="lg:col-span-6 h-[420px] flex items-center justify-center relative">
                    {/* Reusing simplified map logic */}
                    <svg viewBox="0 0 400 400" className="w-full h-full max-w-[400px]">
                       <path d="M 50 200 Q 100 50 350 20 Q 380 150 200 380 Q 50 350 50 200" fill="#FBFBFB" stroke="#EEE" strokeWidth="2" />
                       {/* Shading districts randomly based on 'prevalence' for demo */}
                       {[
                         { x: 280, y: 50 }, { x: 310, y: 30 }, { x: 260, y: 90 }, { x: 235, y: 135 }, { x: 210, y: 165 }, 
                         { x: 185, y: 195 }, { x: 155, y: 225 }, { x: 125, y: 265 }, { x: 115, y: 325 }, { x: 85, y: 285 }, 
                         { x: 75, y: 355 }, { x: 45, y: 295 }, { x: 65, y: 235 }
                       ].map((pos, i) => {
                         const intensity = (i % 5) * 50;
                         return (
                           <circle key={i} cx={pos.x} cy={pos.y} r="14" fill={`rgb(${255-intensity}, ${255-intensity}, ${255-intensity})`} stroke="#000" strokeWidth="0.5" />
                         )
                       })}
                    </svg>
                    <div className="absolute bottom-4 left-4 bg-white/80 border border-[#EEE] p-3 rounded text-[10px] font-bold">
                       <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 bg-black" /> Highest Prevalence</div>
                       <div className="flex items-center gap-2"><div className="w-2 h-2 bg-white border" /> Minimal Flags</div>
                    </div>
                 </div>

                 <div className="lg:col-span-4 space-y-6">
                    <h4 className="text-[11px] font-black uppercase text-[#888] tracking-widest">District Ranking - {selectedCondition}</h4>
                    <div className="space-y-3">
                       {DISTRICT_MOCK_DATA.slice(0, 6).map(d => {
                         const rate = 2.4 + (Math.random() * 8);
                         return (
                           <div key={d.id} className="p-4 bg-[#F9F9F9] rounded border border-[#E5E5E5] flex justify-between items-center group hover:bg-black hover:text-white transition-all">
                              <div>
                                 <span className="text-[14px] font-bold block">{d.name}</span>
                                 <span className="text-[10px] uppercase font-black opacity-50">{Math.floor(rate * 120)} Cases Total</span>
                              </div>
                              <div className="text-right">
                                 <span className="text-[16px] font-black block">{rate.toFixed(1)} <span className="text-[10px]">/ 1k</span></span>
                                 <div className="w-16 h-1 bg-[#DDD] rounded-full mt-1 overflow-hidden group-hover:bg-[#333]">
                                    <div className="h-full bg-black group-hover:bg-white" style={{ width: `${rate * 8}%` }} />
                                 </div>
                              </div>
                           </div>
                         )
                       })}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* TAB: PROGRAMME GAPS */}
      {activeTab === 'Programme Gaps' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <h3 className="text-[18px] font-black uppercase tracking-tight mb-4">Prioritised Intervention Gaps</h3>
           <div className="grid grid-cols-1 gap-4">
              {POLICY_GAPS.map(gap => {
                 const severityColor = gap.severity === 'RED' ? 'border-red-600' : gap.severity === 'AMBER' ? 'border-amber-500' : 'border-[#888]';
                 const Icon = gap.icon === 'UserIcon' ? UserIcon : gap.icon === 'Users' ? Users : gap.icon === 'Settings' ? Settings : FileText;
                 return (
                   <div key={gap.id} className={`bg-white border-l-4 ${severityColor} border-y border-r border-[#E5E5E5] rounded-xl p-8 shadow-sm flex gap-8 items-start hover:shadow-md transition-all`}>
                      <div className={`p-4 rounded-full ${gap.severity === 'RED' ? 'bg-red-50 text-red-600' : gap.severity === 'AMBER' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'}`}>
                         <Icon size={32} />
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <h4 className="text-[20px] font-black text-black tracking-tight">{gap.title}</h4>
                               <p className="text-[15px] text-[#555] font-medium leading-relaxed max-w-2xl mt-1">{gap.description}</p>
                            </div>
                            <div className="bg-black text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest">
                               Priority: {gap.severity}
                            </div>
                         </div>
                         <div className="flex items-center gap-8 border-t border-[#F5F5F5] pt-6 mt-6">
                            <div>
                               <span className="text-[10px] font-bold text-[#888] uppercase block tracking-widest mb-1">Impact Scope</span>
                               <span className="text-[15px] font-black text-black">{gap.affectedCount}</span>
                            </div>
                            <div className="flex-1">
                               <span className="text-[10px] font-bold text-[#888] uppercase block tracking-widest mb-1">Recommended Directive</span>
                               <span className="text-[13px] font-bold text-[#555] italic">"{gap.suggestedAction}"</span>
                            </div>
                            <button className="px-6 py-2 bg-black text-white rounded font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all">
                               Issue Directive
                            </button>
                         </div>
                      </div>
                   </div>
                 )
              })}
           </div>
        </div>
      )}

      {/* TAB: BENCHMARKS */}
      {activeTab === 'Benchmarks' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[#F5F5F5] flex justify-between items-center">
                 <div>
                    <h3 className="text-[20px] font-black uppercase tracking-tight mb-1">National Benchmark Comparison</h3>
                    <p className="text-[14px] text-[#888]">Measuring Andhra Pradesh programme metrics against NITI Aayog ECD targets.</p>
                 </div>
                 <Target className="opacity-10" size={48} />
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                       <tr>
                          <th className="px-8 py-6">Operational Metric</th>
                          <th className="px-4 py-6 text-center">Current Value</th>
                          <th className="px-4 py-6 text-center">National Target</th>
                          <th className="px-4 py-6">Performance Gap</th>
                          <th className="px-4 py-6 text-center">Status</th>
                          <th className="px-8 py-6 text-center">Trend</th>
                       </tr>
                    </thead>
                    <tbody className="text-[14px] divide-y divide-[#F5F5F5]">
                       {NATIONAL_BENCHMARKS.map((item, i) => (
                         <tr key={i} className="hover:bg-[#FBFBFB] transition-colors">
                            <td className="px-8 py-8">
                               <span className="font-black text-black">{item.metric}</span>
                            </td>
                            <td className="px-4 py-8 text-center font-black text-[16px]">{item.stateValue}</td>
                            <td className="px-4 py-8 text-center font-bold text-[#888]">{item.nationalTarget}</td>
                            <td className="px-4 py-8 w-[240px]">
                               <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                     <div 
                                       className={`h-full rounded-full ${item.status === 'Red' ? 'bg-red-500' : item.status === 'Amber' ? 'bg-amber-500' : 'bg-green-500'}`} 
                                       style={{ width: `${100 - item.gapPercentage}%` }}
                                     />
                                  </div>
                                  <span className="text-[11px] font-bold text-[#888]">{item.gapPercentage > 0 ? `-${item.gapPercentage}%` : 'Optimal'}</span>
                               </div>
                            </td>
                            <td className="px-4 py-8 text-center">
                               <span className={`px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${
                                 item.status === 'Green' ? 'bg-green-50 text-green-700' :
                                 item.status === 'Amber' ? 'bg-amber-50 text-amber-700' :
                                 'bg-red-50 text-red-700'
                               }`}>
                                  {item.statusText}
                               </span>
                            </td>
                            <td className="px-8 py-8 text-center">
                               <div className={`inline-flex items-center gap-1 font-bold text-[12px] ${item.historicalTrend === 'Better' ? 'text-green-600' : item.historicalTrend === 'Worse' ? 'text-red-600' : 'text-[#888]'}`}>
                                  {item.historicalTrend === 'Better' ? <ArrowUpRight size={16} /> : item.historicalTrend === 'Worse' ? <ArrowDownRight size={16} /> : null}
                                  {item.historicalTrend}
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              
              <div className="p-8 bg-[#F9F9F9] border-t border-[#EEE] flex justify-between items-center">
                 <p className="text-[12px] text-[#AAA] font-medium italic">Data reflects weighted statewide averages from the 2023-24 Integrated Health Intelligence Cycle.</p>
                 <button className="flex items-center gap-2 text-black font-black text-[12px] uppercase tracking-widest hover:gap-4 transition-all">
                    Full Comparative Audit <ChevronRight size={18} />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Generic Icon Map
const FileText = (props: any) => (
  <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
);

export default PolicyInsightsView;
