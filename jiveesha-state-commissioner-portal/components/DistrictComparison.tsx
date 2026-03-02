
import React, { useState, useMemo } from 'react';
import { DISTRICT_MOCK_DATA } from '../constants';
import { DistrictData } from '../types';
import { 
  Download, FileText, LayoutList, Radar as RadarIcon, 
  ArrowUpDown, MoreHorizontal, Copy, Filter, ChevronRight
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip as RechartsTooltip, 
  LineChart, Line 
} from 'recharts';

interface DistrictComparisonProps {
  onDistrictSelect: (id: string) => void;
}

const DistrictComparison: React.FC<DistrictComparisonProps> = ({ onDistrictSelect }) => {
  const [viewMode, setViewMode] = useState<'table' | 'radar'>('table');
  const [activeToggles, setActiveToggles] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: keyof DistrictData | string, direction: 'asc' | 'desc'}>({
    key: 'performance',
    direction: 'asc'
  });

  const stateAvgCoverage = 67;

  const toggleFilter = (id: string) => {
    setActiveToggles(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const sortedAndFilteredData = useMemo(() => {
    let data = [...DISTRICT_MOCK_DATA];

    if (activeToggles.includes('below-target')) {
      data = data.filter(d => d.coverage < stateAvgCoverage);
    }
    if (activeToggles.includes('high-escalations')) {
      data = data.filter(d => d.escalations > 20);
    }
    if (activeToggles.includes('low-referral')) {
      data = data.filter(d => (d.referralsDone / (d.referralsActive + d.referralsDone)) < 0.7);
    }

    data.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof DistrictData];
      let bValue: any = b[sortConfig.key as keyof DistrictData];

      // Handle nested values or custom keys
      if (sortConfig.key === 'referral_rate') {
        aValue = a.referralsDone / (a.referralsActive + a.referralsDone);
        bValue = b.referralsDone / (b.referralsActive + b.referralsDone);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [activeToggles, sortConfig]);

  const radarData = useMemo(() => {
    // Normalizing metrics for the radar axes (0-100)
    return DISTRICT_MOCK_DATA.slice(0, 5).map(d => ({
      name: d.name,
      'Coverage': d.coverage,
      'Risk': 100 - (d.risk.crit / d.children * 1000), // Inverted risk
      'Resolution': Math.max(0, 100 - (d.avgWait * 5)), // Inverted wait time
      'Referral': (d.referralsDone / (d.referralsActive + d.referralsDone)) * 100,
      'Workforce': d.performance // Proxy for workforce compliance
    }));
  }, []);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-black tracking-tight mb-1">District Comparison</h1>
          <p className="text-[14px] text-[#888888]">13 districts in Andhra Pradesh • All-District Performance Scorecard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#E5E5E5] rounded p-1 flex">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-sm transition-all ${viewMode === 'table' ? 'bg-black text-white' : 'text-[#888] hover:text-black'}`}
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => setViewMode('radar')}
              className={`p-2 rounded-sm transition-all ${viewMode === 'radar' ? 'bg-black text-white' : 'text-[#888] hover:text-black'}`}
            >
              <RadarIcon size={18} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* HIGHLIGHT TOGGLES */}
      <div className="flex gap-3 mb-6">
        {[
          { id: 'below-target', label: 'Below Target', color: 'bg-amber-100 text-amber-900 border-amber-200' },
          { id: 'high-escalations', label: 'High Escalations', color: 'bg-red-100 text-red-900 border-red-200' },
          { id: 'low-referral', label: 'Low Referral Completion', color: 'bg-orange-100 text-orange-900 border-orange-200' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => toggleFilter(t.id)}
            className={`px-4 py-2 rounded-full border text-[12px] font-bold transition-all ${
              activeToggles.includes(t.id) ? t.color : 'bg-white text-[#888] border-[#E5E5E5] hover:border-[#CCC]'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button className="ml-auto text-[13px] font-bold text-[#888] flex items-center gap-2 hover:text-black transition-colors">
          <Filter size={14} /> More Filters
        </button>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-white text-[10px] uppercase font-bold tracking-widest">
                  <th className="px-4 py-3 border-r border-[#333]">Rank</th>
                  <th className="px-4 py-3 min-w-[140px] border-r border-[#333]">District</th>
                  <th className="px-4 py-3 border-r border-[#333]">DPO Officer</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">CDPOs</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">Mandals</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">AWCs</th>
                  <th className="px-4 py-3 text-right border-r border-[#333]">Children</th>
                  <th className="px-4 py-3 text-right border-r border-[#333]">Screened</th>
                  <th className="px-4 py-3 min-w-[150px] border-r border-[#333]">
                    <div className="flex items-center justify-between">
                       Coverage % <ArrowUpDown size={12} className="cursor-pointer" onClick={() => handleSort('coverage')} />
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center border-r border-[#333] bg-[#22C55E]/10">L</th>
                  <th className="px-2 py-3 text-center border-r border-[#333] bg-[#F59E0B]/10">M</th>
                  <th className="px-2 py-3 text-center border-r border-[#333] bg-[#EF4444]/10">H</th>
                  <th className="px-2 py-3 text-center border-r border-[#333] bg-black/10">C</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">Escal.</th>
                  <th className="px-4 py-3 min-w-[120px] border-r border-[#333]">Referrals (A/D)</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">Avg Wait</th>
                  <th className="px-4 py-3 text-center border-r border-[#333]">Load %</th>
                  <th className="px-4 py-3 text-center min-w-[100px]">Perf Score</th>
                </tr>
              </thead>
              <tbody className="text-[12px]">
                {sortedAndFilteredData.map((d, index) => {
                  const isBelowAvg = d.coverage < stateAvgCoverage;
                  const isBelow50 = d.coverage < 50;
                  const waitColor = d.avgWait < 7 ? 'text-green-600' : (d.avgWait > 14 ? 'text-red-600' : 'text-amber-600');
                  const loadColor = d.facilityLoad < 70 ? 'text-green-600' : (d.facilityLoad > 90 ? 'text-red-600' : 'text-amber-600');
                  const scoreColor = d.performance > 80 ? 'text-green-600' : (d.performance < 50 ? 'text-red-600' : 'text-amber-600');

                  return (
                    <tr 
                      key={d.id} 
                      onClick={() => onDistrictSelect(d.id)}
                      className="border-b border-[#F5F5F5] hover:bg-[#F9F9F9] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-bold text-[#AAA]">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-black border-r border-[#F5F5F5]">
                        <div className="flex items-center justify-between">
                          {d.name} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-[#AAA]" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#555] border-r border-[#F5F5F5]">{d.dpo}</td>
                      <td className="px-4 py-3 text-center border-r border-[#F5F5F5]">{d.cdpos}</td>
                      <td className="px-4 py-3 text-center border-r border-[#F5F5F5]">{d.mandals}</td>
                      <td className="px-4 py-3 text-center border-r border-[#F5F5F5] font-medium">{d.awcs}</td>
                      <td className="px-4 py-3 text-right border-r border-[#F5F5F5] font-medium">{d.children.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right border-r border-[#F5F5F5] font-medium">{d.screened.toLocaleString()}</td>
                      <td className="px-4 py-3 border-r border-[#F5F5F5]">
                        <div className="flex items-center gap-2 mb-1">
                           <span className={`font-black ${isBelow50 ? 'text-red-600' : (isBelowAvg ? 'text-amber-600' : 'text-black')}`}>
                             {d.coverage}%
                           </span>
                           <div className="w-[50px] h-[14px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={d.trend.map((v, i) => ({ v, i }))}>
                                  <Line type="monotone" dataKey="v" stroke={isBelow50 ? '#EF4444' : '#000'} strokeWidth={1.5} dot={false} />
                                </LineChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                        <div className="w-full h-1 bg-[#E5E5E5] rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${isBelow50 ? 'bg-red-500' : (isBelowAvg ? 'bg-amber-500' : 'bg-black')}`} style={{ width: `${d.coverage}%` }} />
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center border-r border-[#F5F5F5] font-bold text-green-700">{d.risk.low}</td>
                      <td className="px-2 py-3 text-center border-r border-[#F5F5F5] font-bold text-amber-700">{d.risk.med}</td>
                      <td className="px-2 py-3 text-center border-r border-[#F5F5F5] font-bold text-red-700">{d.risk.high}</td>
                      <td className="px-2 py-3 text-center border-r border-[#F5F5F5] font-bold bg-black/5">{d.risk.crit}</td>
                      <td className={`px-4 py-3 text-center border-r border-[#F5F5F5] font-black ${d.escalations > 20 ? 'text-red-600' : 'text-black'}`}>
                        {d.escalations}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-[#F5F5F5]">
                        <span className="text-[#888] font-bold">{d.referralsActive}</span> / <span className="text-black font-bold">{d.referralsDone}</span>
                      </td>
                      <td className={`px-4 py-3 text-center border-r border-[#F5F5F5] font-black ${waitColor}`}>
                        {d.avgWait}d
                      </td>
                      <td className={`px-4 py-3 text-center border-r border-[#F5F5F5] font-black ${loadColor}`}>
                        {d.facilityLoad}%
                      </td>
                      <td className="px-4 py-3">
                         <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 relative">
                               <svg viewBox="0 0 36 36" className="w-5 h-5 transform -rotate-90">
                                  <circle cx="18" cy="18" r="16" fill="none" stroke="#E5E5E5" strokeWidth="4" />
                                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="4" className={scoreColor} strokeDasharray={`${d.performance}, 100`} />
                               </svg>
                            </div>
                            <span className={`font-black ${scoreColor}`}>{d.performance}</span>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
            <h3 className="text-[16px] font-bold text-black uppercase tracking-tight mb-8">Multi-Factor Operational Radar</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#EEE" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#888', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                  {radarData.map((d, i) => (
                    <Radar
                      key={d.name}
                      name={d.name}
                      dataKey="Coverage"
                      stroke={['#000', '#3B82F6', '#22C55E', '#EF4444', '#F59E0B'][i % 5]}
                      fill={['#000', '#3B82F6', '#22C55E', '#EF4444', '#F59E0B'][i % 5]}
                      fillOpacity={0.1}
                    />
                  ))}
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-black uppercase tracking-tight mb-4">Radar Insight</h3>
              <p className="text-[14px] text-[#555] leading-relaxed mb-6">
                The radar chart evaluates districts across 5 mission-critical axes. Overlapping polygons highlight systemic operational gaps.
              </p>
              <div className="space-y-4">
                 <div className="p-4 bg-[#F9F9F9] rounded border-l-4 border-black">
                    <span className="text-[11px] font-bold text-[#888] uppercase block mb-1">Top Performer</span>
                    <span className="text-[15px] font-bold">East Godavari</span>
                    <p className="text-[12px] text-[#555] mt-1">Exceptional coverage (88%) and workforce compliance (91%).</p>
                 </div>
                 <div className="p-4 bg-[#F9F9F9] rounded border-l-4 border-red-500">
                    <span className="text-[11px] font-bold text-[#888] uppercase block mb-1">Priority Attention</span>
                    <span className="text-[15px] font-bold">Kurnool</span>
                    <p className="text-[12px] text-[#555] mt-1">High critical risk density vs lowest state coverage (38%).</p>
                 </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
               <button className="flex-1 py-3 bg-black text-white font-bold rounded text-[13px] hover:bg-[#333] transition-colors flex items-center justify-center gap-2">
                 <Copy size={16} /> Copy for Presentation
               </button>
               <button className="flex-1 py-3 border border-black font-bold rounded text-[13px] hover:bg-[#F9F9F9] transition-colors">
                 Export PDF
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictComparison;
