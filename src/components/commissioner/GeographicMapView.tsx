'use client'

import React, { useState, useMemo } from 'react';
import { DISTRICT_MOCK_DATA } from '@/lib/commissioner/constants';
import { DistrictData, MetricType } from '@/lib/commissioner/types';
import {
  ChevronDown, Filter, Info, ChevronRight,
  Maximize2, Columns, Layout, ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MapComponentProps {
  metric: MetricType;
  onDistrictSelect: (d: DistrictData) => void;
  showLabels?: boolean;
}

const METRICS: MetricType[] = [
  'Screening Coverage',
  'Risk Distribution',
  'Referral Pipeline Health',
  'Flag Volume',
  'AWW Activity',
  'Facility Load'
];

const GeographicMapView: React.FC = () => {
  const [primaryMetric, setPrimaryMetric] = useState<MetricType>('Screening Coverage');
  const [secondaryMetric, setSecondaryMetric] = useState<MetricType>('Risk Distribution');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [timeFilter, setTimeFilter] = useState('Quarter');

  const getMetricValue = (district: DistrictData, metric: MetricType) => {
    switch (metric) {
      case 'Screening Coverage': return district.coverage;
      case 'Risk Distribution': return Math.round(((district.risk.high + district.risk.crit) / district.children) * 1000); // Normalized per 1000
      // Fix: Calculate referral efficiency since 'referralEfficiency' is not a property on DistrictData
      case 'Referral Pipeline Health': {
        const total = district.referralsActive + district.referralsDone;
        return total > 0 ? Math.round((district.referralsDone / total) * 100) : 0;
      }
      case 'Flag Volume': return district.escalations;
      case 'AWW Activity': return district.performance;
      case 'Facility Load': return district.facilityLoad;
      default: return 0;
    }
  };

  const sortedRanking = useMemo(() => {
    return [...DISTRICT_MOCK_DATA].sort((a, b) =>
      getMetricValue(b, primaryMetric) - getMetricValue(a, primaryMetric)
    );
  }, [primaryMetric]);

  const stateAverage = useMemo(() => {
    const sum = DISTRICT_MOCK_DATA.reduce((acc, d) => acc + getMetricValue(d, primaryMetric), 0);
    return Math.round(sum / DISTRICT_MOCK_DATA.length);
  }, [primaryMetric]);

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] animate-in fade-in duration-500">
      {/* METRIC SELECTOR TOP BAR */}
      <div className="flex items-center justify-between bg-white border border-[#E5E5E5] rounded-t-xl p-4 shadow-sm z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-bold text-[#888] uppercase tracking-wider">Showing:</span>
            <div className="relative group">
              <select
                value={primaryMetric}
                onChange={(e) => setPrimaryMetric(e.target.value as MetricType)}
                className="appearance-none bg-[#F9F9F9] border border-[#E5E5E5] pl-4 pr-10 py-2 rounded font-bold text-[14px] text-black focus:outline-none focus:ring-1 focus:ring-black cursor-pointer min-w-[220px]"
              >
                {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#888]" />
            </div>
          </div>

          {isCompareMode && (
            <div className="flex items-center gap-3 border-l border-[#EEE] pl-6 animate-in slide-in-from-left-4 duration-300">
              <span className="text-[13px] font-bold text-[#888] uppercase tracking-wider">Compare with:</span>
              <div className="relative group">
                <select
                  value={secondaryMetric}
                  onChange={(e) => setSecondaryMetric(e.target.value as MetricType)}
                  className="appearance-none bg-[#F9F9F9] border border-[#E5E5E5] pl-4 pr-10 py-2 rounded font-bold text-[14px] text-black focus:outline-none focus:ring-1 focus:ring-black cursor-pointer min-w-[220px]"
                >
                  {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#888]" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#F9F9F9] p-1 rounded flex border border-[#E5E5E5]">
            {['Week', 'Month', 'Quarter', 'Year'].map(f => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-3 py-1 rounded-sm text-[11px] font-bold transition-all ${timeFilter === f ? 'bg-black text-white' : 'text-[#888] hover:text-black'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`flex items-center gap-2 px-4 py-2 border rounded text-[13px] font-bold transition-all ${isCompareMode ? 'bg-black border-black text-white shadow-lg' : 'bg-white border-[#E5E5E5] text-black hover:bg-[#F9F9F9]'}`}
          >
            {isCompareMode ? <Layout size={16} /> : <Columns size={16} />}
            {isCompareMode ? 'Single View' : 'Compare'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* MAP AREA */}
        <div className={`flex flex-col relative bg-white border-x border-[#E5E5E5] overflow-hidden transition-all duration-500 ${isCompareMode ? 'flex-[0.7]' : 'flex-[0.7]'}`}>
          <div className={`flex-1 flex ${isCompareMode ? 'divide-x divide-[#EEE]' : ''}`}>
            <div className="flex-1 relative">
              <DistrictAnalysisMap metric={primaryMetric} onDistrictSelect={(d) => console.log('Drill down:', d)} />
              <div className="absolute top-4 left-4 flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#888] uppercase tracking-widest">{primaryMetric}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                  <span className="text-[14px] font-bold">Primary Insight</span>
                </div>
              </div>
            </div>
            {isCompareMode && (
              <div className="flex-1 relative animate-in fade-in duration-500">
                <DistrictAnalysisMap metric={secondaryMetric} onDistrictSelect={(d) => console.log('Drill down:', d)} />
                <div className="absolute top-4 left-4 flex flex-col gap-1">
                  <span className="text-[10px] font-black text-[#888] uppercase tracking-widest">{secondaryMetric}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-[14px] font-bold">Comparison Data</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LEGEND BAR */}
          <div className="h-20 border-t border-[#F5F5F5] px-8 flex items-center justify-between bg-white relative">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-bold text-[#888] uppercase mb-1">
                <span>Low Values</span>
                <span>High Impact</span>
              </div>
              <div className="relative w-[320px] h-3 rounded-full border border-[#EEE] bg-gradient-to-r from-white via-gray-400 to-black">
                <div className="absolute -top-1 left-[67%] -translate-x-1/2 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-black" />
                  <span className="text-[10px] font-black mt-2">STATE AVG: {stateAverage}%</span>
                </div>
              </div>
            </div>
            <div className="flex gap-12">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded">
                  <ArrowUpRight size={18} className="text-red-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#888] uppercase block">Anomaly Found</span>
                  <span className="text-[14px] font-bold">Kurnool District</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded">
                  <Maximize2 size={18} className="text-green-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#888] uppercase block">Optimization Area</span>
                  <span className="text-[14px] font-bold">Coastal Corridor</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDE RANKING PANEL */}
        <div className="flex-[0.3] bg-white flex flex-col border-r border-[#E5E5E5] overflow-hidden">
          <div className="p-6 border-b border-[#F5F5F5] bg-[#F9F9F9]/50">
            <h3 className="text-[16px] font-black text-black uppercase tracking-tight mb-1">District Performance</h3>
            <p className="text-[12px] text-[#888]">Ranked by {primaryMetric}</p>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {sortedRanking.map((d, i) => {
              const val = getMetricValue(d, primaryMetric);
              const isTop = i < 3;
              const isBottom = i > sortedRanking.length - 4;
              return (
                <div key={d.id} className={`group p-4 flex items-center gap-4 border-b border-[#F5F5F5] hover:bg-black hover:text-white transition-all cursor-pointer ${isBottom ? 'bg-red-50/30' : ''}`}>
                  <span className={`text-[18px] font-black w-6 ${isTop ? 'text-black group-hover:text-white' : 'text-[#DDD] group-hover:text-[#555]'}`}>
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[14px] font-bold">{d.name}</span>
                      <span className="text-[15px] font-black">{val}{primaryMetric.includes('%') || primaryMetric.includes('Coverage') ? '%' : ''}</span>
                    </div>
                    <div className="w-full h-1 bg-[#F0F0F0] group-hover:bg-[#333] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isBottom ? 'bg-red-500' : 'bg-black group-hover:bg-white'}`}
                        style={{ width: `${Math.min(100, (val / (primaryMetric.includes('Volume') ? 50 : 1)) * (primaryMetric.includes('Volume') ? 1 : 1))}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
          <div className="p-4 bg-black text-white flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <Info size={16} className="text-[#888]" />
              <span className="text-[12px] font-bold uppercase tracking-widest">Methodology & Sources</span>
            </div>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Map Component for detailed analysis
const DistrictAnalysisMap: React.FC<{ metric: MetricType, onDistrictSelect: (d: DistrictData) => void }> = ({ metric, onDistrictSelect }) => {
  const [hovered, setHovered] = useState<DistrictData | null>(null);

  const gridPositions = [
    { id: '10', name: 'Vizianagaram', x: 280, y: 50 },
    { id: '8', name: 'Srikakulam', x: 310, y: 30 },
    { id: '9', name: 'Visakhapatnam', x: 260, y: 90 },
    { id: '3', name: 'East Godavari', x: 235, y: 135 },
    { id: '11', name: 'West Godavari', x: 210, y: 165 },
    { id: '5', name: 'Krishna', x: 185, y: 195 },
    { id: '4', name: 'Guntur', x: 155, y: 225 },
    { id: '7', name: 'Prakasam', x: 125, y: 265 },
    { id: '13', name: 'Nellore', x: 115, y: 325 },
    { id: '12', name: 'Kadapa', x: 85, y: 285 },
    { id: '2', name: 'Chittoor', x: 75, y: 355 },
    { id: '1', name: 'Anantapur', x: 45, y: 295 },
    { id: '6', name: 'Kurnool', x: 65, y: 235 },
  ];

  const getMetricValue = (d: DistrictData | undefined) => {
    if (!d) return 0;
    switch (metric) {
      case 'Screening Coverage': return d.coverage || 0;
      case 'Risk Distribution': return d.risk ? Math.round(((d.risk.high + d.risk.crit) / d.children) * 1000) : 0;
      case 'Referral Pipeline Health': {
        const total = (d.referralsActive || 0) + (d.referralsDone || 0);
        return total > 0 ? Math.round(((d.referralsDone || 0) / total) * 100) : 0;
      }
      case 'Flag Volume': return d.escalations || 0;
      case 'AWW Activity': return d.performance || 0;
      case 'Facility Load': return d.facilityLoad || 0;
      default: return 0;
    }
  };

  const getColorForMetric = (val: number) => {
    let normalized = 0;
    switch (metric) {
      case 'Screening Coverage':
      case 'Referral Pipeline Health':
      case 'AWW Activity':
        normalized = val / 100;
        return `rgb(${Math.round((1 - normalized) * 255)}, ${Math.round((1 - normalized) * 255)}, ${Math.round((1 - normalized) * 255)})`;
      case 'Risk Distribution':
      case 'Flag Volume':
        normalized = Math.min(1, val / 40);
        return `rgb(${Math.round(normalized * 225 + 30)}, ${Math.round((1 - normalized) * 225 + 30)}, ${Math.round((1 - normalized) * 225 + 30)})`;
      case 'Facility Load':
        normalized = val / 100;
        return `rgb(${Math.round(normalized * 220)}, ${Math.round((1 - normalized) * 200)}, 50)`;
      default: return '#eee';
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-[#050A0F] rounded-xl overflow-hidden group">
      {/* Satellite Background synced with Dashboard scale */}
      <div
        className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105"
        style={{
          backgroundImage: 'url("/ap_satellite.png")',
          backgroundSize: '160%',
          backgroundPosition: '55% 35%',
          opacity: 0.8
        }}
      />

      {/* Premium darkening overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      <svg viewBox="0 0 600 500" className="w-[95%] h-[95%] drop-shadow-[0_0_30px_rgba(0,0,0,0.6)] relative z-10">
        {/* 1. Srikakulam */}
        <path d="M500,40 L560,30 L590,80 L520,110 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '8')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '8')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '8')!)} onMouseLeave={() => setHovered(null)} />
        <text x="545" y="70" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Srikakulam</text>

        {/* 2. Vizianagaram */}
        <path d="M440,80 L500,40 L520,110 L470,140 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '10')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '10')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '10')!)} onMouseLeave={() => setHovered(null)} />
        <text x="485" y="100" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Vizian</text>

        {/* 3. Visakhapatnam */}
        <path d="M380,120 L440,80 L470,140 L420,170 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '9')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '9')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '9')!)} onMouseLeave={() => setHovered(null)} />
        <text x="425" y="140" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Visakha</text>

        {/* 4. East Godavari */}
        <path d="M320,160 L380,120 L420,170 L360,200 L320,200 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '3')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '3')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '3')!)} onMouseLeave={() => setHovered(null)} />
        <text x="365" y="175" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>E. Godavari</text>

        {/* 5. West Godavari */}
        <path d="M280,210 L320,160 L320,200 L360,200 L330,240 L280,240 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '11')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '11')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '11')!)} onMouseLeave={() => setHovered(null)} />
        <text x="315" y="215" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>W. Godavari</text>

        {/* 6. Krishna */}
        <path d="M220,240 L280,210 L280,240 L330,240 L310,300 L240,280 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '5')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '5')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '5')!)} onMouseLeave={() => setHovered(null)} />
        <text x="270" y="260" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Krishna</text>

        {/* 7. Guntur */}
        <path d="M160,280 L220,240 L240,280 L310,300 L240,350 L180,330 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '4')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '4')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '4')!)} onMouseLeave={() => setHovered(null)} />
        <text x="220" y="300" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Guntur</text>

        {/* 8. Prakasam */}
        <path d="M100,340 L160,280 L180,330 L240,350 L200,420 L120,400 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '7')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '7')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '7')!)} onMouseLeave={() => setHovered(null)} />
        <text x="160" y="370" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Prakasam</text>

        {/* 9. Nellore */}
        <path d="M120,400 L200,420 L180,480 L100,470 L90,420 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '13')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '13')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '13')!)} onMouseLeave={() => setHovered(null)} />
        <text x="145" y="440" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Nellore</text>

        {/* 10. Kadapa */}
        <path d="M30,340 L100,340 L120,400 L90,420 L100,470 L40,450 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '12')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '12')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '12')!)} onMouseLeave={() => setHovered(null)} />
        <text x="70" y="400" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Kadapa</text>

        {/* 11. Chittoor */}
        <path d="M10,420 L40,450 L100,470 L80,495 L10,490 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '2')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '2')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '2')!)} onMouseLeave={() => setHovered(null)} />
        <text x="45" y="475" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Chittoor</text>

        {/* 12. Anantapur */}
        <path d="M10,300 L30,340 L40,450 L10,420 L5,340 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '1')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '1')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '1')!)} onMouseLeave={() => setHovered(null)} />
        <text x="20" y="375" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Anantapur</text>

        {/* 13. Kurnool */}
        <path d="M10,210 L160,280 L100,340 L30,340 L10,300 Z" fill={getColorForMetric(getMetricValue(DISTRICT_MOCK_DATA.find(d => d.id === '6')!))} fillOpacity="0.45" stroke="rgba(255,255,255,0.2)" strokeWidth="1" className="cursor-pointer hover:fill-opacity-80 transition-all" onClick={() => onDistrictSelect(DISTRICT_MOCK_DATA.find(d => d.id === '6')!)} onMouseEnter={() => setHovered(DISTRICT_MOCK_DATA.find(d => d.id === '6')!)} onMouseLeave={() => setHovered(null)} />
        <text x="60" y="280" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,1))' }}>Kurnool</text>
      </svg>

      {hovered && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
          <div className="bg-black/80 backdrop-blur-xl text-white p-6 rounded-2xl shadow-2xl w-[280px] animate-in zoom-in-95 duration-200 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-[16px] font-black uppercase tracking-tighter text-white/90">{hovered.name}</h4>
                <span className="text-[10px] text-white/40 font-bold tracking-[0.1em] uppercase">{hovered.dpo} • DPO</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[20px] font-black ${getMetricValue(hovered) > 80 ? 'text-green-400' : (getMetricValue(hovered) < 50 ? 'text-red-400' : 'text-white')}`}>
                  {getMetricValue(hovered)}{metric.includes('Coverage') || metric.includes('Health') ? '%' : ''}
                </span>
                <span className="text-[9px] text-white/30 uppercase font-bold text-right tracking-tight">Current {metric.split(' ')[0]}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-5 border-y border-white/5 py-4">
              <div>
                <span className="text-[9px] font-bold text-white/40 uppercase block mb-0.5">Children</span>
                <span className="text-[13px] font-bold">{hovered.children.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-white/40 uppercase block mb-0.5">Coverage</span>
                <span className="text-[13px] font-bold">{hovered.coverage}%</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-white/40 uppercase block mb-0.5 text-red-400/60">Risk Count</span>
                <span className="text-[13px] font-bold text-red-500">{hovered.risk.crit + hovered.risk.high}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-white/40 uppercase block mb-0.5">Escalations</span>
                <span className="text-[13px] font-bold">{hovered.escalations}</span>
              </div>
            </div>
            <div className="h-12 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={hovered.trend.map((v, i) => ({ v, i }))}>
                  <Line type="monotone" dataKey="v" stroke="#666" strokeWidth={1} dot={false} strokeOpacity={0.5} />
                  <Line type="monotone" dataKey="v" stroke="#FFF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[9px] text-center block text-white/20 uppercase font-black tracking-[0.2em]">Click to Explore Detail</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicMapView;
