'use client'
import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import BriefPreview from '@/components/commissioner/BriefPreview';
import {
   Download, Printer, Share2, FileText, Calendar,
   ChevronRight, CheckCircle2, AlertCircle, Eye,
   Presentation, Layout, Clock, Mail, ShieldAlert,
   Search, Filter, ExternalLink, Zap, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { PREVIOUS_BRIEFS, PREVIOUS_REPORTS, EXECUTIVE_KPIS, DISTRICT_MOCK_DATA } from '@/lib/commissioner/constants';
import { useLanguage } from '@/lib/commissioner/LanguageContext';

const BriefsReportsView: React.FC = () => {
   const { t } = useLanguage();
   const [activeTab, setActiveTab] = useState('Cabinet Briefs');
   const [isGenerating, setIsGenerating] = useState(false);
   const [showPreview, setShowPreview] = useState(false);

   // Dynamic report state
   const [selectedType, setSelectedType] = useState('monthly');
   const [selectedScope, setSelectedScope] = useState('Statewide');
   const [selectedFormat, setSelectedFormat] = useState('PDF Brief');
   const [reportData, setReportData] = useState<any>(null);

   // Print ref and hook
   const printRef = useRef<HTMLDivElement>(null);
   const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: `Jiveesha_Report_${selectedScope}_${new Date().toISOString().slice(0, 10)}`,
   });

   const handleGenerate = async () => {
      setIsGenerating(true);
      setShowPreview(false);
      try {
         const res = await fetch(`/api/commissioner/briefs/generate?type=${selectedType}&scope=${selectedScope}&format=${selectedFormat}`);
         const data = await res.json();
         setReportData(data);
         setShowPreview(true);
      } catch (err) {
         console.error('Failed to generate brief:', err);
      } finally {
         setIsGenerating(false);
      }
   };

   return (
      <div className="animate-in fade-in duration-700 pb-20">
         <div className="flex justify-between items-end mb-8">
            <div>
               <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">{t('briefs.title')}</h1>
               <p className="text-[14px] text-[#888888] font-medium">{t('briefs.subtitle')}</p>
            </div>
         </div>

         <div className="flex border-b border-[#E5E5E5] mb-8 overflow-x-auto scrollbar-hide">
            {[
               { id: 'Cabinet Briefs', label: t('briefs.tab.cabinet') },
               { id: 'Standard Reports', label: t('briefs.tab.standard') },
               { id: 'Scheduled', label: t('briefs.tab.scheduled') }
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-8 py-4 text-[13px] font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-black' : 'text-[#888] hover:text-[#555]'
                     }`}
               >
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />}
               </button>
            ))}
         </div>

         {activeTab === 'Cabinet Briefs' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               {/* BRIEF GENERATOR */}
               <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">{t('briefs.generate.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                     <div className="space-y-6">
                        <div>
                           <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-4">{t('briefs.generate.type')}</label>
                           <div className="space-y-3">
                              {[
                                 { id: 'monthly', label: t('briefs.type.monthly'), desc: t('briefs.desc.monthly') },
                                 { id: 'quarterly', label: t('briefs.type.quarterly'), desc: t('briefs.desc.quarterly') },
                                 { id: 'spotlight', label: t('briefs.type.spotlight'), desc: t('briefs.desc.spotlight') },
                                 { id: 'crisis', label: t('briefs.type.crisis'), desc: t('briefs.desc.crisis') },
                              ].map(type => (
                                 <label key={type.id} className="flex gap-4 cursor-pointer group">
                                    <input type="radio" name="briefType"
                                       checked={selectedType === type.id}
                                       onChange={() => setSelectedType(type.id)}
                                       className="mt-1 accent-black w-4 h-4 shrink-0" />
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
                           <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-3">{t('briefs.generate.period')}</label>
                           <div className="grid grid-cols-2 gap-3">
                              <select className="bg-[#F9F9F9] border border-[#E5E5E5] p-2 rounded font-bold text-[13px] outline-none">
                                 <option>March 2024</option>
                                 <option>Q1 2024</option>
                                 <option>Annual 2023</option>
                              </select>
                              <select value={selectedScope} onChange={(e) => setSelectedScope(e.target.value)} className="bg-[#F9F9F9] border border-[#E5E5E5] p-2 rounded font-bold text-[13px] outline-none">
                                 <option>Statewide</option>
                                 <option>Guntur</option>
                                 <option>Krishna</option>
                              </select>
                           </div>
                        </div>
                        <div>
                           <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-3">{t('briefs.generate.format')}</label>
                           <div className="flex gap-3">
                              {['PDF Brief', 'Presentation (PPT)', 'Word Doc'].map(f => (
                                 <button key={f} onClick={() => setSelectedFormat(f)} className={`flex-1 py-2 text-[12px] font-bold border rounded ${f === selectedFormat ? 'bg-zinc-50 border-black text-black' : 'bg-white border-[#E5E5E5] text-[#888]'}`}>{f}</button>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div>
                           <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-3">{t('briefs.generate.branding')}</label>
                           <div className="space-y-3">
                              <label className="flex items-center gap-3 cursor-pointer">
                                 <input type="checkbox" defaultChecked className="accent-black w-4 h-4" />
                                 <span className="text-[13px] font-bold text-black">{t('briefs.brand.header')}</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                 <input type="checkbox" defaultChecked className="accent-black w-4 h-4" />
                                 <span className="text-[13px] font-bold text-black">{t('briefs.brand.watermark')}</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                 <input type="checkbox" className="accent-black w-4 h-4" />
                                 <span className="text-[13px] font-bold text-black">{t('briefs.brand.email')}</span>
                              </label>
                           </div>
                        </div>
                        <button
                           onClick={handleGenerate}
                           disabled={isGenerating}
                           className="w-full h-12 bg-black text-white rounded font-black text-[13px] uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-3"
                        >
                           {isGenerating ? <Clock className="animate-spin" size={18} /> : <Zap size={18} />}
                           {isGenerating ? t('briefs.generating') : t('briefs.generateBtn')}
                        </button>
                     </div>
                  </div>
               </div>

               {/* PREVIEW PANEL (Conditional) */}
               {showPreview && reportData && (
                  <div className="animate-in zoom-in-95 fade-in duration-500">
                     <div className="shadow-2xl border-2 border-black rounded-xl overflow-hidden bg-zinc-50 p-8 flex flex-col items-center max-w-[1000px] mx-auto">
                        <div className="w-full bg-white shadow-lg print:shadow-none border border-gray-200">
                           <BriefPreview ref={printRef} data={reportData} />
                        </div>
                     </div>

                     <div className="flex justify-center gap-4 mt-12">
                        <button onClick={() => handlePrint()} className="px-8 py-3 bg-black text-white rounded-lg font-black text-[14px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                           <Download size={20} /> {t('briefs.action.pdf')}
                        </button>
                        <button className="px-6 py-3 border-2 border-black rounded-lg font-black text-[14px] uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-3 disabled:opacity-50">
                           <Presentation size={20} /> {t('briefs.action.pptx')}
                        </button>
                        <button className="px-6 py-3 bg-[#F5F5F5] rounded-lg font-black text-[14px] uppercase tracking-widest hover:bg-[#EEE] transition-all flex items-center gap-3 disabled:opacity-50">
                           <Mail size={20} /> {t('briefs.action.email')}
                        </button>
                     </div>
                  </div>
               )}

               {/* PREVIOUS BRIEFS TABLE */}
               <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center bg-[#F9F9F9]/50">
                     <h3 className="text-[16px] font-black uppercase tracking-tight">{t('briefs.previous.title')}</h3>
                     <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
                        <input type="text" placeholder={t('briefs.previous.search')} className="pl-9 pr-4 py-2 border border-[#E5E5E5] rounded text-[12px] outline-none focus:ring-1 focus:ring-black" />
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                           <tr>
                              <th className="px-8 py-4">{t('table.briefName')}</th>
                              <th className="px-4 py-4">{t('table.type')}</th>
                              <th className="px-4 py-4">{t('table.period')}</th>
                              <th className="px-4 py-4">{t('table.scope')}</th>
                              <th className="px-4 py-4">{t('table.generated')}</th>
                              <th className="px-8 py-4 text-right">{t('table.actions')}</th>
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
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">{t('briefs.reports.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                     <div>
                        <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-4">{t('briefs.reports.selectTemp')}</label>
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
                        <label className="text-[11px] font-black text-[#888] uppercase tracking-widest block mb-4">{t('briefs.reports.includes')}</label>
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
                           {t('briefs.reports.generate')}
                        </button>
                     </div>
                  </div>
               </div>

               <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#F5F5F5] bg-[#F9F9F9]/50">
                     <h3 className="text-[16px] font-black uppercase tracking-tight">{t('briefs.reports.recent')}</h3>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-[#F9F9F9] text-[10px] font-black uppercase tracking-widest text-[#888] border-b border-[#EEE]">
                           <tr>
                              <th className="px-8 py-4">{t('table.reportId')}</th>
                              <th className="px-4 py-4">{t('table.title')}</th>
                              <th className="px-4 py-4 text-center">{t('table.type')}</th>
                              <th className="px-4 py-4 text-center">{t('table.format')}</th>
                              <th className="px-4 py-4 text-right">{t('table.generated')}</th>
                              <th className="px-8 py-4 text-right">{t('table.actions')}</th>
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
                                       <Download size={16} /> <span className="hidden group-hover:inline">{t('briefs.reports.download')}</span>
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
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">{t('briefs.scheduled.title')}</h3>
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
                                    <span className="text-[11px] font-bold text-[#888] uppercase">{t('briefs.scheduled.nextSend')}: <span className="text-black">{job.next}</span></span>
                                    <span className="text-[11px] font-bold text-[#888] uppercase underline cursor-pointer hover:text-black">{t('briefs.scheduled.editRecipients')} ({job.recipient.split(',').length})</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-8">
                              <div className="text-right">
                                 <span className="text-[10px] font-black text-[#AAA] uppercase block">{t('briefs.scheduled.lastRun')}</span>
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
                        {t('briefs.security.title')}
                     </h3>
                     <p className="text-[14px] opacity-70 mb-6 max-w-xl leading-relaxed">
                        {t('briefs.security.desc')}
                     </p>
                     <button className="text-[12px] font-black uppercase tracking-widest border border-white/20 px-6 py-2 rounded hover:bg-white hover:text-black transition-all">
                        {t('briefs.security.viewLog')}
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