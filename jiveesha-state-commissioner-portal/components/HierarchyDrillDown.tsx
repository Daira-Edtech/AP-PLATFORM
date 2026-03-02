
import React, { useState } from 'react';
import { CDPOData, MandalData, AWCData, ChildData, DistrictData } from '../types';
import { 
  ChevronRight, ArrowLeft, MoreHorizontal, User, 
  Activity, Clipboard, MessageSquare, AlertTriangle, Send, ShieldAlert,
  Info, TrendingUp, Calendar, Clock, MapPin, Search
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

/**
 * CDPO Detail Component
 */
export const CDPODetail: React.FC<{ district: DistrictData, cdpo: CDPOData, onSelectMandal: (id: string) => void, onBack: () => void }> = ({ district, cdpo, onSelectMandal, onBack }) => {
  const riskData = [
    { name: 'Low', value: 70, color: '#22C55E' },
    { name: 'Med', value: 20, color: '#F59E0B' },
    { name: 'High', value: 7, color: '#EF4444' },
    { name: 'Critical', value: 3, color: '#000000' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-[28px] font-bold text-black mb-1">{cdpo.name} CDPO Office</h2>
          <p className="text-[14px] text-[#888]">Officer: {cdpo.officer} • {cdpo.mandals} Mandals • {cdpo.children.toLocaleString()} children</p>
        </div>
        <div className="bg-white border border-[#E5E5E5] px-4 py-2 rounded-full font-bold text-[14px]">
          Score: <span className="text-black ml-1">{cdpo.score}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center">
            <h3 className="text-[16px] font-black uppercase tracking-tight">Mandal Breakdown</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9F9F9] text-[10px] uppercase font-black text-[#888] tracking-widest">
              <tr>
                <th className="px-6 py-4">Mandal / Supervisor</th>
                <th className="px-4 py-4 text-center">AWCs</th>
                <th className="px-4 py-4 text-right">Coverage %</th>
                <th className="px-4 py-4 text-center">H/C Risk</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {cdpo.mandalList?.map(m => (
                <tr key={m.id} onClick={() => onSelectMandal(m.id)} className="border-b border-[#F5F5F5] hover:bg-[#FBFBFB] cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-black">{m.name}</span>
                      <span className="text-[11px] text-[#888]">{m.supervisor}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-medium">{m.awcs}</td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-black">{m.coverage}%</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold text-[11px]">{m.riskHigh + m.riskCrit}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-[#AAA]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
           <h3 className="text-[14px] font-black uppercase tracking-tight mb-8 w-full">Risk Donut</h3>
           <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {riskData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-[#888] uppercase">Critical</span>
                <span className="text-[20px] font-black">{cdpo.riskCrit}</span>
              </div>
           </div>
           <div className="mt-8 grid grid-cols-2 gap-4 w-full">
              {riskData.map(r => (
                <div key={r.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-[11px] font-bold text-[#555] uppercase">{r.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Mandal Detail Component
 */
export const MandalDetail: React.FC<{ mandal: MandalData, onSelectAWC: (id: string) => void, onBack: () => void }> = ({ mandal, onSelectAWC, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-[28px] font-bold text-black mb-1">{mandal.name} Administration</h2>
          <p className="text-[14px] text-[#888]">Supervisor: {mandal.supervisor} • {mandal.awcs} Anganwadi Centers</p>
        </div>
        <button className="px-4 py-2 bg-white border border-[#E5E5E5] rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
          Download Supervisor Report
        </button>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center">
          <h3 className="text-[16px] font-black uppercase tracking-tight">Anganwadi Scorecard</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F9F9F9] text-[10px] uppercase font-black text-[#888] tracking-widest">
            <tr>
              <th className="px-6 py-4">AWC Name</th>
              <th className="px-4 py-4">AWW Worker</th>
              <th className="px-4 py-4 text-center">Children</th>
              <th className="px-4 py-4 text-center">Coverage</th>
              <th className="px-4 py-4 text-center">High/Crit</th>
              <th className="px-4 py-4 text-center">Score</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {mandal.awcList?.map(awc => (
              <tr key={awc.id} onClick={() => onSelectAWC(awc.id)} className="border-b border-[#F5F5F5] hover:bg-[#FBFBFB] cursor-pointer group">
                <td className="px-6 py-4 font-bold text-black">{awc.name}</td>
                <td className="px-4 py-4 text-[#555]">{awc.awwName}</td>
                <td className="px-4 py-4 text-center font-medium">{awc.children}</td>
                <td className="px-4 py-4 text-center">
                  <span className="font-bold">{awc.coverage}%</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-red-600 font-bold">{awc.riskHigh + awc.riskCrit}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`font-black ${awc.score > 80 ? 'text-green-600' : 'text-amber-600'}`}>{awc.score}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-[#AAA]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * AWC Detail Component
 */
export const AWCDetail: React.FC<{ awc: AWCData, onSelectChild: (id: string) => void, onBack: () => void }> = ({ awc, onSelectChild, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-[28px] font-bold text-black mb-1">{awc.name}</h2>
          <p className="text-[14px] text-[#888]">Anganwadi Worker: {awc.awwName} • Reach: {awc.coverage}%</p>
        </div>
        <div className="flex gap-3">
          <div className="p-3 bg-white border border-[#E5E5E5] rounded flex flex-col items-center min-w-[100px]">
             <span className="text-[10px] font-bold text-[#888] uppercase">Children</span>
             <span className="text-[18px] font-black">{awc.children}</span>
          </div>
          <div className="p-3 bg-white border border-[#E5E5E5] rounded flex flex-col items-center min-w-[100px]">
             <span className="text-[10px] font-bold text-[#888] uppercase">Efficiency</span>
             <span className="text-[18px] font-black">{awc.score}%</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center">
          <h3 className="text-[16px] font-black uppercase tracking-tight">Children at AWC</h3>
          <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
             <input type="text" placeholder="Search children..." className="pl-9 pr-4 py-1.5 border border-[#E5E5E5] rounded text-[12px] focus:ring-1 focus:ring-black outline-none" />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F9F9F9] text-[10px] uppercase font-black text-[#888] tracking-widest">
            <tr>
              <th className="px-6 py-4">Child Name</th>
              <th className="px-4 py-4">Age / Gender</th>
              <th className="px-4 py-4">Parent / Guardian</th>
              <th className="px-4 py-4 text-center">Status</th>
              <th className="px-4 py-4 text-center">Last Screened</th>
              <th className="px-4 py-4 text-center">Flags</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {awc.childrenList?.map(child => (
              <tr key={child.id} onClick={() => onSelectChild(child.id)} className="border-b border-[#F5F5F5] hover:bg-[#FBFBFB] cursor-pointer group">
                <td className="px-6 py-4 font-bold text-black">{child.name}</td>
                <td className="px-4 py-4 text-[#555]">{child.age} • {child.gender}</td>
                <td className="px-4 py-4 text-[#555]">{child.parentName}</td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                    child.riskStatus === 'Critical' ? 'bg-black text-white' :
                    child.riskStatus === 'High' ? 'bg-red-50 text-red-700' :
                    child.riskStatus === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {child.riskStatus}
                  </span>
                </td>
                <td className="px-4 py-4 text-center text-[#888]">{child.lastScreened}</td>
                <td className="px-4 py-4 text-center">
                  {child.flags > 0 && <span className="bg-red-600 text-white w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black">{child.flags}</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all text-[#AAA]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Child Detail Component (Tier 5 Version)
 */
export const ChildDetail: React.FC<{ child: ChildData, onBack: () => void }> = ({ child, onBack }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Screening', 'Questionnaire', 'Observations', 'Flags', 'Referrals'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start mb-8">
        <div className="flex gap-6 items-center">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-[32px] shadow-lg ${
            child.riskStatus === 'Critical' ? 'bg-black text-white' : 'bg-white border-2 border-black text-black'
          }`}>
            {child.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-[32px] font-bold text-black tracking-tight">{child.name}</h2>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${
                child.riskStatus === 'Critical' ? 'bg-red-600 text-white' : 'bg-black text-white'
              }`}>
                {child.riskStatus} Risk
              </span>
            </div>
            <p className="text-[14px] text-[#888] font-bold uppercase tracking-widest">
              Child ID: {child.id.toUpperCase()} • {child.age} • {child.gender} • Parent: {child.parentName}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-red-600 text-white font-bold rounded flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg active:scale-95">
            <ShieldAlert size={18} /> Issue State Directive
          </button>
          <button className="px-4 py-3 bg-white border border-[#E5E5E5] rounded font-bold hover:bg-[#F9F9F9]">
            Full Health Profile
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="flex border-b border-[#F5F5F5]">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-[13px] font-bold transition-all relative ${
                activeTab === tab ? 'text-black' : 'text-[#888] hover:text-[#555]'
              }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black" />}
            </button>
          ))}
        </div>
        
        <div className="flex-1 p-8 bg-[#FBFBFB]">
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-lg border border-[#E5E5E5] flex flex-col items-center text-center">
                  <span className="text-[11px] font-black text-[#888] uppercase mb-4 tracking-widest">Growth - Height</span>
                  <span className="text-[28px] font-black">{child.height}</span>
                  <span className="text-[12px] text-green-600 font-bold mt-1">Normal Range</span>
               </div>
               <div className="bg-white p-6 rounded-lg border border-[#E5E5E5] flex flex-col items-center text-center">
                  <span className="text-[11px] font-black text-[#888] uppercase mb-4 tracking-widest">Growth - Weight</span>
                  <span className="text-[28px] font-black">{child.weight}</span>
                  <span className="text-[12px] text-red-600 font-bold mt-1">Underweight (Moderate)</span>
               </div>
               <div className="bg-white p-6 rounded-lg border border-[#E5E5E5] flex flex-col items-center text-center">
                  <span className="text-[11px] font-black text-[#888] uppercase mb-4 tracking-widest">MUAC Index</span>
                  <span className="text-[28px] font-black">{child.muac}</span>
                  <span className="text-[12px] text-red-600 font-bold mt-1">SAM Alert</span>
               </div>
               <div className="bg-white p-6 rounded-lg border border-[#E5E5E5] flex flex-col items-center text-center">
                  <span className="text-[11px] font-black text-[#888] uppercase mb-4 tracking-widest">Health Flags</span>
                  <span className="text-[28px] font-black">{child.flags}</span>
                  <span className="text-[12px] text-red-600 font-bold mt-1">Immediate Action</span>
               </div>

               <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white p-8 rounded-lg border border-[#E5E5E5] mt-4">
                  <h3 className="text-[16px] font-black uppercase mb-6 tracking-tight">State Executive View Summary</h3>
                  <div className="flex gap-8">
                     <div className="flex-1 space-y-4 text-[14px]">
                        <p className="text-[#555] leading-relaxed"><span className="font-bold text-black">Observation:</span> Child presents with consistent negative growth deviation across last 3 screening cycles. Anganwadi worker has flagged persistent lack of dietary diversity in home environment.</p>
                        <p className="text-[#555] leading-relaxed"><span className="font-bold text-black">Referral Status:</span> Initiated to Guntur District General Hospital on March 14th. Current status: <span className="font-bold text-amber-600 uppercase">Waitlisted (48h+)</span>.</p>
                     </div>
                     <div className="w-[300px] p-6 bg-[#F9F9F9] rounded-lg flex flex-col items-center justify-center text-center border border-[#EEE]">
                        <AlertTriangle size={32} className="text-red-600 mb-3" />
                        <span className="text-[13px] font-bold text-red-700 block mb-1">Administrative Delay Detected</span>
                        <p className="text-[11px] text-[#888]">The waitlist duration for this child exceeds the state mandated 24-hour limit for critical cases.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}
          {activeTab !== 'Overview' && (
            <div className="flex flex-col items-center justify-center h-full text-[#888]">
               <Info size={40} className="mb-4 opacity-20" />
               <p className="text-[15px] font-medium">Detailed "{activeTab}" records are synced from the AWC-level mobile terminal.</p>
               <span className="text-[12px] mt-1">Read-only historical data.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
