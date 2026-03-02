'use client'

import React, { useState } from 'react';
import { DistrictData } from '@/lib/commissioner/types';
import KPICard from '@/components/commissioner/KPICard';
import { 
  Phone, Mail, MessageSquare, ArrowLeft, Download, 
  ChevronRight, AlertCircle, Calendar, Clock, MapPin, ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar 
} from 'recharts';

interface DistrictDetailProps {
  district: DistrictData;
  onSelectCDPO: (id: string) => void;
  onBack: () => void;
}

const DistrictDetail: React.FC<DistrictDetailProps> = ({ district, onSelectCDPO, onBack }) => {
  const [timeFilter, setTimeFilter] = useState('Quarter');

  const riskData = [
    { name: 'Low', value: district.risk.low, color: '#22C55E' },
    { name: 'Med', value: district.risk.med, color: '#F59E0B' },
    { name: 'High', value: district.risk.high, color: '#EF4444' },
    { name: 'Critical', value: district.risk.crit, color: '#000000' },
  ];

  const stateRiskData = [
    { name: 'Low', value: 70, color: '#22C55E' },
    { name: 'Med', value: 20, color: '#F59E0B' },
    { name: 'High', value: 7, color: '#EF4444' },
    { name: 'Critical', value: 3, color: '#000000' },
  ];

  const trendData = [
    { name: 'Jan', district: 88, state: 82 },
    { name: 'Feb', district: 89, state: 83 },
    { name: 'Mar', district: 90, state: 84 },
    { name: 'Apr', district: 91, state: 85 },
    { name: 'May', district: 92, state: 86 },
    { name: 'Jun', district: 92, state: 87 },
  ];

  const districtKPIs = [
    { id: 'd1', label: 'TOTAL CHILDREN', value: district.children.toLocaleString(), delta: 0, trend: [100, 102, 105, 108], accent: '#3B82F6', comparisonLabel: 'State Avg', comparisonValue: '62k' },
    { id: 'd2', label: 'SCREENED', value: district.screened.toLocaleString(), delta: 12, trend: [200, 210, 225, 240], accent: '#22C55E', comparisonLabel: 'State Avg', comparisonValue: '42k' },
    { id: 'd3', label: 'COVERAGE', value: `${district.coverage}%`, delta: 8, trend: [60, 62, 63, 64], accent: '#000000', comparisonLabel: 'State Avg', comparisonValue: '67%' },
    { id: 'd4', label: 'HIGH/CRITICAL', value: (district.risk.high + district.risk.crit).toLocaleString(), delta: 2, trend: [10, 11, 10, 11], accent: '#E11D48', comparisonLabel: 'State Avg', comparisonValue: '2.6k' },
    { id: 'd5', label: 'ESCALATIONS', value: district.escalations.toString(), delta: -5, trend: [30, 28, 26, 24], accent: '#F59E0B', comparisonLabel: 'State Avg', comparisonValue: '18' },
    { id: 'd6', label: 'ACTIVE REFERRALS', value: district.referralsActive.toLocaleString(), delta: 15, trend: [400, 450, 520, 680], accent: '#6B7280', comparisonLabel: 'State Avg', comparisonValue: '510' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-start mb-8">
        <div className="flex gap-6 items-center">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center font-black text-[28px] shadow-lg">
            {district.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[32px] font-bold text-black tracking-tight leading-none">{district.name} District</h1>
              <div className="bg-black text-white px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-widest">
                Rank #{district.rank} of 13
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[14px] text-[#333] font-bold">DPO: {district.dpo}</span>
              <div className="flex gap-2">
                <button className="p-1.5 bg-white border border-[#E5E5E5] rounded hover:bg-[#F9F9F9] text-[#888] hover:text-black transition-all">
                  <Phone size={14} />
                </button>
                <button className="p-1.5 bg-white border border-[#E5E5E5] rounded hover:bg-[#F9F9F9] text-[#888] hover:text-black transition-all">
                  <Mail size={14} />
                </button>
                <button className="p-1.5 bg-white border border-[#E5E5E5] rounded hover:bg-[#F9F9F9] text-[#888] hover:text-black transition-all">
                  <MessageSquare size={14} />
                </button>
              </div>
            </div>
            <p className="text-[13px] text-[#888888] mt-2 font-medium">
              {district.cdpos} CDPOs — {district.mandals} Mandals — {district.awcs} AWCs — {district.children.toLocaleString()} children
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
               <svg viewBox="0 0 36 36" className="w-12 h-12 transform -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#E5E5E5" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="black" strokeWidth="3" strokeDasharray={`${district.performance}, 100`} />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center text-[13px] font-black">
                {district.performance}
               </div>
            </div>
            <div className="bg-white border border-[#E5E5E5] rounded p-1 flex">
              {['Week', 'Month', 'Quarter'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-all ${
                    timeFilter === f ? 'bg-black text-white' : 'text-[#888] hover:text-black'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
            <Download size={16} /> District Report
          </button>
        </div>
      </div>

      <div className="flex flex-nowrap overflow-x-auto gap-4 mb-8 pb-2 scrollbar-hide">
        {districtKPIs.map(kpi => (
          <KPICard key={kpi.id} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-10 gap-6 mb-8">
        <div className="col-span-10 lg:col-span-6">
          <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-[#F5F5F5] flex justify-between items-center">
              <h3 className="text-[16px] font-black text-black uppercase tracking-tight">CDPO Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F9F9] text-[10px] uppercase font-black text-[#888] tracking-widest">
                    <th className="px-6 py-4">CDPO / Officer</th>
                    <th className="px-4 py-4 text-center">AWCs</th>
                    <th className="px-4 py-4 text-right">Reach %</th>
                    <th className="px-4 py-4 text-center">H/C Risk</th>
                    <th className="px-4 py-4 text-center">Score</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="text-[13px]">
                  {district.cdpoList?.map(cdpo => (
                    <tr 
                      key={cdpo.id} 
                      onClick={() => onSelectCDPO(cdpo.id)}
                      className="border-b border-[#F5F5F5] hover:bg-[#FBFBFB] cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-black">{cdpo.name}</span>
                          <span className="text-[11px] text-[#888]">{cdpo.officer}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-medium">{cdpo.awcs}</td>
                      <td className="px-4 py-4 text-right font-black">
                        {cdpo.coverage}%
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold text-[11px]">
                          {cdpo.riskHigh + cdpo.riskCrit}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-black ${cdpo.score > 80 ? 'text-green-600' : 'text-amber-600'}`}>{cdpo.score}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#AAA]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-10 lg:col-span-4 flex flex-col h-full">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm flex flex-col h-full">
            <h3 className="text-[16px] font-black text-black uppercase tracking-tight mb-8">District Risk Distribution</h3>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="flex gap-12 items-center">
                 <div className="relative w-[180px] h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={riskData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                          {riskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest">District</span>
                      <span className="text-[20px] font-black">{(district.risk.high + district.risk.crit).toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="flex flex-col gap-3">
                    {riskData.map(r => (
                      <div key={r.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                        <span className="text-[12px] font-medium text-[#555]">{r.name}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictDetail;
