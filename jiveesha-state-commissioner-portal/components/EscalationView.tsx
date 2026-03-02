
import React, { useState } from 'react';
import { Escalation, KPI } from '../types';
import { MOCK_ESCALATIONS, DISTRICT_MOCK_DATA } from '../constants';
import KPICard from './KPICard';
import { 
  AlertCircle, ChevronRight, ChevronDown, ChevronUp, 
  MapPin, Clock, MessageSquare, ShieldAlert, User,
  ArrowRight, Filter, Download, MoreHorizontal, CheckCircle2
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const EscalationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Active');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tabs = [
    { label: 'Active', count: 128 },
    { label: 'In Progress', count: 42 },
    { label: 'Resolved', count: 340 }
  ];

  const escalationKPIs: KPI[] = [
    { id: 'e1', label: 'OPEN ESCALATIONS', value: '128', delta: 12, trend: [110, 115, 120, 128], accent: '#000000' },
    { id: 'e2', label: 'CRITICAL (21d+)', value: '18', delta: 5, trend: [12, 14, 16, 18], accent: '#EF4444' },
    { id: 'e3', label: 'AVG RESOLUTION', value: '11 days', delta: -8, trend: [14, 13, 12, 11], accent: '#3B82F6' },
    { id: 'e4', label: 'RESOLUTION RATE', value: '73%', delta: 4, trend: [65, 68, 70, 73], accent: '#22C55E' },
  ];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">State Escalations</h1>
          <p className="text-[14px] text-[#888888] font-medium">State-level oversight for cases requiring immediate executive intervention</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
            <Download size={16} /> Resolution Logs
          </button>
        </div>
      </div>

      {/* CRITICAL ALERT BANNER */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse">
            <AlertCircle size={22} />
          </div>
          <div>
            <h3 className="text-red-900 font-bold text-[16px]">Attention: 18 Critical Cases Escalated</h3>
            <p className="text-red-700 text-[13px]">These cases have been pending at State Level for 21+ days without resolution.</p>
          </div>
        </div>
        <button className="bg-red-600 text-white px-6 py-2 rounded font-black text-[12px] uppercase tracking-widest hover:bg-red-700 transition-all">
          Priority Audit
        </button>
      </div>

      <div className="flex flex-nowrap overflow-x-auto gap-4 mb-8 pb-2 scrollbar-hide">
        {escalationKPIs.map(kpi => <KPICard key={kpi.id} {...kpi} />)}
      </div>

      <div className="flex gap-8">
        {/* MAIN LIST AREA */}
        <div className="flex-1 space-y-6">
          {/* TABS */}
          <div className="flex border-b border-[#E5E5E5] mb-6">
            {tabs.map(tab => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                className={`px-8 py-4 text-[13px] font-bold transition-all relative ${
                  activeTab === tab.label ? 'text-black' : 'text-[#888] hover:text-[#555]'
                }`}
              >
                {tab.label} ({tab.count})
                {activeTab === tab.label && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {MOCK_ESCALATIONS.map((esc) => (
              <div 
                key={esc.id} 
                className={`bg-white border border-[#E5E5E5] rounded-xl shadow-sm transition-all duration-300 relative overflow-hidden ${
                  expandedId === esc.id ? 'ring-2 ring-black border-transparent' : 'hover:border-black/20'
                }`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${esc.priority === 'Critical' ? 'bg-red-600' : 'bg-amber-500'}`} />
                
                <div className="p-6 cursor-pointer" onClick={() => toggleExpand(esc.id)}>
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-3">
                            <h4 className="text-[18px] font-black tracking-tight">{esc.childName}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                              esc.priority === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {esc.priority}
                            </span>
                            <span className="text-[12px] font-bold text-[#AAA]">{esc.id}</span>
                         </div>
                         <div className="flex items-center gap-2 text-[12px] text-[#888] font-bold uppercase tracking-widest">
                           <MapPin size={12} /> {esc.location.district} • {esc.location.cdpo} CDPO • {esc.location.mandal} Mandal
                         </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-bold text-[#888] uppercase">Pending at State</span>
                           <span className="text-[18px] font-black">{esc.daysOpen} Days</span>
                        </div>
                        {expandedId === esc.id ? <ChevronUp size={20} className="text-[#888]" /> : <ChevronDown size={20} className="text-[#888]" />}
                      </div>
                   </div>

                   {/* FULL PATH TRAIL */}
                   <div className="flex items-center gap-2 mb-4 bg-gray-50/50 p-2 rounded border border-gray-100 overflow-x-auto scrollbar-hide">
                      {esc.path.map((node, i) => (
                        <React.Fragment key={i}>
                           <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <div className={`w-1.5 h-1.5 rounded-full ${i === esc.path.length - 1 ? 'bg-black' : 'bg-[#DDD]'}`} />
                              <span className={`text-[11px] font-bold ${i === esc.path.length - 1 ? 'text-black' : 'text-[#888]'}`}>{node}</span>
                           </div>
                           {i < esc.path.length - 1 && <ChevronRight size={12} className="text-[#DDD] shrink-0" />}
                        </React.Fragment>
                      ))}
                   </div>

                   {/* COLLAPSED NOTES PREVIEW */}
                   {!expandedId && (
                     <p className="text-[13px] text-[#555] line-clamp-1 italic">
                       District Note: {esc.districtNotes}
                     </p>
                   )}

                   {/* EXPANDED CONTENT */}
                   {expandedId === esc.id && (
                     <div className="animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-8 mt-6">
                           <div>
                              <h5 className="text-[11px] font-black uppercase text-[#888] mb-3 tracking-widest">District Observations</h5>
                              <div className="bg-[#F9F9F9] border border-[#EEE] rounded-lg p-4 italic text-[13px] text-[#444] leading-relaxed">
                                "{esc.districtNotes}"
                              </div>
                              <div className="mt-6">
                                 <h5 className="text-[11px] font-black uppercase text-[#888] mb-4 tracking-widest">Action Required</h5>
                                 <div className="flex flex-col gap-3">
                                    <button className="bg-black text-white w-full py-3 rounded font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all active:scale-[0.98]">
                                       <ShieldAlert size={16} /> Issue State Directive
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                       <button className="bg-white border border-[#E5E5E5] py-2.5 rounded font-bold text-[12px] hover:bg-gray-50 transition-all">Reassign District</button>
                                       <button className="bg-white border border-[#E5E5E5] py-2.5 rounded font-bold text-[12px] hover:bg-gray-50 transition-all">Resolve Case</button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div>
                              <h5 className="text-[11px] font-black uppercase text-[#888] mb-3 tracking-widest">Escalation Timeline</h5>
                              <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[#EEE]">
                                 {esc.timeline.map((event, i) => (
                                   <div key={i} className="relative">
                                      <div className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${i === esc.timeline.length - 1 ? 'bg-red-500 ring-2 ring-red-100' : 'bg-black'}`} />
                                      <div className="flex justify-between items-start">
                                         <span className="text-[13px] font-black block">{event.event}</span>
                                         <span className="text-[11px] font-bold text-[#AAA]">{event.date}</span>
                                      </div>
                                      <span className="text-[11px] font-bold text-[#888] uppercase tracking-tighter">{event.role}</span>
                                      {event.note && <p className="text-[11px] text-[#555] mt-1 italic">{event.note}</p>}
                                   </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-[#F5F5F5] flex justify-between items-center">
                           <button className="text-[12px] font-black text-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                              View Child Profile <ArrowRight size={16} />
                           </button>
                           <div className="flex items-center gap-2">
                              <MessageSquare size={14} className="text-[#888]" />
                              <span className="text-[11px] font-bold text-[#888]">4 internal audit messages pending</span>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STATS SIDEBAR */}
        <div className="w-[320px] space-y-6">
           <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
              <h3 className="text-[15px] font-black uppercase tracking-tight mb-6">Escalations by District</h3>
              <div className="space-y-5">
                 {DISTRICT_MOCK_DATA.slice(0, 8).map(d => {
                   const count = Math.floor(Math.random() * 25 + 5);
                   const isBottleneck = count > 20;
                   return (
                     <div key={d.id} className="group">
                        <div className="flex justify-between items-end mb-1.5">
                           <span className="text-[13px] font-bold text-black">{d.name}</span>
                           <span className={`text-[14px] font-black ${isBottleneck ? 'text-red-600' : 'text-black'}`}>{count}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-1000 ${isBottleneck ? 'bg-red-600' : 'bg-black'}`} style={{ width: `${(count / 30) * 100}%` }} />
                           </div>
                           <div className="w-[50px] h-[16px]">
                              <ResponsiveContainer width="100%" height="100%">
                                 <LineChart data={[1,5,3,4,8,6,7].map((v, i) => ({ v: v + Math.random()*2, i }))}>
                                    <Line type="monotone" dataKey="v" stroke={isBottleneck ? '#EF4444' : '#CCC'} strokeWidth={1.5} dot={false} />
                                 </LineChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                        {isBottleneck && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-red-700 uppercase tracking-tighter animate-pulse">
                             <AlertCircle size={10} /> District Bottleneck Detected
                          </div>
                        )}
                     </div>
                   );
                 })}
              </div>
              <button className="w-full mt-8 py-3 bg-black text-white rounded font-black text-[12px] uppercase tracking-widest hover:bg-zinc-800 transition-all">
                 Full District Audit
              </button>
           </div>

           <div className="bg-black text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                 <h4 className="text-[11px] font-black uppercase text-[#888] mb-4 tracking-widest">System Health</h4>
                 <div className="space-y-4">
                    <div className="flex justify-between">
                       <span className="text-[12px] font-bold opacity-70">Auto-Escalation Rate</span>
                       <span className="text-[14px] font-black">12%</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-[12px] font-bold opacity-70">Compliance Lag</span>
                       <span className="text-[14px] font-black text-red-400">+4.2d</span>
                    </div>
                 </div>
                 <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3">
                       <CheckCircle2 size={18} className="text-green-500" />
                       <span className="text-[11px] font-bold text-white/80">Platform AI flagging operational.</span>
                    </div>
                 </div>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                 <ShieldAlert size={120} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EscalationView;
