
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Treemap, Legend
} from 'recharts';
import { Download, AlertCircle, TrendingUp, Info, ChevronRight, Filter } from 'lucide-react';
import { DISTRICT_MOCK_DATA, CONDITION_STATS, AGE_BAND_STATS } from '../constants';
import { KPI } from '../types';
import KPICard from './KPICard';

const ScreeningRiskView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Coverage');
  const [timeFilter, setTimeFilter] = useState('Financial Year');

  const tabs = ['Coverage', 'Risk Distribution', 'Trends', 'Conditions'];

  // Coverage Tab Data
  const coverageKPIs: KPI[] = [
    { id: 'c1', label: 'TOTAL CHILDREN', value: '5,10,000', delta: 0, trend: [480, 485, 490, 495, 500, 505, 510], accent: '#3B82F6' },
    { id: 'c2', label: 'SCREENED', value: '3,42,000', delta: 12, trend: [280, 290, 305, 315, 330, 342], accent: '#22C55E' },
    { id: 'c3', label: 'UNSCREENED', value: '1,68,000', delta: -4, trend: [180, 175, 172, 168], accent: '#94A3B8' },
    { id: 'c4', label: 'COVERAGE RATE', value: '67.1%', delta: 8, trend: [58, 60, 62, 63, 65, 67], accent: '#000000' },
  ];

  const belowTargetDistricts = useMemo(() => {
    return DISTRICT_MOCK_DATA
      .filter(d => d.coverage < 60)
      .sort((a, b) => a.coverage - b.coverage);
  }, []);

  // Risk Tab Data
  const riskKPIs: KPI[] = [
    { id: 'r1', label: 'HIGH RISK (SAM)', value: '24,000', delta: 2, trend: [22, 23, 23, 24], accent: '#EF4444' },
    { id: 'r2', label: 'CRITICAL FLAGS', value: '10,200', delta: -5, trend: [12, 11, 10.5, 10.2], accent: '#000000' },
    { id: 'r3', label: 'MEDIUM RISK', value: '67,800', delta: 0, trend: [65, 66, 67, 67.8], accent: '#F59E0B' },
    { id: 'r4', label: 'HEALTHY STATUS', value: '2,40,000', delta: 15, trend: [200, 215, 230, 240], accent: '#22C55E' },
  ];

  const riskPieData = [
    { name: 'Critical', value: 10200, color: '#000000' },
    { name: 'High', value: 24000, color: '#EF4444' },
    { name: 'Medium', value: 67800, color: '#F59E0B' },
    { name: 'Low', value: 240000, color: '#22C55E' },
  ];

  const districtRiskBars = DISTRICT_MOCK_DATA.map(d => ({
    name: d.name,
    Low: d.risk.low,
    Medium: d.risk.med,
    High: d.risk.high,
    Critical: d.risk.crit
  }));

  const conditionPrevalenceData = CONDITION_STATS.sort((a, b) => b.count - a.count);

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[32px] font-bold text-black tracking-tighter leading-none mb-2">Screening & Risk Overview</h1>
          <p className="text-[14px] text-[#888888] font-medium">Statewide diagnostic reach and risk profile analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#E5E5E5] rounded p-1 flex">
            {['Quarter', 'Year', 'Financial Year'].map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-1.5 text-[12px] font-bold rounded-sm transition-all ${
                  timeFilter === f ? 'bg-black text-white' : 'text-[#888] hover:text-black'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] bg-white rounded text-[13px] font-bold hover:bg-[#F9F9F9]">
            <Download size={16} /> Export Data
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

      {/* CONTENT: COVERAGE */}
      {activeTab === 'Coverage' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-nowrap overflow-x-auto gap-4 scrollbar-hide">
            {coverageKPIs.map(kpi => <KPICard key={kpi.id} {...kpi} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
              <h3 className="text-[16px] font-black uppercase tracking-tight mb-6">District Coverage Intensity</h3>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={DISTRICT_MOCK_DATA.map(d => ({ name: d.name, size: d.coverage }))}
                    dataKey="size"
                    stroke="#fff"
                    fill="#000"
                  >
                    <Tooltip content={<CustomTreemapTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-[#888] mt-4 font-bold uppercase tracking-widest text-center">Block size represents relative coverage percentage</p>
            </div>

            <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[16px] font-black uppercase tracking-tight">Below Target Districts</h3>
                <span className="text-[11px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-1 rounded tracking-widest">Target: 70%</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-[#888] uppercase tracking-widest border-b border-[#F5F5F5]">
                    <tr>
                      <th className="pb-3 px-2">District</th>
                      <th className="pb-3 text-right">Coverage</th>
                      <th className="pb-3 text-right">Gap</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {belowTargetDistricts.map(d => (
                      <tr key={d.id} className="border-b border-[#F9F9F9] hover:bg-[#FBFBFB] transition-all group cursor-pointer">
                        <td className="py-3 px-2 font-bold">{d.name}</td>
                        <td className="py-3 text-right font-black">{d.coverage}%</td>
                        <td className="py-3 text-right text-red-600 font-bold">-{70 - d.coverage}%</td>
                        <td className="py-3 text-right">
                          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-[#AAA] transition-all" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
              <h3 className="text-[16px] font-black uppercase tracking-tight mb-6">Age Band Reach</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={AGE_BAND_STATS} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="band" type="category" axisLine={false} tickLine={false} fontSize={11} width={60} />
                    <Tooltip />
                    <Bar dataKey="screened" stackId="a" fill="#000" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="unscreened" stackId="a" fill="#EEE" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-black rounded-sm" /><span className="text-[10px] font-black text-[#888] uppercase">Screened</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#EEE] rounded-sm" /><span className="text-[10px] font-black text-[#888] uppercase">Gap</span></div>
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
              <h3 className="text-[16px] font-black uppercase tracking-tight mb-6">Coverage by District (12 Months)</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={generateLineData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                    <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip />
                    {DISTRICT_MOCK_DATA.map((d, i) => (
                      <Line 
                        key={d.id} 
                        type="monotone" 
                        dataKey={d.name} 
                        stroke={i % 2 === 0 ? '#CCC' : '#EEE'} 
                        strokeWidth={1} 
                        dot={false} 
                      />
                    ))}
                    <Line type="monotone" dataKey="State Avg" stroke="#000" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: RISK DISTRIBUTION */}
      {activeTab === 'Risk Distribution' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-nowrap overflow-x-auto gap-4 scrollbar-hide">
            {riskKPIs.map(kpi => <KPICard key={kpi.id} {...kpi} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-7 bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm">
              <h3 className="text-[16px] font-black uppercase tracking-tight mb-6">Risk by District (Relative Volume)</h3>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={districtRiskBars}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 20, textTransform: 'uppercase', fontWeight: 'bold' }} />
                    <Bar dataKey="Low" fill="#22C55E" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Medium" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="High" fill="#EF4444" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Critical" fill="#000000" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-3 bg-white border border-[#E5E5E5] rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
              <h3 className="text-[16px] font-black uppercase tracking-tight mb-8 w-full">State Risk Profile</h3>
              <div className="relative w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskPieData} innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value">
                      {riskPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-[#888] uppercase tracking-widest">SAM Rate</span>
                  <span className="text-[28px] font-black">10%</span>
                  <span className="text-[10px] text-red-600 font-bold">▲ 2% vs Bench</span>
                </div>
              </div>
              <div className="w-full mt-6 space-y-2">
                 <div className="flex justify-between items-center bg-black text-white p-3 rounded">
                    <span className="text-[11px] font-black uppercase tracking-widest">Critical Backlog</span>
                    <span className="text-[18px] font-black">128</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-[16px] font-black uppercase tracking-tight">Domain Concern Heatmap</h3>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-50 border border-gray-100" /><span className="text-[10px] font-bold text-[#888]">LOW</span></div>
                   <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-800" /><span className="text-[10px] font-bold text-[#888]">CRITICAL</span></div>
                </div>
             </div>
             <div className="grid grid-cols-14 gap-1">
                <div className="col-span-1" />
                {DISTRICT_MOCK_DATA.map(d => (
                  <div key={d.id} className="text-[10px] font-black text-[#888] uppercase tracking-tighter text-center h-12 flex items-end justify-center pb-2">
                    <span className="rotate-45 origin-bottom-left w-20 truncate">{d.name}</span>
                  </div>
                ))}
                
                {['Motor', 'ASD', 'Hearing', 'Speech', 'Visual'].map((domain, idx) => (
                  <React.Fragment key={domain}>
                    <div className="col-span-1 flex items-center pr-4 text-[11px] font-black text-black uppercase tracking-tight h-12">
                      {domain}
                    </div>
                    {DISTRICT_MOCK_DATA.map(d => {
                      const val = (idx + parseInt(d.id)) % 10;
                      const opacity = 0.05 + (val / 10) * 0.95;
                      return (
                        <div 
                          key={`${domain}-${d.id}`} 
                          className="h-12 border border-white hover:border-black transition-all group relative cursor-help"
                          style={{ backgroundColor: `rgba(185, 28, 28, ${opacity})` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/80 text-white text-[9px] font-bold z-10 transition-opacity">
                            {Math.round(val * 12.4)}%
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* CONTENT: TRENDS */}
      {activeTab === 'Trends' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-[16px] font-black uppercase tracking-tight mb-2">Multi-District Trend Comparison</h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><div className="w-4 h-[2px] bg-black" /><span className="text-[11px] font-black uppercase text-black">State Average</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-[2px] bg-[#CCC]" /><span className="text-[11px] font-bold uppercase text-[#888]">Districts (13)</span></div>
                </div>
              </div>
              <div className="flex bg-[#F9F9F9] p-1 rounded border border-[#EEE]">
                 {['Coverage', 'Risk', 'Screening Volume'].map(m => (
                   <button key={m} className={`px-4 py-2 text-[11px] font-black uppercase rounded ${m === 'Coverage' ? 'bg-black text-white shadow-lg' : 'text-[#888] hover:text-black'}`}>{m}</button>
                 ))}
              </div>
            </div>
            
            <div className="h-[460px] relative">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={generateLineData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F5" />
                    <XAxis dataKey="month" fontSize={12} axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                    <YAxis fontSize={11} axisLine={false} tickLine={false} domain={[50, 100]} />
                    <Tooltip content={<CustomLineTooltip />} />
                    {DISTRICT_MOCK_DATA.map((d, i) => (
                      <Line 
                        key={d.id} 
                        type="monotone" 
                        dataKey={d.name} 
                        stroke={i % 2 === 0 ? '#DDD' : '#EEE'} 
                        strokeWidth={1.5} 
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                    <Line type="monotone" dataKey="State Avg" stroke="#000" strokeWidth={4} dot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }} />
                 </LineChart>
               </ResponsiveContainer>
               
               {/* Annotations */}
               <div className="absolute top-[20%] right-[15%] flex flex-col items-center">
                  <div className="w-[1px] h-20 bg-dashed border-l border-black/30" />
                  <div className="bg-black text-white p-2 rounded text-[10px] font-bold uppercase tracking-widest text-center shadow-xl">
                    New Diagnostic Policy<br/>Effective March 1st
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: CONDITIONS */}
      {activeTab === 'Conditions' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm">
              <h3 className="text-[16px] font-black uppercase tracking-tight mb-8">Condition Prevalence (Statewide)</h3>
              <div className="space-y-6">
                 {conditionPrevalenceData.map((stat, i) => (
                   <div key={stat.condition} className="flex items-center gap-6">
                      <div className="w-[180px] text-[13px] font-bold text-[#555] uppercase tracking-tight">{stat.condition}</div>
                      <div className="flex-1 h-8 flex items-center">
                         <div className="h-full bg-black rounded transition-all duration-1000" style={{ width: `${(stat.count / 1400) * 100}%` }} />
                      </div>
                      <div className="w-20 text-right">
                         <span className="text-[16px] font-black block">{stat.count.toLocaleString()}</span>
                         <span className="text-[10px] font-bold text-[#888] uppercase">{stat.rate} per 1000</span>
                      </div>
                   </div>
                 ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
               <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm flex-1">
                  <h3 className="text-[16px] font-black uppercase tracking-tight mb-6">Condition by District Heatmap</h3>
                  <div className="overflow-x-auto">
                    <div className="min-w-[400px]">
                      <div className="grid grid-cols-13 gap-1 mb-2">
                        {DISTRICT_MOCK_DATA.map(d => (
                          <div key={d.id} className="text-[9px] font-black text-[#AAA] rotate-90 h-10 flex items-center justify-center">
                            {d.name.substring(0,3)}
                          </div>
                        ))}
                      </div>
                      {['Motor', 'ASD', 'Hearing', 'Speech', 'Visual'].map((c, i) => (
                        <div key={c} className="grid grid-cols-13 gap-1 h-6 mb-1">
                           {DISTRICT_MOCK_DATA.map(d => {
                             const intensity = (i + parseInt(d.id)) % 5;
                             return (
                               <div key={d.id} className={`h-full border border-white rounded-sm ${intensity === 4 ? 'bg-red-800' : intensity === 3 ? 'bg-red-600' : intensity === 2 ? 'bg-red-400' : 'bg-red-100'}`} />
                             );
                           })}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 p-4 bg-red-50 rounded border border-red-100">
                     <div className="flex gap-2 items-center mb-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <span className="text-[13px] font-black text-red-700 uppercase">Prevalence Alert</span>
                     </div>
                     <p className="text-[12px] text-red-900 leading-snug font-medium">
                        ASD Indicators in Guntur District are 28% higher than the statewide average. Recommend immediate deployment of developmental pediatricians for secondary screening.
                     </p>
                  </div>
               </div>

               <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 shadow-sm h-64">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[16px] font-black uppercase tracking-tight">Condition Trend Line</h3>
                    <div className="flex bg-[#F9F9F9] p-1 rounded border border-[#EEE]">
                       <button className="px-3 py-1 text-[10px] font-black uppercase bg-black text-white rounded">Absolute</button>
                       <button className="px-3 py-1 text-[10px] font-black uppercase text-[#888] hover:text-black rounded">Rate / 1000</button>
                    </div>
                  </div>
                  <div className="h-32">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateTrendLineData()}>
                           <Line type="stepAfter" dataKey="Motor" stroke="#000" strokeWidth={2} dot={false} />
                           <Line type="stepAfter" dataKey="ASD" stroke="#888" strokeWidth={2} dot={false} />
                           <Line type="stepAfter" dataKey="Nutritional" stroke="#CCC" strokeWidth={2} dot={false} />
                           <Tooltip />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tooltip Components
const CustomTreemapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white p-4 rounded shadow-2xl border border-[#333]">
        <p className="text-[14px] font-black uppercase tracking-tight">{payload[0].payload.name}</p>
        <p className="text-[12px] font-bold text-[#888]">Coverage: <span className="text-white">{payload[0].value}%</span></p>
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const sorted = [...payload].sort((a, b) => b.value - a.value);
    return (
      <div className="bg-black text-white p-4 rounded shadow-2xl border border-[#333] max-h-[300px] overflow-y-auto w-56 scrollbar-hide">
        <p className="text-[12px] font-black mb-3 border-b border-[#333] pb-2 uppercase tracking-widest">{label}</p>
        <div className="space-y-1.5">
          {sorted.map((p, i) => (
            <div key={p.name} className="flex justify-between items-center gap-4">
              <span className={`text-[11px] font-bold truncate flex-1 ${p.name === 'State Avg' ? 'text-white underline' : 'text-[#888]'}`}>{p.name}</span>
              <span className={`text-[12px] font-black ${p.name === 'State Avg' ? 'text-white' : 'text-[#888]'}`}>{p.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Helper Data Generators
function generateLineData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((m, idx) => {
    const entry: any = { month: m };
    let total = 0;
    DISTRICT_MOCK_DATA.forEach(d => {
      const baseVal = d.coverage;
      const seasonal = Math.sin(idx * 0.5) * 5;
      const noise = Math.random() * 3;
      const val = Math.max(0, Math.min(100, Math.round(baseVal - 10 + idx * 1.5 + seasonal + noise)));
      entry[d.name] = val;
      total += val;
    });
    entry['State Avg'] = Math.round(total / DISTRICT_MOCK_DATA.length);
    return entry;
  });
}

function generateTrendLineData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((m, idx) => ({
    name: m,
    Motor: 1000 + idx * 50 + Math.random() * 20,
    ASD: 800 + idx * 20 + Math.random() * 10,
    Nutritional: 1400 - idx * 30 + Math.random() * 15,
  }));
}

export default ScreeningRiskView;
