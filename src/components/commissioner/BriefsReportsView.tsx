'use client'
import React, { useState } from 'react';
import { 
  Download, Printer, Share2, FileText, Calendar, 
  ChevronRight, CheckCircle2, AlertCircle, Eye, 
  Presentation, Layout, Clock, Mail, ShieldAlert,
  Search, Filter, ExternalLink, Zap, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { PREVIOUS_BRIEFS, PREVIOUS_REPORTS, EXECUTIVE_KPIS, DISTRICT_MOCK_DATA } from '@/lib/commissioner/constants';

const BriefsReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Cabinet Briefs');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 1500);
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">Cabinet Briefs & Reports</h1>
          <p className="text-[14px] text-[#888888] font-medium">Executive summaries and longitudinal data audits for decision makers</p>
        </div>
      </div>

      <div className="flex border-b border-[#E5E5E5] mb-8 overflow-x-auto scrollbar-hide">
        {['Cabinet Briefs', 'Standard Reports', 'Scheduled'].map(tab => (
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

      {activeTab === 'Cabinet Briefs' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* BRIEF GENERATOR */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
            <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">Generate Cabinet Brief</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-4">Brief Type</label>
                  <div className="space-y-3">
                    {[
                      { id: 'monthly', label: 'Monthly Executive Summary', desc: '1-page high-level overview' },
                      { id: 'quarterly', label: 'Quarterly Impact Report', desc: '2-page outcome analysis' },
                      { id: 'spotlight', label: 'District Spotlight', desc: 'Deep dive on specific zone' },
                      { id: 'crisis', label: 'Crisis Brief', desc: 'Escalation & SAM clusters' },
                    ].map(type => (
                      <label key={type.id} className="flex gap-4 cursor-pointer group">
                        <input type="radio" name="briefType" className="mt-1 accent-black w-4 h-4 shrink-0" defaultChecked={type.id === 'monthly'} />
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-black group-hover:underline">{type.label}</span>
                          <span className="text-[11px] text-[#888] font-medium">{type.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-3">Period & Scope</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select className="bg-[#F9F9F9] border border-[#E5E5E5] p-2 rounded font-bold text-[13px] outline-none">
                      <option>March 2024</option>
                      <option>Q1 2024</option>
                      <option>Annual 2023</option>
                    </select>
                    <select className="bg-[#F9F9F9] border border-[#E5E5E5] p-2 rounded font-bold text-[13px] outline-none">
                      <option>Statewide</option>
                      <option>Guntur</option>
                      <option>Krishna</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-3">Format</label>
                  <div className="flex gap-3">
                    {['PDF Brief', 'Presentation (PPT)', 'Word Doc'].map(f => (
                      <button key={f} className={`flex-1 py-2 text-[12px] font-bold border rounded ${f === 'PDF Brief' ? 'bg-zinc-50 border-black text-black' : 'bg-white border-[#E5E5E5] text-[#888]'}`}>{f}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-3">Branding & Security</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-black w-4 h-4" />
                      <span className="text-[13px] font-bold text-black">Include government header/seal</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-black w-4 h-4" />
                      <span className="text-[13px] font-bold text-black">Watermark as "CONFIDENTIAL"</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="accent-black w-4 h-4" />
                      <span className="text-[13px] font-bold text-black">Email copy to Chief Secretary</span>
                    </label>
                  </div>
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-12 bg-black text-white rounded font-black text-[13px] uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-3"
                >
                  {isGenerating ? <Clock className="animate-spin" size={18} /> : <Zap size={18} />}
                  {isGenerating ? 'Generating Intelligence...' : 'Generate Cabinet Brief'}
                </button>
              </div>
            </div>
          </div>

          {/* PREVIEW PANEL (Conditional) */}
          {showPreview && (
            <div className="animate-in zoom-in-95 fade-in duration-500">
               <div className="bg-white border-2 border-black rounded-xl shadow-2xl p-10 max-w-[900px] mx-auto relative group">
                  {/* WATERMARK */}
                  <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-35deg] opacity-[0.03] pointer-events-none select-none">
                     <span className="text-[120px] font-black tracking-tighter">CONFIDENTIAL</span>
                  </div>

                  <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-8">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-black rounded flex items-center justify-center text-white font-black text-[32px]">J</div>
                        <div>
                           <h4 className="text-[12px] font-black tracking-[0.3em] uppercase text-[#888] mb-1">Government of Andhra Pradesh</h4>
                           <h2 className="text-[26px] font-black uppercase tracking-tight leading-none text-black">Jiveesha ECD Programme</h2>
                           <p className="text-[11px] font-bold text-[#AAA] mt-1 tracking-widest uppercase">Executive Summary • March 2024 Cycle</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-lg">Confidential</span>
                        <p className="text-[10px] font-bold text-[#888] mt-2">Ref: CS/ICDS/2024/03-A</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-12 gap-10 mb-12">
                     <div className="col-span-8">
                        <h5 className="text-[13px] font-black uppercase text-black mb-4 tracking-widest flex items-center gap-2">
                           <Eye size={16} /> Executive Summary
                        </h5>
                        <ul className="space-y-4 text-[15px] text-[#333] leading-relaxed list-disc pl-5 font-medium">
                           <li>Reached record screening compliance of <span className="font-black text-black">98.8%</span> in Guntur district, establishing a new state benchmark for urban hubs.</li>
                           <li>Overall High/Critical risk children count stabilized at <span className="font-black text-black">34,200</span>, reflecting a 4.2% reduction in severe malnutrition markers.</li>
                           <li>Escalation resolution pipeline improved by <span className="font-black text-green-600">12.4%</span> through targeted CDPO-level administrative directives.</li>
                           <li>Northern tribal belts require urgent secondary specialist deployment to manage diagnostic wait times exceeding 14 days.</li>
                        </ul>
                     </div>
                     <div className="col-span-4 bg-[#F9F9F9] p-6 rounded-lg border border-[#EEE] h-fit">
                        <h5 className="text-[11px] font-black uppercase text-[#888] mb-4 tracking-widest">Action Items</h5>
                        <div className="space-y-4">
                           <div className="flex gap-3">
                              <ShieldAlert size={18} className="text-red-600 shrink-0" />
                              <p className="text-[12px] font-bold text-[#555] leading-tight">Authorize additional SAM counselors for Kurnool.</p>
                           </div>
                           <div className="flex gap-3">
                              <CheckCircle2 size={18} className="text-black shrink-0" />
                              <p className="text-[12px] font-bold text-[#555] leading-tight">Approve Q2 Procurement for 2,400 OMR scanners.</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-10">
                     {EXECUTIVE_KPIS.slice(0, 6).map(kpi => (
                        <div key={kpi.id} className="p-4 bg-white border border-black/10 rounded flex flex-col justify-between">
                           <span className="text-[9px] font-black text-[#888] uppercase tracking-widest">{kpi.label}</span>
                           <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-[20px] font-black">{kpi.value}</span>
                              <span className="text-[10px] font-bold text-green-600">↑{kpi.delta}%</span>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-2 gap-10">
                     <div>
                        <h5 className="text-[11px] font-black uppercase text-[#888] mb-4 tracking-widest">Risk Trend (6 Months)</h5>
                        <div className="h-40">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={[
                                 { m: 'Oct', v: 42 }, { m: 'Nov', v: 38 }, { m: 'Dec', v: 39 }, 
                                 { m: 'Jan', v: 35 }, { m: 'Feb', v: 34 }, { m: 'Mar', v: 32 }
                              ]}>
                                 <Area type="monotone" dataKey="v" stroke="#000" fill="#000" fillOpacity={0.05} strokeWidth={3} />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                     <div className="flex flex-col justify-end">
                        <div className="p-5 bg-black text-white rounded-lg flex items-center justify-between">
                           <div>
                              <span className="text-[10px] font-black opacity-60 uppercase block mb-1">State Impact Score</span>
                              <span className="text-[32px] font-black tracking-tight">8.4<span className="text-[14px] opacity-60 ml-2">/ 10</span></span>
                           </div>
                           {/* Fixed missing import for TrendingUp */}
                           <TrendingUp size={32} className="opacity-30" />
                        </div>
                     </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-[#EEE] flex justify-between items-center text-[10px] font-bold text-[#AAA] uppercase tracking-widest">
                     <span>Generated by State Command Portal • Daira EdTech</span>
                     <span>Data Sync: Mar 24, 2024 • 08:30 IST</span>
                  </div>
               </div>

               <div className="flex justify-center gap-4 mt-12">
                  <button className="px-8 py-3 bg-black text-white rounded-lg font-black text-[14px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                     <Download size={20} /> Download Final PDF
                  </button>
                  <button className="px-6 py-3 border-2 border-black rounded-lg font-black text-[14px] uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-3">
                     <Presentation size={20} /> Download PPTX
                  </button>
                  <button className="px-6 py-3 bg-[#F5F5F5] rounded-lg font-black text-[14px] uppercase tracking-widest hover:bg-[#EEE] transition-all flex items-center gap-3">
                     <Mail size={20} /> Email Brief
                  </button>
               </div>
            </div>
          )}

          {/* PREVIOUS BRIEFS TABLE */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
             <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center bg-[#F9F9F9]/50">
                <h3 className="text-[16px] font-black uppercase tracking-tight">Previously Generated Briefs</h3>
                <div className="relative">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
                   <input type="text" placeholder="Search archive..." className="pl-9 pr-4 py-2 border border-[#E5E5E5] rounded text-[12px] outline-none focus:ring-1 focus:ring-black" />
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                      <tr>
                         <th className="px-8 py-4">Brief Name</th>
                         <th className="px-4 py-4">Type</th>
                         <th className="px-4 py-4">Period</th>
                         <th className="px-4 py-4">Scope</th>
                         <th className="px-4 py-4">Generated</th>
                         <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="text-[13px] divide-y divide-[#F5F5F5]">
                      {PREVIOUS_BRIEFS.map(b => (
                        <tr key={b.id} className="hover:bg-[#FBFBFB] transition-colors group">
                           <td className="px-8 py-4 font-bold text-black flex items-center gap-3">
                              <FileText size={16} className="text-[#AAA]" /> {b.name}
                           </td>
                           <td className="px-4 py-4 text-[#555] font-medium">{b.type}</td>
                           <td className="px-4 py-4 font-bold">{b.period}</td>
                           <td className="px-4 py-4">
                              <span className="px-2 py-0.5 bg-zinc-100 rounded text-[11px] font-bold text-[#666] uppercase">{b.scope}</span>
                           </td>
                           <td className="px-4 py-4 text-[#888]">{b.generatedAt}</td>
                           <td className="px-8 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-2 hover:bg-zinc-100 rounded text-[#888] hover:text-black transition-colors"><Eye size={16} /></button>
                                 <button className="p-2 hover:bg-zinc-100 rounded text-[#888] hover:text-black transition-colors"><Download size={16} /></button>
                                 <button className="p-2 hover:bg-zinc-100 rounded text-[#888] hover:text-black transition-colors"><Share2 size={16} /></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Standard Reports' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
              <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">Standard Report Engine</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                 <div>
                    <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-4">Select Report Template</label>
                    <select className="w-full bg-[#F9F9F9] border border-[#E5E5E5] p-3 rounded font-black text-[14px] outline-none">
                       <option>Monthly State Summary</option>
                       <option>Quarterly Performance Audit</option>
                       <option>Annual Strategic Review</option>
                       <option>District Comparative Scorecard</option>
                       <option>Referral Pipeline efficiency</option>
                       <option>Workforce Compliance Report</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-4">Included Sections</label>
                    <div className="grid grid-cols-1 gap-2">
                       {['KPI Dashboard', 'Coverage Analysis', 'Risk Heatmaps', 'Trend Forecasts', 'District Rankings', 'Escalation Logs'].map(s => (
                          <label key={s} className="flex items-center gap-3 cursor-pointer group">
                             <input type="checkbox" defaultChecked className="accent-black w-4 h-4" />
                             <span className="text-[13px] font-bold text-[#555] group-hover:text-black">{s}</span>
                          </label>
                       ))}
                    </div>
                 </div>
                 <div className="flex flex-col justify-end">
                    <button className="w-full h-12 bg-black text-white rounded font-black text-[13px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
                       Generate Full Report
                    </button>
                 </div>
              </div>
           </div>

           <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#F5F5F5] bg-[#F9F9F9]/50">
                 <h3 className="text-[16px] font-black uppercase tracking-tight">Recent Standard Reports</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                       <tr>
                          <th className="px-8 py-4">Report ID</th>
                          <th className="px-4 py-4">Title</th>
                          <th className="px-4 py-4 text-center">Type</th>
                          <th className="px-4 py-4 text-center">Format</th>
                          <th className="px-4 py-4 text-right">Generated</th>
                          <th className="px-8 py-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="text-[13px] divide-y divide-[#F5F5F5]">
                       {PREVIOUS_REPORTS.map(r => (
                          <tr key={r.id} className="hover:bg-[#FBFBFB] transition-colors group">
                             <td className="px-8 py-4 font-bold text-[#AAA]">{r.id}</td>
                             <td className="px-4 py-4 font-black text-black">{r.name}</td>
                             <td className="px-4 py-4 text-center font-bold text-[#888]">{r.type}</td>
                             <td className="px-4 py-4 text-center">
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-bold text-[#666]">PDF</span>
                             </td>
                             <td className="px-4 py-4 text-right text-[#888]">{r.generatedAt}</td>
                             <td className="px-8 py-4 text-right">
                                <button className="p-2 hover:bg-zinc-100 rounded transition-colors text-black font-black flex items-center gap-2 ml-auto group-hover:bg-black group-hover:text-white">
                                   <Download size={16} /> <span className="hidden group-hover:inline">Download</span>
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Scheduled' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
              <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">Automated Executive Reporting</h3>
              <div className="space-y-6">
                 {[
                   { title: 'Monthly Brief to Governor\'s Office', last: 'Apr 01', recipient: 'governor.office@ap.gov.in', next: 'May 01' },
                   { title: 'Quarterly Impact to ICDS National', last: 'Mar 31', recipient: 'national.icds@gov.in', next: 'Jun 30' },
                   { title: 'Weekly District Scorecard (Global)', last: 'Apr 07', recipient: 'all.dpos@ap.gov.in', next: 'Apr 14' },
                 ].map((job, i) => (
                   <div key={i} className="flex items-center justify-between p-6 bg-[#F9F9F9] rounded-xl border border-[#EEE] hover:border-black transition-all">
                      <div className="flex gap-6 items-center">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-[#EEE] shadow-sm">
                            <Clock size={24} className="text-[#888]" />
                         </div>
                         <div>
                            <h4 className="text-[16px] font-black text-black">{job.title}</h4>
                            <div className="flex gap-4 mt-1">
                               <span className="text-[11px] font-bold text-[#888] uppercase">Next send: <span className="text-black">{job.next}</span></span>
                               <span className="text-[11px] font-bold text-[#888] uppercase underline cursor-pointer hover:text-black">Edit Recipients ({job.recipient.split(',').length})</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                            <span className="text-[10px] font-black text-[#AAA] uppercase block">Last Successful Run</span>
                            <span className="text-[14px] font-black">{job.last}</span>
                         </div>
                         <div className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-black text-white rounded-xl p-8 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="text-[16px] font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                    <ShieldAlert size={22} className="text-red-500" />
                    Security Log: Report Access
                 </h3>
                 <p className="text-[14px] opacity-70 mb-6 max-w-xl leading-relaxed">
                    All generated briefs and standard reports are tracked via blockchain-verified access logs. Any dissemination outside authorized ministry domains will trigger an immediate administrative audit.
                 </p>
                 <button className="text-[12px] font-black uppercase tracking-widest border border-white/20 px-6 py-2 rounded hover:bg-white hover:text-black transition-all">
                    View Access History
                 </button>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Presentation size={120} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BriefsReportsView;