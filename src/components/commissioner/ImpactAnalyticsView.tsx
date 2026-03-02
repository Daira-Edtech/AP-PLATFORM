'use client'

import React, { useState } from 'react';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { 
  TrendingUp, Calendar, ChevronDown, Download, CheckCircle2, 
  ArrowRight, AlertTriangle, Target, Zap
} from 'lucide-react';
import { 
  IMPACT_LONGITUDINAL_DATA, 
  INTERVENTION_PIPELINE_DATA, 
  COHORT_OUTCOME_DATA, 
  BEFORE_AFTER_DATA 
} from '@/lib/commissioner/constants';
import KPICard from '@/components/commissioner/KPICard';

const ImpactAnalyticsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Programme Impact');
  const [selectedCohort, setSelectedCohort] = useState('Q1-2025');

  const tabs = ['Programme Impact', 'Cohort Tracking', 'Before / After'];

  const impactKPIs = [
    { id: 'i1', label: 'IDENTIFICATION IMPROVEMENT', value: '340%', delta: 24, trend: [100, 150, 220, 340], accent: '#22C55E' },
    { id: 'i2', label: 'SCREENING GROWTH (YoY)', value: '+28%', delta: 8, trend: [10, 15, 20, 28], accent: '#3B82F6' },
    { id: 'i3', label: 'REFERRAL COMPLETION', value: '72%', delta: 12, trend: [50, 58, 65, 72], accent: '#000000' },
    { id: 'i4', label: 'AVG TIME TO INTERVENTION', value: '11 days', delta: -15, trend: [20, 18, 14, 11], accent: '#F59E0B' },
  ];

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
            className={`px-8 py-4 text-[13px] font-bold transition-all relative whitespace-nowrap ${
              activeTab === tab ? 'text-black' : 'text-[#888] hover:text-[#555]'
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
          {/* Headline Impact Card */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-black" />
             <div className="flex flex-col gap-4">
                <h2 className="text-[18px] font-semibold text-black tracking-tight leading-relaxed">
                   <span className="font-black text-[22px]">34,200</span> children identified as High/Critical risk — 
                   <span className="font-black text-[22px]"> 4,780</span> referred — 
                   <span className="font-black text-[22px]"> 3,442</span> received intervention 
                   <span className="text-[#888] ml-2">(72% completion rate)</span>
                </h2>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                   <Zap className="text-green-600" size={20} />
                   <p className="text-[14px] text-green-900 font-medium leading-relaxed">
                      Estimated early identification rate improved by <span className="font-black">340%</span> compared to the pre-programme baseline, saving an estimated <span className="font-black">4,200 disability-adjusted life years (DALYs)</span> annually.
                   </p>
                </div>
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
                      <span className="text-[11px] font-bold text-[#888] uppercase">Children Screened</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-4 h-[2px] bg-black" />
                      <span className="text-[11px] font-bold text-black uppercase">High-Risk Rate (per 1k)</span>
                   </div>
                </div>
             </div>
             <div className="h-[380px] relative">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={IMPACT_LONGITUDINAL_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                      <XAxis dataKey="q" fontSize={11} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                      <YAxis yAxisId="right" orientation="right" fontSize={11} axisLine={false} tickLine={false} domain={[0, 15]} />
                      <Tooltip />
                      <Area yAxisId="left" type="monotone" dataKey="volume" stroke="none" fill="#F0F0F0" fillOpacity={1} />
                      <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#000" strokeWidth={3} dot={{ r: 4, fill: '#000' }} />
                   </AreaChart>
                </ResponsiveContainer>
                
                {/* Annotations */}
                <div className="absolute top-0 left-0 right-0 h-full pointer-events-none px-12">
                   <div className="flex justify-between h-full pt-4">
                      {IMPACT_LONGITUDINAL_DATA.map((d, i) => (
                        d.annotation ? (
                          <div key={i} className="flex flex-col items-center">
                             <div className="w-[1px] h-full border-l border-dashed border-[#DDD] mb-2" />
                             <span className="bg-white px-2 py-1 border border-[#EEE] rounded text-[9px] font-black uppercase tracking-widest text-[#AAA]">{d.annotation}</span>
                          </div>
                        ) : <div key={i} className="w-1" />
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Intervention Pipeline */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-[16px] font-black uppercase tracking-tight">Intervention Pipeline Health</h3>
                   <p className="text-[12px] text-[#888]">Tracking drop-off rates from screening to outcome resolution</p>
                </div>
                <div className="flex items-center gap-2">
                   <AlertTriangle size={16} className="text-red-600" />
                   <span className="text-[11px] font-black text-red-700 uppercase">Referral Gap Alert: 86% Drop-off</span>
                </div>
             </div>
             
             <div className="space-y-4">
                {INTERVENTION_PIPELINE_DATA.map((item, idx) => (
                  <div key={item.stage} className="flex items-center gap-6">
                     <div className="w-[180px] text-[13px] font-bold text-[#555] uppercase tracking-tight">{item.stage}</div>
                     <div className="flex-1 h-10 flex items-center relative">
                        <div 
                           className={`h-full rounded transition-all duration-1000 flex items-center px-4 ${idx > 2 ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}
                           style={{ width: `${(item.value / 342000) * 100}%`, minWidth: '40px' }}
                        >
                           <span className="text-[11px] font-black">{item.value.toLocaleString()}</span>
                        </div>
                        {idx < INTERVENTION_PIPELINE_DATA.length - 1 && (
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
          </div>
        </div>
      )}

      {/* CONTENT: COHORT TRACKING */}
      {activeTab === 'Cohort Tracking' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                             <option value="Q1-2025">Q1-2025 (Initial Enrollment)</option>
                             <option value="Q4-2024">Q4-2024 (Pilot phase)</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="p-3 bg-gray-50 rounded border border-gray-100 flex flex-col items-center min-w-[120px]">
                       <span className="text-[10px] font-bold text-[#888] uppercase">Cohort Size</span>
                       <span className="text-[20px] font-black">12,450</span>
                    </div>
                    <div className="p-3 bg-black text-white rounded flex flex-col items-center min-w-[120px]">
                       <span className="text-[10px] font-bold text-[#888] uppercase">Retention</span>
                       <span className="text-[20px] font-black">92%</span>
                    </div>
                 </div>
              </div>

              {/* Cohort Timeline */}
              <div className="relative py-12 mb-12 border-y border-[#F5F5F5]">
                 <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#EEE] -translate-y-1/2" />
                 <div className="flex justify-between relative px-4">
                    {[
                      { label: 'Registration', date: 'Jan 2025', status: 'completed' },
                      { label: 'Screening', date: 'Feb 2025', status: 'completed' },
                      { label: 'Intervention', date: 'Mar 2025', status: 'active' },
                      { label: 'Follow-up 1', date: 'Jun 2025', status: 'pending' },
                      { label: 'Evaluation', date: 'Jan 2026', status: 'pending' },
                    ].map((step, i) => (
                      <div key={i} className="flex flex-col items-center group relative z-10">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                           step.status === 'completed' ? 'bg-black border-black text-white' :
                           step.status === 'active' ? 'bg-white border-black text-black shadow-lg scale-110' :
                           'bg-white border-[#EEE] text-[#DDD]'
                         }`}>
                           {step.status === 'completed' ? <CheckCircle2 size={16} /> : <span className="text-[12px] font-bold">{i+1}</span>}
                         </div>
                         <span className={`text-[12px] font-black mt-3 uppercase tracking-tight ${step.status === 'pending' ? 'text-[#AAA]' : 'text-black'}`}>{step.label}</span>
                         <span className="text-[10px] text-[#888] font-bold">{step.date}</span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Outcome Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                 <div>
                    <h4 className="text-[14px] font-black uppercase tracking-widest text-[#AAA] mb-6">Outcome Distribution</h4>
                    <div className="h-[280px]">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie data={COHORT_OUTCOME_DATA} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                {COHORT_OUTCOME_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                             </Pie>
                             <Tooltip />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
                 <div className="space-y-4">
                    {COHORT_OUTCOME_DATA.map(item => (
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
           </div>
        </div>
      )}

      {/* CONTENT: BEFORE / AFTER */}
      {activeTab === 'Before / After' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                 {BEFORE_AFTER_DATA.map((item, i) => (
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
                 ))}
              </div>

              <div className="p-8 bg-[#F9F9F9] flex justify-between items-start">
                 <p className="text-[11px] text-[#AAA] font-medium max-w-lg leading-relaxed italic">
                    Note: Baseline data (Before Jiveesha) is extracted from historical ICDS records prior to programme launch. Data from this period may be subject to reporting lags and manual entry quality limitations. Jiveesha metrics are real-time and platform-verified.
                 </p>
                 <button className="flex items-center gap-2 text-black font-black text-[12px] uppercase tracking-widest hover:gap-3 transition-all">
                    Full Baseline Study <ArrowRight size={16} />
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ImpactAnalyticsView;
